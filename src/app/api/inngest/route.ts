import { serve } from 'inngest/next';
import { inngest } from '@/inngest/client';
import { embedText } from '@/inngest/functions/embedding';
import { retrieveSimilar } from '@/inngest/functions/retrieval';

export const dynamic = 'force-dynamic';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [embedText, retrieveSimilar],
});
