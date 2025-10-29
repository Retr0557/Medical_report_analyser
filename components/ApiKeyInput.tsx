import React, { useState } from 'react';

interface ApiKeyInputProps {
  onSetKey: (key: string) => void;
}

export const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ onSetKey }) => {
  const [key, setKey] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSetKey(key);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 md:p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-xl md:text-2xl font-semibold text-teal-600 dark:text-teal-400">
            Medical Report Analyzer
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Please enter your Google Gemini API Key to continue.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="api-key" className="sr-only">
              API Key
            </label>
            <input
              id="api-key"
              name="api-key"
              type="password"
              autoComplete="off"
              required
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white transition"
              placeholder="Enter your API Key"
            />
             <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Your key is stored in your browser's session storage and is not sent anywhere other than to Google's API.
            </p>
          </div>
          <div>
            <button
              type="submit"
              disabled={!key.trim()}
              className="w-full py-2.5 px-4 rounded-lg text-base font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed dark:disabled:bg-gray-600 transition-colors"
            >
              Save &amp; Continue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
