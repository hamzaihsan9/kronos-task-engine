import React, { useState, useEffect } from 'react';
import { X, Check, Tag, User, AlertCircle, Layers } from 'lucide-react';
import type { Task, TaskStatus, TaskPriority, Assignee } from '../types';
import { TEAM_MEMBERS } from '../db/kronosDb';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskToEdit?: Task | null;
  defaultStatus?: TaskStatus;
  onSave: (taskData: Partial<Task>) => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  taskToEdit,
  defaultStatus = 'backlog',
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>(defaultStatus);
  const [priority, setPriority] = useState<TaskPriority>('P1');
  const [estimate, setEstimate] = useState<number>(3);
  const [labelsInput, setLabelsInput] = useState('engine, perf');
  const [assigneeId, setAssigneeId] = useState(TEAM_MEMBERS[0].id);

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description);
      setStatus(taskToEdit.status);
      setPriority(taskToEdit.priority);
      setEstimate(taskToEdit.estimate);
      setLabelsInput(taskToEdit.labels.join(', '));
      setAssigneeId(taskToEdit.assignee.id);
    } else {
      setTitle('');
      setDescription('');
      setStatus(defaultStatus);
      setPriority('P1');
      setEstimate(3);
      setLabelsInput('frontend, storage');
      setAssigneeId(TEAM_MEMBERS[0].id);
    }
  }, [taskToEdit, defaultStatus, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const selectedAssignee = TEAM_MEMBERS.find((m) => m.id === assigneeId) || TEAM_MEMBERS[0];
    const parsedLabels = labelsInput
      .split(',')
      .map((l) => l.trim().replace(/^#/, ''))
      .filter(Boolean);

    onSave({
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      estimate,
      labels: parsedLabels,
      assignee: selectedAssignee,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-[#11131a] border border-amber-500/40 rounded-2xl shadow-2xl p-5 flex flex-col gap-4 font-mono text-xs">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-amber-950/60">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-bold">
              {taskToEdit ? `EDIT ISSUE [${taskToEdit.id}]` : 'NEW ENGINE ISSUE'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded bg-[#161822] text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          
          {/* Title */}
          <div>
            <label className="text-slate-400 font-semibold mb-1 block">Title</label>
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Optimize memory consumption in outbox queue"
              className="w-full bg-[#161822] border border-amber-950/60 rounded-lg p-2.5 text-slate-100 font-sans text-xs outline-none focus:border-amber-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-slate-400 font-semibold mb-1 block">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Technical specs, reproduction steps, or context..."
              className="w-full bg-[#161822] border border-amber-950/60 rounded-lg p-2.5 text-slate-100 font-sans text-xs outline-none focus:border-amber-500 resize-none"
            />
          </div>

          {/* Status & Priority Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 font-semibold mb-1 block">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full bg-[#161822] border border-amber-950/60 rounded-lg p-2 text-amber-300 outline-none cursor-pointer"
              >
                <option value="backlog">Backlog</option>
                <option value="in_progress">In Progress</option>
                <option value="review">In Review</option>
                <option value="shipped">Shipped</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 font-semibold mb-1 block">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full bg-[#161822] border border-amber-950/60 rounded-lg p-2 text-amber-300 outline-none cursor-pointer"
              >
                <option value="P0">P0 Critical</option>
                <option value="P1">P1 High</option>
                <option value="P2">P2 Medium</option>
                <option value="P3">P3 Low</option>
              </select>
            </div>
          </div>

          {/* Estimate & Assignee Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 font-semibold mb-1 block">Story Points</label>
              <div className="flex gap-1.5">
                {[1, 2, 3, 5, 8].map((pts) => (
                  <button
                    key={pts}
                    type="button"
                    onClick={() => setEstimate(pts)}
                    className={`flex-1 py-1.5 rounded border text-center transition-all cursor-pointer ${
                      estimate === pts
                        ? 'bg-amber-500 text-black font-bold border-amber-400'
                        : 'bg-[#161822] border-amber-950/60 text-slate-400 hover:text-white'
                    }`}
                  >
                    {pts}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-slate-400 font-semibold mb-1 block">Assignee</label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full bg-[#161822] border border-amber-950/60 rounded-lg p-2 text-slate-200 outline-none cursor-pointer"
              >
                {TEAM_MEMBERS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.handle})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Labels */}
          <div>
            <label className="text-slate-400 font-semibold mb-1 block">Labels (comma-separated)</label>
            <input
              type="text"
              value={labelsInput}
              onChange={(e) => setLabelsInput(e.target.value)}
              placeholder="e.g. storage, perf, ipc"
              className="w-full bg-[#161822] border border-amber-950/60 rounded-lg p-2 text-slate-200 text-xs outline-none focus:border-amber-500"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-amber-950/40 mt-1">
            <span className="text-[10px] text-slate-500">
              Instant local mutation with zero lag
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg bg-[#161822] hover:bg-slate-800 text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold shadow-md shadow-amber-500/20 cursor-pointer active:scale-95 transition-all"
              >
                {taskToEdit ? 'Save Changes' : 'Create Issue'}
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
