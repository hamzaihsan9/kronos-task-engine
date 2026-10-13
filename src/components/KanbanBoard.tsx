import React from 'react';
import { 
  ArrowRight, 
  ArrowLeft, 
  Trash2, 
  Edit3, 
  Plus, 
  Clock, 
  Layers,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import type { Task, TaskStatus, TaskPriority } from '../types';

interface KanbanBoardProps {
  tasks: Task[];
  onMoveTaskStatus: (taskId: string, newStatus: TaskStatus) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onQuickAddTask: (status: TaskStatus) => void;
}

const COLUMNS: { id: TaskStatus; title: string; color: string; badge: string }[] = [
  { id: 'backlog', title: 'Backlog', color: 'border-slate-800', badge: 'bg-slate-900 text-slate-400' },
  { id: 'in_progress', title: 'In Progress', color: 'border-amber-600/40', badge: 'bg-amber-500/10 text-amber-400 border border-amber-500/30' },
  { id: 'review', title: 'In Review', color: 'border-amber-500/30', badge: 'bg-yellow-500/10 text-yellow-300 border border-yellow-500/30' },
  { id: 'shipped', title: 'Shipped', color: 'border-emerald-700/30', badge: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  onMoveTaskStatus,
  onEditTask,
  onDeleteTask,
  onQuickAddTask,
}) => {
  const getNextStatus = (current: TaskStatus): TaskStatus | null => {
    if (current === 'backlog') return 'in_progress';
    if (current === 'in_progress') return 'review';
    if (current === 'review') return 'shipped';
    return null;
  };

  const getPrevStatus = (current: TaskStatus): TaskStatus | null => {
    if (current === 'shipped') return 'review';
    if (current === 'review') return 'in_progress';
    if (current === 'in_progress') return 'backlog';
    return null;
  };

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case 'P0':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">P0 CRIT</span>;
      case 'P1':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">P1 HIGH</span>;
      case 'P2':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">P2 MED</span>;
      case 'P3':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-800 text-slate-400">P3 LOW</span>;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-1 select-none">
      {COLUMNS.map((col) => {
        const columnTasks = tasks.filter((t) => t.status === col.id);
        const columnPoints = columnTasks.reduce((acc, t) => acc + (t.estimate || 0), 0);

        return (
          <div
            key={col.id}
            className={`flex flex-col bg-[#11131a] rounded-xl border ${col.color} p-3 shadow-lg min-h-[500px]`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 border-b border-amber-950/40 mb-3">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${col.badge}`}>
                  {col.title.toUpperCase()}
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  {columnTasks.length}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-slate-500">
                  {columnPoints} pts
                </span>
                <button
                  onClick={() => onQuickAddTask(col.id)}
                  className="p-1 rounded bg-[#181b24] hover:bg-amber-500/20 text-slate-400 hover:text-amber-300 border border-amber-950/40 transition-colors cursor-pointer"
                  title={`Add issue to ${col.title}`}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Task Card List */}
            <div className="flex-1 flex flex-col gap-2.5 overflow-y-auto pr-0.5">
              {columnTasks.length === 0 ? (
                <div className="h-28 border border-dashed border-amber-950/40 rounded-lg flex items-center justify-center text-[11px] font-mono text-slate-600">
                  NO ISSUES IN COLUMN
                </div>
              ) : (
                columnTasks.map((task) => {
                  const next = getNextStatus(task.status);
                  const prev = getPrevStatus(task.status);

                  return (
                    <div
                      key={task.id}
                      className="group bg-[#161822] hover:bg-[#1a1e2b] border border-amber-950/50 hover:border-amber-500/50 rounded-lg p-3 transition-all duration-150 shadow-sm flex flex-col gap-2 relative"
                    >
                      {/* Top Row: Key, Priority, Story Points */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-amber-400 tracking-wider">
                            {task.id}
                          </span>
                          {getPriorityBadge(task.priority)}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/40 text-slate-300 border border-amber-950/60">
                            {task.estimate} pt{task.estimate > 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>

                      {/* Title & Description */}
                      <div>
                        <h4 className="text-xs font-semibold text-slate-100 group-hover:text-amber-200 transition-colors leading-snug">
                          {task.title}
                        </h4>
                        {task.description && (
                          <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                            {task.description}
                          </p>
                        )}
                      </div>

                      {/* Labels */}
                      {task.labels && task.labels.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {task.labels.map((l, i) => (
                            <span
                              key={i}
                              className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20"
                            >
                              #{l}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Footer: Assignee & Movement Controls */}
                      <div className="flex items-center justify-between pt-2 border-t border-amber-950/30 mt-1">
                        
                        {/* Assignee Avatar / Handle */}
                        <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
                          <div 
                            className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-black"
                            style={{ backgroundColor: task.assignee?.avatarColor || '#f59e0b' }}
                          >
                            {task.assignee?.name?.charAt(0) || 'U'}
                          </div>
                          <span className="text-slate-400 text-[10px]">
                            {task.assignee?.handle || '@unassigned'}
                          </span>
                        </div>

                        {/* Status Shift Buttons */}
                        <div className="flex items-center gap-1">
                          {prev && (
                            <button
                              onClick={() => onMoveTaskStatus(task.id, prev)}
                              className="p-1 rounded bg-[#10121a] hover:bg-amber-500/20 text-slate-400 hover:text-amber-300 border border-amber-950/60 transition-colors cursor-pointer"
                              title={`Move to ${prev}`}
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => onEditTask(task)}
                            className="p-1 rounded bg-[#10121a] hover:bg-amber-500/20 text-slate-400 hover:text-amber-300 border border-amber-950/60 transition-colors cursor-pointer"
                            title="Edit Issue"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>

                          <button
                            onClick={() => onDeleteTask(task.id)}
                            className="p-1 rounded bg-[#10121a] hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-amber-950/60 transition-colors cursor-pointer"
                            title="Delete Issue"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>

                          {next && (
                            <button
                              onClick={() => onMoveTaskStatus(task.id, next)}
                              className="p-1 rounded bg-amber-500 hover:bg-amber-400 text-black font-bold border border-amber-400 transition-colors cursor-pointer"
                              title={`Advance to ${next}`}
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                      </div>

                    </div>
                  );
                })
              )}
            </div>

          </div>
        );
      })}
    </div>
  );
};
