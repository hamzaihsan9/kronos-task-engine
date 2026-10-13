import React, { useState } from 'react';
import { 
  Trash2, 
  Edit3, 
  ArrowUpDown, 
  Search, 
  Filter, 
  Terminal,
  CheckCircle2,
  Clock,
  Circle
} from 'lucide-react';
import type { Task, TaskStatus, TaskPriority } from '../types';

interface TableViewProps {
  tasks: Task[];
  onMoveTaskStatus: (taskId: string, newStatus: TaskStatus) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

export const TableView: React.FC<TableViewProps> = ({
  tasks,
  onMoveTaskStatus,
  onEditTask,
  onDeleteTask,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortField, setSortField] = useState<'id' | 'priority' | 'estimate' | 'updatedAt'>('updatedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const filteredTasks = tasks
    .filter((task) => {
      const matchesSearch =
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.labels.some((l) => l.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
      const matchesStatus = filterStatus === 'all' || task.status === filterStatus;

      return matchesSearch && matchesPriority && matchesStatus;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortField === 'id') comparison = a.id.localeCompare(b.id);
      else if (sortField === 'priority') comparison = a.priority.localeCompare(b.priority);
      else if (sortField === 'estimate') comparison = a.estimate - b.estimate;
      else if (sortField === 'updatedAt') comparison = a.updatedAt - b.updatedAt;

      return sortDirection === 'asc' ? comparison : -comparison;
    });

  const toggleSort = (field: 'id' | 'priority' | 'estimate' | 'updatedAt') => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'backlog':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400">Backlog</span>;
      case 'in_progress':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">In Progress</span>;
      case 'review':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">Review</span>;
      case 'shipped':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Shipped</span>;
    }
  };

  return (
    <div className="flex flex-col gap-3 p-1">
      
      {/* Search and Filter Toolstrip */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#11131a] p-3 rounded-xl border border-amber-950/60 shadow-md">
        
        {/* Search Input */}
        <div className="flex items-center gap-2 bg-[#161822] px-3 py-1.5 rounded-lg border border-amber-950/60 w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-amber-400" />
          <input
            type="text"
            placeholder="Search by ID, keyword, #label..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent text-xs font-mono text-slate-200 outline-none w-full placeholder:text-slate-600"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <div className="flex items-center gap-1.5 bg-[#161822] px-2.5 py-1.5 rounded-lg border border-amber-950/60 text-slate-400">
            <Filter className="w-3 h-3 text-amber-400" />
            <span>Priority:</span>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="bg-transparent text-amber-400 outline-none cursor-pointer"
            >
              <option value="all" className="bg-[#161822]">All</option>
              <option value="P0" className="bg-[#161822]">P0 Critical</option>
              <option value="P1" className="bg-[#161822]">P1 High</option>
              <option value="P2" className="bg-[#161822]">P2 Medium</option>
              <option value="P3" className="bg-[#161822]">P3 Low</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-[#161822] px-2.5 py-1.5 rounded-lg border border-amber-950/60 text-slate-400">
            <span>Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-transparent text-amber-400 outline-none cursor-pointer"
            >
              <option value="all" className="bg-[#161822]">All</option>
              <option value="backlog" className="bg-[#161822]">Backlog</option>
              <option value="in_progress" className="bg-[#161822]">In Progress</option>
              <option value="review" className="bg-[#161822]">Review</option>
              <option value="shipped" className="bg-[#161822]">Shipped</option>
            </select>
          </div>
        </div>

      </div>

      {/* Dense Table View */}
      <div className="bg-[#11131a] rounded-xl border border-amber-950/60 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            
            <thead className="bg-[#161822] border-b border-amber-950/60 text-slate-400 uppercase text-[10px]">
              <tr>
                <th 
                  onClick={() => toggleSort('id')}
                  className="py-2.5 px-4 cursor-pointer hover:text-amber-300"
                >
                  <span className="flex items-center gap-1">
                    Key <ArrowUpDown className="w-3 h-3" />
                  </span>
                </th>
                <th 
                  onClick={() => toggleSort('priority')}
                  className="py-2.5 px-3 cursor-pointer hover:text-amber-300"
                >
                  Priority
                </th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-4 w-1/3">Issue Title</th>
                <th 
                  onClick={() => toggleSort('estimate')}
                  className="py-2.5 px-3 cursor-pointer hover:text-amber-300 text-center"
                >
                  Pts
                </th>
                <th className="py-2.5 px-4">Assignee</th>
                <th 
                  onClick={() => toggleSort('updatedAt')}
                  className="py-2.5 px-4 cursor-pointer hover:text-amber-300"
                >
                  Updated
                </th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-amber-950/30">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-600">
                    NO MATCHING ISSUES FOUND IN LOCAL STORE
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => (
                  <tr 
                    key={task.id}
                    className="hover:bg-[#181b24] transition-colors group"
                  >
                    <td className="py-2.5 px-4 font-bold text-amber-400">
                      {task.id}
                    </td>

                    <td className="py-2.5 px-3">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        task.priority === 'P0'
                          ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          : task.priority === 'P1'
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          : task.priority === 'P2'
                          ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {task.priority}
                      </span>
                    </td>

                    <td className="py-2.5 px-3">
                      <select
                        value={task.status}
                        onChange={(e) => onMoveTaskStatus(task.id, e.target.value as TaskStatus)}
                        className="bg-[#12141c] text-[11px] text-amber-300 border border-amber-950/60 rounded px-2 py-0.5 outline-none cursor-pointer"
                      >
                        <option value="backlog">Backlog</option>
                        <option value="in_progress">In Progress</option>
                        <option value="review">Review</option>
                        <option value="shipped">Shipped</option>
                      </select>
                    </td>

                    <td className="py-2.5 px-4">
                      <div className="font-sans font-medium text-slate-200 group-hover:text-amber-200">
                        {task.title}
                      </div>
                      {task.labels && task.labels.length > 0 && (
                        <div className="flex gap-1 mt-0.5">
                          {task.labels.map((l, i) => (
                            <span key={i} className="text-[9px] text-amber-400/80">
                              #{l}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    <td className="py-2.5 px-3 text-center text-slate-300">
                      {task.estimate}
                    </td>

                    <td className="py-2.5 px-4 text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold text-black"
                          style={{ backgroundColor: task.assignee?.avatarColor || '#f59e0b' }}
                        >
                          {task.assignee?.name?.charAt(0) || 'U'}
                        </div>
                        <span>{task.assignee?.handle}</span>
                      </div>
                    </td>

                    <td className="py-2.5 px-4 text-slate-500 text-[11px]">
                      {new Date(task.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>

                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onEditTask(task)}
                          className="p-1 rounded bg-[#161822] hover:bg-amber-500/20 text-slate-400 hover:text-amber-300 border border-amber-950/60 cursor-pointer"
                          title="Edit"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => onDeleteTask(task.id)}
                          className="p-1 rounded bg-[#161822] hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-amber-950/60 cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>

          </table>
        </div>
      </div>

    </div>
  );
};
