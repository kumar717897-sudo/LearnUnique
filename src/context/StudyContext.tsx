import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Language,
  UploadedDocument,
  DocumentChunk,
  ChatMessage,
  QuizSession,
  SynthesisData,
  Citation,
} from '../types';

interface StudyContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  documents: UploadedDocument[];
  chunks: DocumentChunk[];
  addDocument: (doc: UploadedDocument, docChunks: DocumentChunk[]) => void;
  removeDocument: (docId: string) => void;
  clearAllMaterials: () => void;
  chatMessages: ChatMessage[];
  addChatMessage: (msg: ChatMessage) => void;
  clearChatHistory: () => void;
  quizSessions: QuizSession[];
  addQuizSession: (session: QuizSession) => void;
  synthesisData: SynthesisData | null;
  setSynthesisData: (data: SynthesisData | null) => void;
  activeChunkInspection: { chunk?: DocumentChunk; citation?: Citation } | null;
  inspectSource: (citationOrChunk: Citation | DocumentChunk) => void;
  closeSourceInspection: () => void;
}

const StudyContext = createContext<StudyContextType | undefined>(undefined);

export const StudyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Language persistence: strictly persists across refreshes and screen changes
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('study_companion_lang');
      if (saved === 'hi' || saved === 'en') return saved;
    } catch {}
    return 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('study_companion_lang', lang);
    } catch {}
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'hi' : 'en');
  };

  // 2. Uploaded Documents & Chunks: STRICT INITIAL EMPTY ARRAY `[]` (ZERO FAKE DATA)
  const [documents, setDocuments] = useState<UploadedDocument[]>(() => {
    try {
      const saved = localStorage.getItem('study_companion_docs');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [chunks, setChunks] = useState<DocumentChunk[]>(() => {
    try {
      const saved = localStorage.getItem('study_companion_chunks');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('study_companion_docs', JSON.stringify(documents));
    } catch {}
  }, [documents]);

  useEffect(() => {
    try {
      localStorage.setItem('study_companion_chunks', JSON.stringify(chunks));
    } catch {}
  }, [chunks]);

  const addDocument = (doc: UploadedDocument, newChunks: DocumentChunk[]) => {
    setDocuments((prev) => [doc, ...prev]);
    setChunks((prev) => [...prev, ...newChunks]);
    // Immediately invalidate stale study guide summary when new document is uploaded
    setSynthesisData(null);
  };

  const removeDocument = (docId: string) => {
    setDocuments((prev) => {
      const updated = prev.filter((d) => d.id !== docId);
      if (updated.length === 0) {
        try {
          localStorage.removeItem('study_companion_docs');
        } catch {}
      }
      return updated;
    });
    setChunks((prev) => {
      const updated = prev.filter((c) => c.docId !== docId);
      if (updated.length === 0) {
        try {
          localStorage.removeItem('study_companion_chunks');
        } catch {}
      }
      return updated;
    });
    // Immediately invalidate stale study guide summary when a document is deleted
    setSynthesisData(null);
  };

  const clearAllMaterials = () => {
    setDocuments([]);
    setChunks([]);
    setSynthesisData(null);
    setChatMessages([]);
    localStorage.removeItem('study_companion_docs');
    localStorage.removeItem('study_companion_chunks');
    localStorage.removeItem('study_companion_synthesis');
  };

  // 3. Chat Messages persistence
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('study_companion_chat');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('study_companion_chat', JSON.stringify(chatMessages));
    } catch {}
  }, [chatMessages]);

  const addChatMessage = (msg: ChatMessage) => {
    setChatMessages((prev) => [...prev, msg]);
  };

  const clearChatHistory = () => {
    setChatMessages([]);
    localStorage.removeItem('study_companion_chat');
  };

  // 4. Quiz Sessions & Real Evaluation Data persistence (ZERO FAKE SCORES)
  const [quizSessions, setQuizSessions] = useState<QuizSession[]>(() => {
    try {
      const saved = localStorage.getItem('study_companion_quizzes');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('study_companion_quizzes', JSON.stringify(quizSessions));
    } catch {}
  }, [quizSessions]);

  const addQuizSession = (session: QuizSession) => {
    setQuizSessions((prev) => [session, ...prev]);
  };

  // 5. Synthesis Data with Document Binding & Invalidation
  const [synthesisData, setSynthesisDataState] = useState<SynthesisData | null>(() => {
    try {
      const savedDocs = localStorage.getItem('study_companion_docs');
      const docs: UploadedDocument[] = savedDocs ? JSON.parse(savedDocs) : [];
      if (!docs || docs.length === 0) {
        localStorage.removeItem('study_companion_synthesis');
        return null;
      }

      const saved = localStorage.getItem('study_companion_synthesis');
      if (saved) {
        const parsed: SynthesisData = JSON.parse(saved);
        // Verify that the cached summary belongs to the currently active documents
        if (!parsed.docIds || !Array.isArray(parsed.docIds) || parsed.docIds.length === 0) {
          localStorage.removeItem('study_companion_synthesis');
          return null;
        }

        const currentDocIds = docs.map((d) => d.id).sort().join(',');
        const cachedDocIds = [...parsed.docIds].sort().join(',');
        if (currentDocIds !== cachedDocIds) {
          localStorage.removeItem('study_companion_synthesis');
          return null;
        }

        return parsed;
      }
    } catch {}
    return null;
  });

  const setSynthesisData = (data: SynthesisData | null) => {
    setSynthesisDataState(data);
    try {
      if (data) {
        localStorage.setItem('study_companion_synthesis', JSON.stringify(data));
      } else {
        localStorage.removeItem('study_companion_synthesis');
      }
    } catch {}
  };

  // Keep synthesis in sync with active documents
  useEffect(() => {
    if (documents.length === 0) {
      setSynthesisDataState(null);
      try {
        localStorage.removeItem('study_companion_synthesis');
      } catch {}
    } else if (synthesisData) {
      const currentDocIds = documents.map((d) => d.id).sort().join(',');
      const cachedDocIds =
        synthesisData.docIds && Array.isArray(synthesisData.docIds)
          ? [...synthesisData.docIds].sort().join(',')
          : '';

      if (!cachedDocIds || currentDocIds !== cachedDocIds) {
        setSynthesisDataState(null);
        try {
          localStorage.removeItem('study_companion_synthesis');
        } catch {}
      }
    }
  }, [documents, synthesisData]);

  // 6. Citation & Source Chunk Inspector Modal
  const [activeChunkInspection, setActiveChunkInspection] = useState<{
    chunk?: DocumentChunk;
    citation?: Citation;
  } | null>(null);

  const inspectSource = (citationOrChunk: Citation | DocumentChunk) => {
    if ('text' in citationOrChunk) {
      // It is a DocumentChunk
      setActiveChunkInspection({ chunk: citationOrChunk });
    } else {
      // It is a Citation
      const matched = chunks.find(
        (c) =>
          (citationOrChunk.sourceId && c.id === citationOrChunk.sourceId) ||
          (c.docName === citationOrChunk.docName && c.location === citationOrChunk.location)
      );
      setActiveChunkInspection({ citation: citationOrChunk, chunk: matched });
    }
  };

  const closeSourceInspection = () => {
    setActiveChunkInspection(null);
  };

  return (
    <StudyContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        documents,
        chunks,
        addDocument,
        removeDocument,
        clearAllMaterials,
        chatMessages,
        addChatMessage,
        clearChatHistory,
        quizSessions,
        addQuizSession,
        synthesisData,
        setSynthesisData,
        activeChunkInspection,
        inspectSource,
        closeSourceInspection,
      }}
    >
      {children}
    </StudyContext.Provider>
  );
};

export function useStudy() {
  const context = useContext(StudyContext);
  if (!context) {
    throw new Error('useStudy must be used within a StudyProvider');
  }
  return context;
}
