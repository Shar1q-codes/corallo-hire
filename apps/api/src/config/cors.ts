import type { ApiEnv } from './env.js';

type CorsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => void;
  methods: string[];
  allowedHeaders: string[];
  credentials: boolean;
};

export function buildCorsOptions(env: ApiEnv): CorsOptions {
  const allowlist = new Set(env.corsOrigins);

  return {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin) {
        callback(null, true);
        return;
      }
      if (allowlist.has(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('Not allowed by CORS'), false);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type', 'x-request-id'],
    credentials: env.corsAllowCredentials,
  };
}
