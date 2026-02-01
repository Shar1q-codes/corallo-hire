import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50 p-10">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="space-y-2">
          <h1 className="text-4xl font-semibold">Corallo Hire</h1>
          <p className="text-neutral-600">ATS app dashboard — manage jobs, candidates, and applications.</p>
        </header>

        <div className="grid gap-4 sm:grid-cols-3">
          <Link className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm" href="/app/jobs">
            <h3 className="text-lg font-semibold">Jobs</h3>
            <p className="text-sm text-neutral-500">Create and search roles.</p>
          </Link>
          <Link className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm" href="/app/candidates">
            <h3 className="text-lg font-semibold">Candidates</h3>
            <p className="text-sm text-neutral-500">Manage candidate records.</p>
          </Link>
          <Link
            className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm"
            href="/app/applications"
          >
            <h3 className="text-lg font-semibold">Applications</h3>
            <p className="text-sm text-neutral-500">Track pipeline status.</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
