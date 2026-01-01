import { Injectable, OnModuleInit } from '@nestjs/common';
import { pipeline } from '@xenova/transformers';
import {
  ModelDomain,
  getModel,
  getDefaultModel,
  isValidModelDomain,
} from './model-registry';

@Injectable()
export class EmbeddingService implements OnModuleInit {
  private models: Map<ModelDomain, any> = new Map();
  private loadingModels: Map<ModelDomain, Promise<any>> = new Map();

  async onModuleInit() {
    // Load default model on startup
    console.log('Loading default embedding model...');
    try {
      await this.loadModel('general');
      console.log('Default embedding model loaded successfully');
    } catch (error) {
      console.error('Failed to load default embedding model:', error);
      throw error;
    }
  }

  /**
   * Load a specific model (lazy loading)
   */
  private async loadModel(domain: ModelDomain): Promise<any> {
    // Check if model is already loaded
    if (this.models.has(domain)) {
      return this.models.get(domain);
    }

    // Check if model is currently loading (prevent duplicate loading)
    if (this.loadingModels.has(domain)) {
      return this.loadingModels.get(domain);
    }

    // Start loading the model
    const modelConfig = getModel(domain);
    console.log(`Loading ${modelConfig.displayName} model (${modelConfig.modelName})...`);

    const loadPromise = pipeline('feature-extraction', modelConfig.modelName)
      .then((model) => {
        this.models.set(domain, model);
        this.loadingModels.delete(domain);
        console.log(`${modelConfig.displayName} model loaded successfully`);
        return model;
      })
      .catch((error) => {
        this.loadingModels.delete(domain);
        console.error(`Failed to load ${modelConfig.displayName} model:`, error);
        throw error;
      });

    this.loadingModels.set(domain, loadPromise);
    return loadPromise;
  }

  /**
   * Generate embedding using specified model
   */
  async generateEmbedding(
    text: string,
    modelDomain: ModelDomain = 'general',
  ): Promise<number[]> {
    if (!text || text.trim().length === 0) {
      throw new Error('Cannot generate embedding for empty text');
    }

    // Validate model domain
    if (!isValidModelDomain(modelDomain)) {
      console.warn(`Invalid model domain: ${modelDomain}, falling back to general`);
      modelDomain = 'general';
    }

    try {
      // Load model if not already loaded
      const model = await this.loadModel(modelDomain);

      // Generate embedding
      const output = await model(text, {
        pooling: 'mean',
        normalize: true,
      });

      // Convert tensor to array
      const embedding = Array.from(output.data) as number[];

      return embedding;
    } catch (error) {
      console.error(`Error generating embedding with ${modelDomain} model:`, error);

      // Fallback to default model if domain-specific model fails
      if (modelDomain !== 'general') {
        console.log('Falling back to general model...');
        return this.generateEmbedding(text, 'general');
      }

      throw error;
    }
  }

  /**
   * Generate embeddings for multiple texts using specified model
   */
  async generateEmbeddings(
    texts: string[],
    modelDomain: ModelDomain = 'general',
  ): Promise<number[][]> {
    return Promise.all(texts.map((text) => this.generateEmbedding(text, modelDomain)));
  }

  /**
   * Generate embeddings for a single text across all active models
   */
  async generateEmbeddingsAllModels(text: string): Promise<{
    general: number[];
    biomed: number[];
    legal: number[];
    physics: number[];
  }> {
    const [general, biomed, legal, physics] = await Promise.all([
      this.generateEmbedding(text, 'general'),
      this.generateEmbedding(text, 'biomed'),
      this.generateEmbedding(text, 'legal'),
      this.generateEmbedding(text, 'physics'),
    ]);

    return { general, biomed, legal, physics };
  }

  /**
   * Helper method to format embedding for PostgreSQL vector type
   */
  formatEmbeddingForDB(embedding: number[]): string {
    return `[${embedding.join(',')}]`;
  }

  /**
   * Helper method to parse embedding from PostgreSQL vector type
   */
  parseEmbeddingFromDB(embedding: string): number[] {
    return embedding
      .replace('[', '')
      .replace(']', '')
      .split(',')
      .map((v) => parseFloat(v));
  }

  /**
   * Get column name for a specific model domain
   */
  getColumnName(domain: ModelDomain): string {
    const model = getModel(domain);
    return model.columnName;
  }

  /**
   * Check if a model is currently loaded
   */
  isModelLoaded(domain: ModelDomain): boolean {
    return this.models.has(domain);
  }

  /**
   * Get loaded model domains
   */
  getLoadedModels(): ModelDomain[] {
    return Array.from(this.models.keys());
  }
}
