import crypto from 'node:crypto';

import { prisma } from './client.js';
import { withTenant } from './with-tenant.js';
import { Connection, Client } from '@temporalio/client';

async function main() {
  const tenant = await prisma.tenant.create({
    data: { name: 'Acme Recruiting' },
  });

  const { admin, recruiter, candidate, job, application } = await withTenant(prisma, tenant.id, async (tx) => {
    const admin = await tx.user.create({
      data: { tenantId: tenant.id, email: 'admin@acme.test', role: 'ADMIN' },
    });

    const recruiter = await tx.user.create({
      data: { tenantId: tenant.id, email: 'recruiter@acme.test', role: 'RECRUITER' },
    });

    const candidate = await tx.candidate.create({
      data: {
        tenantId: tenant.id,
        email: 'candidate@acme.test',
        fullName: 'Jamie Candidate',
        phone: '555-0100',
      },
    });

    const job = await tx.job.create({
      data: {
        tenantId: tenant.id,
        title: 'Senior Backend Engineer',
        location: 'Remote',
        description: 'Build scalable systems for hiring workflows.',
        status: 'OPEN',
      },
    });

    const application = await tx.application.create({
      data: {
        tenantId: tenant.id,
        candidateId: candidate.id,
        jobId: job.id,
        status: 'APPLIED',
      },
    });

    await tx.applicationEvent.create({
      data: {
        tenantId: tenant.id,
        applicationId: application.id,
        type: 'APPLIED',
        payloadJson: { source: 'seed' },
      },
    });

    await tx.$executeRaw`
      INSERT INTO "Outbox" ("id", "tenantId", "type", "payloadJson", "idempotencyKey")
      VALUES (
        ${crypto.randomUUID()},
        ${tenant.id},
        'START_SCORE_WORKFLOW',
        ${JSON.stringify({ applicationId: application.id })}::jsonb,
        ${`score-workflow:${application.id}`}
      )
    `;

    return { admin, recruiter, candidate, job, application };
  });

  try {
    const connection = await Connection.connect({
      address: process.env.TEMPORAL_ADDRESS ?? 'localhost:7233',
    });
    const client = new Client({ connection });
    await client.workflow.start('ScoreApplicationWorkflow', {
      taskQueue: 'applications',
      args: [application.id, tenant.id],
      workflowId: `score-application-${application.id}`,
    });
  } catch (error) {
    console.warn('Temporal not available, skipping workflow start');
  }

  return { tenant, admin, recruiter, candidate, job, application };
}

main()
  .then((result) => {
    console.log('Seeded:', {
      tenantId: result.tenant.id,
      applicationId: result.application.id,
    });
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
