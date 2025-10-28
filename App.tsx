import React, { useState, useCallback, useRef } from 'react';
import type { Chat } from '@google/genai';
import { Header } from './components/Header';
import { ReportInput } from './components/ReportInput';
import { AnalysisResult } from './components/AnalysisResult';
import { ChatComponent } from './components/Chat';
import { analyzeMedicalReport, startChatSession } from './services/geminiService';
import type { HealthParameter, ChatMessage, AnalysisPayload } from './types';

const App: React.FC = () => {
  const [analysisResult, setAnalysisResult] = useState<AnalysisPayload | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatRef = useRef<Chat | null>(null);

  const handleReset = () => {
    setAnalysisResult(null);
    setChatMessages([]);
    setError(null);
    chatRef.current = null;
  };

  const handleProcessReport = async (file: { content: string; mimeType: string }) => {
    if (!file.content.trim()) {
      setError('Please provide a medical report to analyze.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await analyzeMedicalReport(file);
      setAnalysisResult(result);
      
      chatRef.current = startChatSession();
      setChatMessages([
        { role: 'model', text: 'Your report has been analyzed. Feel free to ask any general medical questions. Please remember, I cannot provide medical advice.' }
      ]);

    } catch (err) {
      console.error(err);
      setError('Failed to analyze the report. Please check the console for details.');
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
      // Fix: The `sendMessage` method expects an object with a `message` property.
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

  return (
    <div className="min-h-screen font-sans text-gray-800 dark:text-gray-200">
      <Header />
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