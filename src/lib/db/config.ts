export const DB_CONFIG = {
  embedding: {
    model: 'text-embedding-3-small',
    dimensions: 1536,
    distance: 'cosine' as 'cosine' | 'euclidean' | 'inner_product',
  },
  chunking: {
    defaultMethod: 'semantic' as 'sentence' | 'paragraph' | 'fixed' | 'semantic',
    fixedSize: 500,
    semanticTargetSize: 1000,
    semanticMaxSize: 1500,
    semanticMinSize: 200,
    semanticOverlap: 150,
  },
  search: {
    defaultLimit: 5,
    reranking: false,
  },
} as const;

export type VectorTableConfig = {
  tableName: string;
  columns: {
    id: string;
    vector: string;
    content?: string;
    metadata?: string;
    createdAt?: string;
    updatedAt?: string;
  };
};

export type VectorDBConfig = {
  embedding?: {
    model?: string;
    dimensions?: number;
    distance?: typeof DB_CONFIG.embedding.distance;
  };
  chunking?: {
    method?: typeof DB_CONFIG.chunking.defaultMethod;
    fixedSize?: number;
    semanticTargetSize?: number;
    semanticMaxSize?: number;
    semanticMinSize?: number;
    semanticOverlap?: number;
  };
  search?: {
    defaultLimit?: number;
    reranking?: boolean;
  };
};

export type ChunkMetadata = {
  date: string;
  embeddingModel: string;
  chunkingMethod: typeof DB_CONFIG.chunking.defaultMethod;
  sourceText?: string;
  chunkIndex: number;
  totalChunks: number;
  [key: string]: unknown;
};
