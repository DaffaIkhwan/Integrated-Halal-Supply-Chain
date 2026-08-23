/**
 * Re-embed script — Fixes the RAG vector search by re-embedding all documents
 * with the SAME model used for search queries (all-MiniLM-L6-v2, 384 dimensions).
 *
 * Background: Documents were originally embedded with OpenAI text-embedding-3-small
 * (1536 dim) but search uses HuggingFace all-MiniLM-L6-v2 (384 dim).
 * This mismatch made vector search completely broken.
 *
 * Usage: npx tsx scripts/reembed-documents.ts
 */

import { pipeline, env } from '@huggingface/transformers';
import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load .env manually if dotenv is not installed
try {
  const envPath = resolve(process.cwd(), '.env');
  const envContent = readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.substring(0, eqIdx).trim();
        let value = trimmed.substring(eqIdx + 1).trim();
        // Remove surrounding quotes
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        if (!process.env[key]) process.env[key] = value;
      }
    }
  }
} catch (e) {
  console.warn('⚠️ Could not load .env file, using existing environment variables');
}

env.allowLocalModels = false;
env.useBrowserCache = false;

const BATCH_SIZE = 10; // Process N chunks at a time
const NEW_DIMENSIONS = 384; // all-MiniLM-L6-v2 output dimensions

async function main() {
  console.log('🔄 Re-embedding documents with all-MiniLM-L6-v2...\n');

  // 1. Initialize the embedding model
  console.log('[1/4] Loading embedding model (Xenova/all-MiniLM-L6-v2)...');
  const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  console.log('✅ Model loaded\n');

  // 2. Connect to database
  console.log('[2/4] Connecting to PostgreSQL...');
  const pool = new Pool();
  const client = await pool.connect();
  console.log('✅ Connected\n');

  try {
    // 3. Check current vector dimensions
    const dimCheck = await client.query(`
      SELECT vector_dims(embedding) as dims 
      FROM oai 
      WHERE embedding IS NOT NULL 
      LIMIT 1
    `);
    if (dimCheck.rows.length > 0) {
      console.log(`Current embedding dimensions: ${dimCheck.rows[0].dims}`);
    }

    // 4. Get total count
    const countResult = await client.query('SELECT COUNT(*) as total FROM oai WHERE chunk IS NOT NULL');
    const total = parseInt(countResult.rows[0].total);
    console.log(`[3/4] Found ${total} chunks to re-embed\n`);

    if (total === 0) {
      console.log('⚠️ No chunks found in database. Nothing to re-embed.');
      return;
    }

    // 5. Check if we need to alter the embedding column dimension
    // Drop the old embedding column and recreate with correct dimensions
    console.log(`[4/4] Processing chunks in batches of ${BATCH_SIZE}...\n`);

    // First, alter the column if needed — pgvector allows re-casting
    try {
      await client.query(`ALTER TABLE oai ALTER COLUMN embedding TYPE vector(${NEW_DIMENSIONS})`);
      console.log(`✅ Altered embedding column to vector(${NEW_DIMENSIONS})\n`);
    } catch (e: any) {
      // If column already has data of different dimensions, we need to set to NULL first
      if (e.message?.includes('dimensions')) {
        console.log('⚠️ Need to clear existing embeddings first (dimension mismatch)...');
        await client.query('UPDATE oai SET embedding = NULL');
        await client.query(`ALTER TABLE oai ALTER COLUMN embedding TYPE vector(${NEW_DIMENSIONS})`);
        console.log(`✅ Cleared old embeddings and altered column to vector(${NEW_DIMENSIONS})\n`);
      } else {
        throw e;
      }
    }

    // 6. Process in batches
    let processed = 0;
    let failed = 0;
    const startTime = Date.now();

    while (processed < total) {
      const batchResult = await client.query(
        'SELECT id, chunk FROM oai WHERE chunk IS NOT NULL ORDER BY id ASC LIMIT $1 OFFSET $2',
        [BATCH_SIZE, processed]
      );

      if (batchResult.rows.length === 0) break;

      const chunks = batchResult.rows.map(r => r.chunk || '');
      
      try {
        // Generate embeddings for this batch
        const output = await extractor(chunks, { pooling: 'mean', normalize: true });
        const embeddings = output.tolist();

        // Update each row
        for (let i = 0; i < batchResult.rows.length; i++) {
          const id = batchResult.rows[i].id;
          const embeddingVector = JSON.stringify(embeddings[i]);
          
          await client.query(
            `UPDATE oai SET embedding = $1::vector, "updatedAt" = NOW() WHERE id = $2`,
            [embeddingVector, id]
          );
        }

        processed += batchResult.rows.length;
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        const pct = ((processed / total) * 100).toFixed(1);
        console.log(`  [${pct}%] ${processed}/${total} chunks re-embedded (${elapsed}s elapsed)`);
      } catch (err: any) {
        console.error(`  ❌ Batch error at offset ${processed}:`, err.message);
        failed += batchResult.rows.length;
        processed += batchResult.rows.length; // Skip failed batch
      }
    }

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n${'='.repeat(50)}`);
    console.log(`✅ Re-embedding complete!`);
    console.log(`   Total: ${processed} chunks`);
    console.log(`   Failed: ${failed} chunks`);
    console.log(`   Time: ${totalTime}s`);
    console.log(`   Model: Xenova/all-MiniLM-L6-v2 (${NEW_DIMENSIONS} dimensions)`);
    console.log(`${'='.repeat(50)}\n`);

    // 7. Verify
    const verifyResult = await client.query(`
      SELECT COUNT(*) as with_embedding 
      FROM oai 
      WHERE embedding IS NOT NULL
    `);
    console.log(`Verification: ${verifyResult.rows[0].with_embedding}/${total} chunks have embeddings`);

    const newDimCheck = await client.query(`
      SELECT vector_dims(embedding) as dims 
      FROM oai 
      WHERE embedding IS NOT NULL 
      LIMIT 1
    `);
    if (newDimCheck.rows.length > 0) {
      console.log(`New embedding dimensions: ${newDimCheck.rows[0].dims}`);
    }

  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
