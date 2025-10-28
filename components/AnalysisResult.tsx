import React from 'react';
import type { AnalysisPayload } from '../types';

interface AnalysisResultProps {
  result: AnalysisPayload;
  onReset: () => void;
}

export const AnalysisResult: React.FC<AnalysisResultProps> = ({ result, onReset }) => {
  return (
    <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 md:p-8 space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Analysis Summary
        </h2>
        <p className="text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-md">
          {result.summary}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic">
          Disclaimer: This is an AI-generated summary and is not a substitute for professional medical advice.
        </p>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
          Extracted Health Parameters
        </h2>
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-gray-700 dark:text-gray-300">
              <tr>
                <th scope="col" className="px-6 py-3">Parameter</th>
                <th scope="col" className="px-6 py-3">Value</th>
                <th scope="col" className="px-6 py-3">Unit</th>
                <th scope="col" className="px-6 py-3">Reference Range</th>
              </tr>
            </thead>
            <tbody>
              {result.parameters.map((param, index) => (
                <tr key={index} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600/50">
                  <th scope="row" className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                    {param.parameter}
                  </th>
                  <td className="px-6 py-4">{param.value ?? 'N/A'}</td>
                  <td className="px-6 py-4">{param.unit ?? 'N/A'}</td>
                  <td className="px-6 py-4">{param.referenceRange ?? 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="pt-4">
        <button
          onClick={onReset}
          className="w-full flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-md font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors"
        >
          Analyze Another Report
        </button>
      </div>
    </div>
  );
};