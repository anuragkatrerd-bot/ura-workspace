import { useState, useRef } from 'react';
import {
  Upload, Trash2, Download, FileText, Image, FileArchive,
  Film, Music, File, Loader2
} from 'lucide-react';
import { useFiles } from '../hooks/useFiles';
import type { FileRecord } from '../lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import FilePreviewModal from '../components/FilePreviewModal';

interface FilesPageProps {
  folderId: string | null;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1_048_576).toFixed(1)} MB`;
}

function FileIcon({ mimeType, className }: { mimeType: string; className?: string }) {
  const type = mimeType || '';
  if (type.startsWith('image/')) return <Image className={className} />;
  if (type.startsWith('video/')) return <Film className={className} />;
  if (type.startsWith('audio/')) return <Music className={className} />;
  if (type === 'application/pdf' || type.includes('text')) return <FileText className={className} />;
  if (type.includes('zip') || type.includes('tar')) return <FileArchive className={className} />;
  return <File className={className} />;
}

function fileColor(mimeType: string) {
  const type = mimeType || '';
  if (type.startsWith('image/')) return '#10b981';
  if (type.startsWith('video/')) return '#e11d48';
  if (type.startsWith('audio/')) return '#f59e0b';
  if (type.includes('pdf')) return '#f43f5e';
  return '#8b5cf6';
}

export default function FilesPage({ folderId }: FilesPageProps) {
  const { files, loading, uploadFile, deleteFile } = useFiles(folderId);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileRecord | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(fileList: FileList) {
    setUploading(true);
    for (const file of Array.from(fileList)) {
      if (file.size > 50 * 1024 * 1024) continue;
      await uploadFile(file, folderId);
    }
    setUploading(false);
  }

  return (
    <div className="relative flex-1 flex flex-col h-full bg-[#141517] overflow-hidden">
      <div className="relative px-8 py-10 lg:px-14 lg:py-14 flex flex-col lg:flex-row lg:items-center justify-between gap-6 z-10 max-w-[1800px] mx-auto w-full">
        <div>
          <h1 className="text-4xl lg:text-5xl font-black tracking-tighter text-white uppercase">Vault</h1>
          <h2 className="text-rose-400 text-[10px] font-bold uppercase tracking-[0.3em] mt-2">Artifacts Storage</h2>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="px-6 py-4 lg:px-8 bg-white text-[#141517] font-extrabold rounded-2xl flex items-center justify-center gap-3 disabled:opacity-50 hover:bg-zinc-200 transition-colors shadow-2xl"
        >
          {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
          <span className="text-[12px] tracking-[0.1em] uppercase">Push Content</span>
        </motion.button>
        <input ref={inputRef} type="file" multiple className="hidden" onChange={e => e.target.files && handleFiles(e.target.files)} />
      </div>

      <div className="flex-1 overflow-y-auto px-8 lg:px-14 pb-24 z-10 custom-scrollbar max-w-[1800px] mx-auto w-full">
        {loading ? (
          <div className="flex items-center justify-center py-40">
            <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin opacity-50" />
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-40 glass-card border-dashed">
             <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
               <Files className="w-8 h-8 text-zinc-500" />
             </div>
             <p className="text-zinc-500 font-bold text-[12px] uppercase tracking-[0.2em] leading-relaxed">No data detected in primary storage</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
            <AnimatePresence>
              {files.map(file => (
                <div key={file.id} onClick={() => setSelectedFile(file)} className="cursor-pointer">
                  <FileCard
                    file={file}
                    onDelete={() => deleteFile(file.id, file.file_url)}
                    onDownload={() => { const a = document.createElement('a'); a.href = file.file_url; a.download = file.filename; a.click(); }}
                  />
                </div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedFile && (
          <FilePreviewModal 
            file={selectedFile} 
            onClose={() => setSelectedFile(null)} 
            onDelete={deleteFile}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function FileCard({ file, onDelete, onDownload }: { file: FileRecord; onDelete: () => void; onDownload: () => void }) {
  const mime = file.mime_type || '';
  const isImage = mime.startsWith('image/');
  const color = fileColor(mime);

  return (
    <motion.div 
      layout
      initial={{ scale: 0.98, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.95, opacity: 0 }}
      className="group relative glass-card overflow-hidden transition-all duration-500 cursor-pointer h-full flex flex-col"
    >
      <div className="h-48 glass flex items-center justify-center p-5 relative border-b border-white/5 bg-[#18191c]">
        {isImage ? (
          <img src={file.file_url} alt={file.filename} className="h-full w-full object-cover rounded-2xl transition-transform duration-700 group-hover:scale-110 opacity-90" />
        ) : (
          <div className="w-20 h-20 rounded-3xl bg-white/[0.03] border border-white/5 shadow-inner flex items-center justify-center transition-transform duration-500 group-hover:scale-110" style={{ color }}>
            <FileIcon mimeType={file.mime_type} className="w-8 h-8 opacity-60" />
          </div>
        )}
        
        <div className="absolute inset-0 bg-[#141517]/80 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-4 backdrop-blur-md">
          <button onClick={(e) => { e.stopPropagation(); onDownload(); }} className="w-12 h-12 bg-white/10 text-white rounded-2xl flex items-center justify-center hover:bg-white/20 hover:scale-110 transition-all border border-white/10 shadow-lg">
            <Download className="w-5 h-5" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="w-12 h-12 bg-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center hover:bg-rose-500/40 hover:scale-110 transition-all border border-rose-500/20 shadow-lg">
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col justify-between">
        <p className="text-zinc-200 font-bold truncate text-base mb-4 tracking-tight" title={file.filename}>{file.filename}</p>
        <div className="flex items-center justify-between mt-auto">
          <span className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">{formatSize(file.file_size)}</span>
          <div className="px-3 py-1.5 rounded-lg bg-white/5 text-[10px] font-bold uppercase tracking-widest text-zinc-400 border border-white/[0.05]">
            {file.mime_type.split('/')[1] || 'FILE'}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
