import React, { useState } from 'react';
import {
  GraduationCap,
  Sparkles,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  MapPin,
  ExternalLink,
  Loader2,
  BookmarkCheck,
} from 'lucide-react';
import { useStudy } from '../context/StudyContext';
import { translations } from '../translations';
import { SynthesisData } from '../types';
import { WorkflowFooter } from './WorkflowFooter';

interface LearnViewProps {
  onNavigateToUpload: () => void;
  onNavigateToAsk?: () => void;
}

export const LearnView: React.FC<LearnViewProps> = ({ onNavigateToUpload, onNavigateToAsk }) => {
  const { language, documents, chunks, synthesisData, setSynthesisData, inspectSource } = useStudy();
  const t = translations[language].learnScreen;

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // If cached synthesis belongs to documents that were deleted or modified, discard it
  const currentDocIdsSorted = documents.map((d) => d.id).sort().join(',');
  const isSynthesisStale = Boolean(
    synthesisData &&
      (!synthesisData.docIds ||
        !Array.isArray(synthesisData.docIds) ||
        [...synthesisData.docIds].sort().join(',') !== currentDocIdsSorted ||
        (synthesisData.language && synthesisData.language !== language))
  );

  React.useEffect(() => {
    if (isSynthesisStale || documents.length === 0) {
      setSynthesisData(null);
    }
  }, [isSynthesisStale, documents.length]);

  const handleSynthesize = async () => {
    if (chunks.length === 0 || documents.length === 0) {
      setSynthesisData(null);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    // Clear old/stale summary while regenerating
    setSynthesisData(null);

    try {
      const res = await fetch('/api/learn/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chunks,
          language,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        let detail = err.error || 'Failed to synthesize study guide.';
        if (err.details && typeof err.details === 'string') {
          try {
            const parsedDetails = JSON.parse(err.details);
            if (parsedDetails?.error?.message) {
              detail = parsedDetails.error.message;
            }
          } catch {
            detail = err.details;
          }
        }
        throw new Error(detail);
      }

      const data: SynthesisData = await res.json();
      // Bind synthesis strictly to the current documents and selected language
      data.docIds = documents.map((d) => d.id);
      data.docNames = documents.map((d) => d.name);
      data.language = language;

      setSynthesisData(data);
      setActiveCardIndex(0);
      setIsFlipped(false);
    } catch (err: any) {
      console.warn('Synthesis notice:', err);
      // Ensure failure shows error instead of an old summary
      setSynthesisData(null);
      setErrorMessage(
        err?.message ||
          (language === 'hi'
            ? 'अध्ययन मार्गदर्शिका तैयार करने में समस्या आई। कृपया पुनः प्रयास करें।'
            : 'Error creating study guide. Please try again.')
      );
    } finally {
      setIsLoading(false);
    }
  };

  // 1. STRICT ZERO FAKE DATA CHECK: If no chunks or documents uploaded, MUST BE 100% EMPTY
  if (chunks.length === 0 || documents.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-4">
          <BookOpen className="w-7 h-7" />
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
          {t.goToUpload}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header and Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {t.title}
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {t.subtitle}
          </p>
        </div>

        <button
          onClick={handleSynthesize}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs sm:text-sm font-semibold transition-all shadow-lg shadow-purple-950/60 active:scale-95 disabled:opacity-50 cursor-pointer self-start sm:self-center"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{t.synthesizing}</span>
            </>
          ) : (
            <>
              {synthesisData ? (
                <RotateCw className="w-4 h-4" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              <span>{synthesisData ? t.regenerate : t.generateGuide}</span>
            </>
          )}
        </button>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/40 text-red-300 text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex-1 leading-relaxed">{errorMessage}</div>
          <button
            onClick={handleSynthesize}
            className="px-3 py-1.5 rounded-lg bg-red-900/60 hover:bg-red-800 text-white text-xs font-medium self-start sm:self-center transition-colors cursor-pointer"
          >
            {translations[language].retry}
          </button>
        </div>
      )}

      {isLoading && (
        <div className="p-10 rounded-2xl bg-purple-950/20 border border-purple-500/30 text-center animate-pulse space-y-3">
          <Loader2 className="w-8 h-8 text-purple-400 animate-spin mx-auto" />
          <h4 className="text-sm font-semibold text-purple-200">{t.synthesizing}</h4>
          <p className="text-xs text-slate-400">
            {language === 'hi'
              ? 'वर्तमान अध्ययन सामग्री का विश्लेषण किया जा रहा है...'
              : `Synthesizing current materials: ${documents.map((d) => d.name).join(', ')}...`}
          </p>
        </div>
      )}

      {/* Guide Content or Prompt to Synthesize */}
      {!synthesisData && !isLoading ? (
        <div className="p-10 rounded-2xl bg-slate-900/40 border border-slate-800 text-center">
          <div className="w-12 h-12 rounded-xl bg-purple-950/50 border border-purple-500/20 text-purple-400 flex items-center justify-center mx-auto mb-3">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h4 className="text-base font-semibold text-slate-200 mb-1">
            {language === 'hi' ? 'अध्ययन मार्गदर्शिका तैयार करें' : 'Generate Source-Grounded Study Guide'}
          </h4>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto mb-5">
            {language === 'hi'
              ? `आपके पास ${chunks.length} खंड अनुक्रमित हैं। सारांश, फ्लैशकार्ड और अवधारणाएं निकालने के लिए बटन पर क्लिक करें।`
              : `You have ${chunks.length} indexed chunks ready. Click the button above to synthesize key takeaways and flashcards.`}
          </p>
          <button
            onClick={handleSynthesize}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs sm:text-sm font-semibold transition-all cursor-pointer"
          >
            {t.generateGuide}
          </button>
        </div>
      ) : synthesisData ? (
        <div className="space-y-10">
          {/* Executive Takeaways */}
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
              <BookmarkCheck className="w-5 h-5 text-purple-400" />
              <span>{t.executiveTakeaways}</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {synthesisData.executiveSummary.map((item, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-purple-500/30 transition-all flex flex-col justify-between"
                >
                  <div>
                    <h4 className="font-semibold text-slate-200 text-sm mb-2">
                      {item.heading}
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-3">
                      {item.summary}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-purple-400/90 pt-3 border-t border-slate-800/80 font-mono">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{item.citation}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Flashcards */}
          {synthesisData.flashcards && synthesisData.flashcards.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                  <RotateCw className="w-5 h-5 text-purple-400" />
                  <span>{t.flashcardsTitle}</span>
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  {t.cardOf} {activeCardIndex + 1} / {synthesisData.flashcards.length}
                </span>
              </div>

              {/* Flashcard container */}
              <div className="max-w-xl mx-auto">
                <div
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="relative h-64 w-full rounded-2xl bg-gradient-to-br from-slate-900 to-purple-950/40 border border-purple-500/30 p-6 flex flex-col justify-between cursor-pointer hover:border-purple-500/60 transition-all shadow-xl group select-none"
                >
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-mono text-purple-300">
                      {synthesisData.flashcards[activeCardIndex].tag}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-slate-400 group-hover:text-purple-300 transition-colors">
                      <RotateCw className="w-3 h-3" /> {t.flipCard}
                    </span>
                  </div>

                  <div className="text-center py-4 px-2">
                    {!isFlipped ? (
                      <div className="space-y-2">
                        <span className="text-xs uppercase tracking-wider text-slate-400 block font-medium">
                          Concept / Question
                        </span>
                        <h4 className="text-lg sm:text-xl font-bold text-white">
                          {synthesisData.flashcards[activeCardIndex].front}
                        </h4>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <span className="text-xs uppercase tracking-wider text-purple-400 block font-medium">
                          Grounded Definition
                        </span>
                        <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
                          {synthesisData.flashcards[activeCardIndex].back}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-800/80">
                    <span className="text-purple-300/80 truncate text-[11px]">
                      📍 {synthesisData.flashcards[activeCardIndex].location}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {isFlipped ? 'Answer' : 'Prompt'}
                    </span>
                  </div>
                </div>

                {/* Flashcard Nav controls */}
                <div className="flex items-center justify-between mt-4">
                  <button
                    onClick={() => {
                      setIsFlipped(false);
                      setActiveCardIndex((prev) =>
                        prev > 0 ? prev - 1 : synthesisData.flashcards.length - 1
                      );
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-medium transition-all cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>{t.prevCard}</span>
                  </button>

                  <button
                    onClick={() => setIsFlipped(!isFlipped)}
                    className="px-4 py-2 rounded-xl bg-purple-900/30 border border-purple-500/20 text-purple-300 hover:bg-purple-900/50 text-xs font-medium transition-all cursor-pointer"
                  >
                    {t.flipCard}
                  </button>

                  <button
                    onClick={() => {
                      setIsFlipped(false);
                      setActiveCardIndex((prev) =>
                        prev < synthesisData.flashcards.length - 1 ? prev + 1 : 0
                      );
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-medium transition-all cursor-pointer"
                  >
                    <span>{t.nextCard}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Core Concept Index */}
          {synthesisData.concepts && synthesisData.concepts.length > 0 && (
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-purple-400" />
                <span>{t.keyConcepts}</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {synthesisData.concepts.map((c, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/80 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-semibold text-slate-100 text-sm">{c.concept}</h4>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                          c.importance === 'critical'
                            ? 'bg-rose-950/60 border border-rose-500/30 text-rose-300'
                            : c.importance === 'important'
                            ? 'bg-amber-950/60 border border-amber-500/30 text-amber-300'
                            : 'bg-slate-800 border border-slate-700 text-slate-300'
                        }`}
                      >
                        {c.importance === 'critical'
                          ? t.importanceCritical
                          : c.importance === 'important'
                          ? t.importanceImportant
                          : t.importanceSupplementary}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{c.explanation}</p>
                    <div className="text-[11px] text-purple-400/90 font-mono pt-2 border-t border-slate-800">
                      {t.sourceLocation}: {c.sourceLocation}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Contextual Workflow Navigation */}
      <WorkflowFooter
        currentStep={2}
        totalSteps={5}
        stepName={language === 'hi' ? 'अध्ययन मार्गदर्शिका' : 'Study Guide'}
        previousStep={{
          label: language === 'hi' ? '← पिछला: सामग्री अपलोड' : '← Previous: Study Materials',
          onNavigate: onNavigateToUpload,
        }}
        nextStep={{
          label: language === 'hi' ? 'अगला: AI ट्यूटर से पूछें →' : 'Next Step: Ask AI Tutor →',
          onNavigate: () => onNavigateToAsk?.(),
          disabled: documents.length === 0,
          disabledReason:
            language === 'hi'
              ? 'आगे बढ़ने के लिए अध्ययन सामग्री उपलब्ध होनी चाहिए।'
              : 'Study materials must be uploaded before asking questions.',
        }}
      />
    </div>
  );
};
