import React from 'react';
import { KeyIcon } from './icons/KeyIcon';

interface HeaderProps {
  onChangeApiKey: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onChangeApiKey }) => {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-md">
      <div className="container mx-auto px-4 md:px-8 py-4 flex flex-col items-center text-center relative">
        <h1 className="text-2xl md:text-3xl font-bold text-teal-600 dark:text-teal-400">
          Medical Report Analyzer
        </h1>
        <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 mt-1">
          Extract, Summarize, and Discuss Your Health Data
        </p>
        <button 
          onClick={onChangeApiKey}
          className="absolute top-1/2 -translate-y-1/2 right-4 p-2 rounded-full text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors"
          title="Change API Key"
          aria-label="Change API Key"
        >
          <KeyIcon />
        </button>
      </div>
    </header>
  );
};
