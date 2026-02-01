import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-12">
        <header className="flex items-center justify-between">
          <span className="text-lg font-semibold tracking-tight">Corallo Hire</span>
          <div className="flex items-center gap-4 text-sm text-slate-200">
            <Link href="#features">Features</Link>
            <Link href="#security">Security</Link>
            <Link href="#pricing">Pricing</Link>
            <Link
              href="/login"
              className="rounded-full border border-white/40 px-4 py-2 text-white hover:bg-white/10"
            >
              Sign in
            </Link>
          </div>
        </header>

        <main className="flex flex-1 flex-col justify-center gap-12">
          <div className="max-w-2xl space-y-6">
            <p className="text-sm uppercase tracking-[0.3em] text-orange-300">Modern ATS MVP</p>
            <h1 className="text-4xl font-semibold leading-tight md:text-6xl">
              Hire faster with a workflow-first ATS built for scale.
            </h1>
            <p className="text-base text-slate-200 md:text-lg">
              Corallo Hire keeps candidates, jobs, and applications in one secure workspace with auditable
              events, automated scoring, and multi-tenant isolation.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/login"
                className="rounded-full bg-orange-400 px-6 py-3 text-sm font-semibold text-slate-900"
              >
                Sign in
              </Link>
              <Link
                href="/login"
                className="rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white"
              >
                View workspace
              </Link>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3" id="features">
            {[
              { title: 'Talent pipelines', body: 'Track every application with immutable events.' },
              { title: 'Temporal workflows', body: 'Scoring runs reliably with outbox dispatch.' },
              { title: 'Multi-tenant ready', body: 'Row-level security enforces isolation.' },
            ].map((card) => (
              <div key={card.title} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <h3 className="text-lg font-semibold">{card.title}</h3>
                <p className="mt-2 text-sm text-slate-200">{card.body}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-6 md:grid-cols-2" id="security">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h3 className="text-lg font-semibold">Security by default</h3>
              <p className="mt-2 text-sm text-slate-200">
                JWT-based auth with Cognito, tenant claims, and Postgres RLS keep data locked down across
                every request.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6" id="pricing">
              <h3 className="text-lg font-semibold">Pricing</h3>
              <p className="mt-2 text-sm text-slate-200">
                MVP pricing is flexible. Contact sales to structure a plan that fits your hiring velocity.
              </p>
            </div>
          </div>
        </main>

        <footer className="mt-12 flex items-center justify-between text-xs text-slate-400">
          <span>© 2026 Corallo Hire</span>
          <span>Built for production-grade ATS teams.</span>
        </footer>
      </div>
    </div>
  );
}
