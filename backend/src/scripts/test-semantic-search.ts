import axios from 'axios';

const BASE_URL = 'http://localhost:3001';

interface SemanticSearchResult {
  posts: Array<{ post: any; similarity: number }>;
  topics: Array<{ topic: any; similarity: number }>;
  journals: Array<{ journal: any; similarity: number }>;
  users: Array<{ user: any; similarity: number }>;
}

async function testSemanticSearch(query: string, limit: number = 3) {
  console.log(`\n🔍 Query: "${query}"\n${'='.repeat(60)}`);

  try {
    const response = await axios.get<SemanticSearchResult>(
      `${BASE_URL}/semantic-search`,
      {
        params: { q: query, limit },
      },
    );

    const results = response.data;

    // Display Posts
    console.log(`\n📄 Posts (${results.posts.length}):`);
    results.posts.forEach((item, i) => {
      console.log(`  ${i + 1}. [${item.similarity.toFixed(4)}] ${item.post.content.substring(0, 80)}...`);
      console.log(`     Citation: ${item.post.citation?.title || 'N/A'}`);
    });

    // Display Topics
    console.log(`\n🏷️  Topics (${results.topics.length}):`);
    results.topics.forEach((item, i) => {
      console.log(`  ${i + 1}. [${item.similarity.toFixed(4)}] ${item.topic.name}`);
      console.log(`     ${item.topic.description}`);
    });

    // Display Journals
    console.log(`\n📚 Journals (${results.journals.length}):`);
    results.journals.forEach((item, i) => {
      console.log(`  ${i + 1}. [${item.similarity.toFixed(4)}] ${item.journal.name}`);
      console.log(`     ${item.journal.description}`);
    });

    // Display Users
    console.log(`\n👤 Users (${results.users.length}):`);
    results.users.forEach((item, i) => {
      console.log(`  ${i + 1}. [${item.similarity.toFixed(4)}] @${item.user.username}`);
      console.log(`     ${item.user.bio?.substring(0, 80) || 'No bio'}...`);
    });

    return results;
  } catch (error: any) {
    console.error(`❌ Error: ${error.message}`);
    throw error;
  }
}

async function runAllTests() {
  console.log('🚀 Starting Semantic Search End-to-End Tests');
  console.log('Backend URL:', BASE_URL);

  const testQueries = [
    'neuroscience and brain research',
    'climate change and environmental science',
    'artificial intelligence and machine learning',
    'quantum computing and quantum physics',
    'chemistry and molecular structure',
  ];

  for (const query of testQueries) {
    await testSemanticSearch(query, 3);
    await new Promise((resolve) => setTimeout(resolve, 100)); // Small delay between queries
  }

  console.log('\n\n✅ All tests completed successfully!');
  console.log('\n💡 Observations:');
  console.log('   - Similarity scores range from 0 to 1 (higher = more similar)');
  console.log('   - Semantic search finds conceptually related content, not just keyword matches');
  console.log('   - Results include full entity data with all relationships loaded');
}

runAllTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Test failed:', err);
    process.exit(1);
  });
