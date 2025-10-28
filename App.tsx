import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { Chat } from '@google/genai';
import { Header } from './components/Header';
import { ReportInput } from './components/ReportInput';
import { AnalysisResult } from './components/AnalysisResult';
import { ChatComponent } from './components/Chat';
import { ApiKeyInput } from './components/ApiKeyInput';
import { analyzeMedicalReport, startChatSession } from './services/geminiService';
import type { HealthParameter, ChatMessage, AnalysisPayload } from './types';

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisPayload | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatRef = useRef<Chat | null>(null);

  useEffect(() => {
    const storedKey = sessionStorage.getItem('GEMINI_API_KEY');
    if (storedKey) {
      setApiKey(storedKey);
    }
  }, []);

  const handleSetApiKey = (key: string) => {
    if (key.trim()) {
      const trimmedKey = key.trim();
      sessionStorage.setItem('GEMINI_API_KEY', trimmedKey);
      setApiKey(trimmedKey);
    }
  };

  const handleReset = () => {
    setAnalysisResult(null);
    setChatMessages([]);
    setError(null);
    chatRef.current = null;
  };

  const handleChangeApiKey = () => {
    sessionStorage.removeItem('GEMINI_API_KEY');
    setApiKey(null);
    handleReset();
  };

  const handleProcessReport = async (file: { content: string; mimeType: string }) => {
    if (!apiKey) {
      setError('API Key is not set. Please refresh and enter your API key.');
      return;
    }
    if (!file.content.trim()) {
      setError('Please provide a medical report to analyze.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await analyzeMedicalReport(file, apiKey);
      setAnalysisResult(result);
      
      chatRef.current = startChatSession(apiKey);
      setChatMessages([
        { role: 'model', text: 'Your report has been analyzed. Feel free to ask any general medical questions. Please remember, I cannot provide medical advice.' }
      ]);

    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to analyze the report. Please check your API key and the console for details. Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!chatRef.current || !message.trim()) return;

    const userMessage: ChatMessage = { role: 'user', text: message };
    setChatMessages(prev => [...prev, userMessage]);
    setIsChatLoading(true);

    try {
      const response = await chatRef.current.sendMessage({ message });
      const modelMessage: ChatMessage = { role: 'model', text: response.text };
      setChatMessages(prev => [...prev, modelMessage]);
    } catch (err) {
      console.error(err);
      const errorMessage: ChatMessage = { role: 'model', text: 'Sorry, I encountered an error. Please try again.' };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsChatLoading(false);
    }
  };
  
  if (!apiKey) {
    return <ApiKeyInput onSetKey={handleSetApiKey} />;
  }

  return (
    <div className="min-h-screen font-sans text-gray-800 dark:text-gray-200">
      <Header onChangeApiKey={handleChangeApiKey} />
      <main className="container mx-auto p-4 md:p-8">
        {!analysisResult ? (
          <ReportInput onProcess={handleProcessReport} isLoading={isLoading} error={error} />
        ) : (
          <div className="space-y-8">
            <AnalysisResult result={analysisResult} onReset={handleReset} />
            <ChatComponent 
              chatHistory={chatMessages} 
              onSendMessage={handleSendMessage} 
              isLoading={isChatLoading} 
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
