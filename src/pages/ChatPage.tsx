import { useState, useRef, useEffect } from 'react';
import {
  Send, Loader2, Bot, User, Sparkles, RefreshCw, Trash2,
  Zap, BrainCircuit
} from 'lucide-react';
import { fetchAllNotes } from '../hooks/useNotes';
import { apiFetch } from '../lib/api';
import type { Note } from '../lib/types';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

function formatChatContent(content: string) {
  const imgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  if (!imgRegex.test(content)) return content;
  
  const parts = content.split(/(!\[[^\]]*\]\([^)]+\))/g);
  return parts.map((part, i) => {
    const match = part.match(/!\[([^\]]*)\]\(([^)]+)\)/);
    if (match) {
      return (
        <img 
          key={i} 
          src={match[2]} 
          alt={match[1]} 
          className="rounded-2xl my-5 max-w-full lg:max-w-md object-cover shadow-2xl border border-white/10" 
        />
      );
    }
    return <span key={i}>{part}</span>;
  });
}

type ContextMode = 'none' | 'all-notes';

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [contextMode, setContextMode] = useState<ContextMode>('none');
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 250)}px`;
    }
  }, [input]);

  async function buildContext() {
    if (contextMode === 'none') return undefined;
    if (contextMode === 'all-notes') {
      const notes = await fetchAllNotes();
      if (!notes.length) return undefined;
      return (notes as Note[])
        .slice(0, 25)
        .map(n => `### Intel Node: ${n.title}\n${n.content}`)
        .join('\n\n---\n\n');
    }
    return undefined;
  }

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: 'user', content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const context = await buildContext();
      const json = await apiFetch('/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
          context,
        }),
      });

      const reply = json.reply ?? json.error ?? 'Neural link timeout.';
      setMessages(prev => [...prev, { role: 'assistant', content: reply, timestamp: new Date() }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Disturbance in the neural field. Attempt recovery.',
        timestamp: new Date(),
      }]);
    }
    setLoading(false);
  }

  return (
    <div className="relative flex-1 flex flex-col h-full bg-[#141517] overflow-hidden">
      {/* Background Decor */}
      <AnimatePresence>
        {contextMode === 'all-notes' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none z-0"
          >
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-bl from-indigo-500/10 to-purple-500/5 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="relative z-10 px-8 py-10 lg:px-14 lg:py-12 flex flex-col lg:flex-row lg:items-center justify-between gap-6 max-w-[1400px] mx-auto w-full">
        <div>
          <h1 className="text-4xl lg:text-5xl font-black tracking-tighter text-white uppercase">Core</h1>
          <div className="flex items-center gap-4 mt-2">
            <h2 className="text-indigo-400 text-[10px] font-bold uppercase tracking-[0.3em]">Link Interface</h2>
            <AnimatePresence>
              {contextMode === 'all-notes' && (
                <motion.div 
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="flex items-center gap-2 px-3 py-1.5 glass rounded-full"
                >
                  <BrainCircuit className="w-3 h-3 text-indigo-400 animate-pulse" />
                  <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Synchronized</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex items-center gap-5">
          <div className="flex items-center gap-1.5 glass p-2 rounded-2xl">
            <button 
              onClick={() => setContextMode('none')}
              className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${contextMode === 'none' ? 'bg-white text-[#141517] shadow-lg' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}
            >
              Direct
            </button>
            <button 
              onClick={() => setContextMode('all-notes')}
              className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${contextMode === 'all-notes' ? 'bg-gradient-to-r from-indigo-400 to-purple-400 text-[#141517] shadow-lg' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}
            >
              <Zap className={`w-3 h-3 ${contextMode === 'all-notes' ? 'fill-[#141517]' : ''}`} />
              Nexus
            </button>
          </div>
          
          <button
            onClick={() => setMessages([])}
            className="w-14 h-14 glass hover:bg-rose-500/10 rounded-2xl flex items-center justify-center transition-all text-zinc-500 hover:text-rose-400"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="relative z-10 flex-1 overflow-y-auto px-6 lg:px-14 py-4 space-y-10 custom-scrollbar pb-40 max-w-[1400px] mx-auto w-full">
        {messages.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center h-full gap-10 text-center py-20"
          >
            <div className="w-24 h-24 glass-card rounded-[2rem] flex items-center justify-center shadow-2xl">
               <Bot className="w-12 h-12 text-indigo-400 opacity-60" />
            </div>
            <div>
              <p className="text-white font-extrabold text-3xl tracking-tighter uppercase mb-4">Protocol Alpha</p>
              <p className="text-zinc-500 text-sm font-semibold max-w-md mx-auto leading-relaxed">
                Initialize conversation sequence. Synchronize Nexus mode to enable workspace memory mapping.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl w-full">
              {[
                'Synthesize recent data',
                'Analyze productivity gaps',
                'Outline strategic goals',
                'Memory recovery sequence',
              ].map(suggestion => (
                <button
                  key={suggestion}
                  onClick={() => setInput(suggestion)}
                  className="px-8 py-5 glass-card text-xs text-zinc-400 font-bold uppercase tracking-widest hover:border-indigo-500/40 hover:text-indigo-300 transition-all text-left shadow-sm hover:shadow-[0_0_20px_rgba(167,139,250,0.1)]"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        <AnimatePresence mode='popLayout'>
          {messages.map((msg, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              key={i} 
              className={`flex gap-5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-12 h-12 rounded-2xl glass-card flex items-center justify-center flex-shrink-0 shadow-inner">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                </div>
              )}
              <div
                className={`max-w-[90%] lg:max-w-3xl rounded-[28px] px-8 py-6 text-lg leading-relaxed shadow-lg border border-white/[0.03] ${
                  msg.role === 'user'
                    ? 'bg-zinc-200 text-[#141517] font-semibold rounded-br-sm'
                    : 'glass-card text-zinc-300 rounded-bl-sm'
                }`}
              >
                <div className="relative z-10 whitespace-pre-wrap tracking-wide">
                  {formatChatContent(msg.content)}
                  <div className={`text-[10px] mt-6 font-extrabold uppercase tracking-widest opacity-40 ${msg.role === 'user' ? 'text-[#141517]' : 'text-zinc-500'}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
              {msg.role === 'user' && (
                <div className="w-12 h-12 rounded-2xl glass flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-zinc-500" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <div className="flex gap-5 justify-start">
            <div className="w-12 h-12 rounded-2xl glass-card flex items-center justify-center flex-shrink-0">
              <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin" />
            </div>
            <div className="glass-card rounded-3xl px-8 py-6 flex items-center gap-3">
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  animate={{ scale: [1, 1.2, 1], opacity: [0.3, 1, 0.3] }}
                  transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
                  className="w-2.5 h-2.5 rounded-full bg-indigo-400"
                />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} className="h-20" />
      </div>

      {/* Input Overlay */}
      <div className="absolute bottom-0 inset-x-0 z-30 px-6 lg:px-14 pb-12 pt-16 bg-gradient-to-t from-[#141517] via-[#141517]/90 to-transparent">
        <div className="relative max-w-[1400px] mx-auto w-full glass-card rounded-[32px] p-2 flex items-end gap-3 shadow-2xl focus-within:border-indigo-500/40 focus-within:shadow-[0_0_40px_rgba(167,139,250,0.1)] transition-all">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="UPLOAD PROTOCOL SIGNAL..."
            className="flex-1 bg-transparent text-white px-6 py-4 lg:text-lg outline-none resize-none placeholder-zinc-600 leading-relaxed max-h-60 font-bold tracking-tight custom-scrollbar"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={send}
            disabled={!input.trim() || loading}
            className="w-14 h-14 bg-white text-[#141517] rounded-2xl flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-20 shadow-lg hover:bg-zinc-200"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
