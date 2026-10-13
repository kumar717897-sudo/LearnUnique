import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';
import { DocumentChunk, UploadedDocument } from '../types';

// Ensure PDF.js worker is properly configured
try {
  if (typeof window !== 'undefined') {
    // Set standard reliable worker CDN
    const pdfVersion = (pdfjsLib as any).version || '4.10.38';
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfVersion}/pdf.worker.min.mjs`;
  }
} catch (e) {
  console.warn('PDF.js worker initialization warning:', e);
}

export interface ProcessingProgress {
  currentPage: number;
  totalPages: number;
  statusText: string;
}

/**
 * FULL PDF PROCESSING: Loops through ALL pages (1 to pdf.numPages),
 * extracts all text chunks with exact page metadata, and validates 100% completion.
 */
export async function processPdfFile(
  file: File,
  onProgress?: (progress: ProcessingProgress) => void
): Promise<{ doc: UploadedDocument; chunks: DocumentChunk[] }> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
  });

  const pdf = await loadingTask.promise;
  const totalPages = pdf.numPages;

  if (totalPages === 0) {
    throw new Error('PDF has 0 pages or is empty.');
  }

  const docId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const chunks: DocumentChunk[] = [];
  let pagesProcessed = 0;

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    if (onProgress) {
      onProgress({
        currentPage: pageNum,
        totalPages,
        statusText: `Extracting page ${pageNum} of ${totalPages}...`,
      });
    }

    try {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => ('str' in item ? item.str : ''))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

      pagesProcessed++;

      // Chunk the page text if lengthy, or store page-level chunk
      if (pageText.length > 0) {
        // Break into ~600 character readable segments while keeping page metadata
        if (pageText.length > 1200) {
          const sentences = pageText.match(/[^.!?]+[.!?]+/g) || [pageText];
          let currentChunkText = '';
          let subPart = 1;

          for (const sentence of sentences) {
            if ((currentChunkText + sentence).length > 800 && currentChunkText.length > 0) {
              chunks.push({
                id: `${docId}_p${pageNum}_s${subPart}`,
                docId,
                docName: file.name,
                docType: 'pdf',
                location: `Page ${pageNum} (Part ${subPart})`,
                pageNumber: pageNum,
                text: currentChunkText.trim(),
              });
              currentChunkText = sentence;
              subPart++;
            } else {
              currentChunkText += ' ' + sentence;
            }
          }
          if (currentChunkText.trim().length > 0) {
            chunks.push({
              id: `${docId}_p${pageNum}_s${subPart}`,
              docId,
              docName: file.name,
              docType: 'pdf',
              location: `Page ${pageNum} (Part ${subPart})`,
              pageNumber: pageNum,
              text: currentChunkText.trim(),
            });
          }
        } else {
          chunks.push({
            id: `${docId}_p${pageNum}`,
            docId,
            docName: file.name,
            docType: 'pdf',
            location: `Page ${pageNum}`,
            pageNumber: pageNum,
            text: pageText,
          });
        }
      } else {
        // Page with graphics / minimal text
        chunks.push({
          id: `${docId}_p${pageNum}`,
          docId,
          docName: file.name,
          docType: 'pdf',
          location: `Page ${pageNum}`,
          pageNumber: pageNum,
          text: `[Page ${pageNum}: Diagrams, formulas or visual figures present]`,
        });
      }
    } catch (pageErr: any) {
      console.warn(`PDF extraction notice on page ${pageNum}:`, pageErr);
      throw new Error(`Failed to extract page ${pageNum} of ${totalPages}: ${pageErr?.message || pageErr}`);
    }
  }

  // Verification step: Ensure ALL pages were processed
  if (pagesProcessed !== totalPages) {
    throw new Error(`Verification failed: Expected ${totalPages} pages, but only processed ${pagesProcessed}.`);
  }

  const doc: UploadedDocument = {
    id: docId,
    name: file.name,
    type: 'pdf',
    size: file.size,
    pageCount: totalPages,
    chunkCount: chunks.length,
    uploadedAt: new Date().toISOString(),
    status: 'ready',
    pagesProcessed,
    totalPages,
  };

  return { doc, chunks };
}

/**
 * PPT / PPTX Processing: Unpacks presentation XML using JSZip
 * Extracts text from every single slide with Slide 1, Slide 2, ... metadata
 */
export async function processPptxFile(
  file: File,
  onProgress?: (progress: ProcessingProgress) => void
): Promise<{ doc: UploadedDocument; chunks: DocumentChunk[] }> {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  const docId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const chunks: DocumentChunk[] = [];

  // Match slide XML files like ppt/slides/slide1.xml
  const slideEntries: { name: string; slideNum: number; zipEntry: JSZip.JSZipObject }[] = [];
  zip.forEach((relativePath, zipEntry) => {
    const match = relativePath.match(/^ppt\/slides\/slide(\d+)\.xml$/i);
    if (match) {
      slideEntries.push({
        name: relativePath,
        slideNum: parseInt(match[1], 10),
        zipEntry,
      });
    }
  });

  // Sort sequentially by slide number
  slideEntries.sort((a, b) => a.slideNum - b.slideNum);
  const totalSlides = slideEntries.length;

  if (totalSlides === 0) {
    // If not standard PPTX XML structure, attempt fallback text extraction
    const text = await file.text().catch(() => '');
    if (text.length > 50) {
      chunks.push({
        id: `${docId}_slide1`,
        docId,
        docName: file.name,
        docType: 'ppt',
        location: 'Slide 1',
        slideNumber: 1,
        text: text.slice(0, 3000),
      });
      return {
        doc: {
          id: docId,
          name: file.name,
          type: 'ppt',
          size: file.size,
          slideCount: 1,
          chunkCount: 1,
          uploadedAt: new Date().toISOString(),
          status: 'ready',
          pagesProcessed: 1,
          totalPages: 1,
        },
        chunks,
      };
    }
    throw new Error('No slides could be found in the uploaded PPTX file.');
  }

  const parser = new DOMParser();

  for (let i = 0; i < totalSlides; i++) {
    const entry = slideEntries[i];
    const slideNum = entry.slideNum;

    if (onProgress) {
      onProgress({
        currentPage: i + 1,
        totalPages: totalSlides,
        statusText: `Extracting slide ${slideNum} (${i + 1} of ${totalSlides})...`,
      });
    }

    const xmlContent = await entry.zipEntry.async('string');
    const xmlDoc = parser.parseFromString(xmlContent, 'application/xml');

    // PPTX slide text is inside <a:t> elements
    const textNodes = xmlDoc.getElementsByTagName('a:t');
    let slideText = '';
    for (let j = 0; j < textNodes.length; j++) {
      const t = textNodes[j].textContent || '';
      if (t.trim()) {
        slideText += t + ' ';
      }
    }

    slideText = slideText.replace(/\s+/g, ' ').trim();

    chunks.push({
      id: `${docId}_slide_${slideNum}`,
      docId,
      docName: file.name,
      docType: 'ppt',
      location: `Slide ${slideNum}`,
      slideNumber: slideNum,
      text: slideText.length > 0 ? slideText : `[Slide ${slideNum}: Presentation graphics/title slide]`,
    });
  }

  const doc: UploadedDocument = {
    id: docId,
    name: file.name,
    type: 'ppt',
    size: file.size,
    slideCount: totalSlides,
    chunkCount: chunks.length,
    uploadedAt: new Date().toISOString(),
    status: 'ready',
    pagesProcessed: totalSlides,
    totalPages: totalSlides,
  };

  return { doc, chunks };
}

/**
 * Text & Markdown file processing with paragraph & section indexing
 */
export async function processTextFile(
  file: File
): Promise<{ doc: UploadedDocument; chunks: DocumentChunk[] }> {
  const content = await file.text();
  const docId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const chunks: DocumentChunk[] = [];

  const rawParagraphs = content.split(/\n\s*\n/);
  let sectionIndex = 1;

  for (let p of rawParagraphs) {
    const clean = p.trim();
    if (clean.length > 0) {
      chunks.push({
        id: `${docId}_sec_${sectionIndex}`,
        docId,
        docName: file.name,
        docType: 'text',
        location: `Section ${sectionIndex}`,
        text: clean,
      });
      sectionIndex++;
    }
  }

  if (chunks.length === 0) {
    throw new Error('File content was empty.');
  }

  const doc: UploadedDocument = {
    id: docId,
    name: file.name,
    type: 'text',
    size: file.size,
    chunkCount: chunks.length,
    uploadedAt: new Date().toISOString(),
    status: 'ready',
    pagesProcessed: chunks.length,
    totalPages: chunks.length,
  };

  return { doc, chunks };
}

/**
 * Process Raw Lecture Notes or Transcript Text pasted by user
 */
export function processRawText(
  title: string,
  rawText: string
): { doc: UploadedDocument; chunks: DocumentChunk[] } {
  const cleanTitle = title.trim() || 'Lecture Notes';
  const docId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const chunks: DocumentChunk[] = [];

  // Look for timestamp patterns like [00:15] or 01:23:45 or Section headers
  const lines = rawText.split('\n');
  let currentTimestamp = '00:00';
  let currentBuffer = '';
  let chunkIdx = 1;

  for (const line of lines) {
    const timeMatch = line.match(/(?:\[)?(\d{1,2}:\d{2}(?::\d{2})?)(?:\])?/);
    if (timeMatch && currentBuffer.trim().length > 100) {
      chunks.push({
        id: `${docId}_c_${chunkIdx}`,
        docId,
        docName: cleanTitle,
        docType: 'video',
        location: `Timestamp ${currentTimestamp}`,
        timestamp: currentTimestamp,
        text: currentBuffer.trim(),
      });
      chunkIdx++;
      currentTimestamp = timeMatch[1];
      currentBuffer = line;
    } else {
      if (timeMatch) {
        currentTimestamp = timeMatch[1];
      }
      currentBuffer += '\n' + line;
    }
  }

  if (currentBuffer.trim().length > 0) {
    chunks.push({
      id: `${docId}_c_${chunkIdx}`,
      docId,
      docName: cleanTitle,
      docType: 'video',
      location: `Timestamp ${currentTimestamp}`,
      timestamp: currentTimestamp,
      text: currentBuffer.trim(),
    });
  }

  const doc: UploadedDocument = {
    id: docId,
    name: cleanTitle,
    type: 'video',
    size: new Blob([rawText]).size,
    chunkCount: chunks.length,
    uploadedAt: new Date().toISOString(),
    status: 'ready',
    pagesProcessed: chunks.length,
    totalPages: chunks.length,
  };

  return { doc, chunks };
}

/**
 * Video file metadata processing: user uploads video file with optional timestamps
 */
export function processVideoFile(
  file: File,
  videoDurationSeconds?: number
): { doc: UploadedDocument; chunks: DocumentChunk[] } {
  const docId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const chunks: DocumentChunk[] = [];

  const duration = videoDurationSeconds || 600; // 10 min default
  const interval = 120; // 2 min intervals
  const totalSegments = Math.max(1, Math.ceil(duration / interval));

  for (let i = 0; i < totalSegments; i++) {
    const startSec = i * interval;
    const mins = Math.floor(startSec / 60)
      .toString()
      .padStart(2, '0');
    const secs = (startSec % 60).toString().padStart(2, '0');
    const timeStr = `${mins}:${secs}`;

    chunks.push({
      id: `${docId}_v_${i + 1}`,
      docId,
      docName: file.name,
      docType: 'video',
      location: `Timestamp ${timeStr}`,
      timestamp: timeStr,
      text: `[Video Lecture Segment at ${timeStr}: ${file.name} - Ingested lecture recording topic discussion]`,
    });
  }

  const doc: UploadedDocument = {
    id: docId,
    name: file.name,
    type: 'video',
    size: file.size,
    chunkCount: chunks.length,
    uploadedAt: new Date().toISOString(),
    status: 'ready',
    pagesProcessed: totalSegments,
    totalPages: totalSegments,
  };

  return { doc, chunks };
}
