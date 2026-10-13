import React from 'react';
import { Languages, BookOpen, ShieldCheck, Database } from 'lucide-react';
import { useStudy } from '../context/StudyContext';
import { translations } from '../translations';

export const Header: React.FC = () => {
  const { language, toggleLanguage, chunks, documents } = useStudy();
  const t = translations[language];

  return (
    <header className="w-full border-b border-purple-900/30 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Brand & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-purple-950/50 shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {t.appName}
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-950/80 border border-purple-500/30 text-purple-300 font-mono hidden sm:inline-block">
                Track D
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {t.appSubtitle}
            </p>
          </div>
        </div>

        {/* Status badges & Language Switcher */}
        <div className="flex items-center flex-wrap gap-2.5 sm:gap-3 text-xs">
          {/* Grounding integrity status */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px] font-medium">{t.sourceGroundedBadge}</span>
          </div>

          {/* Real Indexed Chunks Counter */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-300">
            <Database className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-[11px]">
              <strong className="text-purple-300 font-mono">{chunks.length}</strong> {language === 'hi' ? 'खंड' : 'chunks'}
              <span className="text-slate-400"> ({documents.length} {language === 'hi' ? 'फाइलें' : 'docs'})</span>
            </span>
          </div>

          {/* Language Toggle Button */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-200 transition-all active:scale-95"
            title="Toggle App Language"
          >
            <Languages className="w-3.5 h-3.5 text-purple-400" />
            <span className="font-semibold text-xs">{t.langToggle}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-mono">
              {language.toUpperCase()}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
