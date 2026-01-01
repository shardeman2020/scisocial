#!/usr/bin/env ts-node

/**
 * Semantic/Hybrid Search Performance Benchmark
 *
 * Measures query latency for vector similarity search with pgvector + HNSW indexes.
 *
 * Usage:
 *   npm run benchmark:search
 *
 * Expected Performance Targets:
 *   - Current dataset (~100 records): < 10ms per query
 *   - Medium dataset (10k records): < 30ms per query
 *   - Large dataset (100k records): < 50ms per query
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { SemanticSearchService } from '../modules/semantic-search/semantic-search.service';
import { DataSource } from 'typeorm';

interface BenchmarkResult {
  query: string;
  mode: 'semantic' | 'hybrid';
  executionTime: number;
  totalResults: number;
  postsCount: number;
  topicsCount: number;
  journalsCount: number;
  usersCount: number;
}

async function benchmark() {
  console.log('======================================');
  console.log('Semantic/Hybrid Search Benchmark');
  console.log('======================================\n');

  // Bootstrap NestJS application
  const app = await NestFactory.createApplicationContext(AppModule);
  const searchService = app.get(SemanticSearchService);
  const dataSource = app.get(DataSource);

  // Get current dataset size
  const counts = await dataSource.query(`
    SELECT
      (SELECT COUNT(*) FROM posts) as posts,
      (SELECT COUNT(*) FROM topics) as topics,
      (SELECT COUNT(*) FROM journals) as journals,
      (SELECT COUNT(*) FROM users) as users
  `);

  console.log('Dataset Size:');
  console.log(`  Posts:    ${counts[0].posts}`);
  console.log(`  Topics:   ${counts[0].topics}`);
  console.log(`  Journals: ${counts[0].journals}`);
  console.log(`  Users:    ${counts[0].users}`);
  console.log(`  Total:    ${parseInt(counts[0].posts) + parseInt(counts[0].topics) + parseInt(counts[0].journals) + parseInt(counts[0].users)}\n`);

  // Test queries representing different search patterns
  const testQueries = [
    'machine learning',
    'neuroscience',
    'climate change',
    'quantum computing',
    'gene therapy',
  ];

  const results: BenchmarkResult[] = [];

  console.log('Running Benchmarks...\n');

  // Test Semantic Search
  console.log('=== SEMANTIC SEARCH ===\n');
  for (const query of testQueries) {
    const start = performance.now();
    const searchResults = await searchService.search(query);
    const end = performance.now();

    const totalResults =
      searchResults.posts.length +
      searchResults.topics.length +
      searchResults.journals.length +
      searchResults.users.length;

    const result: BenchmarkResult = {
      query,
      mode: 'semantic',
      executionTime: end - start,
      totalResults,
      postsCount: searchResults.posts.length,
      topicsCount: searchResults.topics.length,
      journalsCount: searchResults.journals.length,
      usersCount: searchResults.users.length,
    };

    results.push(result);

    console.log(`Query: "${query}"`);
    console.log(`  Time: ${result.executionTime.toFixed(2)}ms`);
    console.log(`  Results: ${result.totalResults} (${result.postsCount}p, ${result.topicsCount}t, ${result.journalsCount}j, ${result.usersCount}u)`);
    console.log();
  }

  // Test Hybrid Search
  console.log('=== HYBRID SEARCH (70/30) ===\n');
  for (const query of testQueries) {
    const start = performance.now();
    const searchResults = await searchService.search(query, undefined, 0.0, {
      enabled: true,
      semanticWeight: 0.7,
      keywordWeight: 0.3,
    });
    const end = performance.now();

    const totalResults =
      searchResults.posts.length +
      searchResults.topics.length +
      searchResults.journals.length +
      searchResults.users.length;

    const result: BenchmarkResult = {
      query,
      mode: 'hybrid',
      executionTime: end - start,
      totalResults,
      postsCount: searchResults.posts.length,
      topicsCount: searchResults.topics.length,
      journalsCount: searchResults.journals.length,
      usersCount: searchResults.users.length,
    };

    results.push(result);

    console.log(`Query: "${query}"`);
    console.log(`  Time: ${result.executionTime.toFixed(2)}ms`);
    console.log(`  Results: ${result.totalResults} (${result.postsCount}p, ${result.topicsCount}t, ${result.journalsCount}j, ${result.usersCount}u)`);
    console.log();
  }

  // Calculate statistics
  const semanticResults = results.filter((r) => r.mode === 'semantic');
  const hybridResults = results.filter((r) => r.mode === 'hybrid');

  const avgSemantic =
    semanticResults.reduce((sum, r) => sum + r.executionTime, 0) / semanticResults.length;
  const avgHybrid =
    hybridResults.reduce((sum, r) => sum + r.executionTime, 0) / hybridResults.length;

  const minSemantic = Math.min(...semanticResults.map((r) => r.executionTime));
  const maxSemantic = Math.max(...semanticResults.map((r) => r.executionTime));
  const minHybrid = Math.min(...hybridResults.map((r) => r.executionTime));
  const maxHybrid = Math.max(...hybridResults.map((r) => r.executionTime));

  console.log('======================================');
  console.log('Performance Summary');
  console.log('======================================\n');

  console.log('Semantic Search:');
  console.log(`  Average: ${avgSemantic.toFixed(2)}ms`);
  console.log(`  Min:     ${minSemantic.toFixed(2)}ms`);
  console.log(`  Max:     ${maxSemantic.toFixed(2)}ms\n`);

  console.log('Hybrid Search (70/30):');
  console.log(`  Average: ${avgHybrid.toFixed(2)}ms`);
  console.log(`  Min:     ${minHybrid.toFixed(2)}ms`);
  console.log(`  Max:     ${maxHybrid.toFixed(2)}ms\n`);

  console.log('Overhead:');
  console.log(`  Hybrid vs Semantic: +${((avgHybrid / avgSemantic - 1) * 100).toFixed(1)}%\n`);

  // Check if HNSW indexes are being used
  console.log('======================================');
  console.log('Index Usage Verification');
  console.log('======================================\n');

  const explainResult = await dataSource.query(`
    EXPLAIN (FORMAT JSON, ANALYZE)
    SELECT
      id,
      content,
      1 - (embedding <=> '[${Array(384).fill(0).join(',')}]') as similarity
    FROM posts
    WHERE embedding IS NOT NULL
    ORDER BY embedding <=> '[${Array(384).fill(0).join(',')}]'
    LIMIT 10
  `);

  const plan = explainResult[0]['QUERY PLAN'][0]['Plan'];
  const indexName = plan['Index Name'];
  const scanType = plan['Node Type'];

  if (indexName && indexName.includes('hnsw')) {
    console.log(`✅ HNSW Index detected: ${indexName}`);
    console.log(`   Scan Type: ${scanType}`);
    console.log(`   Execution Time: ${explainResult[0]['QUERY PLAN'][0]['Execution Time'].toFixed(2)}ms\n`);
  } else {
    console.log('⚠️  HNSW Index not being used!');
    console.log(`   Current scan: ${scanType}`);
    console.log('   Consider running: CREATE INDEX idx_posts_embedding_hnsw ON posts USING hnsw (embedding vector_cosine_ops);\n');
  }

  // Performance assessment
  console.log('======================================');
  console.log('Performance Assessment');
  console.log('======================================\n');

  const target = 50; // Target: <50ms for 100k records
  const currentAvg = (avgSemantic + avgHybrid) / 2;

  if (currentAvg < 10) {
    console.log(`✅ EXCELLENT: Average ${currentAvg.toFixed(2)}ms (well below 50ms target)`);
  } else if (currentAvg < 30) {
    console.log(`✅ GOOD: Average ${currentAvg.toFixed(2)}ms (below 50ms target)`);
  } else if (currentAvg < 50) {
    console.log(`✅ ACCEPTABLE: Average ${currentAvg.toFixed(2)}ms (meets 50ms target)`);
  } else {
    console.log(`⚠️  SLOW: Average ${currentAvg.toFixed(2)}ms (exceeds 50ms target)`);
    console.log('   Consider optimizing:');
    console.log('   - Verify HNSW indexes are created');
    console.log('   - Tune HNSW parameters (m, ef_construction)');
    console.log('   - Check database server resources');
  }

  console.log();

  await app.close();
}

benchmark()
  .then(() => {
    console.log('Benchmark completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Benchmark failed:', error);
    process.exit(1);
  });
