import { useState, useEffect } from 'react';
import { 
  Zap, Clock, Sparkles, Activity, FileText, 
  Files, CheckCircle2, AlertCircle, Brain, Mail,
  ArrowRight, QrCode
} from 'lucide-react';
import { motion } from 'framer-motion';
import { apiFetch } from '../lib/api';
import type { Note, FileRecord, Reminder } from '../lib/types';

export default function DashboardPage() {
  const [recentNotes, setRecentNotes] = useState<Note[]>([]);
  const [recentFiles, setRecentFiles] = useState<FileRecord[]>([]);
  const [pendingReminders, setPendingReminders] = useState<Reminder[]>([]);
  const [signals, setSignals] = useState<any[]>([]);
  const [recentTasks, setRecentTasks] = useState<any[]>([]);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [whatsappStatus, setWhatsappStatus] = useState({ connected: false, qr: null as string | null });
  const [showQrModal, setShowQrModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('');
  
  const [readingEmailId, setReadingEmailId] = useState<string | null>(null);
  const [readingEmailContent, setReadingEmailContent] = useState<string>('');
  const [isReadingLoading, setIsReadingLoading] = useState(false);
  
  const [draftingReply, setDraftingReply] = useState(false);
  const [aiDraft, setAiDraft] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const user = JSON.parse(localStorage.getItem('aura_user') || '{}');

  async function openReadModal(id: string) {
    setReadingEmailId(id);
    setReadingEmailContent('');
    setAiDraft(''); // Reset
    setIsReadingLoading(true);
    try {
      const data = await apiFetch(`/gmail/read/${id}`);
      setReadingEmailContent(data.body || 'No content parsed.');
    } catch (err) {
      setReadingEmailContent('Error synchronizing body content.');
    } finally {
      setIsReadingLoading(false);
    }
  }

  async function handleGenerateReply() {
    setDraftingReply(true);
    setAiDraft('');
    try {
       const resp = await apiFetch(`/gmail/draft-reply/${readingEmailId}`, {
          method: 'POST',
          body: JSON.stringify({ emailBody: readingEmailContent })
       });
       setAiDraft(resp.draft || '');
    } catch (e) {
       setAiDraft('Error generating response.');
    } finally {
       setDraftingReply(false);
    }
  }

  async function handleSendReply() {
    if (!aiDraft) return;
    setSendingReply(true);
    try {
       await apiFetch(`/gmail/send/${readingEmailId}`, {
          method: 'POST',
          body: JSON.stringify({ draftedReply: aiDraft })
       });
       setAiDraft('');
       setReadingEmailId(null);
       fetchSignals();
    } catch(e) {
       console.error("Failed to send", e);
    } finally {
       setSendingReply(false);
    }
  }

  async function fetchSignals() {
    try {
      const data = await apiFetch('/gmail/top-signals');
      setGoogleConnected(data.connected);
      setSignals(data.signals || []);
    } catch (err) {
      console.error('Signal sync failure:', err);
    }
  }

  async function checkWhatsapp() {
    try {
      const data = await apiFetch('/whatsapp/status');
      setWhatsappStatus(data);
      if (data.connected && showQrModal) {
         setShowQrModal(false);
      }
    } catch (e) {}
  }

  useEffect(() => {
    const waInterval = setInterval(checkWhatsapp, 3000);
    return () => clearInterval(waInterval);
  }, []);

  function handleConnectGoogle() {
    const width = 600, height = 700;
    const left = (window.innerWidth / 2) - (width / 2);
    const top = (window.innerHeight / 2) - (height / 2);
    
    const popup = window.open(
      `http://localhost:3001/api/auth/google?user_id=${user.id}`,
      'Neural Identity Verification',
      `width=${width},height=${height},top=${top},left=${left}`
    );

    const timer = setInterval(() => {
      if (popup?.closed) {
        clearInterval(timer);
        fetchSignals();
      }
    }, 1000);
  }

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Morning');
    else if (hour < 18) setGreeting('Afternoon');
    else setGreeting('Evening');

    async function loadData() {
      try {
        const [notes, files, reminders, tasksData] = await Promise.all([
          apiFetch('/notes'),
          apiFetch('/files'),
          apiFetch('/reminders'),
          apiFetch('/tasks')
        ]);
        setRecentNotes(notes?.slice(0, 4) || []);
        setRecentFiles(files?.slice(0, 3) || []);
        setPendingReminders(reminders?.filter((r: Reminder) => !r.completed).slice(0, 3) || []);
        setRecentTasks(tasksData?.slice(0, 5) || []);
        
        await fetchSignals();
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 20 } }
  };

  return (
    <div className="relative flex-1 flex flex-col h-full overflow-x-hidden overflow-y-auto px-6 py-10 lg:px-12 xl:px-20 max-w-[1800px] mx-auto w-full">
      
      <motion.div 
        initial="hidden"
        animate="visible"
        transition={{ staggerChildren: 0.15 }}
        className="grid grid-cols-1 md:grid-cols-12 gap-8 auto-rows-[minmax(0,1fr)] pb-24"
      >
        
        {/* Main Hero Card -> Col Span 8 */}
        <motion.div 
          variants={fadeUp}
          className="md:col-span-8 glass-card p-10 lg:p-14 relative overflow-hidden flex flex-col justify-between min-h-[380px] group"
        >
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-purple-500/15 to-pink-500/15 blur-[100px] rounded-full translate-x-1/3 -translate-y-1/3 group-hover:bg-purple-500/20 transition-colors duration-1000 pointer-events-none" />
          
          <div className="relative z-10 flex justify-between items-start">
            <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-white/5 border border-white/10 rounded-full backdrop-blur-md shadow-sm">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse shadow-[0_0_10px_rgba(192,132,252,0.8)]" />
              <span className="text-[11px] text-zinc-300 font-bold uppercase tracking-widest">Aura Neural Engine Connected</span>
            </div>
          </div>

          <div className="relative z-10 mt-12">
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6 leading-[1.1]">
              Good {greeting},<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-300 to-rose-300 italic font-serif opacity-90">
                {user?.email?.split('@')[0] || 'Architect'}.
              </span>
            </h1>
            <p className="text-zinc-400 text-lg md:text-xl max-w-xl mb-10 leading-relaxed font-medium">
              Your cognitive workspace is ready. We've compiled your latest signals, artifacts, and ambient data streams into today's focal points.
            </p>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-10">
              {!googleConnected ? (
                <button
                  onClick={handleConnectGoogle}
                  className="px-8 py-4 bg-white text-black font-bold rounded-2xl flex items-center gap-3 hover:bg-zinc-200 transition-colors shadow-2xl hover:scale-[1.02]"
                >
                  <Zap className="w-5 h-5 fill-current" />
                  Synchronize Gmail
                </button>
              ) : (
                <div className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-zinc-200">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm font-semibold">Identity arrays synced and stable.</span>
                </div>
              )}

              {/* WhatsApp Connection UI */}
              {!whatsappStatus.connected ? (
                whatsappStatus.qr ? (
                  <button
                    onClick={() => setShowQrModal(true)}
                    className="px-8 py-4 bg-[#25D366] text-black font-extrabold uppercase tracking-widest text-[11px] rounded-2xl flex items-center gap-3 hover:scale-[1.02] transition-transform shadow-2xl shadow-[#25D366]/20"
                  >
                    <QrCode className="w-5 h-5" />
                    Show WhatsApp QR Code
                  </button>
                ) : (
                  <button
                    onClick={() => apiFetch('/whatsapp/retry', { method: 'POST' })}
                    className="px-8 py-4 bg-[#25D366] text-black font-extrabold uppercase tracking-widest text-[11px] rounded-2xl flex items-center gap-3 hover:scale-[1.02] transition-transform shadow-2xl shadow-[#25D366]/20"
                  >
                    <Activity className="w-5 h-5" />
                    Load WhatsApp Link
                  </button>
                )
              ) : (
                <div className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl bg-[#25D366]/10 border border-[#25D366]/30 text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="text-sm font-semibold">WhatsApp Automation Active.</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Priority Card -> Col Span 4 */}
        <motion.div 
          variants={fadeUp}
          className="md:col-span-4 bg-gradient-to-br from-[#a78bfa] to-[#f472b6] rounded-[28px] p-10 text-[#141517] relative overflow-hidden flex flex-col justify-between shadow-2xl shadow-purple-500/20 min-h-[380px] group hover:scale-[1.01] transition-transform"
        >
          <div className="w-16 h-16 bg-white/20 rounded-[20px] flex items-center justify-center backdrop-blur-md shadow-inner border border-white/30">
            <Brain className="w-8 h-8 text-[#141517]" />
          </div>
          <div>
            <h3 className="text-4xl font-extrabold tracking-tight mb-4">Focus</h3>
            <p className="text-[#141517]/80 text-lg font-semibold leading-relaxed mb-8">
              Neural signals suggest high bandwidth availability. Deep work recommended for the next 4 hours.
            </p>
            <div className="w-full bg-[#141517]/10 h-3 rounded-full overflow-hidden p-0.5">
               <div className="w-[85%] h-full bg-[#141517] rounded-full shadow-inner" />
            </div>
            <p className="text-xs font-bold mt-3 uppercase tracking-widest text-[#141517]/90">Cognitive Capacity: 85%</p>
          </div>
        </motion.div>

        {/* Neural Signals List -> Col Span 5 */}
        <motion.div 
          variants={fadeUp}
          className="md:col-span-5 glass-card p-8 lg:p-10 flex flex-col"
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-bold flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center">
                 <Mail className="w-5 h-5 text-pink-400" />
              </div>
              Signals Flow
            </h3>
            <div className="px-4 py-1.5 rounded-full bg-white/5 text-xs text-zinc-400 font-medium">{signals.length} Signals (3 Days)</div>
          </div>
          
          <div className="h-[360px] overflow-y-auto space-y-4 pr-3 custom-scrollbar">
            {!googleConnected ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-50 py-10">
                <Sparkles className="w-10 h-10 mb-4" />
                <p className="font-medium text-lg">Connect intelligence bridge to parse ambient communications.</p>
              </div>
            ) : signals.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-60 py-10">
                <CheckCircle2 className="w-10 h-10 mb-4 text-emerald-400" />
                <p className="font-medium text-lg">Zero high-priority signals pending.</p>
              </div>
            ) : (
               signals.map((sig, i) => (
                 <div key={i} onClick={() => openReadModal(sig.id)} className="flex items-start gap-4 p-5 rounded-[20px] bg-white/[0.03] hover:bg-white/[0.08] transition-colors border border-white/5 cursor-pointer shadow-sm group">
                   <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-purple-400/20 to-pink-400/20 flex items-center justify-center text-zinc-200 group-hover:text-white flex-shrink-0 font-extrabold text-lg transition-colors">
                     {sig.from.charAt(0).toUpperCase()}
                   </div>
                   <div className="min-w-0 flex-1">
                     <p className="font-bold text-zinc-200 text-base truncate pr-2 group-hover:text-purple-300 transition-colors">{sig.from.split('<')[0]}</p>
                     <p className="text-sm text-zinc-500 truncate mt-1">{sig.subject}</p>
                     <p className="text-xs text-zinc-600 truncate mt-1 opacity-70 italic">{sig.snippet}</p>
                   </div>
                   <div className="text-right flex-shrink-0">
                     <span className={`px-3 py-1.5 text-[9px] uppercase tracking-widest font-black rounded-lg ${sig.priority==='High'?'bg-rose-500/20 text-rose-300 border border-rose-500/20':'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10'}`}>
                       {sig.priority}
                     </span>
                   </div>
                 </div>
               ))
            )}
          </div>
        </motion.div>

        {/* Activity Nodes -> Col Span 7 */}
        <motion.div 
          variants={fadeUp}
          className="md:col-span-7 glass-card p-8 lg:p-10 relative overflow-hidden"
        >
          {/* Subtle noise texture or gradient background */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#1e1f23] via-transparent to-transparent pointer-events-none" />
          <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />

          <div className="flex items-center justify-between mb-8 relative z-10">
            <h3 className="text-2xl font-bold flex items-center gap-3">
               <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                 <Activity className="w-5 h-5 text-purple-400" />
               </div>
              Recent Artifacts
            </h3>
            <button className="text-sm font-semibold text-zinc-400 hover:text-white transition-colors flex items-center gap-1 bg-white/5 px-4 py-2 rounded-xl">
               View All <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 relative z-10">
            {recentNotes.map((note) => (
              <div key={note.id} className="p-6 rounded-[20px] bg-[#141517]/60 border border-white/5 hover:border-purple-500/30 transition-all flex items-start gap-4 group">
                 <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                   <FileText className="w-6 h-6 text-purple-400" />
                 </div>
                 <div className="min-w-0">
                   <h4 className="font-bold text-zinc-100 truncate text-lg">{note.title}</h4>
                   <p className="text-sm text-zinc-500 mt-1 font-medium">Edited {new Date(note.updated_at).toLocaleDateString()}</p>
                 </div>
              </div>
            ))}
            {recentFiles.slice(0, 4 - recentNotes.length).map((file) => (
              <div key={file.id} className="p-6 rounded-[20px] bg-[#141517]/60 border border-white/5 hover:border-pink-500/30 transition-all flex items-start gap-4 group">
                 <div className="w-12 h-12 rounded-xl bg-pink-500/10 flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                   <Files className="w-6 h-6 text-pink-400" />
                 </div>
                 <div className="min-w-0">
                   <h4 className="font-bold text-zinc-100 truncate text-lg">{file.filename}</h4>
                   <p className="text-sm text-zinc-500 mt-1 font-medium">Uploaded {new Date(file.created_at).toLocaleDateString()}</p>
                 </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Horizon (Reminders) -> Col Span 6 */}
        <motion.div variants={fadeUp} className="md:col-span-6 glass-card p-10 flex flex-col min-h-[350px]">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-bold flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                 <Clock className="w-5 h-5 text-zinc-300" />
              </div>
              Impending Horizons
            </h3>
          </div>
          
          <div className="flex-1 flex flex-col gap-4">
            {pendingReminders.length === 0 ? (
               <div className="flex-1 flex items-center justify-center text-center opacity-50 border border-white/5 border-dashed rounded-3xl">
                 <p className="font-semibold text-lg">No temporal nodes plotted.</p>
               </div>
            ) : (
               pendingReminders.map(r => (
                 <div key={r.id} className="p-6 rounded-[24px] bg-white/[0.02] border border-white/5 relative overflow-hidden group hover:bg-white/[0.04] transition-colors">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.03] rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
                   <h4 className="text-lg font-bold text-zinc-100 mb-2 pr-8 relative z-10">{r.title}</h4>
                   <div className="flex items-center gap-2 relative z-10">
                     <AlertCircle className="w-4 h-4 text-pink-400" />
                     <p className="text-xs text-pink-400 font-bold uppercase tracking-wide">
                       {r.remind_at ? new Date(r.remind_at).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric'}) : 'Unscheduled'}
                     </p>
                   </div>
                 </div>
               ))
            )}
          </div>
        </motion.div>

        {/* WhatsApp Flow -> Col Span 6 */}
        <motion.div variants={fadeUp} className="md:col-span-6 glass-card p-10 flex flex-col min-h-[350px] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#25D366]/5 to-transparent pointer-events-none" />
          <div className="flex items-center justify-between mb-8 relative z-10">
            <h3 className="text-2xl font-bold flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#25D366]/10 flex items-center justify-center">
                 <Activity className="w-5 h-5 text-[#25D366]" />
              </div>
              Bridge Execution
            </h3>
            <div className="px-4 py-1.5 rounded-full bg-white/5 text-xs text-zinc-400 font-medium whitespace-nowrap">Agent Tasks</div>
          </div>
          
          <div className="flex-1 flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-2 relative z-10">
            {recentTasks.length === 0 ? (
               <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50 border border-[#25D366]/10 border-dashed rounded-3xl p-8">
                 <QrCode className="w-8 h-8 mb-4 text-[#25D366]/50" />
                 <p className="font-semibold text-lg">Send !task via WhatsApp to deploy.</p>
               </div>
            ) : (
               recentTasks.map((task, i) => (
                 <div key={task.id || i} className="p-6 rounded-[24px] bg-[#141517]/60 border border-white/5 relative overflow-hidden flex flex-col gap-3 group hover:border-[#25D366]/30 transition-colors">
                   <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2">
                       <div className={`w-2 h-2 rounded-full ${task.status === 'completed' ? 'bg-[#25D366] shadow-[0_0_10px_#25D366]' : task.status === 'failed' ? 'bg-rose-500' : 'bg-yellow-400 animate-pulse'}`} />
                       <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{task.status}</span>
                     </div>
                     <span className="text-xs font-semibold text-zinc-500">{new Date(task.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                   </div>
                   <p className="font-bold text-zinc-200 text-sm leading-relaxed">{task.instruction}</p>
                 </div>
               ))
            )}
          </div>
        </motion.div>

      </motion.div>

      {readingEmailId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 lg:p-20 bg-[#141517]/80 backdrop-blur-xl">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="glass-card rounded-[32px] w-full max-w-4xl max-h-full flex flex-col shadow-[0_0_80px_rgba(167,139,250,0.1)] border-white/10 relative overflow-hidden"
          >
            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-[#1e1f23]">
              <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                <Mail className="w-6 h-6 text-pink-400" /> Signal Extraction
              </h3>
              <button 
                onClick={() => setReadingEmailId(null)}
                className="w-10 h-10 rounded-2xl glass hover:bg-rose-500/20 text-zinc-500 hover:text-rose-400 flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-8 lg:p-12 overflow-y-auto custom-scrollbar flex-1 bg-[#141517]">
              {isReadingLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
                  <div className="w-8 h-8 rounded-full border-4 border-pink-500 border-t-transparent animate-spin"/>
                  <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Decrypting Packet...</span>
                </div>
              ) : (
                <div className="flex flex-col h-full">
                   <div className="prose prose-invert max-w-none flex-1">
                     <pre className="whitespace-pre-wrap font-sans text-zinc-300 leading-relaxed text-lg tracking-wide">{readingEmailContent}</pre>
                   </div>
                   
                   {/* AI Auto-Responder Box */}
                   <div className="mt-10 border-t border-white/5 pt-8">
                     {!aiDraft && !draftingReply ? (
                        <button onClick={handleGenerateReply} className="w-full py-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 border border-purple-500/30 rounded-2xl flex items-center justify-center gap-2 font-bold text-pink-300 transition-all group">
                           <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform" />
                           Auto-Generate AI Reply
                        </button>
                     ) : draftingReply ? (
                        <div className="w-full py-4 bg-white/5 rounded-2xl flex items-center justify-center gap-3">
                           <div className="w-4 h-4 rounded-full border-2 border-pink-500 border-t-transparent animate-spin" />
                           <span className="text-sm font-bold tracking-widest uppercase text-zinc-400">Synthesizing Response...</span>
                        </div>
                     ) : (
                        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2">
                           <label className="text-xs font-bold uppercase tracking-widest text-pink-400 flex items-center gap-2">
                             <Zap className="w-3 h-3" /> AI Draft Ready
                           </label>
                           <textarea
                             value={aiDraft}
                             onChange={(e) => setAiDraft(e.target.value)}
                             rows={6}
                             className="w-full bg-[#18191c] border border-white/10 rounded-2xl p-5 text-white focus:outline-none focus:border-pink-500/50 resize-y custom-scrollbar font-medium shadow-inner"
                           />
                           <div className="flex items-center gap-4">
                             <button onClick={() => setAiDraft('')} className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold transition-all">Discard Draft</button>
                             <button onClick={handleSendReply} disabled={sendingReply} className="flex-1 py-4 bg-pink-500 hover:bg-pink-400 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(244,63,94,0.3)] disabled:opacity-50 hover:scale-[1.01]">
                               {sendingReply ? <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin"/> : <Mail className="w-5 h-5" />}
                               Deploy Message
                             </button>
                           </div>
                        </div>
                     )}
                   </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* WhatsApp High Resolution QR Modal */}
      {showQrModal && whatsappStatus.qr && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 transition-all duration-300">
          <div className="bg-[#141517] p-10 rounded-[32px] border border-[#25D366]/20 flex flex-col items-center max-w-md w-full relative overflow-hidden shadow-[0_0_100px_rgba(37,211,102,0.15)] animate-in fade-in zoom-in duration-300">
            <button onClick={() => setShowQrModal(false)} className="absolute top-6 right-6 w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors text-zinc-500 hover:text-white text-xl">
               ✕
            </button>
            <div className="w-16 h-16 bg-[#25D366]/10 rounded-3xl flex items-center justify-center mb-6 border border-[#25D366]/20">
               <Activity className="w-8 h-8 text-[#25D366]" />
            </div>
            <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-3">Sync Agent</h3>
            <p className="text-sm font-semibold text-zinc-400 text-center mb-10 leading-relaxed max-w-[250px]">Open WhatsApp on your phone.<br/>Go to <b>Linked Devices</b> and scan this protocol.</p>
            <div className="p-4 bg-white rounded-[24px] shadow-2xl relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-green-500 opacity-20 blur-xl -z-10" />
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(whatsappStatus.qr)}`} alt="Scan WA" className="w-[280px] h-[280px]" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
