'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { JobCreateSchema } from '@corallo/shared';
import type { JobCreateInput } from '@corallo/shared';

import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';

type Job = {
  id: string;
  title: string;
  description: string;
  location?: string | null;
};

export default function JobsPage() {
  const queryClient = useQueryClient();
  const { data = [] } = useQuery<Job[]>({
    queryKey: ['jobs'],
    queryFn: () => apiFetch('/jobs'),
  });

  const mutation = useMutation({
    mutationFn: (input: JobCreateInput) =>
      apiFetch('/jobs', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['jobs'] }),
  });

  const form = useForm<JobCreateInput>({
    resolver: zodResolver(JobCreateSchema),
    defaultValues: { title: '', description: '', location: '' },
  });

  return (
    <div className="min-h-screen bg-white p-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <h1 className="text-3xl font-semibold">Jobs</h1>
        <form
          className="rounded-xl border border-neutral-200 p-6"
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <input className="rounded-md border px-3 py-2" placeholder="Title" {...form.register('title')} />
            <input
              className="rounded-md border px-3 py-2"
              placeholder="Location"
              {...form.register('location')}
            />
            <input
              className="rounded-md border px-3 py-2"
              placeholder="Description"
              {...form.register('description')}
            />
          </div>
          <Button className="mt-4" type="submit" disabled={mutation.isPending}>
            Create Job
          </Button>
        </form>

        <div className="space-y-3">
          {data.map((job) => (
            <div key={job.id} className="rounded-lg border border-neutral-200 p-4">
              <div className="font-semibold">{job.title}</div>
              <div className="text-sm text-neutral-500">{job.location}</div>
              <p className="text-sm">{job.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
