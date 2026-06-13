import { query } from './pg';
import { pipeline, env } from '@huggingface/transformers';

// Next.js specific configuration to prevent hanging/fetch issues
env.allowLocalModels = false;
env.useBrowserCache = false;

class EmbeddingPipeline {
  static task = 'feature-extraction' as const;
  static model = 'Xenova/all-MiniLM-L6-v2';
  static instance: any = null;

  static async getInstance() {
    if (this.instance === null) {
      console.log('[RAG] Initializing HuggingFace Pipeline...');
      this.instance = await pipeline(this.task, this.model);
      console.log('[RAG] Pipeline initialized successfully');
    }
    return this.instance;
  }
}
import {
  DB_CONFIG,
  ChunkMetadata,
  VectorTableConfig,
  VectorDBConfig,
} from './config';

type ChunkingMethod = 'sentence' | 'paragraph' | 'fixed' | 'semantic';

interface VectorDBConfigType {
  embedding: {
    model: string;
    dimensions: number;
    distance: 'cosine' | 'euclidean' | 'inner_product';
  };
  chunking: {
    defaultMethod: ChunkingMethod;
    fixedSize: number;
    semanticTargetSize: number;
    semanticMaxSize: number;
    semanticMinSize: number;
    semanticOverlap: number;
  };
  search: {
    defaultLimit: number;
    reranking: boolean;
  };
}

export class VectorDB {
  private embeddingModel;
  private tableConfig: VectorTableConfig;
  private config: VectorDBConfigType;

  constructor(tableConfig: VectorTableConfig, config?: VectorDBConfig) {
    this.tableConfig = tableConfig;
    this.config = {
      embedding: {
        ...DB_CONFIG.embedding,
        ...config?.embedding,
      },
      chunking: {
        ...DB_CONFIG.chunking,
        ...config?.chunking,
      },
      search: {
        ...DB_CONFIG.search,
        ...config?.search,
      },
    };
  }
  /**
   *
   * Adds chunks to the database with their embeddings
   */
  async addChunks(chunks: string[], metadata?: Partial<ChunkMetadata>) {
    try {
      const extractor = await EmbeddingPipeline.getInstance();
      const output = await extractor(chunks, { pooling: 'mean', normalize: true });
      const embeddings = output.tolist();

      const baseMetadata: ChunkMetadata = {
        date: new Date().toISOString(),
        embeddingModel: this.config.embedding.model,
        chunkingMethod: this.config.chunking.defaultMethod,
        chunkIndex: 0,
        totalChunks: chunks.length,
        ...metadata,
      };

      for (let i = 0; i < chunks.length; i++) {
        await query(
          `INSERT INTO ${this.tableConfig.tableName} (
            "${this.tableConfig.columns.content}", 
            "${this.tableConfig.columns.vector}", 
            "${this.tableConfig.columns.metadata}"
          )
          VALUES ($1, $2::vector, $3)`,
          [
            chunks[i],
            JSON.stringify(embeddings[i]),
            JSON.stringify({ ...baseMetadata, chunkIndex: i }),
          ]
        );
      }

      return { count: chunks.length };
    } catch (error) {
      console.error('Error in addChunks:', error);
      throw error;
    }
  }

