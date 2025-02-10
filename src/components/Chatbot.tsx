import React, { useState, useCallback, useRef, useEffect } from 'react';
import axios, { AxiosInstance } from 'axios';
import { Loader2, Send, MessageCircle, RefreshCcw, Moon, Sun, Code, User, Bot, Smile, Copy, MoreVertical, Settings } from 'lucide-react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

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
  Gemini = 'google/gemini-pro',
  DeepSeek = 'deepseek/deepseek-chat'
}

export default function AdvancedChatbot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [config, setConfig] = useState<ChatConfig>({
    model: ModelProvider.Gemini,
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
      case ModelProvider.Gemini:
        return import.meta.env.VITE_GEMINI_API_KEY;
      case ModelProvider.DeepSeek:
        return import.meta.env.VITE_DEEPSEEKR1_API_KEY;
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

  const handleEmojiSelect = (emoji: { native: string }) => {
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
  useEffect(() => {
    document.body.className = darkMode ? 'dark bg-zinc-900' : 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50';
  }, [darkMode]);

  return (
    <div className={`min-h-screen w-full transition-all duration-500 py-8 px-4 ${darkMode ? 'bg-gradient-to-b from-zinc-900 via-zinc-900 to-zinc-800' : 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50'}`}>
      <div className={`max-w-6xl mx-auto relative backdrop-blur-xl ${
        darkMode 
          ? 'bg-zinc-800/90 border-zinc-700/30 shadow-[0_0_50px_rgba(0,0,0,0.3)]' 
          : 'bg-white/90 border-white/30 shadow-[0_0_50px_rgba(0,0,0,0.1)]'
      } rounded-3xl shadow-2xl border overflow-hidden hover:shadow-3xl transition-all duration-500 transform hover:scale-[1.002]`}>
        <div className={`absolute inset-0 ${
          darkMode 
            ? 'bg-gradient-to-br from-purple-900/20 via-zinc-900/20 to-blue-900/20' 
            : 'bg-gradient-to-br from-blue-100/30 via-purple-100/30 to-pink-100/30'
        } opacity-70`} />
        
        <div className="relative h-[750px] flex flex-col">
          <div className={`flex justify-between items-center p-5 border-b ${
            darkMode 
              ? 'border-zinc-700/50 bg-zinc-800/50' 
              : 'border-white/20 bg-white/40'
          } backdrop-blur-md`}>
            <div className="flex items-center gap-4">
              <div className={`p-3.5 ${
                darkMode 
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600' 
                  : 'bg-gradient-to-r from-zinc-900 to-zinc-700'
              } rounded-2xl shadow-lg transform hover:scale-105 transition-transform duration-300`}>
                <Bot className="w-7 h-7 text-white" />
              </div>
              <div>
                <span className={`font-bold text-xl ${darkMode ? 'text-white' : 'text-zinc-800'}`}>AI Чат-Бот</span>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                  </span>
                  <span className={`text-sm font-medium ${darkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>онлайн</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-3 rounded-xl ${
                  darkMode 
                    ? 'bg-zinc-700/50 hover:bg-zinc-700 text-white' 
                    : 'bg-white/80 hover:bg-white text-zinc-700'
                } shadow-lg hover:scale-105 transition-all duration-300 hover:shadow-xl`}
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <select
                value={config.model}
                onChange={(e) => setConfig(prev => ({ ...prev, model: e.target.value }))}
                className={`text-sm px-4 py-3 rounded-xl border ${
                  darkMode 
                    ? 'bg-zinc-700/50 border-zinc-600 text-white hover:bg-zinc-700/70' 
                    : 'bg-white/80 border-zinc-200 text-zinc-800 hover:bg-white'
                } backdrop-blur-sm hover:border-purple-400 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-400 cursor-pointer shadow-lg`}
              >
                <option value={ModelProvider.Gemini}>Gemini Pro</option>
                <option value={ModelProvider.DeepSeek}>DeepSeek</option>
              </select>
              <button 
                onClick={() => setMessages([])} 
                className={`p-3 rounded-xl ${
                  darkMode 
                    ? 'bg-zinc-700/50 hover:bg-zinc-700 text-white' 
                    : 'bg-white/80 hover:bg-white text-zinc-700'
                } shadow-lg hover:scale-105 transition-all duration-300 hover:shadow-xl group`}
                title="Очистить чат"
              >
                <RefreshCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
              </button>
            </div>
          </div>

          {/* Сообщение */}
          <div className={`flex-1 overflow-y-auto p-6 space-y-6 ${
            darkMode ? 'bg-zinc-800/50' : 'bg-white/50'
          } scroll-smooth`}>
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex items-end gap-3 ${msg.user === 'Вы' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}
              >
                {msg.user !== 'Вы' && (
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
                    darkMode 
                      ? 'bg-gradient-to-br from-purple-600 to-blue-600' 
                      : 'bg-gradient-to-br from-zinc-800 to-zinc-900'
                  } shadow-lg transform hover:scale-105 transition-transform duration-300`}>
                    <Bot className="w-6 h-6 text-white" />
                  </div>
                )}
                <div className="group relative max-w-[85%]">
                  <div 
                    className={`
                      p-4 rounded-2xl shadow-lg
                      ${msg.user === 'Вы' 
                        ? `${darkMode 
                            ? 'bg-gradient-to-r from-purple-600 to-blue-600' 
                            : 'bg-gradient-to-br from-zinc-800 to-zinc-900'
                          } text-white rounded-tr-sm` 
                        : `${darkMode 
                            ? 'bg-zinc-700/50 hover:bg-zinc-700/70' 
                            : 'bg-white/90 hover:bg-white'
                          } backdrop-blur-sm border ${
                            darkMode ? 'border-zinc-600/50' : 'border-white/50'
                          } ${darkMode ? 'text-white' : 'text-zinc-800'} rounded-tl-sm`
                      }
                      transition-all duration-300 hover:shadow-xl transform hover:scale-[1.01]
                    `}
                  >
                    <div className="mb-2 text-sm font-medium opacity-80">
                      {formatTime(msg.timestamp)}
                    </div>
                    <div className="text-base leading-relaxed whitespace-pre-wrap">
                      {formatMessage(msg.text)}
                    </div>
                    <div className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex gap-2 p-2">
                        <button 
                          onClick={() => handleCopyMessage(msg.text)} 
                          className={`p-2 rounded-full ${
                            darkMode ? 'hover:bg-zinc-600/50' : 'hover:bg-black/5'
                          } transition-all duration-200 hover:scale-110`}
                          title="Копировать сообщение"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                {msg.user === 'Вы' && (
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
                    darkMode 
                      ? 'bg-gradient-to-br from-purple-600 to-blue-600' 
                      : 'bg-gradient-to-br from-zinc-800 to-zinc-900'
                  } shadow-lg transform hover:scale-105 transition-transform duration-300`}>
                    <User className="w-6 h-6 text-white" />
                  </div>
                )}
              </div>
            ))}
            {isTyping && (
              <div className={`flex items-center gap-3 ${darkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                <Bot className="w-5 h-5" />
                <div className="flex gap-1">
                  <span className="animate-bounce">●</span>
                  <span className="animate-bounce delay-100">●</span>
                  <span className="animate-bounce delay-200">●</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className={`p-4 border-t ${
            darkMode 
              ? 'border-zinc-700/50 bg-zinc-800/50' 
              : 'border-white/20 bg-white/40'
          } backdrop-blur-md`}>
            <div className="relative flex items-end gap-3">
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Введите сообщение..."
                  className={`w-full p-4 pr-12 rounded-xl border ${
                    darkMode 
                      ? 'bg-zinc-700/50 border-zinc-600 text-white placeholder-zinc-400' 
                      : 'bg-white/80 border-zinc-200 text-zinc-800 placeholder-zinc-500'
                  } focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all duration-300 shadow-lg`}
                />
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className={`absolute right-3 bottom-3 p-2 rounded-full ${
                    darkMode ? 'hover:bg-zinc-600/50' : 'hover:bg-black/5'
                  } transition-all duration-200 hover:scale-110`}
                >
                  <Smile className={`w-5 h-5 ${darkMode ? 'text-zinc-400' : 'text-zinc-500'}`} />
                </button>
              </div>
              <button
                onClick={sendMessage}
                disabled={isLoading || !input.trim()}
                className={`p-4 rounded-xl ${
                  darkMode 
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500' 
                    : 'bg-gradient-to-r from-zinc-800 to-zinc-900 hover:from-zinc-700 hover:to-zinc-800'
                } text-white shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 hover:shadow-xl`}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
            {showEmojiPicker && (
              <div className="absolute bottom-20 right-4 z-50 shadow-2xl rounded-2xl overflow-hidden">
                <Picker data={data} onEmojiSelect={handleEmojiSelect} theme={darkMode ? 'dark' : 'light'} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

