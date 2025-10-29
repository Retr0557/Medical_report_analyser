import React, { useState, useRef } from 'react';
// FIX: Import Chat and GenerateContentResponse for proper typing.
import { type Chat, type GenerateContentResponse } from '@google/genai';
import { Header } from './components/Header';
import { ReportInput } from './components/ReportInput';
import { AnalysisResult } from './components/AnalysisResult';
import { ChatComponent } from './components/Chat';
import { analyzeMedicalReport, startChatSession } from './services/geminiService';
import type { ChatMessage, AnalysisPayload } from './types';

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
      
      chatRef.current = startChatSession(result);
      setChatMessages([
        { role: 'model', text: "Your report has been analyzed. You can now ask questions about the extracted parameters (e.g., \"What is Hemoglobin?\").\n\nPlease remember, I cannot provide medical advice. Always consult a healthcare professional for interpretation of your results." }
      ]);

    } catch (err) {
      console.error(err);
      let errorMessage = 'An unknown error occurred.';
      if (err instanceof Error) {
        try {
          // The Gemini API often returns a JSON string in the error message
          const errorObj = JSON.parse(err.message);
          if (errorObj.error) {
            if (errorObj.error.message) {
              errorMessage = errorObj.error.message;
            } else if (errorObj.error.status) {
              errorMessage = `The API returned an error: ${errorObj.error.status}. Please try again.`;
            }
            if (errorObj.error.status === 'UNAVAILABLE') {
              errorMessage = 'The model is currently overloaded. Our automatic retry failed. Please try again in a few moments.';
            }
          } else {
            errorMessage = err.message;
          }
        } catch (e) {
          // If parsing fails, it's just a regular error message string
          errorMessage = err.message;
        }
      }
      setError(`Failed to analyze the report. Please check the console for details. Error: ${errorMessage}`);
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
      const responseStream = await chatRef.current.sendMessageStream({ message });

      let firstChunk = true;
      let accumulatedText = '';

      for await (const chunk of responseStream) {
        const chunkText = chunk.text;
        accumulatedText += chunkText;

        if (firstChunk) {
          // On the first chunk, create the new model message entry
          setChatMessages(prev => [...prev, { role: 'model', text: accumulatedText }]);
          firstChunk = false;
        } else {
          // On subsequent chunks, update the last message entry
          setChatMessages(prev => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1].text = accumulatedText;
            return newMessages;
          });
        }
      }
    } catch (err) {
      console.error(err);
      // If an error occurs, add an error message bubble.
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