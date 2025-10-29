import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-md">
      <div className="container mx-auto px-4 md:px-8 py-4 flex flex-col items-center text-center relative">
        <h1 className="text-2xl md:text-3xl font-bold text-teal-600 dark:text-teal-400">
          Medical Report Analyzer
        </h1>
        <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 mt-1">
          Extract, Summarize, and Discuss Your Health Data
        </p>
      </div>
    </header>
  );
};