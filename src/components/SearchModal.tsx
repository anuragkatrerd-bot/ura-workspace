import { useState, useEffect, useRef } from 'react';
import { Search, FileText, Files, X, Sparkles } from 'lucide-react';
import { apiFetch } from '../lib/api';
import type { Note, FileRecord } from '../lib/types';
import { motion } from 'framer-motion';

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
  onSelectNote: (note: Note) => void;
}

export default function SearchModal({ open, onClose, onSelectNote }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [notes, setNotes] = useState<Note[]>([]);
  const [files, setFiles] = useState<FileRecord[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setNotes([]);
      setFiles([]);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (!query.trim()) { setNotes([]); setFiles([]); return; }
    const timer = setTimeout(async () => {
      try {
        const data = await apiFetch(`/search?q=${encodeURIComponent(query)}`);
        setNotes(data.notes ?? []);
        setFiles(data.files ?? []);
      } catch (err) {
        console.error(err);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); if (open) onClose(); }
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const hasResults = notes.length > 0 || files.length > 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-10 lg:pt-24 px-4 overflow-hidden">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-md" 
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-2xl glass rounded-[2.5rem] shadow-2xl overflow-hidden border-white/10"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-4 px-6 py-5 border-b border-white/5">
          <Search className="w-5 h-5 text-gray-500 flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search Intelligence Nodes..."
            className="flex-1 bg-transparent text-white placeholder-gray-600 outline-none text-lg font-medium"
          />
          {query ? (
            <button onClick={() => setQuery('')} className="text-gray-500 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          ) : (
             <div className="hidden sm:flex items-center gap-2 px-2 py-1 bg-white/5 rounded-lg border border-white/10 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
               ESC to close
             </div>
          )}
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-4 custom-scrollbar">
          {hasResults ? (
            <div className="space-y-6">
              {notes.length > 0 && (
                <div>
                  <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] px-4 mb-3 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    Intelligence Matches
                  </p>
                  <div className="space-y-1">
                    {notes.map(note => (
                      <button
                        key={note.id}
                        onClick={() => { onSelectNote(note); onClose(); }}
                        className="w-full flex items-start gap-4 px-4 py-4 rounded-2xl hover:bg-white/5 text-left transition-all border border-transparent hover:border-white/5"
                      >
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5 text-blue-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-white truncate">{note.title}</p>
                          <p className="text-xs text-gray-500 truncate mt-1">{note.content.slice(0, 100)}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {files.length > 0 && (
                <div>
                  <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] px-4 mb-3 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Archive Hits
                  </p>
                  <div className="space-y-1">
                    {files.map(file => (
                      <div key={file.id} className="flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-white/5 transition-all text-left group border border-transparent hover:border-white/5">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                          <Files className="w-5 h-5 text-emerald-400" />
                        </div>
                        <p className="text-sm font-bold text-white truncate flex-1">{file.filename}</p>
                        <Sparkles className="w-4 h-4 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : query ? (
            <div className="py-20 text-center">
              <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-700" />
              </div>
              <p className="text-gray-500 text-sm font-medium">No intelligence found for <span className="text-white">"{query}"</span></p>
            </div>
          ) : (
            <div className="py-20 text-center">
              <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-gray-700" />
              </div>
              <p className="text-gray-500 text-sm font-medium tracking-wide">Enter coordinates to search your mindscape</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
