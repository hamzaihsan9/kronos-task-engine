import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Plus, 
  Wifi, 
  WifiOff, 
  Layers, 
  Terminal, 
  Database, 
  Download, 
  Check, 
  X,
  FileText
} from 'lucide-react';
import type { Task } from '../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  onSelectTask: (task: Task) => void;
  onOpenNewTask: () => void;
  onToggleOffline: () => void;
  isOffline: boolean;
  onChangeView: (view: 'kanban' | 'table') => void;
  onFlushOutbox: () => void;
  onExportSnapshot: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  tasks,
  onSelectTask,
  onOpenNewTask,
  onToggleOffline,
  isOffline,
  onChangeView,
  onFlushOutbox,
  onExportSnapshot,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Actions list
  const actions = [
    { id: 'act-new', label: 'Create New Issue', shortcut: 'C', icon: Plus, run: onOpenNewTask },
    { id: 'act-offline', label: isOffline ? 'Disable Offline Mode (Go Online)' : 'Simulate Network Disconnection', shortcut: 'O', icon: isOffline ? Wifi : WifiOff, run: onToggleOffline },
    { id: 'act-board', label: 'Switch to Board View', shortcut: '1', icon: Layers, run: () => onChangeView('kanban') },
    { id: 'act-table', label: 'Switch to Table View', shortcut: '2', icon: Terminal, run: () => onChangeView('table') },
    { id: 'act-flush', label: 'Flush Offline Outbox Queue', shortcut: 'F', icon: Database, run: onFlushOutbox },
    { id: 'act-export', label: 'Export Database Snapshot (JSON)', shortcut: 'E', icon: Download, run: onExportSnapshot },
  ];

  // Filter actions and tasks
  const matchedActions = actions.filter((a) =>
    a.label.toLowerCase().includes(query.toLowerCase())
  );

  const matchedTasks = tasks.filter((t) =>
    t.title.toLowerCase().includes(query.toLowerCase()) ||
    t.id.toLowerCase().includes(query.toLowerCase()) ||
    t.labels.some((l) => l.toLowerCase().includes(query.toLowerCase()))
  ).slice(0, 5);

  const totalItems = matchedActions.length + matchedTasks.length;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, totalItems));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + totalItems) % Math.max(1, totalItems));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex < matchedActions.length) {
        matchedActions[selectedIndex].run();
        onClose();
      } else {
        const taskIdx = selectedIndex - matchedActions.length;
        if (matchedTasks[taskIdx]) {
          onSelectTask(matchedTasks[taskIdx]);
          onClose();
        }
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-xl bg-[#11131a] border border-amber-500/40 rounded-2xl shadow-2xl shadow-amber-950/40 overflow-hidden flex flex-col font-mono text-xs"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-amber-950/60 bg-[#161822]">
          <Search className="w-4 h-4 text-amber-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search issues..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="w-full bg-transparent text-slate-100 placeholder:text-slate-600 outline-none text-xs"
          />
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400 border border-slate-700">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 flex flex-col gap-1">
          {/* Actions */}
          {matchedActions.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[10px] uppercase text-amber-500/70 font-bold">
                Operations
              </div>
              {matchedActions.map((action, idx) => {
                const Icon = action.icon;
                const isSelected = selectedIndex === idx;

                return (
                  <div
                    key={action.id}
                    onClick={() => {
                      action.run();
                      onClose();
                    }}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-amber-500 text-black font-bold'
                        : 'text-slate-300 hover:bg-[#181b24]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5" />
                      <span>{action.label}</span>
                    </div>
                    <kbd className={`px-1.5 py-0.5 rounded text-[10px] ${
                      isSelected ? 'bg-black/20 text-black' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {action.shortcut}
                    </kbd>
                  </div>
                );
              })}
            </div>
          )}

          {/* Jump to Issues */}
          {matchedTasks.length > 0 && (
            <div className="mt-2 pt-2 border-t border-amber-950/40">
              <div className="px-2 py-1 text-[10px] uppercase text-amber-500/70 font-bold">
                Jump to Issue
              </div>
              {matchedTasks.map((task, idx) => {
                const itemIdx = matchedActions.length + idx;
                const isSelected = selectedIndex === itemIdx;

                return (
                  <div
                    key={task.id}
                    onClick={() => {
                      onSelectTask(task);
                      onClose();
                    }}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-amber-500 text-black font-bold'
                        : 'text-slate-300 hover:bg-[#181b24]'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className={isSelected ? 'text-black' : 'text-amber-400 font-bold'}>
                        {task.id}
                      </span>
                      <span className="truncate">{task.title}</span>
                    </div>
                    <span className={`text-[10px] ${isSelected ? 'text-black' : 'text-slate-500'}`}>
                      {task.status}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {totalItems === 0 && (
            <div className="py-8 text-center text-slate-600">
              NO MATCHING COMMANDS OR ISSUES
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-3 py-2 border-t border-amber-950/40 bg-[#0d0e14] text-[10px] text-slate-500 flex items-center justify-between">
          <span>Navigate with ↑ / ↓, Select with Enter</span>
          <span>Zero-Latency Command Bus</span>
        </div>

      </div>
    </div>
  );
};
