import React, { useState } from 'react';
import { StudyProvider } from './context/StudyContext';
import { Header } from './components/Header';
import { Navigation, TabId } from './components/Navigation';
import { UploadView } from './components/UploadView';
import { LearnView } from './components/LearnView';
import { AskView } from './components/AskView';
import { PracticeView } from './components/PracticeView';
import { ProgressView } from './components/ProgressView';
import { EvaluationView } from './components/EvaluationView';
import { SourceModal } from './components/SourceModal';

function AppContent() {
  const [activeTab, setActiveTab] = useState<TabId>('upload');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-purple-600 selection:text-white">
      {/* Top Header */}
      <Header />

      {/* Primary Workflow Navigation */}
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1 w-full overflow-x-hidden">
        {activeTab === 'upload' && (
          <UploadView onNavigateToLearn={() => setActiveTab('learn')} />
        )}
        {activeTab === 'learn' && (
          <LearnView
            onNavigateToUpload={() => setActiveTab('upload')}
            onNavigateToAsk={() => setActiveTab('ask')}
          />
        )}
        {activeTab === 'ask' && (
          <AskView
            onNavigateToUpload={() => setActiveTab('upload')}
            onNavigateToLearn={() => setActiveTab('learn')}
            onNavigateToPractice={() => setActiveTab('practice')}
          />
        )}
        {activeTab === 'practice' && (
          <PracticeView
            onNavigateToUpload={() => setActiveTab('upload')}
            onNavigateToAsk={() => setActiveTab('ask')}
            onNavigateToProgress={() => setActiveTab('progress')}
            onNavigateToEvaluation={() => setActiveTab('evaluation')}
          />
        )}
        {activeTab === 'progress' && (
          <ProgressView
            onNavigateToUpload={() => setActiveTab('upload')}
            onNavigateToPractice={() => setActiveTab('practice')}
            onNavigateToEvaluation={() => setActiveTab('evaluation')}
          />
        )}
        {activeTab === 'evaluation' && (
          <EvaluationView
            onNavigateToPractice={() => setActiveTab('practice')}
            onNavigateToProgress={() => setActiveTab('progress')}
            onNavigateToUpload={() => setActiveTab('upload')}
          />
        )}
      </main>

      {/* Global Source Chunk & Citation Modal Inspector */}
      <SourceModal />
    </div>
  );
}

export default function App() {
  return (
    <StudyProvider>
      <AppContent />
    </StudyProvider>
  );
}
