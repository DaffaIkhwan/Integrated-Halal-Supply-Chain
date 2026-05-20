import { PrismaClient } from '@prisma/client';

import { env } from '@/lib/env.mjs';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

let dbUrl = process.env.DATABASE_URL;
if (dbUrl) {
  if (!dbUrl.includes('connection_limit')) {
    dbUrl = dbUrl.includes('?') ? `${dbUrl}&connection_limit=3&pool_timeout=10` : `${dbUrl}?connection_limit=3&pool_timeout=10`;
  }
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log:
      env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn', 'info']
        : ['error'],
    ...(dbUrl ? { datasources: { db: { url: dbUrl } } } : {})
  });

if (env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}
