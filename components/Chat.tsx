import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../types';
import { SendIcon } from './icons/SendIcon';
import { BotIcon } from './icons/BotIcon';
import { UserIcon } from './icons/UserIcon';

interface ChatProps {
  chatHistory: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

export const ChatComponent: React.FC<ChatProps> = ({ chatHistory, onSendMessage, isLoading }) => {
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim()) {
      onSendMessage(inputMessage);
      setInputMessage('');
    }
  };
  
  return (
    <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
      <div className="p-4 md:p-5 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg md:text-xl font-semibold text-gray-700 dark:text-gray-300">
          Continue the Conversation
        </h2>
        <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-0.5">Ask questions about your analyzed report.</p>
      </div>

      <div className="h-80 md:h-96 overflow-y-auto p-4 md:p-5 space-y-3">
        {chatHistory.map((msg, index) => (
          <div key={index} className={`flex items-start gap-2 md:gap-3 ${msg.role === 'user' ? 'justify-end' : ''} animate-fade-in-up`}>
            {msg.role === 'model' && (
              <div className="flex-shrink-0 w-7 h-7 md:w-8 md:h-8 rounded-full bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center">
                <BotIcon />
              </div>
            )}
            <div className={`max-w-[85%] md:max-w-md px-3 py-2 md:px-4 md:py-2.5 rounded-lg ${msg.role === 'user' ? 'bg-teal-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}>
              <p className="text-sm md:text-base whitespace-pre-wrap">{msg.text}</p>
            </div>
             {msg.role === 'user' && (
              <div className="flex-shrink-0 w-7 h-7 md:w-8 md:h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                <UserIcon />
              </div>
            )}
          </div>
        ))}
        {isLoading && (
            <div className="flex items-start gap-2 md:gap-3 animate-fade-in-up">
                 <div className="flex-shrink-0 w-7 h-7 md:w-8 md:h-8 rounded-full bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center">
                    <BotIcon />
                </div>
                 <div className="max-w-[85%] md:max-w-md px-3 py-2 md:px-4 md:py-2.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                    <div className="flex items-center justify-center space-x-1">
                        <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                        <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                        <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse"></div>
                    </div>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 md:p-5 border-t border-gray-200 dark:border-gray-700">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask about your results..."
            className="flex-grow px-4 py-2 md:py-2.5 border border-gray-300 rounded-full focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white transition text-sm md:text-base"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !inputMessage.trim()}
            className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-teal-600 text-white hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:bg-gray-300 dark:disabled:bg-gray-600 transition-colors"
            aria-label="Send message"
          >
            <SendIcon />
          </button>
        </form>
      </div>
    </div>
  );
};