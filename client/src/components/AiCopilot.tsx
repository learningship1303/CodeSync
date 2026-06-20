import React, { useState } from 'react';
import { Sparkles, Send, Loader2 } from 'lucide-react';
import API from '../services/api';

interface AiCopilotProps {
  currentCode: string;
  contextLanguage: string;
}

export const AiCopilot: React.FC<AiCopilotProps> = ({ currentCode, contextLanguage }) => {
  const [prompt, setPrompt] = useState('');
  const [chatLog, setChatLog] = useState<{ role: 'user' | 'ai'; text: string }[]>([
    { role: 'ai', text: 'Hey dev! I am synced with your active code buffer. Drop a query to optimize or debug!' }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    const userText = prompt.trim();
    setPrompt('');
    setChatLog(prev => [...prev, { role: 'user', text: userText }]);
    setIsLoading(true);

    try {
      const response = await API.post('/ai/consult', {
        prompt: userText,
        currentCode,
        contextLanguage
      });

      setChatLog(prev => [...prev, { role: 'ai', text: response.data.response }]);
    } catch (err) {
      setChatLog(prev => [...prev, { role: 'ai', text: 'Pipeline Error: Failed to execute prompt vectors.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-80 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-4 flex flex-col h-full font-sans">
      <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
        <Sparkles className="h-4 w-4 text-purple-500 animate-pulse" />
        <span className="text-sm font-bold bg-gradient-to-r from-purple-500 to-indigo-500 bg-clip-text text-transparent">AI Copilot Core</span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1 scrollbar-thin text-xs">
        {chatLog.map((chat, idx) => (
          <div key={idx} className={`p-2.5 rounded-xl max-w-[85%] ${
            chat.role === 'user' 
              ? 'bg-indigo-600 text-white ml-auto' 
              : 'bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200'
          }`}>
            <span className="whitespace-pre-wrap font-medium">{chat.text}</span>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 text-slate-400 font-mono animate-pulse pl-2">
            <Loader2 className="h-3 w-3 animate-spin text-purple-500" />
            <span>Parsing token matrix...</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSendPrompt} className="relative flex items-center">
        <input
          type="text"
          value={prompt}
          disabled={isLoading}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask AI to debug or refactor..."
          className="w-full bg-slate-100 dark:bg-slate-950 text-xs border border-slate-200 dark:border-slate-800 rounded-xl pl-3 pr-10 py-3 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none"
        />
        <button type="submit" className="absolute right-2 p-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-all transform active:scale-95">
          <Send className="h-3 w-3" />
        </button>
      </form>
    </div>
  );
};
