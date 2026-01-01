import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';

async function testEmbeddingGeneration() {
  console.log('🧪 Testing embedding generation for new records...\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  try {
    // Create a test topic without embedding
    const result = await dataSource.query(`
      INSERT INTO topics (id, name, slug, description, "followerCount", "postCount", embedding)
      VALUES (
        gen_random_uuid(),
        'Test Embedding Topic',
        'test-embedding-topic-' || floor(random() * 1000000),
        'This is a test topic to verify automatic embedding generation',
        0,
        0,
        NULL
      )
      RETURNING id, name, embedding;
    `);

    const testTopicId = result[0].id;
    console.log('✅ Created test topic:', testTopicId);
    console.log('   Name:', result[0].name);
    console.log('   Embedding status:', result[0].embedding ? 'HAS EMBEDDING' : 'NULL (expected)\n');

    console.log('📋 This record will be processed by the scheduler within the next hour.');
    console.log('   Or run manually: npm run generate:embeddings\n');

    console.log('🔍 To check if embedding was generated later:');
    console.log(`   psql -d sci_social -c "SELECT name, CASE WHEN embedding IS NULL THEN 'NULL' ELSE 'GENERATED' END as status FROM topics WHERE id = '${testTopicId}';"\n`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await app.close();
  }
}

testEmbeddingGeneration();
