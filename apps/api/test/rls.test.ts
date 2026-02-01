import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { prisma, withTenant } from '@corallo/db';

test('RLS blocks cross-tenant reads', async (t) => {
  if (!process.env.DATABASE_URL || process.env.SKIP_DB_TESTS === 'true') {
    t.skip('DATABASE_URL not configured for RLS test');
    return;
  }

  t.after(async () => {
    await prisma.$disconnect();
  });

  const tenantA = await prisma.tenant.create({ data: { name: `Tenant A ${crypto.randomUUID()}` } });
  const tenantB = await prisma.tenant.create({ data: { name: `Tenant B ${crypto.randomUUID()}` } });

  const email = `candidate-${crypto.randomUUID()}@example.test`;

  await withTenant(prisma, tenantA.id, (tx) =>
    tx.candidate.create({
      data: {
        tenantId: tenantA.id,
        email,
        fullName: 'Candidate A',
      },
    }),
  );

  const candidatesB = await withTenant(prisma, tenantB.id, (tx) =>
    tx.candidate.findMany({ where: { email } }),
  );

  assert.equal(candidatesB.length, 0);
});
