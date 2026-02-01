'use client';

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ApplicationCreateSchema } from '@corallo/shared';
import type { ApplicationCreateInput } from '@corallo/shared';

import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';

type ApplicationPayload = {
  jobs: { id: string; title: string }[];
  candidates: { id: string; fullName: string }[];
  applications: ApplicationRow[];
};

type ApplicationRow = {
  id: string;
  status: string;
  candidate?: { fullName?: string | null };
  job?: { title?: string | null };
  scores?: { score: number }[];
  explanations?: { reason: string }[];
};

export default function ApplicationsPage() {
  const queryClient = useQueryClient();
  const { data: payload = { jobs: [], candidates: [], applications: [] } } = useQuery<ApplicationPayload>({
    queryKey: ['applications'],
    queryFn: async () => {
      const jobs = await apiFetch<{ id: string; title: string }[]>('/jobs');
      const candidates = await apiFetch<{ id: string; fullName: string }[]>('/candidates');
      const applications = await apiFetch<ApplicationRow[]>('/applications?list=true').catch(() => []);
      return { jobs, candidates, applications };
    },
    refetchInterval: 5000,
  });

  const mutation = useMutation({
    mutationFn: (input: ApplicationCreateInput) =>
      apiFetch('/applications', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['applications'] }),
  });

  const form = useForm<ApplicationCreateInput>({
    resolver: zodResolver(ApplicationCreateSchema),
    defaultValues: { candidateId: '', jobId: '' },
  });

  return (
    <div className="min-h-screen bg-white p-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <h1 className="text-3xl font-semibold">Applications</h1>
        <form
          className="rounded-xl border border-neutral-200 p-6"
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <select className="rounded-md border px-3 py-2" {...form.register('candidateId')}>
              <option value="">Select candidate</option>
              {payload.candidates.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.fullName}
                </option>
              ))}
            </select>
            <select className="rounded-md border px-3 py-2" {...form.register('jobId')}>
              <option value="">Select job</option>
              {payload.jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title}
                </option>
              ))}
            </select>
          </div>
          <Button className="mt-4" type="submit" disabled={mutation.isPending}>
            Create Application
          </Button>
        </form>

        <div className="space-y-3">
          {payload.applications.map((app) => (
            <div key={app.id} className="rounded-lg border border-neutral-200 p-4">
              <Link className="font-semibold" href={`/app/applications/${app.id}`}>
                {app.id}
              </Link>
              <div className="text-sm text-neutral-500">Status: {app.status}</div>
              <div className="text-sm">Candidate: {app.candidate?.fullName}</div>
              <div className="text-sm">Job: {app.job?.title}</div>
              <div className="text-sm">Score: {app.scores?.[0]?.score ?? 'pending'}</div>
              <div className="text-sm">Reason: {app.explanations?.[0]?.reason ?? 'pending'}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
