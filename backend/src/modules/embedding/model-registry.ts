/**
 * Model Registry for Domain-Specific Semantic Search
 *
 * Defines available embedding models for different scientific domains.
 * Each model is optimized for specific subject areas to improve search precision.
 */

export type ModelDomain = 'general' | 'biomed' | 'legal' | 'physics';

export interface EmbeddingModel {
  /** Unique identifier for the model */
  id: ModelDomain;

  /** Display name for UI */
  displayName: string;

  /** Model name/path for loading */
  modelName: string;

  /** Embedding vector dimension */
  dimension: number;

  /** Provider (HuggingFace, OpenAI, etc.) */
  provider: 'HuggingFace' | 'OpenAI' | 'Custom';

  /** Description of the model's specialization */
  description: string;

  /** Database column name for storing embeddings */
  columnName: string;

  /** Whether the model is currently active/available */
  active: boolean;
}

export const MODEL_REGISTRY: Record<ModelDomain, EmbeddingModel> = {
  general: {
    id: 'general',
    displayName: 'General',
    modelName: 'Xenova/all-MiniLM-L6-v2',
    dimension: 384,
    provider: 'HuggingFace',
    description: 'General-purpose model for broad scientific content',
    columnName: 'embedding',
    active: true,
  },

  biomed: {
    id: 'biomed',
    displayName: 'Biomedical',
    modelName: 'Xenova/BiomedNLP-PubMedBERT-base-uncased-abstract',
    dimension: 768,
    provider: 'HuggingFace',
    description: 'Specialized for biomedical and life sciences research',
    columnName: 'embedding_biomed',
    active: true,
  },

  legal: {
    id: 'legal',
    displayName: 'Legal',
    modelName: 'Xenova/legal-bert-base-uncased',
    dimension: 768,
    provider: 'HuggingFace',
    description: 'Optimized for legal and policy documents',
    columnName: 'embedding_legal',
    active: true,
  },

  physics: {
    id: 'physics',
    displayName: 'Physics',
    modelName: 'Xenova/scibert_scivocab_uncased',
    dimension: 768,
    provider: 'HuggingFace',
    description: 'Specialized for physics and physical sciences',
    columnName: 'embedding_physics',
    active: true,
  },
};

/**
 * Get model configuration by domain
 */
export function getModel(domain: ModelDomain): EmbeddingModel {
  const model = MODEL_REGISTRY[domain];
  if (!model) {
    throw new Error(`Model not found for domain: ${domain}`);
  }
  if (!model.active) {
    throw new Error(`Model not active for domain: ${domain}`);
  }
  return model;
}

/**
 * Get all active models
 */
export function getActiveModels(): EmbeddingModel[] {
  return Object.values(MODEL_REGISTRY).filter((model) => model.active);
}

/**
 * Get default model
 */
export function getDefaultModel(): EmbeddingModel {
  return MODEL_REGISTRY.general;
}

/**
 * Validate model domain
 */
export function isValidModelDomain(domain: string): domain is ModelDomain {
  return domain in MODEL_REGISTRY;
}
