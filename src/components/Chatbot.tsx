import React, { useState, useCallback, useRef, useEffect } from 'react';
import axios, { AxiosInstance } from 'axios';
import { Loader2, Send, MessageCircle, RefreshCcw, Moon, Sun, Code, User, Bot, Smile, Copy, MoreVertical } from 'lucide-react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

interface Message {
  id: string;
  user: 'Вы' | 'Бот';
  text: string;
  timestamp: number;
  type?: 'default' | 'code' | 'error';
  reactions?: string[];
}

interface ChatConfig {
  model: string;
  temperature: number;
  maxTokens: number;
}

enum ModelProvider {
  OpenAI = 'openai/gpt-3.5-turbo',
  Anthropic = 'anthropic/claude-2'
}

export default function AdvancedChatbot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [config, setConfig] = useState<ChatConfig>({
    model: ModelProvider.OpenAI,
    temperature: 0.7,
    maxTokens: 300
  });
  const [darkMode, setDarkMode] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const getApiKey = (model: string) => {
    switch (model) {
      case ModelProvider.OpenAI:
        return import.meta.env.VITE_OPENAI_API_KEY;
      case ModelProvider.Anthropic:
        return import.meta.env.VITE_ANTHROPIC_API_KEY;
      case ModelProvider.Google:
        return import.meta.env.VITE_GOOGLE_API_KEY;
      default:
        return '';
    }
  };

  const createApiClient = useCallback((): AxiosInstance => {
    const apiKey = getApiKey(config.model);
    return axios.create({
      baseURL: 'https://openrouter.ai/api/v1/',
      timeout: 15000,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      }
    });
  }, [config.model]);

  const generateId = () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const formatMessage = (text: string) => {
    if (text.includes('```')) {
      const parts = text.split('```');
      return parts.map((part, index) => {
        if (index % 2 === 1) { 
          return (
            <div className="my-2 rounded-lg overflow-hidden">
              <SyntaxHighlighter
                language="javascript"
                style={atomDark}
                className="!m-0"
              >
                {part.trim()}
              </SyntaxHighlighter>
            </div>
          );
        }
        return <p className="whitespace-pre-wrap">{part}</p>;
      });
    }
    return text;
  };

  const sendMessage = useCallback(async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput) return;

    const userMessage: Message = {
      id: generateId(),
      user: 'Вы',
      text: trimmedInput,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      const api = createApiClient();
      const response = await api.post('chat/completions', {
        model: config.model,
        messages: [{ role: "user", content: trimmedInput }],
        max_tokens: config.maxTokens,
        temperature: config.temperature
      });

      const botReply = response.data?.choices?.[0]?.message?.content || 'Ответ не получен.';

      const botMessage: Message = {
        id: generateId(),
        user: 'Бот',
        text: botReply,
        timestamp: Date.now(),
        type: botReply.includes('```') ? 'code' : 'default'
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: generateId(),
        user: 'Бот',
        text: 'Ошибка при получении ответа.',
        timestamp: Date.now(),
        type: 'error'
      }]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
      scrollToBottom();
      inputRef.current?.focus();
    }
  }, [input, config, createApiClient, scrollToBottom]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp: number) => {
    return new Intl.DateTimeFormat('ru', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(timestamp);
  };

  const handleEmojiSelect = (emoji: any) => {
    setInput(prev => prev + emoji.native);
    setShowEmojiPicker(false);
  };

  const handleCopyMessage = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleReaction = (messageId: string, emoji: string) => {
    setMessages(messages.map(msg => 
      msg.id === messageId 
        ? { ...msg, reactions: [...(msg.reactions || []), emoji] }
        : msg
    ));
  };

  return (
    <div className={`w-full max-w-6xl mx-auto p-4 transition-colors duration-300 ${darkMode ? 'bg-zinc-900' : 'bg-gray-50'}`}>
      <div className={`relative backdrop-blur-xl ${darkMode ? 'bg-zinc-800/90' : 'bg-white/90'} rounded-3xl shadow-2xl border border-white/20 overflow-hidden hover:shadow-3xl transition-shadow duration-500`}>
        <div className={`absolute inset-0 ${darkMode ? 'bg-gradient-to-br from-purple-900/20 via-zinc-900/20 to-blue-900/20' : 'bg-gradient-to-br from-blue-50/30 via-purple-50/30 to-pink-50/30'} opacity-50`} />
        
        <div className="relative h-[750px] flex flex-col">
          <div className={`flex justify-between items-center p-5 border-b ${darkMode ? 'border-zinc-700/50 bg-zinc-800/50' : 'border-white/20 bg-white/40'} backdrop-blur-md`}>
            <div className="flex items-center gap-3">
              <div className={`p-3 ${darkMode ? 'bg-gradient-to-r from-purple-600 to-blue-600' : 'bg-gradient-to-r from-zinc-900 to-zinc-700'} rounded-2xl`}>
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className={`font-bold ${darkMode ? 'text-white' : 'text-zinc-800'}`}>AI Чат-Бот</span>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  <span className={`text-xs ${darkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>онлайн</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2.5 rounded-xl ${darkMode ? 'bg-zinc-700/50 text-white' : 'bg-white/80 text-zinc-700'} hover:scale-105 transition-all duration-300`}
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <select
                value={config.model}
                onChange={(e) => setConfig(prev => ({ ...prev, model: e.target.value }))}
                className="text-sm px-4 py-2.5 rounded-xl border border-zinc-200 bg-white/80 backdrop-blur-sm hover:border-zinc-300 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-200"
              >
                <option value={ModelProvider.OpenAI}>GPT-3.5</option>
                <option value={ModelProvider.Anthropic}>Claude-2</option>
              </select>
              <button 
                onClick={() => setMessages([])} 
                className="p-2.5 rounded-xl bg-white/80 hover:bg-white transition-all duration-300 hover:shadow-md"
                title="Очистить чат"
              >
                <RefreshCcw className="w-5 h-5 text-zinc-700" />
              </button>
            </div>
          </div>

          <div className={`flex-1 overflow-y-auto p-6 space-y-6 ${darkMode ? 'bg-zinc-800/50' : 'bg-white/50'} scroll-smooth`}>
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex items-end gap-3 ${msg.user === 'Вы' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}
              >
                {msg.user !== 'Вы' && (
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${darkMode ? 'bg-purple-600' : 'bg-zinc-900'}`}>
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                )}
                <div className="group relative">
                  <div 
                    className={`
                      max-w-[85%] p-4 rounded-2xl shadow-lg
                      ${msg.user === 'Вы' 
                        ? `${darkMode ? 'bg-gradient-to-r from-purple-600 to-blue-600' : 'bg-gradient-to-br from-zinc-800 to-zinc-900'} text-white rounded-tr-sm` 
                        : `${darkMode ? 'bg-zinc-700/50 hover:bg-zinc-700/70' : 'bg-white/80 hover:bg-white/90'} backdrop-blur-sm border ${darkMode ? 'border-zinc-600/50' : 'border-white/50'} ${darkMode ? 'text-white' : 'text-zinc-800'} rounded-tl-sm`}
                      transition-all duration-300 hover:shadow-xl
                    `}
                  >
                    <div className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex gap-2 p-2">
                        <button onClick={() => handleCopyMessage(msg.text)} className="p-1 rounded-full hover:bg-white/10">
                          <Copy className="w-4 h-4" />
                        </button>
                        <button className="p-1 rounded-full hover:bg-white/10">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-medium opacity-70">{msg.user}</span>
                      <span className="text-[10px] opacity-50">{formatTime(msg.timestamp)}</span>
                    </div>
                    <div className="leading-relaxed">
                      {formatMessage(msg.text)}
                    </div>
                    {msg.reactions && msg.reactions.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {msg.reactions.map((emoji, i) => (
                          <span key={i} className="text-sm">{emoji}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {msg.user === 'Вы' && (
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${darkMode ? 'bg-purple-600' : 'bg-zinc-900'}`}>
                    <User className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="flex items-center gap-2 text-sm text-zinc-500">
                <Bot className="w-4 h-4" />
                <div className="flex gap-1">
                  <span className="animate-bounce">.</span>
                  <span className="animate-bounce delay-100">.</span>
                  <span className="animate-bounce delay-200">.</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className={`p-5 border-t ${darkMode ? 'border-zinc-700/50 bg-zinc-800/50' : 'border-white/20 bg-white/40'} backdrop-blur-md`}>
            <div className="relative flex items-center gap-3">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className={`p-3 rounded-xl ${darkMode ? 'hover:bg-zinc-700' : 'hover:bg-zinc-100'} transition-colors`}
              >
                <Smile className="w-5 h-5" />
              </button>
              
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Введите сообщение..."
                className={`flex-1 px-5 py-3.5 ${darkMode ? 'bg-zinc-700/50 text-white placeholder:text-zinc-500' : 'bg-white/80 text-zinc-800'} backdrop-blur-sm border ${darkMode ? 'border-zinc-600' : 'border-zinc-200'} rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all shadow-sm hover:shadow-md`}
                disabled={isLoading}
              />

              <button
                onClick={sendMessage}
                disabled={isLoading || !input.trim()}
                className={`
                  p-3.5 rounded-xl transition-all duration-300
                  ${isLoading || !input.trim() 
                    ? `${darkMode ? 'bg-zinc-700 text-zinc-500' : 'bg-zinc-100 text-zinc-400'} cursor-not-allowed` 
                    : `${darkMode ? 'bg-purple-600 hover:bg-purple-500' : 'bg-gradient-to-r from-zinc-800 to-zinc-900'} text-white hover:shadow-lg hover:scale-105 active:scale-95`}
                `}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>

              {showEmojiPicker && (
                <div className="absolute bottom-full right-0 mb-2">
                  <Picker data={data} onEmojiSelect={handleEmojiSelect} theme={darkMode ? 'dark' : 'light'} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
