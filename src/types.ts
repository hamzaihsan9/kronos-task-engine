export type TaskStatus = 'backlog' | 'in_progress' | 'review' | 'shipped';

export type TaskPriority = 'P0' | 'P1' | 'P2' | 'P3';

export interface Assignee {
  id: string;
  name: string;
  handle: string;
  role: string;
  avatarColor: string;
}

export interface Task {
  id: string; // e.g. KRN-101
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  labels: string[];
  assignee: Assignee;
  estimate: number; // Story points
  createdAt: number;
  updatedAt: number;
  syncVersion: number;
}

export type MutationType = 
  | 'CREATE_TASK'
  | 'UPDATE_TASK'
  | 'DELETE_TASK'
  | 'MOVE_TASK_STATUS';

export interface QueuedMutation {
  id: string;
  timestamp: number;
  type: MutationType;
  entityId: string;
  payload: any;
  status: 'queued' | 'replaying' | 'synced';
}

export interface CycleStats {
  cycleNumber: number;
  cycleName: string;
  daysRemaining: number;
  totalPoints: number;
  completedPoints: number;
}
