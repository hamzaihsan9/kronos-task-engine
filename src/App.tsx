import React, { useState, useEffect, useCallback } from 'react';
import type { Task, TaskStatus, QueuedMutation } from './types';
import { 
  db, 
  initializeDatabase, 
  dispatchMutation, 
  flushQueuedMutations, 
  syncChannel,
  INITIAL_TASKS
} from './db/kronosDb';
import { Header } from './components/Header';
import { KanbanBoard } from './components/KanbanBoard';
import { TableView } from './components/TableView';
import { CommandPalette } from './components/CommandPalette';
import { TaskModal } from './components/TaskModal';
import { OutboxDrawer } from './components/OutboxDrawer';

export default function App() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);

  const [mutations, setMutations] = useState<QueuedMutation[]>([]);
  const [isOfflineSimulated, setIsOfflineSimulated] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState<'kanban' | 'table'>('kanban');

  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [defaultStatusForNew, setDefaultStatusForNew] = useState<TaskStatus>('backlog');
  const [isOutboxOpen, setIsOutboxOpen] = useState(false);

  // Load state from local IndexedDB
  const reloadFromDb = useCallback(async () => {
    const loadedTasks = await db.tasks.toArray();
    const loadedMutations = await db.mutations.orderBy('timestamp').reverse().toArray();
    setTasks(loadedTasks);
    setMutations(loadedMutations);
  }, []);

  // Initialize DB on mount
  useEffect(() => {
    const init = async () => {
      await initializeDatabase();
      await reloadFromDb();
    };
    init();

    // Listen to Multi-Tab Broadcast Sync events
    if (syncChannel) {
      syncChannel.onmessage = async (event) => {
        if (event.data?.type === 'LOCAL_MUTATION_APPLIED' || event.data?.type === 'OUTBOX_DRAINED') {
          await reloadFromDb();
        }
      };
    }
  }, [reloadFromDb]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is inside an input, textarea or select
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      } else if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        setTaskToEdit(null);
        setDefaultStatusForNew('backlog');
        setIsTaskModalOpen(true);
      } else if (e.key.toLowerCase() === 'o') {
        e.preventDefault();
        setIsOfflineSimulated((prev) => !prev);
      } else if (e.key === '1') {
        e.preventDefault();
        setCurrentView('kanban');
      } else if (e.key === '2') {
        e.preventDefault();
        setCurrentView('table');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Mutations Handlers
  const handleCreateOrUpdateTask = async (taskData: Partial<Task>) => {
    if (taskToEdit) {
      // Update
      await dispatchMutation(
        'UPDATE_TASK',
        taskToEdit.id,
        {
          ...taskToEdit,
          ...taskData,
        },
        isOfflineSimulated
      );
    } else {
      // Create New
      const nextNum = tasks.length > 0
        ? Math.max(...tasks.map((t) => parseInt(t.id.replace('KRN-', '')) || 100)) + 1
        : 101;
      const newId = `KRN-${nextNum}`;

      const newTask: Task = {
        id: newId,
        title: taskData.title || 'Untitled Issue',
        description: taskData.description || '',
        status: taskData.status || defaultStatusForNew,
        priority: taskData.priority || 'P1',
        labels: taskData.labels || ['feature'],
        assignee: taskData.assignee!,
        estimate: taskData.estimate || 3,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        syncVersion: 1,
      };

      await dispatchMutation('CREATE_TASK', newId, newTask, isOfflineSimulated);
    }

    await reloadFromDb();
  };

  const handleMoveTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    await dispatchMutation(
      'MOVE_TASK_STATUS',
      taskId,
      { status: newStatus },
      isOfflineSimulated
    );
    await reloadFromDb();
  };

  const handleDeleteTask = async (taskId: string) => {
    await dispatchMutation('DELETE_TASK', taskId, null, isOfflineSimulated);
    await reloadFromDb();
  };

  const handleFlushOutbox = async () => {
    await flushQueuedMutations();
    await reloadFromDb();
  };

  const handleClearSyncedMutations = async () => {
    await db.mutations.where('status').equals('synced').delete();
    await reloadFromDb();
  };

  const handleExportSnapshot = async () => {
    const allTasks = await db.tasks.toArray();
    const allMutations = await db.mutations.toArray();
    const data = JSON.stringify({ version: '2.4', timestamp: Date.now(), tasks: allTasks, mutations: allMutations }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kronos-snapshot-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const pendingCount = mutations.filter((m) => m.status === 'queued').length;
  const cyclePointsTotal = tasks.reduce((sum, t) => sum + (t.estimate || 0), 0);
  const cyclePointsCompleted = tasks
    .filter((t) => t.status === 'shipped')
    .reduce((sum, t) => sum + (t.estimate || 0), 0);

  return (
    <div className="min-h-screen bg-[#0c0d12] text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-black">
      
      {/* Header */}
      <Header
        isOfflineSimulated={isOfflineSimulated}
        onToggleOffline={() => setIsOfflineSimulated((prev) => !prev)}
        pendingMutationCount={pendingCount}
        onOpenNewTaskModal={() => {
          setTaskToEdit(null);
          setDefaultStatusForNew('backlog');
          setIsTaskModalOpen(true);
        }}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenOutbox={() => setIsOutboxOpen(true)}
        currentView={currentView}
        onChangeView={setCurrentView}
        cyclePointsCompleted={cyclePointsCompleted}
        cyclePointsTotal={cyclePointsTotal}
      />

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 lg:p-6 flex flex-col gap-4">
        
        {/* Offline Warning Banner if Offline Simulation is Enabled */}
        {isOfflineSimulated && (
          <div className="bg-hazard-stripes border border-amber-500/80 rounded-xl p-3 flex items-center justify-between shadow-lg shadow-amber-500/10 font-mono text-xs">
            <div className="flex items-center gap-2 text-amber-300 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
              <span>SIMULATED NETWORK DROP ACTIVE</span>
              <span className="text-slate-400 font-normal hidden sm:inline">
                — Mutations will queue in local IndexedDB outbox. Toggle off or press &quot;O&quot; to restore.
              </span>
            </div>
            <button
              onClick={() => setIsOfflineSimulated(false)}
              className="px-2.5 py-1 rounded bg-amber-500 text-black font-bold hover:bg-amber-400 transition-colors cursor-pointer"
            >
              Go Online
            </button>
          </div>
        )}

        {/* View Component */}
        {currentView === 'kanban' ? (
          <KanbanBoard
            tasks={tasks}
            onMoveTaskStatus={handleMoveTaskStatus}
            onEditTask={(task) => {
              setTaskToEdit(task);
              setIsTaskModalOpen(true);
            }}
            onDeleteTask={handleDeleteTask}
            onQuickAddTask={(status) => {
              setTaskToEdit(null);
              setDefaultStatusForNew(status);
              setIsTaskModalOpen(true);
            }}
          />
        ) : (
          <TableView
            tasks={tasks}
            onMoveTaskStatus={handleMoveTaskStatus}
            onEditTask={(task) => {
              setTaskToEdit(task);
              setIsTaskModalOpen(true);
            }}
            onDeleteTask={handleDeleteTask}
          />
        )}

      </main>

      {/* Command Palette Modal (Cmd+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        tasks={tasks}
        onSelectTask={(task) => {
          setTaskToEdit(task);
          setIsTaskModalOpen(true);
        }}
        onOpenNewTask={() => {
          setTaskToEdit(null);
          setDefaultStatusForNew('backlog');
          setIsTaskModalOpen(true);
        }}
        onToggleOffline={() => setIsOfflineSimulated((prev) => !prev)}
        isOffline={isOfflineSimulated}
        onChangeView={setCurrentView}
        onFlushOutbox={handleFlushOutbox}
        onExportSnapshot={handleExportSnapshot}
      />

      {/* Task Creation & Edit Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        taskToEdit={taskToEdit}
        defaultStatus={defaultStatusForNew}
        onSave={handleCreateOrUpdateTask}
      />

      {/* Outbox Queue Drawer */}
      <OutboxDrawer
        isOpen={isOutboxOpen}
        onClose={() => setIsOutboxOpen(false)}
        mutations={mutations}
        onFlushQueue={handleFlushOutbox}
        onClearSynced={handleClearSyncedMutations}
        isOffline={isOfflineSimulated}
      />

      {/* Industrial Footer */}
      <footer className="border-t border-amber-950/60 bg-[#090a0f] px-4 py-3 text-xs font-mono text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-bold">KRONOS ENGINE</span>
            <span>&bull;</span>
            <span>Local-First Dexie.js Store &bull; BroadcastChannel Mesh</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span>Shortcuts: <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-300">C</kbd> New Issue</span>
            <span><kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-300">⌘K</kbd> Palette</span>
            <span><kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-300">O</kbd> Offline Mode</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