  /**
   * Searches for similar chunks using different distance metrics
   */
  async searchSimilar(
    searchQuery: string,
    options?: {
      limit?: number;
      distance?: typeof DB_CONFIG.embedding.distance;
      filter?: Record<string, unknown>;
      select?: string[];
    }
  ) {
    console.log('[RAG] Starting searchSimilar for query:', searchQuery);
    const extractor = await EmbeddingPipeline.getInstance();
    console.log('[RAG] Running extractor on query...');
    const output = await extractor(searchQuery, { pooling: 'mean', normalize: true });
    const embedding = output.tolist()[0];
    console.log('[RAG] Extractor finished. Querying DB...');

    const distanceOp = {
      cosine: '<=>',
      euclidean: '<->',
      inner_product: '<#>',
    }[options?.distance || this.config.embedding.distance];

    const columns = this.tableConfig.columns;
    const selectColumns =
      options?.select?.map((col) => `"${col}"`) ||
      [columns.content, columns.metadata, columns.createdAt]
        .filter(Boolean)
        .map((col) => `"${col}"`);

    let filterClause = '';
    if (options?.filter && columns.metadata) {
      filterClause =
        'WHERE ' +
        Object.entries(options.filter)
          .map(
            ([key, value]) => `"${columns.metadata}"->>'${key}' = '${value}'`
          )
          .join(' AND ');
    }

    const { rows } = await query(
      `SELECT 
        ${selectColumns.join(', ')},
        "${columns.vector}" ${distanceOp} $1::vector AS distance
      FROM "${this.tableConfig.tableName}"
      ${filterClause}
      ORDER BY distance ASC
      LIMIT $2`,
      [
        JSON.stringify(embedding),
        options?.limit || this.config.search.defaultLimit,
      ]
    );

    return rows;
  }

  /**
   * Clean PDF-extracted text by removing noise
   */
  private cleanPdfText(text: string): string {
    return text
      // Remove page numbers like "- 2 -", "- 10 -"
      .replace(/^[\s]*-\s*\d+\s*-[\s]*$/gm, '')
      // Remove pagination marks like "Pasal 2  . . .", "Dengan . . ."
      .replace(/^.*\.\s*\.\s*\.\s*$/gm, '')
      // Remove standalone "SALINAN" headers
      .replace(/^\s*SALINAN\s*$/gm, '')
      // Collapse 3+ consecutive blank lines into 2
      .replace(/\n{3,}/g, '\n\n')
      // Remove leading/trailing whitespace per line
      .replace(/^[ \t]+|[ \t]+$/gm, '')
      // Collapse multiple spaces into one
      .replace(/ {2,}/g, ' ')
      .trim();
  }

  /**
   * Recursive Semantic Chunking — state-of-the-art method
   * Splits text using a hierarchy of semantic separators,
   * then merges small chunks and splits large ones.
   */
  private semanticChunk(text: string, contextHeader?: string): string[] {
    const targetSize = this.config.chunking.semanticTargetSize;
    const maxSize = this.config.chunking.semanticMaxSize;
    const minSize = this.config.chunking.semanticMinSize;
    const overlap = this.config.chunking.semanticOverlap;

    // Clean text first
    const cleanedText = this.cleanPdfText(text);

    // Semantic separator hierarchy (highest to lowest)
    const separators = [
      /\n(?=BAB\s+[IVXLCDM]+)/,         // BAB boundaries
      /\n(?=Bagian\s+\w+)/,              // Bagian boundaries
      /\n(?=Pasal\s+\d+)/,              // Pasal boundaries
      /\n(?=(?:Kriteria|Parameter|Evidence|Risk|Dokumen)\b)/i, // Section headers
      /\n\n+/,                           // Double newlines (paragraph)
      /(?<=\.)\s+(?=[A-Z])/,            // Sentence boundary (period + capital)
      /\n/,                              // Single newline
    ];

    const rawChunks = this.recursiveSplit(cleanedText, separators, 0, maxSize);

    // Merge small chunks
    const merged = this.mergeSmallChunks(rawChunks, minSize, targetSize);

    // Add overlap between chunks
    const withOverlap = this.addOverlap(merged, overlap);

    // Prepend context header if provided
    if (contextHeader) {
      return withOverlap.map((chunk) => `[${contextHeader}]\n${chunk}`);
    }

    return withOverlap;
  }

  /**
   * Recursively split text using separator hierarchy
   */
  private recursiveSplit(
    text: string,
    separators: RegExp[],
    level: number,
    maxSize: number,
  ): string[] {
    if (text.length <= maxSize || level >= separators.length) {
      return text.trim() ? [text.trim()] : [];
    }

    const separator = separators[level];
    const parts = text.split(separator).filter((p) => p.trim());

    const result: string[] = [];
    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed) continue;

