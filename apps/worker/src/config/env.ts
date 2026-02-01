export type WorkerEnv = {
  temporalAddress: string;
  taskQueue: string;
  dispatchIntervalMs: number;
};

let cached: WorkerEnv | null = null;

export function getEnv(force = false): WorkerEnv {
  if (cached && !force) {
    return cached;
  }

  const temporalAddress = process.env.TEMPORAL_ADDRESS ?? 'localhost:7233';
  const taskQueue = process.env.TEMPORAL_TASK_QUEUE ?? 'applications';
  const dispatchIntervalMs = process.env.OUTBOX_DISPATCH_INTERVAL_MS
    ? Number(process.env.OUTBOX_DISPATCH_INTERVAL_MS)
    : 5000;

  if (Number.isNaN(dispatchIntervalMs) || dispatchIntervalMs <= 0) {
    throw new Error('OUTBOX_DISPATCH_INTERVAL_MS must be a positive number');
  }

  cached = { temporalAddress, taskQueue, dispatchIntervalMs };
  return cached;
}

export function validateEnv() {
  getEnv(true);
}
