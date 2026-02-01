'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CandidateCreateSchema } from '@corallo/shared';
import type { CandidateCreateInput } from '@corallo/shared';

import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';

type Candidate = {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
};

export default function CandidatesPage() {
  const queryClient = useQueryClient();
  const { data = [] } = useQuery<Candidate[]>({
    queryKey: ['candidates'],
    queryFn: () => apiFetch('/candidates'),
  });

  const mutation = useMutation({
    mutationFn: (input: CandidateCreateInput) =>
      apiFetch('/candidates', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['candidates'] }),
  });

  const form = useForm<CandidateCreateInput>({
    resolver: zodResolver(CandidateCreateSchema),
    defaultValues: { email: '', fullName: '', phone: '' },
  });

  return (
    <div className="min-h-screen bg-white p-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <h1 className="text-3xl font-semibold">Candidates</h1>
        <form
          className="rounded-xl border border-neutral-200 p-6"
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <input className="rounded-md border px-3 py-2" placeholder="Full Name" {...form.register('fullName')} />
            <input className="rounded-md border px-3 py-2" placeholder="Email" {...form.register('email')} />
            <input className="rounded-md border px-3 py-2" placeholder="Phone" {...form.register('phone')} />
          </div>
          <Button className="mt-4" type="submit" disabled={mutation.isPending}>
            Create Candidate
          </Button>
        </form>

        <div className="space-y-3">
          {data.map((candidate) => (
            <div key={candidate.id} className="rounded-lg border border-neutral-200 p-4">
              <div className="font-semibold">{candidate.fullName}</div>
              <div className="text-sm text-neutral-500">{candidate.email}</div>
              <div className="text-sm">{candidate.phone}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
