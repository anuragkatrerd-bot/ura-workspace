import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Mail, Lock, User, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { API_URL } from '../lib/api';

interface AuthPageProps {
  onAuth: (user: any) => void;
}

export default function AuthPage({ onAuth }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
    
    setLoading(true);
    setError('');
    
    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
      const body = isLogin ? { email, password } : { email, password, fullName };
      
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Identity verification failed');
      
      // Success
      localStorage.setItem('aura_user', JSON.stringify(data));
      onAuth(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-[#0a0c10] flex items-center justify-center p-6 overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-500/5 blur-[120px] rounded-full" />
         <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-10">
          <motion.div 
            whileHover={{ rotate: 10, scale: 1.1 }}
            className="w-16 h-16 bg-teal-500 rounded-2xl mx-auto flex items-center justify-center shadow-xl shadow-teal-900/20 mb-6"
          >
            <Brain className="w-8 h-8 text-slate-950" />
          </motion.div>
          <h1 className="text-4xl font-black tracking-tighter text-white uppercase mb-2">Aura</h1>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em]">Central Identity Gateway</p>
        </div>

        <div className="bg-[#14181f] rounded-[2rem] border border-white/[0.03] p-8 lg:p-10 shadow-2xl relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.form 
              key={isLogin ? 'login' : 'signup'}
              initial={{ opacity: 0, x: isLogin ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isLogin ? 20 : -20 }}
              onSubmit={handleSubmit} 
              className="space-y-5"
            >
              {!isLogin && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-4">Full Identity Name</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700 group-focus-within:text-teal-400 transition-colors" />
                    <input 
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      placeholder="ENTER FULL NAME..." 
                      className="w-full bg-white/[0.02] border border-white/[0.03] rounded-xl pl-12 pr-4 py-3.5 text-sm text-white placeholder-slate-800 outline-none focus:border-teal-500/20 focus:bg-white/[0.04] transition-all font-bold tracking-tight"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-4">Neural Address (Email)</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700 group-focus-within:text-teal-400 transition-colors" />
                  <input 
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="ENTER EMAIL SIGNAL..." 
                    className="w-full bg-white/[0.02] border border-white/[0.03] rounded-xl pl-12 pr-4 py-3.5 text-sm text-white placeholder-slate-800 outline-none focus:border-teal-500/20 focus:bg-white/[0.04] transition-all font-bold tracking-tight"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-4">Access Key (Password)</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700 group-focus-within:text-teal-400 transition-colors" />
                  <input 
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="ENTER SECURE KEY..." 
                    className="w-full bg-white/[0.02] border border-white/[0.03] rounded-xl pl-12 pr-4 py-3.5 text-sm text-white placeholder-slate-800 outline-none focus:border-teal-500/20 focus:bg-white/[0.04] transition-all font-bold tracking-tight"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 flex items-center gap-3">
                   <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                   <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider">{error}</p>
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full btn-genz flex items-center justify-center gap-3 h-14"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span className="text-[11px] font-black uppercase tracking-[0.2em]">{isLogin ? 'Verify Identity' : 'Create Identity'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </motion.form>
          </AnimatePresence>
        </div>

        <div className="text-center mt-8">
          <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest">
            {isLogin ? "New user recognized?" : "Already verified?"}
            <button 
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="ml-2 text-teal-400 hover:text-teal-300 transition-colors"
            >
              {isLogin ? 'Initialize Signup' : 'Return to Login'}
            </button>
          </p>
        </div>

        {/* Footer Credit */}
        <div className="absolute bottom-[-60px] inset-x-0 flex items-center justify-center gap-3 opacity-20">
            <Sparkles className="w-3 h-3 text-teal-400" />
            <span className="text-[9px] font-black uppercase tracking-[0.4em] text-white">Quantum Secured Protocol</span>
        </div>
      </motion.div>
    </div>
  );
}
