import Dexie, { type Table } from 'dexie';
import type { Task, QueuedMutation, Assignee } from '../types';

export const TEAM_MEMBERS: Assignee[] = [
  { id: 'usr-1', name: 'Hamza Ihsan', handle: '@hihsan', role: 'Staff Systems Eng', avatarColor: '#f59e0b' },
  { id: 'usr-2', name: 'Elena Vance', handle: '@evance', role: 'Distributed DB Lead', avatarColor: '#d97706' },
  { id: 'usr-3', name: 'Marcus Chen', handle: '@mchen', role: 'Kernel & Performance', avatarColor: '#fbbf24' },
  { id: 'usr-4', name: 'Sarah Connor', handle: '@sconnor', role: 'Infra & Security', avatarColor: '#b45309' },
];

export const INITIAL_TASKS: Task[] = [
  {
    id: 'KRN-101',
    title: 'Implement optimistic lock & vector clock reconciliation in Dexie store',
    description: 'Ensure multi-tab mutations do not overwrite concurrent writes when offline network reconnects.',
    status: 'in_progress',
    priority: 'P0',
    labels: ['engine', 'storage', 'distributed'],
    assignee: TEAM_MEMBERS[0],
    estimate: 5,
    createdAt: Date.now() - 3600000 * 24 * 3,
    updatedAt: Date.now() - 3600000 * 4,
    syncVersion: 4,
  },
  {
    id: 'KRN-102',
    title: 'Migrate broadcast channel events to structured binary ArrayBuffer',
    description: 'Compress inter-tab telemetry payloads to reduce serialization overhead during peak bursts.',
    status: 'in_progress',
    priority: 'P1',
    labels: ['perf', 'ipc', 'broadcast'],
    assignee: TEAM_MEMBERS[2],
    estimate: 3,
    createdAt: Date.now() - 3600000 * 24 * 2,
    updatedAt: Date.now() - 3600000 * 6,
    syncVersion: 2,
  },
  {
    id: 'KRN-103',
    title: 'Profile IndexedDB cold-boot latency across 100k issue dataset',
    description: 'Verify index traversal does not cause frame hitching on initial view paint.',
    status: 'backlog',
    priority: 'P1',
    labels: ['benchmarks', 'perf'],
    assignee: TEAM_MEMBERS[1],
    estimate: 5,
    createdAt: Date.now() - 3600000 * 24 * 4,
    updatedAt: Date.now() - 3600000 * 12,
    syncVersion: 1,
  },
  {
    id: 'KRN-104',
    title: 'Build command palette fuzzy finder with zero DOM allocations',
    description: 'Leverage pre-computed Trie index for sub-millisecond keyboard search queries.',
    status: 'review',
    priority: 'P2',
    labels: ['ui', 'keyboard', 'dx'],
    assignee: TEAM_MEMBERS[0],
    estimate: 2,
    createdAt: Date.now() - 3600000 * 24 * 5,
    updatedAt: Date.now() - 3600000 * 2,
    syncVersion: 6,
  },
  {
    id: 'KRN-105',
    title: 'Harden cryptographic signature checks on imported snapshot JSON',
    description: 'Reject tamper-modified state schemas before merging into primary tables.',
    status: 'shipped',
    priority: 'P0',
    labels: ['security', 'integrity'],
    assignee: TEAM_MEMBERS[3],
    estimate: 3,
    createdAt: Date.now() - 3600000 * 24 * 7,
    updatedAt: Date.now() - 3600000 * 18,
    syncVersion: 8,
  },
  {
    id: 'KRN-106',
    title: 'Zero-latency drag-and-drop state reconciliation across columns',
    description: 'Prevent layout thrashing by calculating bounding rect offsets once per interaction cycle.',
    status: 'backlog',
    priority: 'P3',
    labels: ['ui', 'animation'],
    assignee: TEAM_MEMBERS[2],
    estimate: 1,
    createdAt: Date.now() - 3600000 * 24 * 1,
    updatedAt: Date.now() - 3600000 * 1,
    syncVersion: 1,
  },
];

export class KronosDatabase extends Dexie {
  tasks!: Table<Task, string>;
  mutations!: Table<QueuedMutation, string>;

  constructor() {
    super('KronosEngineDB');
    this.version(1).stores({
      tasks: 'id, status, priority, updatedAt',
      mutations: 'id, status, timestamp, entityId',
    });
  }
}

export const db = new KronosDatabase();

// Multi-Tab Synchronization via BroadcastChannel API
export const syncChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('kronos_mesh_sync')
  : null;

/**
 * Initializes the database and seeds realistic data if first run
 */
export async function initializeDatabase(): Promise<void> {
  const count = await db.tasks.count();
  if (count === 0) {
    await db.tasks.bulkAdd(INITIAL_TASKS);
  }
}

/**
 * Optimistic Local-First Mutation Dispatcher
 */
export async function dispatchMutation(
  type: QueuedMutation['type'],
  entityId: string,
  payload: any,
  isOfflineSimulated: boolean = false
): Promise<QueuedMutation> {
  const mutationId = `mut_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const timestamp = Date.now();

  const mutation: QueuedMutation = {
    id: mutationId,
    timestamp,
    type,
    entityId,
    payload,
    status: isOfflineSimulated ? 'queued' : 'synced',
  };

  // 1. Immediately apply mutation optimistically to local IndexedDB
  if (type === 'CREATE_TASK') {
    await db.tasks.put(payload);
  } else if (type === 'UPDATE_TASK' || type === 'MOVE_TASK_STATUS') {
    await db.tasks.update(entityId, {
      ...payload,
      updatedAt: timestamp,
      syncVersion: (payload.syncVersion || 1) + 1,
    });
  } else if (type === 'DELETE_TASK') {
    await db.tasks.delete(entityId);
  }

  // 2. Persist mutation in Outbox queue
  await db.mutations.put(mutation);

  // 3. Broadcast to peer tabs
  if (syncChannel) {
    syncChannel.postMessage({
      type: 'LOCAL_MUTATION_APPLIED',
      mutation,
    });
  }

  return mutation;
}

/**
 * Replays all queued offline mutations once connectivity restores
 */
export async function flushQueuedMutations(): Promise<number> {
  const queued = await db.mutations.where('status').equals('queued').toArray();
  if (queued.length === 0) return 0;

  for (const mut of queued) {
    await db.mutations.update(mut.id, { status: 'synced' });
  }

  if (syncChannel) {
    syncChannel.postMessage({
      type: 'OUTBOX_DRAINED',
      count: queued.length,
    });
  }

  return queued.length;
}
