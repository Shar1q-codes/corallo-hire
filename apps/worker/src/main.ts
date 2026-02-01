import 'dotenv/config';
import 'reflect-metadata';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { Client, Connection } from '@temporalio/client';
import { Worker } from '@temporalio/worker';
import { prisma } from '@corallo/db';

import { activities } from './activities/index.js';
import { dispatchOutboxOnce } from './outbox/dispatcher.js';
import { initTelemetry } from './telemetry.js';
import { getEnv, validateEnv } from './config/env.js';

initTelemetry('corallo-worker');

async function run() {
  validateEnv();
  const env = getEnv();
  const __dirname = dirname(fileURLToPath(import.meta.url));
  let worker: Worker | undefined;
  let attempt = 0;

  while (!worker) {
    attempt += 1;
    try {
      worker = await Worker.create({
        workflowsPath: join(__dirname, 'workflows'),
        activities,
        taskQueue: env.taskQueue,
      });
    } catch (error) {
      const delayMs = Math.min(5000, attempt * 1000);
      console.warn(`[worker] Temporal not ready, retrying in ${delayMs}ms`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  const connection = await Connection.connect({ address: env.temporalAddress });
  const temporalClient = new Client({ connection });

  const dispatchTimer = setInterval(async () => {
    try {
      const dispatched = await dispatchOutboxOnce({
        prisma,
        temporalClient,
        taskQueue: env.taskQueue,
      });
      if (dispatched > 0) {
        console.log(`[worker] dispatched ${dispatched} outbox item(s)`);
      }
    } catch (error) {
      console.warn('[worker] outbox dispatcher error', error);
    }
  }, env.dispatchIntervalMs);

  setInterval(() => {
    console.log('[worker] heartbeat', new Date().toISOString());
  }, 30000);

  await worker.run();
  clearInterval(dispatchTimer);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
