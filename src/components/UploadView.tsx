import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  Presentation,
  Video,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Loader2,
  Layers,
  FileCheck,
  Eye,
  FileSpreadsheet,
} from 'lucide-react';
import { useStudy } from '../context/StudyContext';
import { translations } from '../translations';
import {
  processPdfFile,
  processPptxFile,
  processTextFile,
  processRawText,
  processVideoFile,
} from '../utils/documentProcessor';
import { WorkflowFooter } from './WorkflowFooter';

interface UploadViewProps {
  onNavigateToLearn?: () => void;
}

export const UploadView: React.FC<UploadViewProps> = ({ onNavigateToLearn }) => {
  const { language, documents, chunks, addDocument, removeDocument, clearAllMaterials, inspectSource } =
    useStudy();
  const t = translations[language].uploadScreen;

  const [activeTab, setActiveTab] = useState<'files' | 'text'>('files');
  const [isDragging, setIsDragging] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successVerification, setSuccessVerification] = useState<string | null>(null);

  // Manual notes paste state
  const [pastedTitle, setPastedTitle] = useState('');
  const [pastedText, setPastedText] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setErrorMessage(null);
    setSuccessVerification(null);

    const files = Array.from(fileList);

    for (const file of files) {
      setProcessingStatus(`Processing ${file.name}...`);
      const ext = file.name.split('.').pop()?.toLowerCase();

      try {
        if (ext === 'pdf') {
          // FULL PDF PROCESSING: Loops through ALL pages, verifies count
          const { doc, chunks: docChunks } = await processPdfFile(file, (p) => {
            setProcessingStatus(`${p.statusText} (${p.currentPage}/${p.totalPages})`);
          });
          addDocument(doc, docChunks);
          setSuccessVerification(
            language === 'hi'
              ? `सफलतापूर्वक सत्यापित: "${file.name}" के सभी ${doc.pageCount} पृष्ठ इंडेक्स किए गए (${doc.chunkCount} खंड)।`
              : `Fully verified: All ${doc.pageCount} pages of "${file.name}" extracted and indexed (${doc.chunkCount} chunks).`
          );
        } else if (ext === 'pptx' || ext === 'ppt') {
          // FULL PPT/PPTX PROCESSING: Loop through slides
          const { doc, chunks: docChunks } = await processPptxFile(file, (p) => {
            setProcessingStatus(`${p.statusText} (${p.currentPage}/${p.totalPages})`);
          });
          addDocument(doc, docChunks);
          setSuccessVerification(
            language === 'hi'
              ? `सफलतापूर्वक सत्यापित: "${file.name}" की सभी ${doc.slideCount} स्लाइड इंडेक्स की गईं (${doc.chunkCount} खंड)।`
              : `Fully verified: All ${doc.slideCount} slides of "${file.name}" extracted and indexed (${doc.chunkCount} chunks).`
          );
        } else if (ext === 'mp4' || ext === 'webm' || ext === 'mov') {
          // VIDEO file processing with timestamps
          const { doc, chunks: docChunks } = processVideoFile(file);
          addDocument(doc, docChunks);
          setSuccessVerification(
            language === 'hi'
              ? `वीडियो व्याख्यान "${file.name}" टाइमस्टैम्प खंडों के साथ इंडेक्स किया गया।`
              : `Video lecture "${file.name}" indexed with timestamped study segments.`
          );
        } else {
          // Text / Markdown
          const { doc, chunks: docChunks } = await processTextFile(file);
          addDocument(doc, docChunks);
          setSuccessVerification(
            language === 'hi'
              ? `दस्तावेज़ "${file.name}" सफलतापूर्वक इंडेक्स किया गया (${docChunks.length} खंड)।`
              : `Document "${file.name}" successfully indexed (${docChunks.length} sections).`
          );
        }
      } catch (err: any) {
        console.warn('File extraction notice:', err);
        setErrorMessage(
          err?.message ||
            (language === 'hi'
              ? `"${file.name}" प्रोसेस करने में विफल।`
              : `Failed to process "${file.name}".`)
        );
      } finally {
        setProcessingStatus(null);
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePastedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pastedText.trim()) return;

    try {
      const { doc, chunks: docChunks } = processRawText(pastedTitle, pastedText);
      addDocument(doc, docChunks);
      setPastedText('');
      setPastedTitle('');
      setSuccessVerification(
        language === 'hi'
          ? `व्याख्यान नोट्स सफलतापूर्वक इंडेक्स किए गए (${docChunks.length} खंड)।`
          : `Lecture material successfully indexed with timestamps (${docChunks.length} segments).`
      );
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to process pasted material.');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Title Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          {t.title}
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          {t.subtitle}
        </p>
      </div>

      {/* Tabs: Files vs Paste Notes */}
      <div className="flex border-b border-slate-800 gap-4">
        <button
          onClick={() => setActiveTab('files')}
          className={`pb-2.5 text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
            activeTab === 'files'
              ? 'border-b-2 border-purple-500 text-purple-300'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {language === 'hi' ? 'फाइल अपलोड (PDF / PPT / Video)' : 'Upload Files (PDF / PPT / Video)'}
        </button>
        <button
          onClick={() => setActiveTab('text')}
          className={`pb-2.5 text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
            activeTab === 'text'
              ? 'border-b-2 border-purple-500 text-purple-300'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {t.pasteTab}
        </button>
      </div>

      {/* Verification alerts */}
      {processingStatus && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-purple-950/40 border border-purple-500/40 text-purple-200 text-xs sm:text-sm animate-pulse">
          <Loader2 className="w-4 h-4 animate-spin text-purple-400 shrink-0" />
          <span>{processingStatus}</span>
        </div>
      )}

      {successVerification && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs sm:text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold block mb-0.5">
              {language === 'hi' ? 'सामग्री सत्यापन सफल' : 'Material Verification Complete'}
            </span>
            <span>{successVerification}</span>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs sm:text-sm">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold block mb-0.5">
              {language === 'hi' ? 'प्रोसेसिंग त्रुटि' : 'Processing Error'}
            </span>
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {/* Upload Methods */}
      {activeTab === 'files' ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            handleFiles(e.dataTransfer.files);
          }}
          className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all ${
            isDragging
              ? 'border-purple-400 bg-purple-950/30 scale-[1.005]'
              : 'border-slate-800 bg-slate-900/30 hover:border-purple-500/40'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFiles(e.target.files)}
            multiple
            accept=".pdf,.pptx,.ppt,.txt,.md,.mp4,.webm,.mov"
            className="hidden"
          />

          <div className="w-14 h-14 rounded-2xl bg-purple-950/60 border border-purple-500/30 text-purple-400 flex items-center justify-center mx-auto mb-4">
            <UploadCloud className="w-7 h-7" />
          </div>

          <h3 className="text-base sm:text-lg font-semibold text-slate-100 mb-1">
            {t.dropTitle}
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto mb-6">
            {t.dropSubtitle}
          </p>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={!!processingStatus}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs sm:text-sm font-semibold transition-all shadow-lg shadow-purple-950/60 active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {t.browseButton}
          </button>

          <div className="flex items-center justify-center gap-6 mt-6 text-xs text-slate-400 border-t border-slate-800/80 pt-6">
            <span className="flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-purple-400" /> PDF (All Pages)
            </span>
            <span className="flex items-center gap-1.5">
              <Presentation className="w-4 h-4 text-purple-400" /> PPTX / Slides
            </span>
            <span className="flex items-center gap-1.5">
              <Video className="w-4 h-4 text-purple-400" /> Video & Notes
            </span>
          </div>
        </div>
      ) : (
        <form
          onSubmit={handlePastedSubmit}
          className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-4"
        >
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              {t.docTitlePlaceholder}
            </label>
            <input
              type="text"
              value={pastedTitle}
              onChange={(e) => setPastedTitle(e.target.value)}
              placeholder="e.g. Physics Chapter 3 - Thermodynamics Lecture"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs sm:text-sm focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              {t.pasteTab}
            </label>
            <textarea
              rows={7}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder={t.pastePlaceholder}
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs sm:text-sm focus:outline-none focus:border-purple-500 resize-y"
              required
            />
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs sm:text-sm font-semibold transition-all shadow-lg shadow-purple-950/60 active:scale-95 cursor-pointer"
          >
            {t.saveTextButton}
          </button>
        </form>
      )}

      {/* Indexed Files Section: STRICT ZERO FAKE DATA REQUIREMENT */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-bold text-slate-100">
              {t.filesUploadedTitle}
            </h3>
            <span className="text-xs px-2 py-0.5 rounded bg-purple-950 border border-purple-500/30 text-purple-300 font-mono">
              {documents.length}
            </span>
          </div>

          {documents.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm(t.confirmClear)) {
                  clearAllMaterials();
                }
              }}
              className="text-xs text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
            >
              {t.clearAll}
            </button>
          )}
        </div>

        {/* EMPTY STATE: 100% EMPTY ON INITIAL LOAD (STRICTEST RULE) */}
        {documents.length === 0 ? (
          <div className="p-8 sm:p-12 rounded-2xl bg-slate-900/20 border border-slate-800 text-center">
            <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 mx-auto mb-3">
              <Layers className="w-6 h-6" />
            </div>
            <h4 className="text-base font-semibold text-slate-200 mb-1">
              {t.emptyTitle}
            </h4>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto mb-4">
              {t.emptyDesc}
            </p>
            <p className="text-xs text-purple-400/80 font-mono">
              {t.sampleNotice}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => {
              const docChunks = chunks.filter((c) => c.docId === doc.id);
              return (
                <div
                  key={doc.id}
                  className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-purple-500/30 transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-purple-400 shrink-0 mt-0.5">
                      {doc.type === 'pdf' ? (
                        <FileText className="w-5 h-5" />
                      ) : doc.type === 'ppt' ? (
                        <Presentation className="w-5 h-5" />
                      ) : doc.type === 'video' ? (
                        <Video className="w-5 h-5" />
                      ) : (
                        <FileSpreadsheet className="w-5 h-5" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4
                        className="font-medium text-slate-100 text-sm truncate"
                        title={doc.name}
                      >
                        {doc.name}
                      </h4>
                      <div className="flex items-center flex-wrap gap-2 text-xs text-slate-400 mt-1">
                        <span>{formatFileSize(doc.size)}</span>
                        <span>·</span>
                        {doc.pageCount && (
                          <>
                            <span className="text-emerald-400 font-medium">
                              {doc.pageCount} {t.pagesProcessed}
                            </span>
                            <span>·</span>
                          </>
                        )}
                        {doc.slideCount && (
                          <>
                            <span className="text-emerald-400 font-medium">
                              {doc.slideCount} {t.slidesProcessed}
                            </span>
                            <span>·</span>
                          </>
                        )}
                        <span className="text-purple-300 font-mono">
                          {doc.chunkCount} {language === 'hi' ? 'खंड' : 'chunks'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {docChunks.length > 0 && (
                      <button
                        onClick={() => inspectSource(docChunks[0])}
                        className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="View First Chunk"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{language === 'hi' ? 'देखें' : 'View Chunk'}</span>
                      </button>
                    )}

                    <button
                      onClick={() => removeDocument(doc.id)}
                      className="p-1.5 text-xs rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
                      title={t.deleteFile}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Contextual Workflow Navigation */}
      <WorkflowFooter
        currentStep={1}
        totalSteps={5}
        stepName={language === 'hi' ? 'सामग्री अपलोड' : 'Upload Materials'}
        nextStep={{
          label: language === 'hi' ? 'अगला: अध्ययन मार्गदर्शिका →' : 'Next Step: Study Guide →',
          onNavigate: () => onNavigateToLearn?.(),
          disabled: documents.length === 0,
          disabledReason:
            language === 'hi'
              ? 'अध्ययन मार्गदर्शिका पर जाने से पहले कृपया कम से कम एक अध्ययन सामग्री अपलोड या पेस्ट करें।'
              : 'Please upload or paste at least one study material before proceeding to the Study Guide.',
        }}
      />
    </div>
  );
};
