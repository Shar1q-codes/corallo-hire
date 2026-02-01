import { z } from 'zod';

import { APPLICATION_STATUSES, JOB_STATUSES, USER_ROLES } from './constants.js';

export const TenantCreateSchema = z.object({
  name: z.string().min(2),
});

export const JobCreateSchema = z.object({
  title: z.string().min(2),
  location: z.string().optional(),
  description: z.string().min(4),
  status: z.enum(JOB_STATUSES).optional(),
});

export const JobUpdateSchema = JobCreateSchema.partial();

export const CandidateCreateSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2),
  phone: z.string().optional(),
});

export const CandidateSelfUpdateSchema = z.object({
  fullName: z.string().min(2).optional(),
  phone: z.string().optional(),
});

export const ApplicationCreateSchema = z.object({
  candidateId: z.string().uuid(),
  jobId: z.string().uuid(),
});

export const StatusUpdateSchema = z.object({
  status: z.enum(APPLICATION_STATUSES),
  reason: z.string().optional(),
});

export type TenantCreateInput = z.infer<typeof TenantCreateSchema>;
export type JobCreateInput = z.infer<typeof JobCreateSchema>;
export type JobUpdateInput = z.infer<typeof JobUpdateSchema>;
export type CandidateCreateInput = z.infer<typeof CandidateCreateSchema>;
export type CandidateSelfUpdateInput = z.infer<typeof CandidateSelfUpdateSchema>;
export type ApplicationCreateInput = z.infer<typeof ApplicationCreateSchema>;
export type StatusUpdateInput = z.infer<typeof StatusUpdateSchema>;
export type UserRole = (typeof USER_ROLES)[number];
export type JobStatus = (typeof JOB_STATUSES)[number];
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];
