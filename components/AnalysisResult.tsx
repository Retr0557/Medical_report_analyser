import React from 'react';
import type { AnalysisPayload } from '../types';

interface AnalysisResultProps {
  result: AnalysisPayload;
  onReset: () => void;
}

export const AnalysisResult: React.FC<AnalysisResultProps> = ({ result, onReset }) => {
  return (
    <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 md:p-6 space-y-5">
      <div>
        <h2 className="text-lg md:text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Analysis Summary
        </h2>
        <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg leading-relaxed">
          {result.summary}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic">
          Disclaimer: This is an AI-generated summary and is not a substitute for professional medical advice.
        </p>
      </div>

      <div>
        <h2 className="text-lg md:text-xl font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Extracted Health Parameters
        </h2>
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-300">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Parameter</th>
                <th scope="col" className="px-4 py-3 font-medium">Value</th>
                <th scope="col" className="px-4 py-3 font-medium hidden sm:table-cell">Unit</th>
                <th scope="col" className="px-4 py-3 font-medium hidden md:table-cell">Reference Range</th>
              </tr>
            </thead>
            <tbody>
              {result.parameters.map((param, index) => (
                <tr key={index} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <th scope="row" className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                    <div className="whitespace-nowrap">{param.parameter}</div>
                    <div className="sm:hidden text-xs text-gray-500 dark:text-gray-400 font-normal mt-1">
                      {param.unit && <span className="mr-2">Unit: {param.unit}</span>}
                      {param.referenceRange && <div className="mt-0.5">Range: {param.referenceRange}</div>}
                    </div>
                  </th>
                  <td className="px-4 py-3">{param.value ?? 'N/A'}</td>
                  <td className="px-4 py-3 hidden sm:table-cell">{param.unit ?? 'N/A'}</td>
                  <td className="px-4 py-3 hidden md:table-cell">{param.referenceRange ?? 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="pt-2">
        <button
          onClick={onReset}
          className="w-full py-2.5 px-4 rounded-lg text-base font-medium text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-colors"
        >
          Analyze Another Report
        </button>
      </div>
    </div>
  );
};