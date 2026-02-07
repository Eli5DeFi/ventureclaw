/**
 * /dashboard/copilot
 * 
 * Founder Co-Pilot AI - 24/7 advisor for funded startups
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export default function CopilotPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [startupId, setStartupId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  // Load startup ID (get user's first startup for now)
  useEffect(() => {
    const loadStartup = async () => {
      try {
        const res = await fetch('/api/dashboard/pitches');
        const data = await res.json();
        
        if (data.pitches && data.pitches.length > 0) {
          const firstPitch = data.pitches[0];
          setStartupId(firstPitch.id); // Use startup ID directly
        } else {
          setError('No startup found. Please submit a pitch first.');
        }
      } catch (err) {
        console.error('Failed to load startup:', err);
        setError('Failed to load startup data');
      }
    };

    if (session?.user) {
      loadStartup();
    }
  }, [session]);

  // Load conversation history
  useEffect(() => {
    const loadHistory = async () => {
      if (!startupId) return;

      try {
        const res = await fetch(`/api/copilot/history?startupId=${startupId}&limit=50`);
        const data = await res.json();

        if (data.success && data.messages) {
          setMessages(data.messages);
        }
      } catch (err) {
        console.error('Failed to load history:', err);
      } finally {
        setLoadingHistory(false);
      }
    };

    loadHistory();
  }, [startupId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message
  const sendMessage = async (text: string) => {
    if (!text.trim() || !startupId || loading) return;

    setLoading(true);
    setError(null);

    // Add user message immediately
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    try {
      const res = await fetch('/api/copilot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, startupId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      // Add assistant response
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: data.timestamp,
      };
      setMessages(prev => [...prev, assistantMsg]);

    } catch (err) {
      console.error('Send message error:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
      // Remove the user message on error
      setMessages(prev => prev.slice(0, -1));
      setInput(text); // Restore input
    } finally {
      setLoading(false);
    }
  };

  // Generate investor update
  const generateUpdate = async () => {
    if (!startupId || loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/copilot/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startupId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate update');
      }

      // Add as assistant message
      const updateMsg: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.update,
        timestamp: data.generatedAt,
      };
      setMessages(prev => [...prev, updateMsg]);

    } catch (err) {
      console.error('Generate update error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate update');
    } finally {
      setLoading(false);
    }
  };

  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  // Quick actions
  const quickActions = [
    { label: '📊 Generate Investor Update', action: generateUpdate },
    { label: '💡 Growth Advice', message: 'What should I focus on to grow faster?' },
    { label: '🚀 Fundraising Help', message: 'How can I improve my pitch for investors?' },
    { label: '⚙️ Technical Guidance', message: 'What architecture should I use as we scale?' },
  ];

  if (status === 'loading' || loadingHistory) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading Co-Pilot...</div>
      </div>
    );
  }

  if (error && !startupId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900">🤖 Your Co-Pilot AI</h1>
          <p className="text-sm text-gray-600 mt-1">
            24/7 advisor for growth, technical, and fundraising questions
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white border-b border-gray-200 p-3">
        <div className="max-w-4xl mx-auto flex gap-2 overflow-x-auto">
          {quickActions.map((action, i) => (
            <button
              key={i}
              onClick={() => action.action ? action.action() : sendMessage(action.message!)}
              disabled={loading}
              className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm whitespace-nowrap hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 mt-8">
              <p className="text-lg mb-2">👋 Welcome to your Co-Pilot!</p>
              <p className="text-sm">Ask me anything about growing your startup.</p>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-900 border border-gray-200'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
                <p className={`text-xs mt-1 ${msg.role === 'user' ? 'text-blue-100' : 'text-gray-400'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <p className="text-gray-500">Thinking...</p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Error Banner */}
      {error && startupId && (
        <div className="bg-red-50 border-t border-red-200 p-3">
          <div className="max-w-4xl mx-auto text-red-700 text-sm">
            {error}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask your co-pilot anything..."
              disabled={loading || !startupId}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              disabled={loading || !input.trim() || !startupId}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
