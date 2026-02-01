import type { ReactNode } from 'react';
import Link from 'next/link';

import { AppHeader } from './app-header';

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/app" className="text-lg font-semibold">
            Corallo Hire
          </Link>
          <AppHeader />
        </div>
      </div>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
