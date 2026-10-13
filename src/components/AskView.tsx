import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  Loader2,
  Bookmark,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Bot,
  User,
  ExternalLink,
} from 'lucide-react';
import { useStudy } from '../context/StudyContext';
import { translations } from '../translations';
import { ChatMessage, Citation } from '../types';
import { WorkflowFooter } from './WorkflowFooter';

interface AskViewProps {
  onNavigateToUpload: () => void;
  onNavigateToLearn?: () => void;
  onNavigateToPractice?: () => void;
}

export const AskView: React.FC<AskViewProps> = ({
  onNavigateToUpload,
  onNavigateToLearn,
  onNavigateToPractice,
}) => {
  const {
    language,
    chunks,
    documents,
    chatMessages,
    addChatMessage,
    clearChatHistory,
    inspectSource,
  } = useStudy();
  const t = translations[language].askScreen;

  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = inputQuery.trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}_u`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    addChatMessage(userMsg);
    setInputQuery('');
    setIsLoading(true);

    // Filter/rank relevant chunks if there are many to keep request fast and reliable
    const relevantChunks = chunks.length > 35
      ? chunks.filter((c) => {
          const qWords = query.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
          const cText = (c.text + ' ' + c.docName).toLowerCase();
          return qWords.some((w) => cText.includes(w));
        }).slice(0, 30)
      : chunks;

    const chunksToSend = relevantChunks.length > 0 ? relevantChunks : chunks.slice(0, 30);

    let response: Response | null = null;
    let fetchErrorOccurred = false;

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query,
            history: chatMessages.slice(-6).map((m) => ({
              role: m.role,
              content: m.content,
            })),
            chunks: chunksToSend,
            language,
          }),
        });

        if (response.ok) break;
      } catch (fErr) {
        fetchErrorOccurred = true;
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 800));
        }
      }
    }

    try {
      if (!response || !response.ok) {
        throw new Error('Failed to fetch tutor response.');
      }

      const data = await response.json();

      const assistantMsg: ChatMessage = {
        id: `msg_${Date.now()}_a`,
        role: 'assistant',
        content: data.answer || t.notCoveredMsg,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        citations: data.citations || [],
        foundInMaterial: data.foundInMaterial ?? true,
      };

      addChatMessage(assistantMsg);
    } catch (err: any) {
      console.warn('Chat request notice:', err);
      const errorMsg: ChatMessage = {
        id: `msg_${Date.now()}_err`,
        role: 'assistant',
        content:
          language === 'hi'
            ? 'सर्वर से उत्तर प्राप्त करने में समस्या हुई। कृपया पुनः प्रयास करें।'
            : 'Error communicating with tutor. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        foundInMaterial: false,
      };
      addChatMessage(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // STRICT ZERO FAKE DATA CHECK: If no chunks, show empty state
  if (chunks.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-4">
          <MessageSquare className="w-7 h-7" />
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

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-4 py-3 sm:py-5 flex flex-col h-[calc(100dvh-125px)] min-h-[500px]">
      {/* Header bar */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight shrink-0">
            {t.title}
          </h2>
          <span className="text-[11px] text-purple-300/80 font-medium bg-purple-950/40 border border-purple-500/20 px-2.5 py-0.5 rounded-full truncate">
            {language === 'hi' ? 'केवल अपलोड की गई सामग्री से उत्तर' : 'केवल अपलोड की गई सामग्री से उत्तर'}
          </span>
        </div>

        {chatMessages.length > 0 && (
          <button
            onClick={clearChatHistory}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors px-2 py-1 rounded-lg hover:bg-slate-900 cursor-pointer shrink-0 ml-2"
            title={t.clearHistory}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.clearHistory}</span>
          </button>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 py-3">
        {chatMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <div className="w-12 h-12 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-center text-purple-400 mb-3">
              <Bot className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-slate-200 mb-1">
              {language === 'hi' ? 'तैयार है आपका अध्ययन ट्यूटर' : 'Your Grounded Study Tutor is Ready'}
            </h4>
            <p className="text-xs max-w-sm text-slate-400 mb-4">
              {language === 'hi'
                ? `आपके पास ${chunks.length} अनुक्रमित अध्ययन खंड उपलब्ध हैं। कोई भी विषय या अवधारणा पूछें।`
                : `Indexed from ${documents.length} materials (${chunks.length} chunks). Ask any concept, theorem, or question.`}
            </p>

            {/* Quick Suggestions from actual documents */}
            <div className="flex flex-wrap justify-center gap-2 max-w-lg">
              {documents.slice(0, 3).map((d, i) => (
                <button
                  key={i}
                  onClick={() => setInputQuery(
                    language === 'hi'
                      ? `"${d.name}" के मुख्य बिंदु क्या हैं?`
                      : `What are the core concepts covered in "${d.name}"?`
                  )}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-purple-500/40 text-slate-300 text-xs transition-colors cursor-pointer text-left truncate max-w-xs"
                >
                  💡 {d.name}
                </button>
              ))}
            </div>
          </div>
        ) : (
          chatMessages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-lg bg-purple-950 border border-purple-500/30 text-purple-400 flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[90%] sm:max-w-[80%] rounded-2xl px-3.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm space-y-2 break-words ${
                    isUser
                      ? 'bg-purple-600 text-white rounded-tr-xs'
                      : 'bg-slate-900 border border-slate-800/80 text-slate-200 rounded-tl-xs shadow-md'
                  }`}
                >
                  {/* Assistant Not-found warning badge */}
                  {!isUser && msg.foundInMaterial === false && (
                    <div className="flex items-center gap-1.5 text-xs text-amber-400 font-medium pb-1 border-b border-slate-800">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        {language === 'hi' ? 'सामग्री में अनुपलब्ध' : 'Not Found in Uploaded Material'}
                      </span>
                    </div>
                  )}

                  {/* Message content */}
                  <div className="whitespace-pre-wrap leading-relaxed select-text break-words">
                    {msg.content}
                  </div>

                  {/* Verifiable Clickable Citations */}
                  {!isUser && msg.citations && msg.citations.length > 0 && (
                    <div className="pt-2.5 mt-2 border-t border-slate-800/90 space-y-1.5">
                      <span className="text-[11px] font-semibold text-purple-300 block">
                        {t.citationsHeader}:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.citations.map((c, cIdx) => (
                          <button
                            key={cIdx}
                            onClick={() => inspectSource(c)}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-950/60 border border-purple-500/40 text-purple-200 text-xs hover:bg-purple-900/60 transition-colors cursor-pointer text-left"
                            title={c.quote ? `Quote: "${c.quote}"` : 'Click to inspect source chunk'}
                          >
                            <Bookmark className="w-3 h-3 text-purple-400 shrink-0" />
                            <span className="font-mono text-[11px] truncate max-w-[180px]">
                              {c.docName} · {c.location}
                            </span>
                            <ExternalLink className="w-2.5 h-2.5 text-purple-400 shrink-0" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div
                    className={`text-[10px] text-right font-mono ${
                      isUser ? 'text-purple-200' : 'text-slate-400'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>

                {isUser && (
                  <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center shrink-0 mt-1">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Loading typing bubble */}
        {isLoading && (
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-purple-950 border border-purple-500/30 text-purple-400 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3 rounded-2xl rounded-tl-xs bg-slate-900 border border-slate-800 text-slate-400 text-xs flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />
              <span>{t.thinking}</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <form onSubmit={handleSubmit} className="pt-2 pb-1 border-t border-slate-800 shrink-0 bg-slate-950">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder={t.chatPlaceholder}
            disabled={isLoading}
            className="flex-1 px-3.5 py-2.5 sm:py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 placeholder:text-slate-500 text-xs sm:text-sm focus:outline-none focus:border-purple-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!inputQuery.trim() || isLoading}
            className="px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs sm:text-sm transition-all shadow-md shadow-purple-950/60 disabled:opacity-40 cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <span>{t.sendButton}</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>

      {/* Contextual Workflow Navigation */}
      <div className="shrink-0">
        <WorkflowFooter
          className="mt-2 pt-2 border-t border-slate-800/60"
          currentStep={3}
          totalSteps={5}
          stepName={language === 'hi' ? 'AI ट्यूटर' : 'AI Tutor'}
          previousStep={{
            label: language === 'hi' ? '← पिछला: अध्ययन मार्गदर्शिका' : '← Previous: Study Guide',
            onNavigate: () => (onNavigateToLearn ? onNavigateToLearn() : onNavigateToUpload()),
          }}
          nextStep={{
            label: language === 'hi' ? 'अगला: अभ्यास परीक्षा →' : 'Next Step: Practice Exam →',
            onNavigate: () => onNavigateToPractice?.(),
            disabled: documents.length === 0,
            disabledReason:
              language === 'hi'
                ? 'अभ्यास परीक्षा शुरू करने से पहले अध्ययन सामग्री आवश्यक है।'
                : 'Study materials required before taking practice quizzes.',
          }}
        />
      </div>
    </div>
  );
};
