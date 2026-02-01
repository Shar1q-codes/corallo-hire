'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';


type SessionInfo = {
  tenantId?: string;
  role?: string;
  email?: string;
};

export function AppHeader() {
  const [session, setSession] = useState<SessionInfo | null>(null);

  useEffect(() => {
    fetch('/api/session')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setSession(data))
      .catch(() => setSession(null));
  }, []);

  return (
    <div className="flex items-center gap-4 text-sm text-slate-600">
      {session?.email ? (
        <span>{session.email}</span>
      ) : (
        <span>Authenticated</span>
      )}
      {session?.tenantId ? <span className="text-slate-400">Tenant {session.tenantId}</span> : null}
      {session?.role ? <span className="text-slate-400">Role {session.role}</span> : null}
      <Link className="text-slate-900" href="/logout">
        Sign out
      </Link>
    </div>
  );
}