      if (trimmed.length <= maxSize) {
        result.push(trimmed);
      } else {
        // Try next separator level
        result.push(...this.recursiveSplit(trimmed, separators, level + 1, maxSize));
      }
    }

    return result;
  }

  /**
   * Merge chunks that are too small into their neighbors
   */
  private mergeSmallChunks(
    chunks: string[],
    minSize: number,
    targetSize: number,
  ): string[] {
    if (chunks.length === 0) return [];

    const result: string[] = [];
    let buffer = chunks[0];

    for (let i = 1; i < chunks.length; i++) {
      const combined = `${buffer}\n\n${chunks[i]}`;

      if (buffer.length < minSize && combined.length <= targetSize) {
        // Current buffer is too small, merge with next
        buffer = combined;
      } else if (chunks[i].length < minSize && combined.length <= targetSize) {
        // Next chunk is too small, merge into current
        buffer = combined;
      } else {
        result.push(buffer);
        buffer = chunks[i];
      }
    }

    if (buffer.trim()) result.push(buffer);
    return result;
  }

  /**
   * Add overlap between consecutive chunks for context continuity
   */
  private addOverlap(chunks: string[], overlapSize: number): string[] {
    if (chunks.length <= 1 || overlapSize <= 0) return chunks;

    const result: string[] = [chunks[0]];

    for (let i = 1; i < chunks.length; i++) {
      const prevChunk = chunks[i - 1];
      // Take last N characters from previous chunk as context prefix
      const overlapText = prevChunk.length > overlapSize
        ? '...' + prevChunk.slice(-overlapSize).trim()
        : prevChunk;

      result.push(`${overlapText}\n\n${chunks[i]}`);
    }

    return result;
  }

  /**
   * Utility function to chunk text
   */
  chunkText(
    text: string,
    method = this.config.chunking.defaultMethod,
    contextHeader?: string,
  ): string[] {
    switch (method) {
      case 'semantic':
        return this.semanticChunk(text, contextHeader);
      case 'sentence':
        return text
          .trim()
          .split('.')
          .filter(Boolean)
          .map((s) => s.trim());
      case 'paragraph':
        return text
          .trim()
          .split('\n\n')
          .filter(Boolean)
          .map((p) => p.trim());
      case 'fixed':
        const chunks: string[] = [];
        const words = text.split(' ');
        let currentChunk = '';

        for (const word of words) {
          if (
            currentChunk.length + word.length >
            this.config.chunking.fixedSize
          ) {
            chunks.push(currentChunk.trim());
            currentChunk = word;
          } else {
            currentChunk += ' ' + word;
          }
        }
        if (currentChunk) chunks.push(currentChunk.trim());
        return chunks;
    }
    return [];
  }

  /**
   * Adds text by first chunking it
   */
  async addText(
    text: string,
    options?: {
      chunkingMethod?: ChunkingMethod;
      metadata?: Partial<ChunkMetadata>;
    }
  ) {
    const chunks = this.chunkText(text, options?.chunkingMethod);
    return this.addChunks(chunks, {
      ...options?.metadata,
      sourceText: text.slice(0, 100) + '...',
      chunkingMethod:
        options?.chunkingMethod || this.config.chunking.defaultMethod,
    });
  }

  async select(
    options: {
      limit?: number;
      filter?: Record<string, unknown>;
      orderBy?: string;
      order?: 'ASC' | 'DESC';
    } = {}
  ) {
    const limit = options.limit || 10;
    const orderBy = options.orderBy
      ? `ORDER BY ${options.orderBy} ${options.order || 'ASC'}`
      : '';

    const { rows } = await query(
      `SELECT ${Object.values(this.tableConfig.columns)
        .filter(Boolean)
        .map((col) => `"${col}"`)
        .join(', ')}
      FROM "${this.tableConfig.tableName}"
      ${orderBy}
      LIMIT $1`,
      [limit]
    );

    return rows;
  }
}

// Example instances for different tables
export const oaiVectorDB = new VectorDB({
  tableName: 'oai',
  columns: {
    id: 'id',
    vector: 'embedding',
    content: 'chunk',
    metadata: 'metadata',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  },
});

export const itemsVectorDB = new VectorDB({
  tableName: 'items',
  columns: {
    id: 'id',
    vector: 'embedding',
  },
});
