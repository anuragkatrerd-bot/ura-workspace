import { useState, useEffect } from 'react';
import { Calendar, Trash2, CheckCircle, Circle, Plus, Loader2, Clock } from 'lucide-react';
import { useReminders } from '../hooks/useReminders';
import { motion, AnimatePresence } from 'framer-motion';

export default function RemindersPage() {
  const { reminders, loading, createReminder, updateReminder, deleteReminder } = useReminders();
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDate, setNewDate] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  async function handleAdd() {
    if (!newTitle.trim()) return;
    setSaving(true);
    try {
      const { data } = await createReminder(newTitle, newDescription, newDate || null);
      if (data) { setNewTitle(''); setNewDescription(''); setNewDate(''); setShowAdd(false); }
    } finally { setSaving(false); }
  }

  function getCountdown(remindAt: string | null) {
    if (!remindAt) return null;
    const diff = new Date(remindAt).getTime() - currentTime.getTime();
    if (diff <= 0) return 'OVERDUE';
    const hours = Math.floor((diff / (1000 * 60 * 60)));
    const mins = Math.floor((diff / (1000 * 60)) % 60);
    const secs = Math.floor((diff / 1000) % 60);
    return `${hours}H ${mins}M ${secs}S`;
  }

  const sortedReminders = [...reminders].sort((a, b) => {
    if (a.completed && !b.completed) return 1;
    if (!a.completed && b.completed) return -1;
    return new Date(a.remind_at || 0).getTime() - new Date(b.remind_at || 0).getTime();
  });

  return (
    <div className="relative flex-1 flex flex-col bg-[#141517] overflow-hidden">
      <div className="relative px-8 py-10 lg:px-14 lg:py-14 flex flex-col lg:flex-row lg:items-center justify-between gap-6 z-10 max-w-[1800px] mx-auto w-full">
        <div>
          <h1 className="text-4xl lg:text-5xl font-black tracking-tighter text-white uppercase">Orbit</h1>
          <h2 className="text-amber-400 text-[10px] font-bold uppercase tracking-[0.3em] mt-2">Synchronizations</h2>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowAdd(true)}
          className="px-6 py-4 bg-white text-[#141517] font-extrabold rounded-2xl flex items-center justify-center gap-3 hover:bg-zinc-200 transition-colors shadow-2xl"
        >
          <Plus className="w-5 h-5" />
          <span className="text-[12px] tracking-[0.1em] uppercase">Schedule Pulse</span>
        </motion.button>
      </div>

      <div className="flex-1 overflow-y-auto px-8 lg:px-14 pb-24 z-10 custom-scrollbar max-w-[1800px] mx-auto w-full">
        <AnimatePresence>
          {showAdd && (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="mb-10 p-8 glass-card border border-white/5 shadow-2xl space-y-8 max-w-4xl">
              <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="PROTOCOL OBJECTIVE..." className="w-full bg-transparent text-3xl font-black text-white outline-none placeholder-zinc-700 tracking-tighter" />
              <textarea value={newDescription} onChange={e => setNewDescription(e.target.value)} placeholder="ADDITIONAL CONTEXT DATA..." className="w-full bg-transparent text-zinc-400 outline-none placeholder-zinc-700 resize-none h-24 text-[13px] font-bold tracking-wide custom-scrollbar" />
              <div className="flex flex-wrap items-center justify-between gap-6 pt-4 border-t border-white/5">
                <div className="flex items-center gap-4 px-5 py-3 glass rounded-xl shadow-inner">
                  <Calendar className="w-5 h-5 text-amber-400" />
                  <input type="datetime-local" value={newDate} onChange={e => setNewDate(e.target.value)} className="bg-transparent outline-none text-xs font-black text-zinc-300 uppercase tracking-widest [color-scheme:dark]" />
                </div>
                <div className="flex gap-4">
                  <button onClick={() => setShowAdd(false)} className="px-6 py-3 text-zinc-500 hover:text-white font-black text-[11px] uppercase tracking-widest transition-colors rounded-xl hover:bg-white/5">Discard</button>
                  <button onClick={handleAdd} disabled={saving} className="px-8 py-3 bg-white text-black font-bold uppercase text-[11px] tracking-widest rounded-xl hover:bg-zinc-200 transition-all flex items-center gap-2">
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {saving ? 'Transmitting...' : 'Confirm Sync'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="flex items-center justify-center py-40">
            <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin opacity-50" />
          </div>
        ) : sortedReminders.length === 0 ? (
          <div className="text-center py-40 glass-card border-dashed">
             <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
               <Clock className="w-8 h-8 text-zinc-500" />
             </div>
             <p className="text-zinc-500 font-bold text-[12px] uppercase tracking-[0.2em] leading-relaxed">No active temporal pulses detected</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            <AnimatePresence mode='popLayout'>
              {sortedReminders.map(r => {
                const countdown = getCountdown(r.remind_at);
                const isOverdue = countdown === 'OVERDUE' && !r.completed;
                return (
                  <motion.div layout key={r.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className={`group relative glass-card p-8 flex flex-col transition-all duration-500 hover:border-amber-500/30 ${r.completed ? 'opacity-40 bg-[#1e1f23]' : isOverdue ? 'border-rose-500/20 shadow-[0_0_20px_-5px_rgba(244,63,94,0.1)]' : ''}`}>
                    <div className="relative z-10 flex-1 flex flex-col">
                      <div className="flex items-start justify-between mb-8">
                        <button onClick={() => updateReminder(r.id, { completed: !r.completed })} className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-inner border border-white/5 ${r.completed ? 'bg-gradient-to-br from-amber-400 to-orange-400 text-[#141517]' : 'bg-[#18191c] text-zinc-500 hover:text-amber-400'}`}>
                          {r.completed ? <CheckCircle className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                        </button>
                        <button onClick={() => deleteReminder(r.id)} className="opacity-0 group-hover:opacity-100 p-2 bg-white/5 rounded-xl text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"><Trash2 className="w-4 h-4" /></button>
                      </div>

                      <h3 className={`text-2xl font-bold mb-3 tracking-tight ${r.completed ? 'text-zinc-500 line-through' : 'text-zinc-100'}`}>{r.title}</h3>
                      {r.description && <p className="text-[13px] font-semibold text-zinc-500 mb-8 line-clamp-3 leading-relaxed tracking-wide flex-1">{r.description}</p>}

                      {r.remind_at && (
                        <div className="flex items-center justify-between pt-6 border-t border-white/5 mt-auto">
                          <div className={`text-[10px] font-black px-4 py-2 rounded-xl uppercase tracking-[0.2em] shadow-inner ${isOverdue ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'glass text-amber-400 border border-white/5'}`}>
                            {countdown}
                          </div>
                          <Clock className={`w-5 h-5 ${isOverdue ? 'text-rose-900' : 'text-zinc-600'}`} />
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
