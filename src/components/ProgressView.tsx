import React, { useState, useEffect } from 'react';
import {
  BarChart2,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Award,
  Calendar,
  ArrowRight,
  RotateCcw,
  BarChart,
  RefreshCw,
} from 'lucide-react';
import { useStudy } from '../context/StudyContext';
import { translations } from '../translations';
import { QuizSession } from '../types';
import { WorkflowFooter } from './WorkflowFooter';

interface ProgressViewProps {
  onNavigateToUpload?: () => void;
  onNavigateToPractice: () => void;
  onNavigateToEvaluation: () => void;
}

export const ProgressView: React.FC<ProgressViewProps> = ({
  onNavigateToUpload,
  onNavigateToPractice,
  onNavigateToEvaluation,
}) => {
  const { language, quizSessions, refreshQuizHistory, lastRefreshedAt } = useStudy();
  const t = translations[language].progressScreen;

  const [displayedSessions, setDisplayedSessions] = useState<QuizSession[]>(quizSessions);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [refreshSuccess, setRefreshSuccess] = useState<string | null>(null);

  // Synchronize local view state whenever context quizSessions change
  useEffect(() => {
    setDisplayedSessions(quizSessions);
  }, [quizSessions]);

  const handleRefreshHistory = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setRefreshError(null);
    setRefreshSuccess(null);
    try {
      const prevSerialized = JSON.stringify(displayedSessions);
      const prevCount = displayedSessions.length;

      // 1. Fetch fresh authoritative records from storage and server
      const latest = await refreshQuizHistory();

      // 2. Immediately update local view state so rendered history updates instantly
      setDisplayedSessions(latest);

      const newSerialized = JSON.stringify(latest);
      const newCount = latest.length;
      const dataChanged = prevSerialized !== newSerialized;

      // 3. Clear, accurate feedback based on actual change detection
      if (!dataChanged) {
        if (newCount === 0) {
          setRefreshSuccess(
            language === 'hi'
              ? 'इतिहास अद्यतित है। अभी तक कोई अभ्यास परीक्षा दर्ज नहीं है।'
              : 'History is up to date. No practice test records found.'
          );
        } else {
          setRefreshSuccess(
            language === 'hi'
              ? `इतिहास पहले से अद्यतित है (${newCount} ${newCount === 1 ? 'सत्र' : 'सत्र'})। कोई नया बदलाव नहीं मिला।`
              : `History is up to date (${newCount} completed ${newCount === 1 ? 'session' : 'sessions'}). No changes detected.`
          );
        }
      } else {
        if (newCount > prevCount) {
          const added = newCount - prevCount;
          setRefreshSuccess(
            language === 'hi'
              ? `इतिहास सफलतापूर्वक ताज़ा हुआ! ${added} नया ${added === 1 ? 'सत्र' : 'सत्र'} लोड हुआ (कुल ${newCount})।`
              : `History refreshed successfully! Loaded ${added} new ${added === 1 ? 'session' : 'sessions'} (${newCount} total).`
          );
        } else {
          setRefreshSuccess(
            language === 'hi'
              ? `इतिहास सफलतापूर्वक ताज़ा हुआ! अद्यतित रिकॉर्ड प्रदर्शित (कुल ${newCount} सत्र)।`
              : `History refreshed successfully! Updated records displayed (${newCount} total).`
          );
        }
      }
    } catch (err: any) {
      setRefreshError(
        language === 'hi'
          ? 'प्रगति इतिहास ताज़ा करने में समस्या आई। कृपया पुनः प्रयास करें।'
          : (err?.message || 'Failed to refresh progress history. Please try again.')
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  // STRICT ZERO FAKE DATA CHECK: If no tests have been completed, MUST BE EMPTY
  if (displayedSessions.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-4">
          <BarChart2 className="w-7 h-7" />
        </div>
        <h3 className="text-lg sm:text-xl font-bold text-slate-100 mb-2">
          {t.emptyTitle}
        </h3>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto mb-6">
          {t.emptyDesc}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={onNavigateToPractice}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs sm:text-sm font-semibold transition-all shadow-lg shadow-purple-950/60 cursor-pointer"
          >
            {t.startPracticeBtn}
          </button>
          <button
            onClick={handleRefreshHistory}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs sm:text-sm font-semibold transition-all cursor-pointer disabled:opacity-50"
            title={t.refreshHistory}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-purple-400' : ''}`} />
            <span>{isRefreshing ? (language === 'hi' ? 'ताज़ा हो रहा है...' : 'Refreshing...') : t.refreshHistory}</span>
          </button>
        </div>

        {refreshSuccess && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs max-w-md mx-auto flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{refreshSuccess}</span>
          </div>
        )}

        {refreshError && (
          <div className="mt-4 p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs max-w-md mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{refreshError}</span>
            </div>
            <button
              onClick={handleRefreshHistory}
              className="px-2.5 py-1 rounded-lg bg-rose-900/80 hover:bg-rose-800 text-white text-xs font-medium transition-colors cursor-pointer"
            >
              {translations[language].retry}
            </button>
          </div>
        )}

        {/* Contextual Workflow Navigation */}
        <WorkflowFooter
          currentStep={5}
          totalSteps={5}
          stepName={language === 'hi' ? 'प्रगति और एनालिटिक्स' : 'Progress & Analytics'}
          previousStep={{
            label: language === 'hi' ? '← पिछला: अभ्यास परीक्षा' : '← Previous: Practice Exam',
            onNavigate: onNavigateToPractice,
          }}
          finishAction={{
            label: language === 'hi' ? 'नया सत्र शुरू करें / सामग्री ↺' : 'Start New Session / Back to Upload ↺',
            onNavigate: () => (onNavigateToUpload ? onNavigateToUpload() : undefined),
          }}
          secondaryAction={{
            label: language === 'hi' ? 'RAG मूल्यांकन देखें →' : 'View RAG Evaluation →',
            onNavigate: onNavigateToEvaluation,
            icon: <BarChart className="w-4 h-4 text-purple-400" />,
          }}
        />
      </div>
    );
  }

  // Real data calculations from actual quiz sessions
  const totalTests = displayedSessions.length;
  const totalQuestions = displayedSessions.reduce((acc, s) => acc + s.totalQuestions, 0);
  const totalCorrect = displayedSessions.reduce((acc, s) => acc + s.score, 0);
  const overallAccuracy = Math.round((totalCorrect / Math.max(1, totalQuestions)) * 100);

  // Group by topic
  const topicMap: Record<string, { total: number; correct: number }> = {};
  displayedSessions.forEach((session) => {
    session.questions.forEach((q) => {
      const top = q.topic || session.topic || 'General';
      if (!topicMap[top]) topicMap[top] = { total: 0, correct: 0 };
      topicMap[top].total++;
      if (q.userAnswerIndex === q.correctIndex) {
        topicMap[top].correct++;
      }
    });
  });

  const weakTopics = Object.entries(topicMap)
    .filter(([_, stats]) => stats.total > 0 && stats.correct / stats.total < 0.7)
    .map(([topic, stats]) => ({
      topic,
      accuracy: Math.round((stats.correct / stats.total) * 100),
      total: stats.total,
    }));

  const strongTopics = Object.entries(topicMap)
    .filter(([_, stats]) => stats.total > 0 && stats.correct / stats.total >= 0.7)
    .map(([topic, stats]) => ({
      topic,
      accuracy: Math.round((stats.correct / stats.total) * 100),
      total: stats.total,
    }));

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {t.title}
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {t.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-center">
          <button
            onClick={handleRefreshHistory}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
            title={t.refreshHistory}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-purple-400' : ''}`} />
            <span>{isRefreshing ? (language === 'hi' ? 'ताज़ा हो रहा है...' : 'Refreshing...') : t.refreshHistory}</span>
          </button>

          <button
            onClick={onNavigateToEvaluation}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-900/30 border border-purple-500/30 text-purple-300 hover:bg-purple-900/50 text-xs font-medium transition-all cursor-pointer"
          >
            <span>{translations[language].practiceScreen.viewInEvaluation}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {refreshSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{refreshSuccess}</span>
          </div>
          <button
            onClick={() => setRefreshSuccess(null)}
            className="text-emerald-400 hover:text-emerald-200 text-xs cursor-pointer p-1"
            title="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

      {refreshError && (
        <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{refreshError}</span>
          </div>
          <button
            onClick={handleRefreshHistory}
            className="px-2.5 py-1 rounded-lg bg-rose-900/80 hover:bg-rose-800 text-white text-xs font-medium transition-colors cursor-pointer"
          >
            {translations[language].retry}
          </button>
        </div>
      )}

      {/* Top Real Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">{t.totalTestsTaken}</span>
          <div className="text-2xl sm:text-3xl font-bold text-white font-mono">
            {totalTests}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">{t.totalQuestionsAnswered}</span>
          <div className="text-2xl sm:text-3xl font-bold text-white font-mono">
            {totalQuestions}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">{t.overallAccuracy}</span>
          <div className="text-2xl sm:text-3xl font-bold text-purple-400 font-mono">
            {overallAccuracy}%
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">{t.masteryRate}</span>
          <div className="text-2xl sm:text-3xl font-bold text-emerald-400 font-mono">
            {strongTopics.length} / {Object.keys(topicMap).length || 1}
          </div>
        </div>
      </div>

      {/* Weak Topics vs Mastered Topics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Weak Topics Card */}
        <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-400" />
            <h3 className="font-semibold text-slate-100 text-sm sm:text-base">
              {t.weakTopicsTitle}
            </h3>
          </div>

          {weakTopics.length === 0 ? (
            <p className="text-xs text-slate-400 italic">
              {t.weakTopicsEmpty}
            </p>
          ) : (
            <div className="space-y-2.5">
              {weakTopics.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-950 border border-amber-500/20 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-medium text-slate-200 block truncate max-w-xs">
                      {item.topic}
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      {item.total} {language === 'hi' ? 'प्रश्न पूछे गए' : 'questions tested'}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-amber-950/80 border border-amber-500/30 text-amber-300 font-mono font-bold">
                    {item.accuracy}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mastered Topics Card */}
        <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-400" />
            <h3 className="font-semibold text-slate-100 text-sm sm:text-base">
              {t.strongTopicsTitle}
            </h3>
          </div>

          {strongTopics.length === 0 ? (
            <p className="text-xs text-slate-400 italic">
              {language === 'hi'
                ? 'अभी तक कोई विषय 70% सटीकता के साथ मास्टर नहीं हुआ है।'
                : 'Complete more tests with >= 70% score to master topics.'}
            </p>
          ) : (
            <div className="space-y-2.5">
              {strongTopics.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-950 border border-emerald-500/20 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-medium text-slate-200 block truncate max-w-xs">
                      {item.topic}
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      {item.total} {language === 'hi' ? 'प्रश्न पूछे गए' : 'questions tested'}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 font-mono font-bold">
                    {item.accuracy}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Completed Test History Table */}
      <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4">
        <h3 className="font-semibold text-slate-100 text-sm sm:text-base">
          {t.recentSessions}
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-3 font-semibold">{t.date}</th>
                <th className="pb-3 font-semibold">{t.topic}</th>
                <th className="pb-3 font-semibold">{t.score}</th>
                <th className="pb-3 font-semibold">{t.accuracy}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {displayedSessions.map((session) => (
                <tr key={session.id} className="text-slate-300">
                  <td className="py-3 font-mono text-[11px] text-slate-400">
                    {session.timestamp}
                  </td>
                  <td className="py-3 font-medium text-slate-200 truncate max-w-xs">
                    {session.topic}
                  </td>
                  <td className="py-3 font-mono">
                    {session.score} / {session.totalQuestions}
                  </td>
                  <td className="py-3">
                    <span
                      className={`px-2 py-0.5 rounded font-mono font-semibold ${
                        session.percentage >= 70
                          ? 'bg-emerald-950/60 text-emerald-300'
                          : session.percentage >= 50
                          ? 'bg-amber-950/60 text-amber-300'
                          : 'bg-rose-950/60 text-rose-300'
                      }`}
                    >
                      {session.percentage}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Contextual Workflow Navigation */}
      <WorkflowFooter
        currentStep={5}
        totalSteps={5}
        stepName={language === 'hi' ? 'प्रगति और एनालिटिक्स' : 'Progress & Analytics'}
        previousStep={{
          label: language === 'hi' ? '← पिछला: अभ्यास परीक्षा' : '← Previous: Practice Exam',
          onNavigate: onNavigateToPractice,
        }}
        finishAction={{
          label: language === 'hi' ? 'नया सत्र शुरू करें / सामग्री ↺' : 'Start New Session / Back to Upload ↺',
          onNavigate: () => (onNavigateToUpload ? onNavigateToUpload() : undefined),
        }}
        secondaryAction={{
          label: language === 'hi' ? 'RAG मूल्यांकन देखें →' : 'View RAG Evaluation Metrics →',
          onNavigate: onNavigateToEvaluation,
          icon: <BarChart className="w-4 h-4 text-purple-400" />,
        }}
      />
    </div>
  );
};
