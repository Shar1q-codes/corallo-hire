import { proxyActivities } from '@temporalio/workflow';

import type { activities } from '../activities/index.js';

type ActivityTypes = typeof activities;

const {
  parseResume,
  matchToJob,
  generateExplanation,
  persistScore,
  persistExplanation,
  addEvent,
} = proxyActivities<ActivityTypes>({
  startToCloseTimeout: '1 minute',
});

export async function ScoreApplicationWorkflow(applicationId: string, tenantId: string) {
  const resume = await parseResume(applicationId);
  const match = await matchToJob(applicationId);
  const explanation = await generateExplanation(applicationId);

  await persistScore(tenantId, applicationId, match.score);
  await addEvent(tenantId, applicationId, 'SCORED', { resume, match });

  await persistExplanation(tenantId, applicationId, explanation.reason, explanation.suggestions);
  await addEvent(tenantId, applicationId, 'EXPLANATION_READY', { explanation });

  return { score: match.score };
}
