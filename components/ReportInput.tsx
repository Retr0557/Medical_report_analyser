import React, { useState, useRef } from 'react';
import { UploadIcon } from './icons/UploadIcon';

interface ReportInputProps {
  onProcess: (file: { content: string; mimeType: string }) => void;
  isLoading: boolean;
  error: string | null;
}

export const ReportInput: React.FC<ReportInputProps> = ({ onProcess, isLoading, error }) => {
  const [reportText, setReportText] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileData, setFileData] = useState<{ content: string; mimeType: string; } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Clear textarea when a file is selected
    setReportText('');
    setFileName(file.name);
    const reader = new FileReader();

    const acceptedImageTypes = file.type.startsWith('image/');
    const acceptedFileTypes = ['text/plain', 'application/pdf'].includes(file.type);

    if (acceptedImageTypes || acceptedFileTypes) {
      if (file.type === 'text/plain') {
        reader.onload = (e) => {
          const text = e.target?.result as string;
          setReportText(text); // Set text area content directly
          setFileData(null); // Clear file data state
        };
        reader.readAsText(file);
      } else { // Images and PDFs
        reader.onload = (e) => {
          const result = e.target?.result as string;
          // Strip the data URL prefix to get the pure base64 string
          const base64String = result.split(',')[1];
          setFileData({ content: base64String, mimeType: file.type });
        };
        reader.readAsDataURL(file);
      }
    } else {
      alert("Please upload a valid .txt, image, or .pdf file.");
      setFileName('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setReportText(e.target.value);
    // Clear file input if text is pasted
    if (e.target.value) {
      setFileData(null);
      setFileName('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = () => {
    if (reportText.trim()) {
      onProcess({ content: reportText, mimeType: 'text/plain' });
    } else if (fileData) {
      onProcess(fileData);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 md:p-8 space-y-6">
      <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
        Upload or Paste Your Medical Report
      </h2>
      
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md" role="alert">{error}</div>}

      <div className="space-y-4">
        <label htmlFor="report-textarea" className="block text-sm font-medium text-gray-600 dark:text-gray-400">
          Paste report text below
        </label>
        <textarea
          id="report-textarea"
          value={reportText}
          onChange={handleTextChange}
          placeholder="Paste the text from your OCR'd medical report here..."
          className="w-full h-64 p-3 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white transition"
          disabled={isLoading}
        />
      </div>

      <div className="flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
        <span className="flex-shrink-0 px-2">OR</span>
        <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
      </div>
      
      <div>
        <label className="w-full flex justify-center px-4 py-6 bg-gray-50 dark:bg-gray-700 text-teal-600 dark:text-teal-400 rounded-md shadow-sm tracking-wide border border-dashed border-gray-300 dark:border-gray-600 cursor-pointer hover:bg-teal-50 dark:hover:bg-gray-600 transition">
          <UploadIcon />
          <span className="ml-2">{fileName || 'Upload a .txt, image, or PDF file'}</span>
          <input ref={fileInputRef} type="file" className="hidden" accept=".txt,image/*,.pdf" onChange={handleFileChange} disabled={isLoading} />
        </label>
      </div>

      <div className="pt-4">
        <button
          onClick={handleSubmit}
          disabled={isLoading || (!reportText.trim() && !fileData)}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:bg-gray-400 disabled:cursor-not-allowed dark:disabled:bg-gray-500 transition-colors"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Analyzing...
            </>
          ) : 'Analyze Report'}
        </button>
      </div>
    </div>
  );
};