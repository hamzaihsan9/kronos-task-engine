import React, { useState } from 'react';
import { 
  X, 
  Database, 
  RotateCw, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Trash2, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { QueuedMutation } from '../types';

interface OutboxDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  mutations: QueuedMutation[];
  onFlushQueue: () => Promise<void>;
  onClearSynced: () => Promise<void>;
  isOffline: boolean;
}

export const OutboxDrawer: React.FC<OutboxDrawerProps> = ({
  isOpen,
  onClose,
  mutations,
  onFlushQueue,
  onClearSynced,
  isOffline,
}) => {
  const [isFlushing, setIsFlushing] = useState(false);

  if (!isOpen) return null;

  const queuedMutations = mutations.filter((m) => m.status === 'queued');
  const syncedMutations = mutations.filter((m) => m.status === 'synced');

  const handleFlush = async () => {
    setIsFlushing(true);
    await onFlushQueue();
    setIsFlushing(false);
    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.6 },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-[#0e1017] border-l border-amber-500/40 h-full p-4 flex flex-col font-mono text-xs shadow-2xl">
        
        {/* Drawer Header */}
        <div className="flex items-center justify-between pb-3 border-b border-amber-950/60 mb-3">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-amber-400" />
            <div>
              <h3 className="font-bold text-amber-300">OUTBOX MUTATION LOG</h3>
              <p className="text-[10px] text-slate-500">IndexedDB Local Mutation Journal</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded bg-[#161822] text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Alert Banner */}
        <div className={`p-3 rounded-lg border mb-3 flex items-center justify-between ${
          isOffline
            ? 'bg-amber-950/30 border-amber-500 text-amber-300'
            : 'bg-[#12151e] border-emerald-900/40 text-emerald-400'
        }`}>
          <div className="flex items-center gap-2">
            {isOffline ? (
              <AlertTriangle className="w-4 h-4 text-amber-400 animate-pulse" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            )}
            <div>
              <div className="font-bold">{isOffline ? 'OFFLINE QUEUE ACTIVE' : 'NETWORK SYNCHRONIZED'}</div>
              <div className="text-[10px] text-slate-400">
                {queuedMutations.length} mutations queued in local store
              </div>
            </div>
          </div>

          <button
            onClick={handleFlush}
            disabled={isFlushing || queuedMutations.length === 0}
            className={`px-3 py-1.5 rounded font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              queuedMutations.length > 0
                ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-md shadow-amber-500/20'
                : 'bg-slate-800 text-slate-600 cursor-not-allowed'
            }`}
          >
            <RotateCw className={`w-3.5 h-3.5 ${isFlushing ? 'animate-spin' : ''}`} />
            <span>Flush</span>
          </button>
        </div>

        {/* Mutation Records List */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1">
          {mutations.length === 0 ? (
            <div className="py-16 text-center text-slate-600 border border-dashed border-amber-950/40 rounded-lg">
              OUTBOX EMPTY (ALL TRANSACTIONS COMMITTED)
            </div>
          ) : (
            mutations.map((mut) => (
              <div
                key={mut.id}
                className={`p-2.5 rounded-lg border text-[11px] flex flex-col gap-1.5 transition-all ${
                  mut.status === 'queued'
                    ? 'bg-amber-950/20 border-amber-500/60 text-amber-200'
                    : 'bg-[#141620] border-amber-950/30 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-bold text-amber-400">{mut.type}</span>
                  <span className={`px-1.5 py-0.2 rounded font-mono ${
                    mut.status === 'queued' ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-500'
                  }`}>
                    {mut.status.toUpperCase()}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-300">
                  <span>Target: <span className="font-bold text-white">{mut.entityId}</span></span>
                  <span className="text-[10px] text-slate-500">
                    {new Date(mut.timestamp).toLocaleTimeString()}
                  </span>
                </div>

                {mut.payload && (
                  <pre className="p-1.5 rounded bg-black/40 text-[10px] text-slate-400 overflow-x-auto border border-amber-950/30 font-mono">
                    {JSON.stringify(mut.payload, null, 1)}
                  </pre>
                )}
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer Actions */}
        <div className="pt-3 border-t border-amber-950/40 mt-2 flex items-center justify-between text-[10px]">
          <span className="text-slate-500">Persistent Dexie IndexedDB Store</span>
          {syncedMutations.length > 0 && (
            <button
              onClick={onClearSynced}
              className="flex items-center gap-1 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear Synced Journal</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
