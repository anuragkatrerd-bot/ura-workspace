import { useState } from 'react';
import Sidebar from './components/Sidebar';
import NotesPage from './pages/NotesPage';
import FilesPage from './pages/FilesPage';
import ChatPage from './pages/ChatPage';
import RemindersPage from './pages/RemindersPage';
import TasksPage from './pages/TasksPage';
import DocumentPage from './pages/DocumentPage';
import SearchModal from './components/SearchModal';
import type { Note } from './lib/types';
import { Menu, X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import DashboardPage from './pages/DashboardPage';
import AuthPage from './pages/AuthPage';

type View = 'nexus' | 'notes' | 'files' | 'chat' | 'reminders' | 'tasks' | 'documents';

export default function App() {
  const [user, setUser] = useState<any>(() => {
    const saved = localStorage.getItem('aura_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [activeView, setActiveView] = useState<View>('nexus');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) {
    return <AuthPage onAuth={setUser} />;
  }

  function handleSelectNote(note: Note) {
    setActiveView('notes');
    setEditingNote(note);
    setSearchOpen(false);
  }

  function toggleSidebar() {
    setSidebarOpen(!sidebarOpen);
  }

  return (
    <div className="flex h-screen w-full bg-mesh text-white font-sans overflow-hidden">
      <AnimatePresence>
        {(sidebarOpen || window.innerWidth >= 1024) && (
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`fixed inset-y-0 left-0 z-50 lg:static lg:block ${sidebarOpen ? 'w-full sm:w-80' : 'hidden lg:block'}`}
          >
            <div className={`h-full ${sidebarOpen ? 'bg-deep/95 backdrop-blur-2xl' : ''}`}>
              <Sidebar
                activeView={activeView}
                setActiveView={(v) => { setActiveView(v); setSidebarOpen(false); }}
                selectedFolderId={selectedFolderId}
                setSelectedFolderId={setSelectedFolderId}
                onSearch={() => setSearchOpen(true)}
                user={user}
                onLogout={() => setUser(null)}
              />
              {sidebarOpen && (
                <button 
                  onClick={toggleSidebar}
                  className="absolute top-8 right-8 w-12 h-12 glass rounded-2xl flex items-center justify-center text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 flex flex-col relative min-w-0">
        <header className="lg:hidden h-20 px-6 glass border-b border-white/5 flex items-center justify-between z-40">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center">
               <div className="w-4 h-4 border-2 border-white rounded-full" />
             </div>
             <span className="font-black tracking-tighter text-xl italic uppercase">Aura</span>
          </div>
          <button 
            onClick={toggleSidebar}
            className="w-12 h-12 glass rounded-2xl flex items-center justify-center"
          >
            <Menu className="w-6 h-6 text-white" />
          </button>
        </header>

        <div className="flex-1 overflow-hidden relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, scale: 0.98, filter: 'blur(10px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 1.02, filter: 'blur(10px)' }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="h-full w-full"
            >
              {activeView === 'nexus' && <DashboardPage />}
              {activeView === 'notes' && (
                <NotesPage 
                  folderId={selectedFolderId} 
                  initialNote={editingNote}
                  onClearInitialNote={() => setEditingNote(null)}
                />
              )}
              {activeView === 'files' && <FilesPage folderId={selectedFolderId} />}
              {activeView === 'reminders' && <RemindersPage />}
              {activeView === 'chat' && <ChatPage />}
              {activeView === 'tasks' && <TasksPage />}
              {activeView === 'documents' && <DocumentPage />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <SearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectNote={handleSelectNote}
      />
    </div>
  );
}
