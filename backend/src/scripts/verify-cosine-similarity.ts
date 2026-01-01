import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { EmbeddingService } from '../modules/embedding/embedding.service';

// Manual cosine similarity calculation
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  // Cosine similarity is dot product divided by product of norms
  return dotProduct / (normA * normB);
}

function cosineDistance(a: number[], b: number[]): number {
  // Cosine distance = 1 - cosine similarity
  return 1 - cosineSimilarity(a, b);
}

async function verifyCosineSimilarity() {
  console.log('🔬 Verifying Cosine Similarity Calculations\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  const embeddingService = app.get(EmbeddingService);

  try {
    // Test query
    const query = 'neuroscience research';
    console.log(`Query: "${query}"\n`);

    // Generate query embedding
    const queryEmbedding = await embeddingService.generateEmbedding(query);
    const queryEmbeddingStr = embeddingService.formatEmbeddingForDB(queryEmbedding);

    console.log(`✅ Generated query embedding (${queryEmbedding.length} dimensions)\n`);

    // Get one topic with both pgvector distance AND raw embedding
    const result = await dataSource.query(`
      SELECT
        name,
        description,
        embedding,
        embedding <=> $1::vector as pgvector_distance,
        1 - (embedding <=> $1::vector) as pgvector_similarity
      FROM topics
      WHERE embedding IS NOT NULL
      ORDER BY embedding <=> $1::vector
      LIMIT 1
    `, [queryEmbeddingStr]);

    if (result.length === 0) {
      console.log('❌ No topics with embeddings found');
      return;
    }

    const topic = result[0];
    console.log(`📌 Testing with topic: "${topic.name}"`);
    console.log(`   Description: ${topic.description}\n`);

    // Parse the embedding from DB format
    const topicEmbedding = embeddingService.parseEmbeddingFromDB(topic.embedding);

    // Calculate manually
    const manualSimilarity = cosineSimilarity(queryEmbedding, topicEmbedding);
    const manualDistance = cosineDistance(queryEmbedding, topicEmbedding);

    // Get pgvector values
    const pgvectorDistance = parseFloat(topic.pgvector_distance);
    const pgvectorSimilarity = parseFloat(topic.pgvector_similarity);

    console.log('📊 Comparison Results:');
    console.log('='.repeat(60));
    console.log(`Manual Cosine Similarity:    ${manualSimilarity.toFixed(6)}`);
    console.log(`Manual Cosine Distance:      ${manualDistance.toFixed(6)}`);
    console.log();
    console.log(`pgvector <=> operator:       ${pgvectorDistance.toFixed(6)}`);
    console.log(`pgvector similarity (1-<=>): ${pgvectorSimilarity.toFixed(6)}`);
    console.log('='.repeat(60));

    // Verify they match (allow small floating point differences)
    const distanceDiff = Math.abs(manualDistance - pgvectorDistance);
    const similarityDiff = Math.abs(manualSimilarity - pgvectorSimilarity);

    console.log();
    console.log('🔍 Verification:');
    console.log(`Distance difference:    ${distanceDiff.toExponential(2)}`);
    console.log(`Similarity difference:  ${similarityDiff.toExponential(2)}`);

    const tolerance = 1e-6;
    if (distanceDiff < tolerance && similarityDiff < tolerance) {
      console.log(`\n✅ SUCCESS: Calculations match within tolerance (${tolerance})`);
      console.log('   pgvector <=> operator correctly computes cosine distance');
      console.log('   1 - (embedding <=> query) correctly computes cosine similarity\n');
    } else {
      console.log(`\n⚠️  WARNING: Difference exceeds tolerance (${tolerance})`);
      console.log('   This may indicate a calculation issue\n');
    }

    // Show interpretation
    console.log('📖 Interpretation:');
    console.log(`   Cosine Similarity: ${pgvectorSimilarity.toFixed(4)} (range: -1 to 1, higher = more similar)`);
    console.log(`   Cosine Distance:   ${pgvectorDistance.toFixed(4)} (range: 0 to 2, lower = more similar)`);
    console.log();
    console.log('   For normalized vectors (like ours):');
    console.log('   - Cosine similarity of 1.0 = identical direction');
    console.log('   - Cosine similarity of 0.0 = orthogonal (90 degrees)');
    console.log('   - Cosine similarity of -1.0 = opposite direction');
    console.log();

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await app.close();
  }
}

verifyCosineSimilarity();
