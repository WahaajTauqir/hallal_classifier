
import React from 'react';
import { ChatBubbleIcon } from './icons/ChatBubbleIcon';
import { BookOpenIcon } from './icons/BookOpenIcon';
import { SparklesIcon } from './icons/SparklesIcon';

type View = 'identifier' | 'chatbot' | 'guide';

interface HeaderProps {
  activeView: View;
  setActiveView: (view: View) => void;
}

const Header: React.FC<HeaderProps> = ({ activeView, setActiveView }) => {
  const NavButton: React.FC<{
    view: View;
    icon: React.ReactNode;
    label: string;
  }> = ({ view, icon, label }) => {
    const isActive = activeView === view;
    return (
      <button
        onClick={() => setActiveView(view)}
        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 ${
          isActive
            ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg'
            : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100'
        }`}
      >
        {icon}
        <span className="hidden sm:inline">{label}</span>
      </button>
    );
  };

  return (
    <header className="bg-black/70 backdrop-blur-lg sticky top-0 z-10 border-b border-zinc-800/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <SparklesIcon className="h-6 w-6 text-emerald-400" />
              Halal Identifier
            </h1>
          </div>
          <nav className="flex items-center space-x-2 sm:space-x-4">
            <NavButton view="identifier" icon={<SparklesIcon className="h-5 w-5" />} label="Identifier" />
            <NavButton view="chatbot" icon={<ChatBubbleIcon className="h-5 w-5" />} label="Chatbot" />
            <NavButton view="guide" icon={<BookOpenIcon className="h-5 w-5" />} label="User Guide" />
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;