import { FileText, Files, MessageSquare, ChevronRight, ChevronDown, Plus, Trash2, Check, X, Search, Clock, Sparkles, Briefcase, LayoutTemplate } from 'lucide-react';
import { useFolders } from '../hooks/useFolders';
import type { Folder as FolderType } from '../lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

type View = 'nexus' | 'notes' | 'files' | 'chat' | 'reminders' | 'tasks' | 'documents';

interface SidebarProps {
  activeView: View;
  setActiveView: (v: View) => void;
  selectedFolderId: string | null;
  setSelectedFolderId: (id: string | null) => void;
  onSearch: () => void;
  user: any;
  onLogout: () => void;
}

export default function Sidebar({ activeView, setActiveView, selectedFolderId, setSelectedFolderId, onSearch, user, onLogout }: SidebarProps) {
  const { folders, createFolder, renameFolder, deleteFolder } = useFolders();
  const [newFolderName, setNewFolderName] = useState('');
  const [addingFolder, setAddingFolder] = useState<string | 'root' | null>(null);

  const rootFolders = folders.filter(f => f.parent_id === null);

  async function handleCreateFolder(parentId: string | null) {
    if (!newFolderName.trim()) return;
    await createFolder(newFolderName.trim(), parentId);
    setNewFolderName('');
    setAddingFolder(null);
  }

  const navItems = [
    { id: 'nexus' as View, label: 'Nexus', icon: Sparkles, color: 'text-purple-400' },
    { id: 'notes' as View, label: 'Nodes', icon: FileText, color: 'text-pink-400' },
    { id: 'files' as View, label: 'Vault', icon: Files, color: 'text-rose-400' },
    { id: 'reminders' as View, label: 'Orbit', icon: Clock, color: 'text-amber-400' },
    { id: 'chat' as View, label: 'Neural', icon: MessageSquare, color: 'text-indigo-400' },
    { id: 'tasks' as View, label: 'Flow', icon: Briefcase, color: 'text-teal-400' },
    { id: 'documents' as View, label: 'Canvas', icon: LayoutTemplate, color: 'text-cyan-400' },
  ];

  return (
    <aside className="w-72 h-full p-5 flex flex-col relative z-20 overflow-hidden bg-[#141517] border-r border-white/5 shadow-2xl">
      <div className="flex-1 flex flex-col relative">
        {/* Brand */}
        <div className="mb-10 px-2 pt-2">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-white font-extrabold text-2xl tracking-tight uppercase">Aura</span>
              <span className="text-[9px] text-purple-400 font-bold uppercase tracking-[0.25em]">Workspace</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-1.5 mb-10">
          {navItems.map(({ id, label, icon: Icon, color }) => (
            <motion.button
              key={id}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveView(id)}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all ${
                activeView === id
                  ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03]'
              }`}
            >
              <Icon className={`w-4 h-4 ${activeView === id ? 'text-purple-400' : 'text-zinc-500'}`} />
              {label}
            </motion.button>
          ))}
        </nav>

        {/* Storage / Folders */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-1">
          <div className="flex items-center justify-between mb-4 px-2">
            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em]">Collections</span>
            <button onClick={() => setAddingFolder('root')} className="w-5 h-5 rounded-md bg-white/5 flex items-center justify-center text-zinc-500 hover:text-purple-400 transition-colors">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1">
            <button
              onClick={() => setSelectedFolderId(null)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                selectedFolderId === null ? 'text-purple-400 bg-white/5' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02]'
              }`}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-current" />
              All Content
            </button>

            {addingFolder === 'root' && (
              <div className="px-3 py-2 ml-2">
                <input
                  autoFocus
                  value={newFolderName}
                  onChange={e => setNewFolderName(e.target.value)}
                  onKeyDown={e => { if(e.key === 'Enter') handleCreateFolder(null); if(e.key === 'Escape') { setAddingFolder(null); setNewFolderName(''); } }}
                  placeholder="NEW FOLDER NAME..."
                  className="bg-white/5 border border-white/10 rounded-lg pl-3 py-2 text-white outline-none w-full text-[9px] font-bold uppercase"
                />
              </div>
            )}

            {rootFolders.map(f => (
              <FolderItem
                key={f.id}
                folder={f}
                allFolders={folders}
                depth={0}
                selectedFolderId={selectedFolderId}
                onSelect={setSelectedFolderId}
                onCreateChild={(parentId: string) => setAddingFolder(parentId)}
                onRename={renameFolder}
                onDelete={deleteFolder}
                addingFolder={addingFolder}
                newFolderName={newFolderName}
                setNewFolderName={setNewFolderName}
                onConfirmAdd={handleCreateFolder}
                onCancelAdd={() => { setAddingFolder(null); setNewFolderName(''); }}
              />
            ))}
          </div>
        </div>

        {/* Global Search Button */}
        <div className="mt-8 border-t border-white/[0.05] pt-6 space-y-4">
          <button
            onClick={onSearch}
            className="w-full flex items-center justify-center gap-3 py-3.5 bg-white/[0.03] hover:bg-white/[0.06] rounded-2xl border border-white/[0.05] text-zinc-400 transition-all font-bold uppercase tracking-widest text-[10px] group"
          >
            <Search className="w-4 h-4 group-hover:text-purple-400" />
            <span>Quick Search</span>
          </button>

          {/* User Identity Section */}
          <div className="bg-[#1e1f23] rounded-3xl p-4 border border-white/[0.05] relative overflow-hidden group shadow-inner">
             <div className="relative z-10 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 font-extrabold text-sm border border-purple-500/20 shadow-md">
                   {user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                   <p className="text-[12px] font-bold text-white truncate text-ellipsis">{user.full_name || 'Protocol User'}</p>
                   <p className="text-[9px] text-zinc-500 truncate font-semibold uppercase tracking-widest mt-0.5">{user.email}</p>
                </div>
                <button 
                  onClick={() => { localStorage.removeItem('aura_user'); onLogout(); }}
                  className="opacity-0 group-hover:opacity-100 p-2 text-zinc-500 hover:text-rose-400 transition-all"
                >
                   <X className="w-4 h-4" />
                </button>
             </div>
          </div>
        </div>
      </div>
    </aside>

  );
}

function FolderItem({ folder, allFolders, depth, selectedFolderId, onSelect, onCreateChild, onRename, onDelete, addingFolder, newFolderName, setNewFolderName, onConfirmAdd, onCancelAdd }: any) {
  const [expanded, setExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(folder.name);
  const children = allFolders.filter((f: any) => f.parent_id === folder.id);
  const isSelected = selectedFolderId === folder.id;

  async function handleRename() {
    if (!editName.trim()) return;
    await onRename(folder.id, editName);
    setIsEditing(false);
  }

  return (
    <div className="space-y-1">
      <div 
        className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl text-[11px] font-semibold transition-all ${
          isSelected ? 'bg-purple-500/10 text-purple-300' : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.02]'
        }`}
        style={{ marginLeft: `${depth * 12}px` }}
      >
        <button onClick={() => setExpanded(!expanded)} className="p-1">
          {children.length > 0 ? (
            expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />
          ) : <div className="w-3.5 h-3.5" />}
        </button>

        <div className="flex-1 truncate" onClick={() => onSelect(folder.id)}>
          {isEditing ? (
            <input
              autoFocus
              value={editName}
              onChange={e => setEditName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setIsEditing(false); }}
              className="bg-transparent text-white outline-none w-full"
            />
          ) : (
            <span className="truncate">{folder.name}</span>
          )}
        </div>

        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 pr-1">
          <Plus onClick={(e) => { e.stopPropagation(); setExpanded(true); onCreateChild(folder.id); }} className="w-3.5 h-3.5 cursor-pointer text-zinc-400 hover:text-purple-400" />
          <Trash2 onClick={(e) => { e.stopPropagation(); onDelete(folder.id); }} className="w-3.5 h-3.5 cursor-pointer text-zinc-400 hover:text-rose-400" />
        </div>
      </div>

      {(expanded && children.length > 0) || addingFolder === folder.id ? (
        <div className="border-l border-white/10 ml-4">
          {children.map((child: any) => (
            <FolderItem
              key={child.id}
              folder={child}
              allFolders={allFolders}
              depth={depth + 1}
              selectedFolderId={selectedFolderId}
              onSelect={onSelect}
              onCreateChild={onCreateChild}
              onRename={onRename}
              onDelete={onDelete}
              addingFolder={addingFolder}
              newFolderName={newFolderName}
              setNewFolderName={setNewFolderName}
              onConfirmAdd={onConfirmAdd}
              onCancelAdd={onCancelAdd}
            />
          ))}
          {addingFolder === folder.id && (
            <div className="px-3 py-2" style={{ marginLeft: `${(depth + 1) * 12}px` }}>
              <input
                autoFocus
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                onKeyDown={e => { if(e.key === 'Enter') onConfirmAdd(folder.id); if(e.key === 'Escape') onCancelAdd(); }}
                placeholder="NEW FOLDER NAME..."
                className="bg-white/5 border border-white/10 rounded pl-2 py-1.5 text-white outline-none w-full text-[9px] font-bold uppercase"
              />
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
