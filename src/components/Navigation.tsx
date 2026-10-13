import React from 'react';
import {
  UploadCloud,
  GraduationCap,
  MessageSquare,
  CheckSquare,
  BarChart2,
  Activity,
} from 'lucide-react';
import { useStudy } from '../context/StudyContext';
import { translations } from '../translations';

export type TabId = 'upload' | 'learn' | 'ask' | 'practice' | 'progress' | 'evaluation';

interface NavigationProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  const { language } = useStudy();
  const t = translations[language].nav;

  const tabs: { id: TabId; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'upload', label: t.upload, icon: <UploadCloud className="w-4 h-4" /> },
    { id: 'learn', label: t.learn, icon: <GraduationCap className="w-4 h-4" /> },
    { id: 'ask', label: t.ask, icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'practice', label: t.practice, icon: <CheckSquare className="w-4 h-4" /> },
    { id: 'progress', label: t.progress, icon: <BarChart2 className="w-4 h-4" /> },
    {
      id: 'evaluation',
      label: t.evaluation,
      icon: <Activity className="w-4 h-4" />,
      badge: 'RAG',
    },
  ];

  return (
    <nav className="w-full bg-slate-950 border-b border-purple-900/20 px-4 sm:px-6 lg:px-8 py-2">
      <div className="max-w-7xl mx-auto flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-purple-600/25 border border-purple-500/50 text-white shadow-sm shadow-purple-900/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 border border-transparent'
              }`}
            >
              <span className={isActive ? 'text-purple-400' : 'text-slate-400'}>
                {tab.icon}
              </span>
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-900/80 text-purple-300 font-mono">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
