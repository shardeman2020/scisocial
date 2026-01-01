import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getQueueToken } from '@nestjs/bull';
import { Queue } from 'bull';

async function bootstrap() {
  console.log('🚀 Starting embedding generation script...');

  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    // Get the embedding queue
    const embeddingQueue = app.get<Queue>(getQueueToken('embedding'));

    console.log('📋 Adding embedding generation job to queue...');

    // Add the job to generate all embeddings
    const job = await embeddingQueue.add('generate-all', {}, {
      priority: 1, // High priority
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 60000, // 1 minute
      },
    });

    console.log(`✅ Job added successfully! Job ID: ${job.id}`);
    console.log('⏳ Embedding generation is now running in the background...');
    console.log('\n📊 Monitor progress by checking the backend logs.');
    console.log('   Look for messages like:');
    console.log('   - "Processing generate-all embeddings job..."');
    console.log('   - "Generating embeddings for X posts..."');
    console.log('   - "Completed X post embeddings"');
    console.log('\n💡 The job will process up to 100 records per entity at a time.');
    console.log('   Run this script again if you have more records to process.');

  } catch (error) {
    console.error('❌ Error generating embeddings:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

bootstrap();
