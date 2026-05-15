import { serve } from 'inngest/next';
import { inngest } from '@/inngest/client';

export const dynamic = 'force-dynamic';
import { embedText } from '@/inngest/functions/embedding';
import { retrieveSimilar } from '@/inngest/functions/retrieval';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [embedText, retrieveSimilar],
});
