import React from 'react';
import { KeyIcon } from './icons/KeyIcon';

interface HeaderProps {
  onChangeApiKey: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onChangeApiKey }) => {
  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4 py-3 md:py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-teal-600 dark:text-teal-400">
              Medical Report Analyzer
            </h1>
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Extract, Summarize, and Discuss Your Health Data
            </p>
          </div>
          <button 
            onClick={onChangeApiKey}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors"
            title="Change API Key"
            aria-label="Change API Key"
          >
            <KeyIcon />
          </button>
        </div>
      </div>
    </header>
  );
};
