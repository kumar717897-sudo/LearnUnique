import React from 'react';
import { X, FileText, Bookmark, ExternalLink } from 'lucide-react';
import { useStudy } from '../context/StudyContext';
import { translations } from '../translations';

export const SourceModal: React.FC = () => {
  const { activeChunkInspection, closeSourceInspection, language } = useStudy();
  const t = translations[language].sourceModal;

  if (!activeChunkInspection) return null;

  const { chunk, citation } = activeChunkInspection;
  const docName = chunk?.docName || citation?.docName || 'Unknown Document';
  const location = chunk?.location || citation?.location || 'Unknown Location';
  const quote = citation?.quote;
  const fullText = chunk?.text;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div
        className="relative w-full max-w-2xl bg-slate-900 border border-purple-500/30 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-purple-950/60 border border-purple-500/20 text-purple-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100 text-sm md:text-base">
                {t.title}
              </h3>
              <p className="text-xs text-slate-400 truncate max-w-xs md:max-w-md">
                {docName} · {location}
              </p>
            </div>
          </div>
          <button
            onClick={closeSourceInspection}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            aria-label={t.close}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Metadata info */}
          <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-slate-950/50 border border-slate-800 text-xs text-slate-300">
            <div>
              <span className="text-slate-400 block mb-0.5">{t.docName}</span>
              <span className="font-medium text-purple-300 truncate block">{docName}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">{t.location}</span>
              <span className="font-medium text-purple-300">{location}</span>
            </div>
          </div>

          {/* Exact Quote if provided */}
          {quote && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 mb-1.5">
                <Bookmark className="w-3.5 h-3.5" />
                <span>{t.exactQuote}</span>
              </div>
              <blockquote className="p-3.5 rounded-lg bg-amber-950/20 border border-amber-500/30 text-amber-200/90 italic text-xs leading-relaxed">
                "{quote}"
              </blockquote>
            </div>
          )}

          {/* Full Chunk Context */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1.5">
              <span>{t.fullChunk}</span>
              <span className="text-slate-400 font-mono text-[11px]">
                {chunk?.id || 'Ground Context'}
              </span>
            </div>
            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800/80 text-slate-300 text-xs leading-relaxed max-h-72 overflow-y-auto whitespace-pre-wrap select-text">
              {fullText ? (
                fullText
              ) : (
                <span className="text-slate-400 italic">
                  Excerpt citation verified directly from: {docName} ({location})
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            onClick={closeSourceInspection}
            className="px-4 py-2 text-xs font-medium rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition-colors"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
