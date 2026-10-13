import React from 'react';
import { 
  Zap, 
  Wifi, 
  WifiOff, 
  Plus, 
  Command, 
  Database, 
  Layers, 
  Activity,
  Terminal,
  RotateCcw
} from 'lucide-react';

interface HeaderProps {
  isOfflineSimulated: boolean;
  onToggleOffline: () => void;
  pendingMutationCount: number;
  onOpenNewTaskModal: () => void;
  onOpenCommandPalette: () => void;
  onOpenOutbox: () => void;
  currentView: 'kanban' | 'table';
  onChangeView: (view: 'kanban' | 'table') => void;
  cyclePointsCompleted: number;
  cyclePointsTotal: number;
}

export const Header: React.FC<HeaderProps> = ({
  isOfflineSimulated,
  onToggleOffline,
  pendingMutationCount,
  onOpenNewTaskModal,
  onOpenCommandPalette,
  onOpenOutbox,
  currentView,
  onChangeView,
  cyclePointsCompleted,
  cyclePointsTotal,
}) => {
  const percentage = Math.round((cyclePointsCompleted / Math.max(1, cyclePointsTotal)) * 100);

  return (
    <header className="border-b border-amber-950/60 bg-[#0c0d12]/95 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-6 py-2.5 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        
        {/* Brand / Logo with Custom Cybernetic Amber Emblem */}
        <div className="flex items-center gap-3">
          {/* Custom Geometric Amber Vector Insignia */}
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/20 border border-amber-400/40 relative overflow-hidden group">
            <div className="absolute inset-0 bg-hazard-stripes opacity-10" />
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-black fill-current transform group-hover:rotate-45 transition-transform duration-300">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-base tracking-wider text-amber-400">
                KRONOS
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                v2.4-LOCAL-FIRST
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
              <span className="text-amber-500/80">INDEXEDDB ENGINE</span>
              <span className="text-slate-600">•</span>
              <span className="hidden sm:inline text-slate-500">MULTI-TAB BROADCAST MESH</span>
            </div>
          </div>
        </div>

        {/* Center: View Switcher & Cycle Progress */}
        <div className="flex items-center gap-3">
          
          {/* View Mode Switcher */}
          <div className="flex items-center bg-[#14161f] p-1 rounded-lg border border-amber-950/80 text-xs font-mono">
            <button
              onClick={() => onChangeView('kanban')}
              className={`px-3 py-1 rounded transition-all cursor-pointer flex items-center gap-1.5 ${
                currentView === 'kanban'
                  ? 'bg-amber-500 text-black font-bold shadow-sm'
                  : 'text-slate-400 hover:text-amber-300'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Board</span>
            </button>
            <button
              onClick={() => onChangeView('table')}
              className={`px-3 py-1 rounded transition-all cursor-pointer flex items-center gap-1.5 ${
                currentView === 'table'
                  ? 'bg-amber-500 text-black font-bold shadow-sm'
                  : 'text-slate-400 hover:text-amber-300'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
          </div>

          {/* Sprint / Cycle Velocity Widget */}
          <div className="hidden md:flex items-center gap-2 bg-[#14161f] px-3 py-1.5 rounded-lg border border-amber-950/80 text-[11px] font-mono">
            <span className="text-slate-400">Sprint 42:</span>
            <div className="w-20 bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-700/60">
              <div 
                className="bg-amber-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="text-amber-400 font-bold">{cyclePointsCompleted}/{cyclePointsTotal} pts</span>
          </div>

        </div>

        {/* Right Action Bar */}
        <div className="flex items-center gap-2">
          
          {/* Network State / Offline Simulation Switch */}
          <button
            onClick={onToggleOffline}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-medium border transition-all cursor-pointer ${
              isOfflineSimulated
                ? 'bg-hazard-stripes border-amber-500 text-amber-300 shadow-md shadow-amber-500/10'
                : 'bg-[#14161f] border-emerald-900/40 text-emerald-400 hover:border-emerald-600/60'
            }`}
            title="Toggle Network Disconnection Simulation (Key: O)"
          >
            {isOfflineSimulated ? (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span className="font-bold">OFFLINE SIMULATED</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>ONLINE // SYNCED</span>
              </>
            )}
          </button>

          {/* Outbox Queue Drawer Trigger */}
          <button
            onClick={onOpenOutbox}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono border transition-all cursor-pointer ${
              pendingMutationCount > 0
                ? 'bg-amber-500/20 text-amber-300 border-amber-500 animate-pulse'
                : 'bg-[#14161f] text-slate-400 hover:text-slate-200 border-amber-950/60'
            }`}
            title="Inspect Local Outbox Mutation Queue"
          >
            <Database className="w-3.5 h-3.5 text-amber-400" />
            <span>Outbox</span>
            <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
              pendingMutationCount > 0 ? 'bg-amber-500 text-black' : 'bg-slate-800 text-slate-400'
            }`}>
              {pendingMutationCount}
            </span>
          </button>

          {/* Command Palette Trigger */}
          <button
            onClick={onOpenCommandPalette}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#14161f] hover:bg-slate-800 text-slate-300 hover:text-white border border-amber-950/60 text-xs font-mono transition-colors cursor-pointer"
            title="Command Palette (Ctrl+K or Cmd+K)"
          >
            <Command className="w-3.5 h-3.5 text-amber-400" />
            <kbd className="text-[10px] bg-slate-900 px-1 rounded text-slate-400 border border-slate-700">⌘K</kbd>
          </button>

          {/* New Issue Button */}
          <button
            onClick={onOpenNewTaskModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-xs tracking-tight shadow-md shadow-amber-500/20 transition-all active:scale-95 cursor-pointer"
            title="New Issue (Key: C)"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>New Issue</span>
          </button>

        </div>

      </div>
    </header>
  );
};
