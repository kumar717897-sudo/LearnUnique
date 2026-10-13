import React, { useState } from 'react';
import {
  CheckSquare,
  Sparkles,
  Loader2,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  RotateCcw,
  BarChart,
  Bookmark,
  ExternalLink,
} from 'lucide-react';
import { useStudy } from '../context/StudyContext';
import { translations } from '../translations';
import { QuizQuestion, QuizSession } from '../types';
import { WorkflowFooter } from './WorkflowFooter';

interface PracticeViewProps {
  onNavigateToUpload: () => void;
  onNavigateToAsk?: () => void;
  onNavigateToProgress?: () => void;
  onNavigateToEvaluation: () => void;
}

export const PracticeView: React.FC<PracticeViewProps> = ({
  onNavigateToUpload,
  onNavigateToAsk,
  onNavigateToProgress,
  onNavigateToEvaluation,
}) => {
  const { language, chunks, documents, addQuizSession, inspectSource } = useStudy();
  const t = translations[language].practiceScreen;

  // Configuration state
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [difficulty, setDifficulty] = useState<string>('adaptive');
  const [selectedTopic, setSelectedTopic] = useState<string>('All Material');

  // Exam execution state
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<{
    questions: QuizQuestion[];
    currentIndex: number;
    userAnswers: Record<number, number>; // question index -> option index
    isSubmitted: Record<number, boolean>; // question index -> boolean
    completed: boolean;
    startTime: number;
  } | null>(null);

  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const handleGenerateTest = async () => {
    if (chunks.length === 0) return;
    setIsGenerating(true);
    setErrorMessage(null);

    // Filter chunks by topic if user selected specific document
    const relevantChunks =
      selectedTopic === 'All Material'
        ? chunks
        : chunks.filter((c) => c.docName === selectedTopic);

    try {
      const res = await fetch('/api/test/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionCount,
          difficulty,
          chunks: relevantChunks.length > 0 ? relevantChunks : chunks,
          language,
          topic: selectedTopic,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to generate test.');
      }

      const data = await res.json();
      const generatedQuestions: QuizQuestion[] = data.questions || [];

      if (generatedQuestions.length === 0) {
        throw new Error('No questions generated. Please verify study material.');
      }

      setActiveSession({
        questions: generatedQuestions,
        currentIndex: 0,
        userAnswers: {},
        isSubmitted: {},
        completed: false,
        startTime: Date.now(),
      });
      setSelectedOption(null);
    } catch (err: any) {
      console.warn('Test generation notice:', err);
      setErrorMessage(err?.message || 'Error creating test.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmitAnswer = () => {
    if (!activeSession || selectedOption === null) return;
    const curIdx = activeSession.currentIndex;

    const updatedAnswers = {
      ...activeSession.userAnswers,
      [curIdx]: selectedOption,
    };
    const updatedSubmitted = {
      ...activeSession.isSubmitted,
      [curIdx]: true,
    };

    setActiveSession({
      ...activeSession,
      userAnswers: updatedAnswers,
      isSubmitted: updatedSubmitted,
    });
  };

  const handleNextQuestion = () => {
    if (!activeSession) return;
    const nextIdx = activeSession.currentIndex + 1;
    if (nextIdx < activeSession.questions.length) {
      setActiveSession({
        ...activeSession,
        currentIndex: nextIdx,
      });
      setSelectedOption(
        activeSession.userAnswers[nextIdx] !== undefined
          ? activeSession.userAnswers[nextIdx]
          : null
      );
    }
  };

  const handleFinishExam = () => {
    if (!activeSession) return;

    // Calculate score
    let correctCount = 0;
    const finalizedQuestions = activeSession.questions.map((q, idx) => {
      const ans = activeSession.userAnswers[idx];
      if (ans === q.correctIndex) correctCount++;
      return {
        ...q,
        userAnswerIndex: ans,
      };
    });

    const total = finalizedQuestions.length;
    const percentage = Math.round((correctCount / total) * 100);
    const timeSpent = Math.round((Date.now() - activeSession.startTime) / 1000);

    const newQuizSession: QuizSession = {
      id: `quiz_${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      topic: selectedTopic,
      difficulty,
      score: correctCount,
      totalQuestions: total,
      percentage,
      timeTakenSeconds: timeSpent,
      questions: finalizedQuestions,
    };

    // Save to global context
    addQuizSession(newQuizSession);

    setActiveSession({
      ...activeSession,
      questions: finalizedQuestions,
      completed: true,
    });
  };

  // STRICT ZERO FAKE DATA CHECK: If no chunks, show empty state
  if (chunks.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-4">
          <CheckSquare className="w-7 h-7" />
        </div>
        <h3 className="text-lg sm:text-xl font-bold text-slate-100 mb-2">
          {t.emptyTitle}
        </h3>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto mb-6">
          {t.emptyDesc}
        </p>
        <button
          onClick={onNavigateToUpload}
          className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs sm:text-sm font-semibold transition-all shadow-lg shadow-purple-950/60 cursor-pointer"
        >
          {translations[language].learnScreen.goToUpload}
        </button>
      </div>
    );
  }

  // 1. CONFIGURATION VIEW
  if (!activeSession) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {t.title}
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {t.subtitle}
          </p>
        </div>

        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/40 text-red-300 text-xs sm:text-sm">
            {errorMessage}
          </div>
        )}

        <div className="p-6 sm:p-8 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-6">
          <h3 className="text-base font-semibold text-slate-100 border-b border-slate-800 pb-3">
            {t.configTitle}
          </h3>

          {/* Question count selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              {t.questionCountLabel}: <span className="text-purple-300 font-mono">{questionCount}</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[3, 5, 10, 15].map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => setQuestionCount(cnt)}
                  className={`py-2 px-3 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    questionCount === cnt
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-950/60'
                      : 'bg-slate-950 text-slate-300 border border-slate-800 hover:border-purple-500/40'
                  }`}
                >
                  {cnt} {language === 'hi' ? 'प्रश्न' : 'Questions'}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty mode */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              {t.difficultyLabel}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'adaptive', label: t.diffAdaptive },
                { id: 'easy', label: t.diffEasy },
                { id: 'medium', label: t.diffMedium },
                { id: 'hard', label: t.diffHard },
              ].map((diff) => (
                <button
                  key={diff.id}
                  type="button"
                  onClick={() => setDifficulty(diff.id)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-medium transition-all text-left truncate cursor-pointer ${
                    difficulty === diff.id
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-950/60'
                      : 'bg-slate-950 text-slate-300 border border-slate-800 hover:border-purple-500/40'
                  }`}
                >
                  {diff.label}
                </button>
              ))}
            </div>
          </div>

          {/* Topic filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              {t.filterTopicLabel}
            </label>
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs sm:text-sm focus:outline-none focus:border-purple-500"
            >
              <option value="All Material">{t.allTopics} ({chunks.length} chunks)</option>
              {documents.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name} ({d.chunkCount} chunks)
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleGenerateTest}
            disabled={isGenerating}
            className="w-full py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm transition-all shadow-lg shadow-purple-950/60 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t.generatingTest}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{t.generateTestButton}</span>
              </>
            )}
          </button>
        </div>

        {/* Contextual Workflow Navigation */}
        <WorkflowFooter
          currentStep={4}
          totalSteps={5}
          stepName={language === 'hi' ? 'अभ्यास परीक्षा' : 'Practice Exam'}
          previousStep={{
            label: language === 'hi' ? '← पिछला: AI ट्यूटर' : '← Previous: Ask AI Tutor',
            onNavigate: () => (onNavigateToAsk ? onNavigateToAsk() : onNavigateToUpload()),
          }}
          nextStep={{
            label: language === 'hi' ? 'अगला: प्रगति और एनालिटिक्स →' : 'Next Step: View Progress →',
            onNavigate: () => onNavigateToProgress?.(),
            disabled: documents.length === 0,
            disabledReason:
              language === 'hi'
                ? 'आगे बढ़ने के लिए अध्ययन सामग्री आवश्यक है।'
                : 'Study materials required before viewing progress.',
          }}
        />
      </div>
    );
  }

  // 2. COMPLETED TEST RESULTS VIEW
  if (activeSession.completed) {
    const total = activeSession.questions.length;
    const correctCount = activeSession.questions.filter(
      (q) => q.userAnswerIndex === q.correctIndex
    ).length;
    const percentage = Math.round((correctCount / total) * 100);

    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Results Banner */}
        <div className="p-8 rounded-2xl bg-gradient-to-br from-slate-900 to-purple-950/50 border border-purple-500/30 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-purple-950/80 border border-purple-500/40 text-purple-300 flex items-center justify-center mx-auto text-2xl font-bold font-mono">
            {percentage}%
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-white">
              {t.testCompleted}
            </h3>
            <p className="text-sm text-slate-300 mt-1">
              {t.scoreLabel}: <strong className="text-purple-300 font-mono">{correctCount}</strong> / {total} {language === 'hi' ? 'सही उत्तर' : 'correct'}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setActiveSession(null)}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs sm:text-sm font-semibold transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{t.retakeTest}</span>
            </button>

            <button
              onClick={onNavigateToEvaluation}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs sm:text-sm font-semibold transition-all shadow-md shadow-purple-950/60 cursor-pointer"
            >
              <BarChart className="w-4 h-4" />
              <span>{t.viewInEvaluation}</span>
            </button>
          </div>
        </div>

        {/* Detailed Question Review */}
        <div className="space-y-4">
          <h4 className="text-base font-bold text-slate-100">
            {t.reviewResults}
          </h4>
          {activeSession.questions.map((q, qIdx) => {
            const isCorrect = q.userAnswerIndex === q.correctIndex;
            return (
              <div
                key={q.id || qIdx}
                className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 mt-0.5">
                      Q{qIdx + 1}
                    </span>
                    <h5 className="font-semibold text-slate-100 text-sm">{q.question}</h5>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded font-medium shrink-0 flex items-center gap-1 ${
                      isCorrect
                        ? 'bg-emerald-950/60 border border-emerald-500/30 text-emerald-300'
                        : 'bg-rose-950/60 border border-rose-500/30 text-rose-300'
                    }`}
                  >
                    {isCorrect ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    <span>{isCorrect ? t.correctTag : t.incorrectTag}</span>
                  </span>
                </div>

                {/* Options List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {q.options.map((opt, optIdx) => {
                    const isSelected = q.userAnswerIndex === optIdx;
                    const isTheCorrect = q.correctIndex === optIdx;
                    return (
                      <div
                        key={optIdx}
                        className={`p-2.5 rounded-lg border ${
                          isTheCorrect
                            ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-200'
                            : isSelected
                            ? 'bg-rose-950/30 border-rose-500/50 text-rose-200'
                            : 'bg-slate-950 border-slate-800/80 text-slate-400'
                        }`}
                      >
                        <span className="font-mono font-semibold mr-1.5">
                          {String.fromCharCode(65 + optIdx)}.
                        </span>
                        <span>{opt}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Explanation and Citation */}
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 text-xs text-slate-300 space-y-1.5">
                  <span className="font-semibold text-purple-300 block">
                    {t.explanationTitle}:
                  </span>
                  <p className="text-slate-300 leading-relaxed">{q.explanation}</p>
                  {q.citation && (
                    <button
                      onClick={() => inspectSource(q.citation)}
                      className="flex items-center gap-1.5 text-purple-400 hover:text-purple-300 transition-colors pt-1 font-mono text-[11px] cursor-pointer"
                    >
                      <Bookmark className="w-3 h-3" />
                      <span>{q.citation.docName} · {q.citation.location}</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Contextual Workflow Navigation */}
        <WorkflowFooter
          currentStep={4}
          totalSteps={5}
          stepName={language === 'hi' ? 'अभ्यास परीक्षा' : 'Practice Exam'}
          previousStep={{
            label: language === 'hi' ? '← पिछला: AI ट्यूटर' : '← Previous: Ask AI Tutor',
            onNavigate: () => (onNavigateToAsk ? onNavigateToAsk() : onNavigateToUpload()),
          }}
          nextStep={{
            label: language === 'hi' ? 'अगला: प्रगति और एनालिटिक्स →' : 'Next Step: View Progress →',
            onNavigate: () => onNavigateToProgress?.(),
            disabled: documents.length === 0,
            disabledReason:
              language === 'hi'
                ? 'आगे बढ़ने के लिए अध्ययन सामग्री आवश्यक है।'
                : 'Study materials required before viewing progress.',
          }}
        />
      </div>
    );
  }

  // 3. ACTIVE TEST IN-PROGRESS
  const curQ = activeSession.questions[activeSession.currentIndex];
  const isCurSubmitted = activeSession.isSubmitted[activeSession.currentIndex] || false;
  const curAnswer = activeSession.userAnswers[activeSession.currentIndex];
  const isCurCorrect = isCurSubmitted && curAnswer === curQ.correctIndex;
  const isLastQuestion = activeSession.currentIndex === activeSession.questions.length - 1;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Progress header */}
      <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-3">
        <span className="font-mono text-purple-300 font-semibold">
          {t.questionNumber} {activeSession.currentIndex + 1} {t.of} {activeSession.questions.length}
        </span>
        <span className="text-[11px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
          {curQ.topic} · {curQ.difficulty}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
        <div
          className="bg-purple-500 h-full transition-all duration-300"
          style={{
            width: `${((activeSession.currentIndex + 1) / activeSession.questions.length) * 100}%`,
          }}
        />
      </div>

      {/* Question Card */}
      <div className="p-6 sm:p-8 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-6">
        <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
          {curQ.question}
        </h3>

        {/* 4 Options */}
        <div className="space-y-3">
          {curQ.options.map((option, optIdx) => {
            const isSelected = selectedOption === optIdx || curAnswer === optIdx;
            const isThisCorrect = curQ.correctIndex === optIdx;

            let optionStyle =
              'bg-slate-950 border-slate-800 text-slate-300 hover:border-purple-500/40';

            if (isCurSubmitted) {
              if (isThisCorrect) {
                optionStyle = 'bg-emerald-950/40 border-emerald-500 text-emerald-200';
              } else if (isSelected) {
                optionStyle = 'bg-rose-950/40 border-rose-500 text-rose-200';
              } else {
                optionStyle = 'bg-slate-950 border-slate-800/60 text-slate-500';
              }
            } else if (isSelected) {
              optionStyle = 'bg-purple-950/40 border-purple-500 text-purple-100 shadow-md';
            }

            return (
              <button
                key={optIdx}
                disabled={isCurSubmitted}
                onClick={() => setSelectedOption(optIdx)}
                className={`w-full p-4 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer text-xs sm:text-sm ${optionStyle}`}
              >
                <span className="w-6 h-6 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-0.5">
                  {String.fromCharCode(65 + optIdx)}
                </span>
                <span className="flex-1 leading-relaxed">{option}</span>
                {isCurSubmitted && isThisCorrect && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                )}
                {isCurSubmitted && isSelected && !isThisCorrect && (
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
              </button>
            );
          })}
        </div>

        {/* Explanation on submit */}
        {isCurSubmitted && (
          <div
            className={`p-4 rounded-xl border text-xs space-y-2 animate-in fade-in duration-200 ${
              isCurCorrect
                ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                : 'bg-rose-950/20 border-rose-500/30 text-rose-200'
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold">
              {isCurCorrect ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{t.correctTag}!</span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 text-rose-400" />
                  <span>{t.incorrectTag}.</span>
                </>
              )}
            </div>
            <p className="text-slate-200 leading-relaxed">{curQ.explanation}</p>
            {curQ.citation && (
              <button
                onClick={() => inspectSource(curQ.citation)}
                className="flex items-center gap-1.5 text-purple-300 hover:text-purple-200 transition-colors pt-1 font-mono text-[11px] cursor-pointer"
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>
                  {curQ.citation.docName} · {curQ.citation.location}
                </span>
                <ExternalLink className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
        )}

        {/* Action button */}
        <div className="pt-2 flex justify-end">
          {!isCurSubmitted ? (
            <button
              onClick={handleSubmitAnswer}
              disabled={selectedOption === null}
              className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs sm:text-sm transition-all shadow-md shadow-purple-950/60 disabled:opacity-40 cursor-pointer"
            >
              {t.submitAnswer}
            </button>
          ) : !isLastQuestion ? (
            <button
              onClick={handleNextQuestion}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs sm:text-sm transition-all shadow-md shadow-purple-950/60 cursor-pointer"
            >
              <span>{t.nextQuestion}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleFinishExam}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm transition-all shadow-md shadow-emerald-950/60 cursor-pointer"
            >
              {t.finishExam}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
