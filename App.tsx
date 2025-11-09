
import React, { useState } from 'react';
import Header from './components/Header';
import HalalIdentifier from './components/HalalIdentifier';
import Chatbot from './components/Chatbot';
import UserGuide from './components/UserGuide';
import { SparklesIcon } from './components/icons/SparklesIcon';

type View = 'identifier' | 'chatbot' | 'guide';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('identifier');

  const renderView = () => {
    switch (activeView) {
      case 'identifier':
        return <HalalIdentifier />;
      case 'chatbot':
        return <Chatbot />;
      case 'guide':
        return <UserGuide />;
      default:
        return <HalalIdentifier />;
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-200 font-sans flex flex-col bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.15),rgba(255,255,255,0))]">
      <Header activeView={activeView} setActiveView={setActiveView} />
      <main className="flex-grow container mx-auto p-4 md:p-8 flex flex-col">
        {renderView()}
      </main>
      <footer className="bg-transparent text-center py-4">
        <p className="text-zinc-500 text-sm flex items-center justify-center gap-2">
          Powered by Gemini AI <SparklesIcon className="w-4 h-4 text-fuchsia-500" />
        </p>
      </footer>
    </div>
  );
};

export default App;