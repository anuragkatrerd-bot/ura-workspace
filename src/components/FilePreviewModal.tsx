import { useState, useEffect } from 'react';
import { X, Download, Trash2, FileText, Music, Film, Image as ImageIcon, Save, Loader2, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { apiFetch } from '../lib/api';
import type { FileRecord } from '../lib/types';

interface FilePreviewModalProps {
  file: FileRecord | null;
  onClose: () => void;
  onDelete: (id: string, url: string) => void;
}

export default function FilePreviewModal({ file, onClose, onDelete }: FilePreviewModalProps) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!file) { setContent(null); setEditing(false); return; }
    
    // Auto-load text content for text-based files
    const textTypes = ['text/plain', 'text/markdown', 'application/json', 'text/javascript', 'text/css'];
    if (textTypes.includes(file.mime_type) || file.filename.endsWith('.md') || file.filename.endsWith('.txt')) {
      setLoading(true);
      fetch(file.file_url)
        .then(res => res.text())
        .then(text => { setContent(text); setEditing(true); })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [file]);

  if (!file) return null;

  const isImage = file.mime_type.startsWith('image/');
  const isVideo = file.mime_type.startsWith('video/');
  const isAudio = file.mime_type.startsWith('audio/');
  const isPDF = file.mime_type === 'application/pdf';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-10 overflow-hidden">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-bg-deep/90 backdrop-blur-3xl"
        onClick={onClose}
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 100 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 100 }}
        className="relative w-full h-full glass rounded-[3rem] border border-white/10 flex flex-col overflow-hidden shadow-3xl max-w-7xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-10 py-8 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-6">
             <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
               {isImage ? <ImageIcon className="w-6 h-6 text-emerald-400" /> : 
                isVideo ? <Film className="w-6 h-6 text-rose-400" /> : 
                isAudio ? <Music className="w-6 h-6 text-amber-400" /> : 
                <FileText className="w-6 h-6 text-blue-400" />}
             </div>
             <div>
               <h3 className="text-xl font-black text-white uppercase tracking-tighter truncate max-w-md">{file.filename}</h3>
               <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mt-1">Artifact – {file.mime_type}</p>
             </div>
          </div>

          <div className="flex items-center gap-4">
             <button
               onClick={() => { const a = document.createElement('a'); a.href = file.file_url; a.download = file.filename; a.click(); }}
               className="w-12 h-12 glass hover:bg-white/5 rounded-2xl flex items-center justify-center transition-all border border-white/10"
             >
               <Download className="w-5 h-5" />
             </button>
             <button
               onClick={() => { onDelete(file.id, file.file_url); onClose(); }}
               className="w-12 h-12 glass hover:bg-red-500/10 hover:border-red-500/30 rounded-2xl flex items-center justify-center transition-all border border-white/10"
             >
               <Trash2 className="w-5 h-5 text-gray-700 hover:text-red-400" />
             </button>
             <button
               onClick={onClose}
               className="w-12 h-12 glass hover:bg-white/10 rounded-2xl flex items-center justify-center transition-all border border-white/10"
             >
               <X className="w-6 h-6" />
             </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-10 flex items-center justify-center relative">
          <div className="card-blob-container"><div className="card-blob" style={{ '--blob-color': '#8b5cf6' } as any} /></div>
          
          <div className="relative z-10 w-full h-full flex items-center justify-center">
            {loading ? (
              <div className="flex flex-col items-center gap-6">
                <Loader2 className="w-16 h-16 text-purple-400 animate-spin" />
                <p className="text-gray-500 font-black uppercase tracking-widest text-xs">Extracting Buffer...</p>
              </div>
            ) : editing ? (
               <textarea
                 value={content || ''}
                 onChange={e => setContent(e.target.value)}
                 className="w-full h-full bg-transparent text-gray-300 text-lg leading-relaxed outline-none resize-none placeholder-gray-800 font-medium font-mono"
               />
            ) : isImage ? (
              <img src={file.file_url} alt={file.filename} className="max-w-full max-h-full object-contain rounded-[2rem] shadow-3xl" />
            ) : isVideo ? (
              <video src={file.file_url} controls className="max-w-full max-h-full aspect-video rounded-[2rem] shadow-3xl" />
            ) : isAudio ? (
              <div className="w-full max-w-xl glass p-10 rounded-[3rem] border border-white/10 text-center">
                <div className="w-24 h-24 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-amber-500/20">
                  <Music className="w-10 h-10 text-amber-500 animate-pulse" />
                </div>
                <audio src={file.file_url} controls className="w-full" />
              </div>
            ) : isPDF ? (
              <iframe src={file.file_url} className="w-full h-full rounded-[2rem] bg-white" />
            ) : (
              <div className="text-center">
                <div className="w-40 h-40 glass rounded-[4rem] flex items-center justify-center mx-auto mb-10 border border-white/5 relative group">
                  <div className="absolute inset-0 bg-purple-600/10 blur-2xl group-hover:bg-purple-600/30 transition-all rounded-full" />
                  <Sparkles className="w-16 h-16 text-white animate-pulse relative z-10" />
                </div>
                <h4 className="text-4xl font-black text-white uppercase tracking-tighter">Protocol Gap</h4>
                <p className="text-gray-500 mt-6 font-bold uppercase tracking-[0.2em] max-w-sm mx-auto leading-relaxed">
                  This artifact's neural signature is specialized. High-level decoding required.
                </p>
                <div className="mt-12 flex flex-wrap items-center justify-center gap-6 pb-20">
                  <button
                    onClick={() => {
                      setLoading(true);
                      apiFetch('/files/extract', {
                        method: 'POST',
                        body: JSON.stringify({ file_url: file.file_url, mime_type: file.mime_type })
                      })
                        .then(data => { 
                          if (data && data.text) { setContent(data.text); setEditing(true); }
                          else { alert('Neural extraction failed.'); }
                        })
                        .catch(() => alert('Artifact corrupted or incompatible with text read.'))
                        .finally(() => setLoading(false));
                    }}
                    className="px-10 py-5 glass border border-white/10 rounded-[2rem] text-xs font-black uppercase tracking-widest text-purple-400 hover:bg-purple-500/10 transition-all"
                  >
                    Neural Buffer Sync (Extract Text)
                  </button>
                  <button
                    onClick={() => { const a = document.createElement('a'); a.href = file.file_url; a.download = file.filename; a.click(); }}
                    className="px-10 py-5 btn-genz text-white"
                  >
                    Export Artifact
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer / Status */}
        {editing && (
          <div className="px-10 py-6 border-t border-white/5 flex items-center justify-between">
            <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.3em]">Direct Buffer Edit Mode</p>
            <button className="px-8 py-3 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2">
              <Save className="w-3 h-3" />
              Store Updates
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
