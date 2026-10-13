export type Language = 'en' | 'hi';

export type DocType = 'pdf' | 'ppt' | 'video' | 'text';

export interface DocumentChunk {
  id: string;
  docId: string;
  docName: string;
  docType: DocType;
  location: string; // e.g. "Page 3", "Slide 12", "04:25"
  pageNumber?: number;
  slideNumber?: number;
  timestamp?: string;
  text: string;
}

export interface UploadedDocument {
  id: string;
  name: string;
  type: DocType;
  size: number;
  pageCount?: number;
  slideCount?: number;
  chunkCount: number;
  uploadedAt: string;
  status: 'processing' | 'ready' | 'error';
  errorMessage?: string;
  pagesProcessed?: number;
  totalPages?: number;
}

export interface Citation {
  sourceId?: string;
  docName: string;
  location: string;
  quote: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  citations?: Citation[];
  foundInMaterial?: boolean;
}

export interface QuizQuestion {
  id: string;
  question: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  options: string[];
  correctIndex: number;
  userAnswerIndex?: number;
  explanation: string;
  citation: Citation;
}

export interface QuizSession {
  id: string;
  timestamp: string;
  topic: string;
  difficulty: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  timeTakenSeconds?: number;
  questions: QuizQuestion[];
}

export interface FlashcardItem {
  id: string;
  front: string;
  back: string;
  docName: string;
  location: string;
  tag?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  citation?: Citation;
  mastered?: boolean;
  bookmarked?: boolean;
}

export interface FlashcardDeck {
  id: string;
  title: string;
  topic: string;
  focus: string;
  createdAt: string;
  cards: FlashcardItem[];
}

export interface SynthesisData {
  title: string;
  docIds?: string[];
  docNames?: string[];
  language?: string;
  executiveSummary: {
    heading: string;
    summary: string;
    citation: string;
  }[];
  flashcards: {
    front: string;
    back: string;
    location: string;
    tag: string;
  }[];
  concepts: {
    concept: string;
    explanation: string;
    importance: 'critical' | 'important' | 'supplementary';
    sourceLocation: string;
  }[];
}

export interface RagEvaluationMetrics {
  totalTests: number;
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  ragEvaluation: {
    faithfulness: number; // 0 - 100%
    relevancy: number;    // 0 - 100%
    precision: number;    // 0 - 100%
    recall: number;       // 0 - 100%
  };
  topicBreakdown: Record<string, { total: number; correct: number }>;
  difficultyBreakdown: Record<string, { total: number; correct: number }>;
  weakTopics: { topic: string; accuracy: number; totalQuestions: number }[];
  strongTopics: { topic: string; accuracy: number; totalQuestions: number }[];
}
