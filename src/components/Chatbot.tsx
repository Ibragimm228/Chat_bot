import { useState } from 'react';
import axios from 'axios';
import { Loader2 } from 'lucide-react';

export default function Chatbot() {
  const [messages, setMessages] = useState<{ user: string; text: string }[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const api = axios.create({
    baseURL: 'https://openrouter.ai/api/v1/'
  });
  api.defaults.headers.common['Authorization'] = "Bearer " + import.meta.env.VITE_API_KEY;
  api.defaults.headers.post['Content-Type'] = 'application/json';

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessage = { user: 'Вы', text: input };
    setMessages((prev) => [...prev, newMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await api.post('chat/completions', {
        "model": "openai/gpt-3.5-turbo",
        "messages": [
          {
            "role": "user",
            "content": input
          }
        ]
      });
      const botReply = response.data?.choices[0].message.content || 'Ответ не получен.';
      const botMessage = { user: 'Бот', text: botReply };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Ошибка:', error);
      setMessages((prev) => [
        ...prev,
        { user: 'Бот', text: 'Ошибка: не удалось получить ответ.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="w-full max-w-2xl bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-zinc-200 overflow-hidden">
      <div className="h-[600px] flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.user === 'Вы' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-300`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-2xl ${
                  msg.user === 'Вы'
                    ? 'bg-zinc-900 text-white rounded-tr-sm'
                    : 'bg-zinc-100 text-zinc-900 rounded-tl-sm'
                }`}
              >
                <div className="text-sm font-medium mb-1">{msg.user}</div>
                <div className="text-sm whitespace-pre-wrap">{msg.text}</div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start animate-in fade-in slide-in-from-bottom-4">
              <div className="bg-zinc-100 p-3 rounded-2xl rounded-tl-sm">
                <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
              </div>
            </div>
          )}
        </div>
        <div className="border-t border-zinc-200 p-4 bg-white/50">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Введите сообщение..."
              disabled={isLoading}
              className="flex-1 bg-zinc-100 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-300 disabled:opacity-50 transition-all"
            />
            <button
              onClick={sendMessage}
              disabled={isLoading}
              className="bg-zinc-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-zinc-800 disabled:opacity-50 transition-all"
            >
              {isLoading ? 'Отправка...' : 'Отправить'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}