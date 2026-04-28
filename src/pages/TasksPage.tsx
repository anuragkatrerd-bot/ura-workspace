import { useState, useEffect } from 'react';
import { Briefcase, Plus, Loader2, CheckCircle2, Clock, PlayCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { apiFetch } from '../lib/api';
import type { Task } from '../lib/types';
import { motion, AnimatePresence } from 'framer-motion';

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [instruction, setInstruction] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function loadTasks() {
    try {
      const data = await apiFetch('/tasks');
      setTasks(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      if (loading) setLoading(false);
    }
  }

  useEffect(() => {
    loadTasks();
    const interval = setInterval(loadTasks, 4000); // Poll for background processing updates
    return () => clearInterval(interval);
  }, []);

  async function handleSubmit() {
    if (!instruction.trim()) return;
    setSubmitting(true);
    await apiFetch('/tasks', {
      method: 'POST',
      body: JSON.stringify({ instruction })
    });
    setInstruction('');
    setSubmitting(false);
    loadTasks();
  }

  async function deleteTask(id: string) {
    await apiFetch(`/tasks/${id}`, { method: 'DELETE' });
    setTasks(tasks.filter(t => t.id !== id));
  }

  const pending = tasks.filter(t => t.status === 'pending' || t.status === 'processing');
  const completed = tasks.filter(t => t.status === 'completed' || t.status === 'failed');

  return (
    <div className="relative flex-1 flex flex-col h-full bg-[#141517] overflow-hidden">
      <div className="relative px-8 py-10 lg:px-14 lg:py-14 flex flex-col lg:flex-row lg:items-center justify-between gap-6 z-10 max-w-[1600px] mx-auto w-full border-b border-white/5">
        <div>
          <h1 className="text-4xl lg:text-5xl font-black tracking-tighter text-white uppercase">Flow</h1>
          <h2 className="text-teal-400 text-[10px] font-bold uppercase tracking-[0.3em] mt-2">Autonomous Agents</h2>
        </div>
        <div className="flex items-center gap-3 glass px-5 py-3 rounded-2xl shadow-inner">
           <RefreshCw className="w-4 h-4 text-teal-400 animate-spin" />
           <span className="text-[10px] font-black text-teal-500 uppercase tracking-widest">Background Engine Active</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 lg:px-14 py-10 z-10 custom-scrollbar max-w-[1600px] mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Submission Panel */}
        <div className="lg:col-span-5 space-y-6">
           <div className="glass-card p-8 flex flex-col h-full sticky top-0 shadow-[0_0_80px_rgba(45,212,191,0.05)] border-teal-500/10">
             <div className="w-12 h-12 bg-teal-500/10 rounded-2xl flex items-center justify-center mb-6">
                <Briefcase className="w-6 h-6 text-teal-400" />
             </div>
             <h3 className="text-2xl font-black tracking-tight text-white mb-2">New Mission</h3>
             <p className="text-zinc-500 text-sm font-semibold mb-8">Deploy an autonomous agent to research, draft emails, or automate a process in the background.</p>
             
             <textarea
               value={instruction}
               onChange={e => setInstruction(e.target.value)}
               placeholder="e.g., 'Draft a reply to the newest email and write a python script for scraping'"
               className="w-full bg-black/20 text-white p-5 rounded-2xl outline-none resize-none h-40 focus:border-teal-500/30 transition-all border border-white/5 text-sm font-medium tracking-wide custom-scrollbar shadow-inner mb-6"
             />
             
             <button
               onClick={handleSubmit}
               disabled={submitting || !instruction.trim()}
               className="w-full py-4 bg-teal-500 text-[#141517] font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3 disabled:opacity-30 hover:scale-[1.02] transition-transform shadow-lg shadow-teal-500/20"
             >
               {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <PlayCircle className="w-5 h-5" />}
               Deploy Agent
             </button>
           </div>
        </div>

        {/* Task Board */}
        <div className="lg:col-span-7 flex flex-col gap-10">
          {/* Active Missions */}
          <div>
            <h4 className="text-sm font-black uppercase tracking-[0.2em] text-zinc-500 mb-6 flex items-center gap-3">
              <Clock className="w-4 h-4 text-amber-500" />
              In Progress ({pending.length})
            </h4>
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {pending.length === 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 border border-white/5 border-dashed rounded-3xl text-center glass">
                    <span className="text-xs font-bold uppercase tracking-widest text-zinc-600">No active deployments</span>
                  </motion.div>
                )}
                {pending.map(task => (
                  <motion.div key={task.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="glass-card p-6 overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-1 h-full bg-amber-500 shadow-[0_0_15px_#f59e0b]" />
                    <div className="flex items-start gap-4">
                       <Loader2 className={`w-5 h-5 mt-0.5 flex-shrink-0 text-amber-400 ${task.status === 'processing' ? 'animate-spin' : 'animate-pulse'}`} />
                       <div>
                         <p className="text-white font-bold leading-relaxed">{task.instruction}</p>
                         <p className="text-[10px] font-black uppercase tracking-widest text-amber-500/70 mt-3 flex items-center gap-2">
                           <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                           {task.status === 'processing' ? 'Agent Executing...' : 'Queued'}
                         </p>
                       </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Completed Missions */}
          <div>
            <h4 className="text-sm font-black uppercase tracking-[0.2em] text-zinc-500 mb-6 flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Completed ({completed.length})
            </h4>
            <div className="space-y-6">
              <AnimatePresence mode="popLayout">
                {completed.map(task => (
                  <motion.div key={task.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-[24px] overflow-hidden border-white/5 group">
                    <div className="p-6 bg-[#1e1f23] border-b border-white/5 flex items-start justify-between gap-4">
                       <div className="flex items-start gap-3 flex-1 min-w-0">
                         {task.status === 'completed' ? (
                           <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                         ) : (
                           <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                         )}
                         <p className="text-zinc-300 font-semibold truncate text-sm leading-relaxed">{task.instruction}</p>
                       </div>
                       <button onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 p-2 text-zinc-600 hover:text-rose-500 transition-all rounded-xl hover:bg-white/5">
                         Delete
                       </button>
                    </div>
                    <div className="p-6 bg-[#141517]">
                       <div className="prose prose-invert max-w-none">
                         <pre className="whitespace-pre-wrap font-sans text-white text-[13px] leading-relaxed tracking-wide custom-scrollbar">{task.output}</pre>
                       </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
