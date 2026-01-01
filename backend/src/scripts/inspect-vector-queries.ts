import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { EmbeddingService } from '../modules/embedding/embedding.service';

async function inspectVectorQueries() {
  console.log('🔍 Inspecting Vector Database Queries\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  const embeddingService = app.get(EmbeddingService);

  try {
    // Test query
    const query = 'artificial intelligence';
    console.log(`Test Query: "${query}"\n`);

    // Generate embedding
    const queryEmbedding = await embeddingService.generateEmbedding(query);
    const queryEmbeddingStr = embeddingService.formatEmbeddingForDB(queryEmbedding);

    console.log('=' .repeat(80));
    console.log('1. CHECK: Vector indexes exist and are being used');
    console.log('='.repeat(80));

    // Check for vector indexes
    const indexes = await dataSource.query(`
      SELECT
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE indexdef LIKE '%vector%'
      ORDER BY tablename, indexname;
    `);

    if (indexes.length > 0) {
      console.log(`\n✅ Found ${indexes.length} vector indexes:\n`);
      indexes.forEach((idx: any) => {
        console.log(`   Table: ${idx.tablename}`);
        console.log(`   Index: ${idx.indexname}`);
        console.log(`   Definition: ${idx.indexdef}\n`);
      });
    } else {
      console.log('\n⚠️  No vector indexes found!');
      console.log('   Consider adding indexes for better performance:\n');
      console.log('   CREATE INDEX idx_posts_embedding ON posts USING ivfflat (embedding vector_cosine_ops);');
      console.log('   CREATE INDEX idx_topics_embedding ON topics USING ivfflat (embedding vector_cosine_ops);\n');
    }

    console.log('\n' + '='.repeat(80));
    console.log('2. EXPLAIN: Query execution plan for topics');
    console.log('='.repeat(80));

    // Run EXPLAIN ANALYZE on a topics query
    const explainResult = await dataSource.query(`
      EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
      SELECT
        name,
        description,
        1 - (embedding <=> $1::vector) as similarity
      FROM topics
      WHERE embedding IS NOT NULL
      ORDER BY embedding <=> $1::vector
      LIMIT 5;
    `, [queryEmbeddingStr]);

    const plan = explainResult[0]['QUERY PLAN'][0];
    console.log(`\n📊 Execution Time: ${plan['Execution Time'].toFixed(2)} ms`);
    console.log(`📊 Planning Time: ${plan['Planning Time'].toFixed(2)} ms`);
    console.log(`📊 Total Time: ${(plan['Execution Time'] + plan['Planning Time']).toFixed(2)} ms\n`);

    console.log('Query Plan:');
    const mainPlan = plan.Plan;
    console.log(`  Node Type: ${mainPlan['Node Type']}`);
    console.log(`  Startup Cost: ${mainPlan['Startup Cost']}`);
    console.log(`  Total Cost: ${mainPlan['Total Cost']}`);
    console.log(`  Rows: ${mainPlan['Actual Rows']}`);
    if (mainPlan['Index Name']) {
      console.log(`  ✅ Index Used: ${mainPlan['Index Name']}`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('3. PERFORMANCE: Actual query with timing');
    console.log('='.repeat(80));

    const startTime = Date.now();

    const results = await dataSource.query(`
      SELECT
        name,
        description,
        1 - (embedding <=> $1::vector) as similarity
      FROM topics
      WHERE embedding IS NOT NULL
      ORDER BY embedding <=> $1::vector
      LIMIT 5;
    `, [queryEmbeddingStr]);

    const endTime = Date.now();
    const queryTime = endTime - startTime;

    console.log(`\n⏱️  Query Execution Time: ${queryTime} ms\n`);
    console.log('Top 5 Results:');
    results.forEach((row: any, i: number) => {
      console.log(`  ${i + 1}. [${parseFloat(row.similarity).toFixed(4)}] ${row.name}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('4. STATS: Database statistics');
    console.log('='.repeat(80));

    // Check table statistics
    const stats = await dataSource.query(`
      SELECT
        schemaname,
        relname as table_name,
        n_tup_ins as inserts,
        n_tup_upd as updates,
        n_tup_del as deletes,
        n_live_tup as live_rows,
        n_dead_tup as dead_rows,
        last_vacuum,
        last_autovacuum,
        last_analyze,
        last_autoanalyze
      FROM pg_stat_user_tables
      WHERE relname IN ('posts', 'topics', 'journals', 'users')
      ORDER BY relname;
    `);

    console.log('\nTable Statistics:\n');
    stats.forEach((stat: any) => {
      console.log(`📊 ${stat.table_name.toUpperCase()}`);
      console.log(`   Live Rows: ${stat.live_rows}`);
      console.log(`   Dead Rows: ${stat.dead_rows}`);
      console.log(`   Last Analyze: ${stat.last_autoanalyze || stat.last_analyze || 'Never'}`);
      if (stat.dead_rows > stat.live_rows * 0.1) {
        console.log(`   ⚠️  Consider running VACUUM ANALYZE`);
      }
      console.log();
    });

    console.log('='.repeat(80));
    console.log('5. VERIFICATION: Embedding usage confirmation');
    console.log('='.repeat(80));

    // Verify embeddings are populated
    const embeddingStats = await dataSource.query(`
      SELECT
        'posts' as table_name,
        COUNT(*) as total,
        COUNT(embedding) as with_embedding,
        ROUND(100.0 * COUNT(embedding) / COUNT(*), 2) as percentage
      FROM posts
      UNION ALL
      SELECT
        'topics',
        COUNT(*),
        COUNT(embedding),
        ROUND(100.0 * COUNT(embedding) / COUNT(*), 2)
      FROM topics
      UNION ALL
      SELECT
        'journals',
        COUNT(*),
        COUNT(embedding),
        ROUND(100.0 * COUNT(embedding) / COUNT(*), 2)
      FROM journals
      UNION ALL
      SELECT
        'users',
        COUNT(*),
        COUNT(embedding),
        ROUND(100.0 * COUNT(embedding) / COUNT(*), 2)
      FROM users;
    `);

    console.log('\n✅ Embedding Coverage:\n');
    embeddingStats.forEach((stat: any) => {
      const icon = stat.percentage === '100.00' ? '✅' : '⚠️';
      console.log(`   ${icon} ${stat.table_name.padEnd(10)} ${stat.with_embedding}/${stat.total} (${stat.percentage}%)`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('💡 RECOMMENDATIONS');
    console.log('='.repeat(80));

    console.log(`
1. Query Logging:
   - TypeORM logs SQL queries when logging is enabled
   - Check backend console for query logs during development

2. Performance Monitoring:
   - Vector queries under 50ms = Excellent
   - 50-200ms = Good (acceptable for most use cases)
   - Over 200ms = Consider adding indexes

3. Index Recommendations:
   - For datasets with 100+ records, add IVFFlat indexes:
     CREATE INDEX idx_posts_embedding ON posts USING ivfflat (embedding vector_cosine_ops);
   - For smaller datasets (< 100 records), sequential scan is often faster

4. Optimization Tips:
   - Limit results to what you need (LIMIT clause)
   - Use WHERE embedding IS NOT NULL to skip NULL checks
   - Run VACUUM ANALYZE periodically for accurate query plans
   - Monitor query performance with EXPLAIN ANALYZE

5. Production Monitoring:
   - Enable PostgreSQL query logging: log_statement = 'all'
   - Use pg_stat_statements extension for query analytics
   - Monitor slow queries: log_min_duration_statement = 100
`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await app.close();
  }
}

inspectVectorQueries();
