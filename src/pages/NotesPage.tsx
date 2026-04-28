import { useState, useEffect, useRef } from 'react';
import {
  Plus, Trash2, FileText, Search, Sparkles, ChevronRight
} from 'lucide-react';
import { useNotes } from '../hooks/useNotes';
import type { Note } from '../lib/types';
import { motion, AnimatePresence } from 'framer-motion';

interface NotesPageProps {
  folderId: string | null;
  initialNote?: Note | null;
  onClearInitialNote?: () => void;
}

function formatDate(d: string) {
  const date = new Date(d);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function NotesPage({ folderId, initialNote, onClearInitialNote }: NotesPageProps) {
  const { notes, createNote, updateNote, deleteNote } = useNotes(folderId);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showListOnMobile, setShowListOnMobile] = useState(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedNote = notes.find(n => n.id === selectedId);

  useEffect(() => {
    if (selectedId) setShowListOnMobile(false);
    else setShowListOnMobile(true);
  }, [selectedId]);

  useEffect(() => {
    if (initialNote) {
      setSelectedId(initialNote.id);
      setTitle(initialNote.title);
      setContent(initialNote.content);
      onClearInitialNote?.();
    }
  }, [initialNote, onClearInitialNote]);

  useEffect(() => {
    if (selectedNote && selectedNote.id === selectedId) {
      setTitle(selectedNote.title);
      setContent(selectedNote.content);
    }
  }, [selectedNote?.id]);

  function selectNote(note: Note) {
    setSelectedId(note.id);
    setTitle(note.title);
    setContent(note.content);
  }

  function scheduleAutoSave(id: string, t: string, c: string) {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaving(true);
      await updateNote(id, { title: t, content: c });
      setSaving(false);
    }, 800);
  }

  const filteredNotes = notes.filter(n =>
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative flex-1 flex h-full bg-[#141517] overflow-hidden rounded-tl-3xl">
      
      <motion.div 
        animate={{ 
          x: (showListOnMobile || window.innerWidth >= 1024) ? 0 : -340,
          opacity: (showListOnMobile || window.innerWidth >= 1024) ? 1 : 0,
        }}
        className={`w-full lg:w-[360px] flex flex-col z-10 relative lg:static p-6 ${showListOnMobile ? 'fixed inset-0 pt-24 lg:pt-8 bg-[#141517]' : 'hidden lg:flex'}`}
      >
        <div className="mb-10 px-2 lg:pt-4">
          <h1 className="text-2xl font-black tracking-tighter text-white uppercase">Nodes</h1>
          <h2 className="text-purple-400 text-[10px] font-bold uppercase tracking-[0.25em] mt-1">Intelligence</h2>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="FILTER NODES..."
            className="w-full pl-12 pr-4 py-3.5 bg-white/[0.03] rounded-2xl text-xs font-bold text-white placeholder-zinc-600 outline-none focus:border-purple-500/40 transition-all border border-white/5 uppercase tracking-widest shadow-inner"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pb-10">
          <button
            onClick={async () => {
              const { data } = await createNote('New Fragment', folderId);
              if (data) selectNote(data);
            }}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border border-dashed border-white/10 text-zinc-500 hover:text-purple-400 hover:border-purple-500/30 hover:bg-purple-500/5 transition-all group font-bold text-[10px] uppercase tracking-widest"
          >
            <Plus className="w-4 h-4" />
            <span>Create Intel</span>
          </button>

          <AnimatePresence>
            {filteredNotes.map(note => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                key={note.id}
                onClick={() => selectNote(note)}
                className={`group relative p-5 rounded-[24px] cursor-pointer transition-all border overflow-hidden ${
                  selectedId === note.id ? 'border-purple-500/30 bg-purple-500/[0.04]' : 'border-white/5 hover:bg-white/[0.03] bg-white/[0.01]'
                }`}
              >
                {selectedId === note.id && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-purple-400 rounded-r-full" />
                )}
                <div className="relative z-10 flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${selectedId === note.id ? 'bg-gradient-to-br from-purple-400 to-pink-400 text-white shadow-lg shadow-purple-900/40' : 'bg-[#1e1f23] text-zinc-500 border border-white/5 shadow-inner'}`}>
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-base font-bold truncate tracking-tight ${selectedId === note.id ? 'text-zinc-100' : 'text-zinc-300'}`}>{note.title || 'Untitled Node'}</p>
                    <p className="text-xs text-zinc-500 truncate mt-1 font-medium leading-relaxed">
                      {note.content ? note.content.slice(0, 45) : 'No data stored...'}
                    </p>
                    <p className="mt-3 text-[9px] font-black text-zinc-600 uppercase tracking-[0.1em]">{formatDate(note.updated_at)}</p>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); deleteNote(note.id); if (selectedId === note.id) setSelectedId(null); }}
                    className="opacity-0 group-hover:opacity-100 p-2 text-zinc-600 hover:text-rose-400 transition-all rounded-lg hover:bg-rose-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Editor Context */}
      <div className={`flex-1 flex flex-col z-10 p-4 lg:p-8 ${!showListOnMobile ? 'fixed inset-0 pt-24 lg:pt-8 bg-[#141517] lg:bg-transparent lg:static' : 'hidden lg:flex'}`}>
        {selectedId ? (
          <motion.div 
            key={selectedId}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 p-8 lg:p-14 flex flex-col relative overflow-hidden glass-card rounded-[32px] h-full"
          >
            <div className="relative z-10 h-full flex flex-col">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div className="flex items-center gap-4 flex-1">
                   <button onClick={() => setSelectedId(null)} className="lg:hidden w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-purple-400">
                     <ChevronRight className="w-5 h-5 rotate-180" />
                   </button>
                   <input
                    value={title}
                    onChange={e => { setTitle(e.target.value); scheduleAutoSave(selectedId, e.target.value, content); }}
                    placeholder="NODE TITLE..."
                    className="bg-transparent text-3xl lg:text-5xl font-black text-white outline-none placeholder-zinc-800 w-full tracking-tighter"
                  />
                </div>
                <div className="self-start px-5 py-3 glass rounded-2xl">
                    {saving ? (
                      <div className="flex items-center gap-3 text-[10px] font-black text-purple-400 uppercase tracking-[0.2em]">
                        <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse shadow-[0_0_10px_#a78bfa]" />
                        Transmitting
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">
                        <div className="w-2 h-2 rounded-full bg-zinc-600" />
                        Persistent
                      </div>
                    )}
                </div>
              </div>
              
              <textarea
                value={content}
                onChange={e => { setContent(e.target.value); scheduleAutoSave(selectedId, title, e.target.value); }}
                placeholder="SYNCHRONIZE THOUGHTS..."
                className="flex-1 w-full bg-transparent text-zinc-300 text-lg lg:text-xl leading-relaxed outline-none resize-none placeholder-zinc-800 font-medium tracking-tight custom-scrollbar"
              />
            </div>
          </motion.div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-10 glass-card rounded-[32px] border-dashed border-white/5">
            <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-8 border border-white/5 shadow-2xl">
              <Sparkles className="w-8 h-8 text-purple-400/40" />
            </div>
            <h3 className="text-zinc-400 text-2xl font-black tracking-tight">Neural Void</h3>
            <p className="text-zinc-600 mt-3 text-sm font-semibold max-w-sm mx-auto leading-relaxed">Select a fragment to begin data synthesis.</p>
          </div>
        )}
      </div>

    </div>
  );
}
