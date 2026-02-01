'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';

import { apiFetch } from '@/lib/api';

export default function ApplicationDetailPage() {
  const params = useParams();
  const raw = params.id;
  const applicationId = Array.isArray(raw) ? raw[0] : (raw as string);

  type ApplicationDetail = {
    id: string;
    status: string;
    candidate?: { fullName?: string | null };
    job?: { title?: string | null };
    scores?: { score: number }[];
    explanations?: { reason: string }[];
  };

  const { data } = useQuery<ApplicationDetail>({
    queryKey: ['application', applicationId],
    queryFn: () => apiFetch(`/applications/${applicationId}`),
    enabled: Boolean(applicationId),
  });

  if (!data) {
    return <div className="p-10">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-white p-10">
      <div className="mx-auto max-w-3xl space-y-4">
        <h1 className="text-3xl font-semibold">Application Detail</h1>
        <div className="rounded-lg border border-neutral-200 p-4">
          <div className="font-semibold">{data.id}</div>
          <div className="text-sm text-neutral-500">Status: {data.status}</div>
          <div className="text-sm">Candidate: {data.candidate?.fullName}</div>
          <div className="text-sm">Job: {data.job?.title}</div>
          <div className="text-sm">Score: {data.scores?.[0]?.score ?? 'pending'}</div>
          <div className="text-sm">Reason: {data.explanations?.[0]?.reason ?? 'pending'}</div>
        </div>
      </div>
    </div>
  );
}
