import { prisma, withTenant } from '@corallo/db';

export const activities = {
  async parseResume(applicationId: string) {
    return {
      applicationId,
      extractedSkills: ['TypeScript', 'PostgreSQL', 'Recruiting Ops'],
      yearsExperience: 5,
    };
  },
  async matchToJob(applicationId: string) {
    return {
      applicationId,
      score: 82,
      highlights: ['Strong backend experience', 'ATS domain fit'],
    };
  },
  async generateExplanation(applicationId: string) {
    return {
      applicationId,
      reason: 'Strong fit for backend role based on skills and experience.',
      suggestions: ['Schedule technical interview', 'Confirm availability'],
    };
  },
  async persistScore(tenantId: string, applicationId: string, score: number) {
    await withTenant(prisma, tenantId, (tx) =>
      tx.score.create({
        data: {
          tenantId,
          applicationId,
          modelVersion: 'stub-v1',
          score,
        },
      }),
    );
  },
  async persistExplanation(
    tenantId: string,
    applicationId: string,
    reason: string,
    suggestions: string[],
  ) {
    await withTenant(prisma, tenantId, (tx) =>
      tx.explanation.create({
        data: {
          tenantId,
          applicationId,
          reason,
          suggestionsJson: suggestions,
        },
      }),
    );
  },
  async addEvent(tenantId: string, applicationId: string, type: string, payload: any) {
    await withTenant(prisma, tenantId, (tx) =>
      tx.applicationEvent.create({
        data: {
          tenantId,
          applicationId,
          type,
          payloadJson: payload,
        },
      }),
    );
  },
};
