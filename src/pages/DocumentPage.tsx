import { useState, useEffect, useRef } from 'react';
import { LayoutTemplate, Sparkles, Download, Save, FileText, Loader2, PlayCircle, Plus, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, List, Type } from 'lucide-react';
import { apiFetch } from '../lib/api';
import type { DocumentRecord } from '../lib/types';
import { motion, AnimatePresence } from 'framer-motion';

export default function DocumentPage() {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<DocumentRecord | null>(null);
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadDocs();
  }, []);

  async function loadDocs() {
    const data = await apiFetch('/documents');
    setDocuments(data || []);
  }

  function selectDoc(doc: DocumentRecord) {
    setSelectedDoc(doc);
    setTitle(doc.title);
    setContent(doc.content);
    setPrompt('');
  }

  async function handleNewDoc() {
    const doc = await apiFetch('/documents', { method: 'POST', body: JSON.stringify({ title: 'Untitled Document', content: '' }) });
    if (doc) {
      setDocuments([doc, ...documents]);
      selectDoc(doc);
    }
  }

  function handleContentChange(val: string) {
    setContent(val);
    if (selectedDoc) scheduleAutoSave(selectedDoc.id, title, val);
  }

  function handleTitleChange(val: string) {
    setTitle(val);
    if (selectedDoc) scheduleAutoSave(selectedDoc.id, val, content);
  }

  function scheduleAutoSave(id: string, t: string, c: string) {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaving(true);
      await apiFetch(`/documents/${id}`, { method: 'PUT', body: JSON.stringify({ title: t, content: c }) });
      setDocuments(prev => prev.map(d => d.id === id ? { ...d, title: t, content: c } : d));
      setSaving(false);
    }, 1000);
  }

  async function handleAIGenerate() {
    if (!prompt.trim() || !selectedDoc) return;
    setGenerating(true);
    try {
      const data = await apiFetch('/documents/generate', { method: 'POST', body: JSON.stringify({ prompt }) });
      // The AI returns Markdown, which is fine, but since we are a rich text editor now, we can crudely format markdown to basic HTML or just insert it as basic formatted text
      let htmlGen = data.output.replace(/\\n/g, '<br/>');
      const newContent = content ? `${content}<br/><br/><strong>AI Gen:</strong><br/>${htmlGen}` : htmlGen;
      
      handleContentChange(newContent);
      setPrompt('');
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  }

  function downloadAsWord() {
    if (!selectedDoc) return;
    const htmlTemplate = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="utf-8"><title>${title}</title></head>
      <body>
        <h1>${title}</h1>
        <div style="font-family: Arial, sans-serif; font-size: 14px;">${content}</div>
      </body>
      </html>
    `;
    const blob = new Blob(['\ufeff', htmlTemplate], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.replace(/[\s\\]+/g, '_')}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function downloadAsPDF() {
    // Relying on native exact print frame
    const originalTitle = document.title;
    document.title = title;
    window.print();
    document.title = originalTitle;
  }

  return (
    <div className="relative flex-1 flex h-full bg-[#0a0c10] overflow-hidden">
      
      {/* Sidebar / Document List */}
      <div className="w-80 bg-[#141517] border-r border-white/5 flex flex-col z-20">
        <div className="p-8 border-b border-white/5">
           <h1 className="text-3xl font-black tracking-tighter text-white uppercase">Canvas</h1>
           <h2 className="text-cyan-400 text-[10px] font-bold uppercase tracking-[0.25em] mt-1">Word Processor</h2>
        </div>
        <div className="p-4">
           <button onClick={handleNewDoc} className="w-full py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl flex items-center justify-center gap-2 border border-white/10 transition-all text-xs font-bold uppercase tracking-widest shadow-inner">
             <Plus className="w-4 h-4 text-cyan-400" /> New Document
           </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
           {documents.map(doc => (
             <div 
               key={doc.id} 
               onClick={() => selectDoc(doc)}
               className={`p-4 rounded-xl cursor-pointer transition-all flex items-center gap-3 border ${selectedDoc?.id === doc.id ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-transparent border-transparent hover:bg-white/5'}`}
             >
               <FileText className={`w-5 h-5 ${selectedDoc?.id === doc.id ? 'text-cyan-400' : 'text-zinc-600'}`} />
               <div className="min-w-0 flex-1">
                 <h4 className={`text-sm font-bold truncate ${selectedDoc?.id === doc.id ? 'text-cyan-300' : 'text-zinc-300'}`}>{doc.title}</h4>
                 <p className="text-[10px] text-zinc-600 font-bold tracking-widest uppercase mt-0.5">{new Date(doc.updated_at).toLocaleDateString()}</p>
               </div>
             </div>
           ))}
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 flex flex-col h-full bg-[#1e1f23] relative print:bg-white print:text-black">
        {selectedDoc ? (
          <>
            {/* Header controls (hidden on print) */}
            <div className="h-20 lg:h-24 px-8 lg:px-16 flex items-center justify-between border-b border-white/5 shrink-0 print:hidden bg-[#1e1f23]/90 backdrop-blur-md z-10 sticky top-0">
               <div>
                  <div className="flex items-center gap-4">
                     <p className="text-[10px] font-black tracking-widest uppercase text-cyan-400 flex items-center gap-2">
                       <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_#22d3ee]" />
                       Intelligent Canvas
                     </p>
                     {saving && <span className="text-[10px] font-extrabold uppercase text-zinc-500"><Loader2 className="w-3 h-3 animate-spin inline mr-1"/> Saving</span>}
                  </div>
               </div>
               <div className="flex gap-4">
                 <button onClick={downloadAsWord} className="px-5 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 transition-all text-[11px] font-bold uppercase tracking-widest text-zinc-300 flex items-center gap-2"><Download className="w-3.5 h-3.5 text-cyan-400"/> Word .doc</button>
                 <button onClick={downloadAsPDF} className="px-5 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 transition-all text-[11px] font-bold uppercase tracking-widest text-zinc-300 flex items-center gap-2"><Download className="w-3.5 h-3.5 text-rose-400"/> PDF</button>
               </div>
            </div>

            {/* Paper Container */}
            <div className="flex-1 overflow-y-auto px-6 py-6 lg:py-10 custom-scrollbar flex justify-center print:p-0 print:overflow-visible">
               <div className="w-full max-w-[900px] flex flex-col mb-24">
                  
                  {/* Rich Text Toolbar */}
                  <div className="w-full bg-[#18191c] border border-white/10 rounded-t-[20px] p-4 flex flex-wrap items-center gap-2 lg:gap-4 sticky top-0 z-20 shadow-2xl print:hidden backdrop-blur-3xl">
                     <div className="flex items-center gap-2 bg-black/20 p-1.5 rounded-xl border border-white/5">
                        <button onClick={() => document.execCommand('bold')} className="p-2.5 rounded-lg hover:bg-white/10 transition-colors text-zinc-300 hover:text-white" title="Bold">
                          <Bold className="w-4 h-4" />
                        </button>
                        <button onClick={() => document.execCommand('italic')} className="p-2.5 rounded-lg hover:bg-white/10 transition-colors text-zinc-300 hover:text-white" title="Italic">
                          <Italic className="w-4 h-4" />
                        </button>
                        <button onClick={() => document.execCommand('underline')} className="p-2.5 rounded-lg hover:bg-white/10 transition-colors text-zinc-300 hover:text-white" title="Underline">
                          <Underline className="w-4 h-4" />
                        </button>
                     </div>

                     <div className="w-px h-8 bg-white/10 mx-1" />

                     <div className="flex items-center gap-2 bg-black/20 p-1.5 rounded-xl border border-white/5">
                        <button onClick={() => document.execCommand('justifyLeft')} className="p-2.5 rounded-lg hover:bg-white/10 transition-colors text-zinc-300" title="Align Left">
                          <AlignLeft className="w-4 h-4" />
                        </button>
                        <button onClick={() => document.execCommand('justifyCenter')} className="p-2.5 rounded-lg hover:bg-white/10 transition-colors text-zinc-300" title="Align Center">
                          <AlignCenter className="w-4 h-4" />
                        </button>
                        <button onClick={() => document.execCommand('justifyRight')} className="p-2.5 rounded-lg hover:bg-white/10 transition-colors text-zinc-300" title="Align Right">
                          <AlignRight className="w-4 h-4" />
                        </button>
                        <button onClick={() => document.execCommand('insertUnorderedList')} className="p-2.5 rounded-lg hover:bg-white/10 transition-colors text-zinc-300" title="Bullet List">
                          <List className="w-4 h-4" />
                        </button>
                     </div>

                     <div className="w-px h-8 bg-white/10 mx-1" />

                     <div className="flex items-center gap-3 bg-black/20 p-2 rounded-xl border border-white/5">
                        <Type className="w-4 h-4 text-zinc-400 ml-1" />
                        <select 
                          onChange={(e) => document.execCommand('fontName', false, e.target.value)}
                          className="bg-transparent text-xs font-bold text-zinc-200 outline-none cursor-pointer"
                        >
                           <option value="Inter, sans-serif" className="bg-[#1e1f23]">Default Sans</option>
                           <option value="Georgia, serif" className="bg-[#1e1f23]">Georgia Serif</option>
                           <option value="Courier New, monospace" className="bg-[#1e1f23]">Courier Mono</option>
                           <option value="Times New Roman, serif" className="bg-[#1e1f23]">Times New Roman</option>
                        </select>
                        <div className="w-px h-4 bg-white/10" />
                        <select 
                          onChange={(e) => document.execCommand('fontSize', false, e.target.value)}
                          className="bg-transparent text-xs font-bold text-zinc-200 outline-none cursor-pointer"
                        >
                           <option value="3" className="bg-[#1e1f23]">Normal</option>
                           <option value="4" className="bg-[#1e1f23]">Medium</option>
                           <option value="5" className="bg-[#1e1f23]">Large</option>
                           <option value="6" className="bg-[#1e1f23]">Huge</option>
                        </select>
                     </div>

                     <div className="w-px h-8 bg-white/10 mx-1" />

                     <div className="flex items-center gap-2 bg-black/20 px-4 py-1.5 rounded-xl border border-white/5">
                        <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mt-0.5">Tone</span>
                        <input 
                          type="color" 
                          onChange={(e) => document.execCommand('foreColor', false, e.target.value)}
                          className="w-6 h-6 p-0 border-0 bg-transparent rounded cursor-pointer"
                          title="Text Color"
                        />
                     </div>
                  </div>

                  {/* Document Paper Content */}
                  <div className="px-10 py-12 lg:px-20 lg:py-24 flex-1 flex flex-col min-h-[1056px] border border-t-0 border-white/5 bg-[#141517] lg:rounded-b-[20px] shadow-2xl print:border-none print:p-0">
                    <input 
                      value={title} 
                      onChange={e => handleTitleChange(e.target.value)} 
                      placeholder="Document Title" 
                      className="text-4xl lg:text-5xl font-black tracking-tighter text-white bg-transparent outline-none mb-10 print:text-black print:mb-6"
                    />
                    
                    {/* Rich Editable Area */}
                    <div
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => handleContentChange(e.currentTarget.innerHTML)}
                      onInput={(e) => {
                         // Real-time capturing optional, but onBlur handles the intense saves reliably.
                         // Using onInput to keep the reactive state roughly in sync:
                         setContent(e.currentTarget.innerHTML);
                      }}
                      dangerouslySetInnerHTML={{ __html: content }}
                      className="flex-1 bg-transparent text-zinc-300 text-[15px] outline-none font-medium tracking-wide prose prose-invert max-w-none print:text-black focus:ring-0 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
                      style={{ minHeight: '600px' }}
                    />
                  </div>
               </div>
            </div>

            {/* AI Generator Footer (hidden on print) */}
            <div className="p-6 bg-gradient-to-t from-[#141517] to-transparent shrink-0 print:hidden absolute bottom-0 left-0 right-0 z-10 pointer-events-none">
              <div className="max-w-[900px] mx-auto bg-[#18191c] p-2 rounded-2xl border border-white/5 shadow-[0_0_50px_rgba(34,211,238,0.1)] flex items-center gap-3 backdrop-blur-xl pointer-events-auto">
                 <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-6 h-6 text-cyan-400" />
                 </div>
                 <input 
                   value={prompt}
                   onChange={e => setPrompt(e.target.value)}
                   onKeyDown={e => { if(e.key==='Enter') handleAIGenerate(); }}
                   placeholder="Prompt AI: 'Draft a project proposal for a sustainable tech initiative'..."
                   className="flex-1 bg-transparent text-white font-semibold text-sm outline-none px-2"
                 />
                 <button 
                   disabled={generating || !prompt.trim()}
                   onClick={handleAIGenerate}
                   className="px-6 py-3 bg-white text-black font-extrabold uppercase rounded-xl text-[11px] tracking-widest disabled:opacity-50 hover:bg-zinc-200 transition-colors flex items-center gap-2"
                 >
                   {generating ? <Loader2 className="w-4 h-4 animate-spin"/> : <PlayCircle className="w-4 h-4" />}
                   Build
                 </button>
              </div>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center opacity-50">
             <LayoutTemplate className="w-16 h-16 text-cyan-500 mb-6" />
             <p className="text-xl font-bold uppercase tracking-widest text-zinc-400">Initialize Canvas</p>
          </div>
        )}
      </div>

    </div>
  );
}
