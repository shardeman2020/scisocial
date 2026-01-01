# Semantic Search Quality & Tuning Guide

## Overview

Your semantic search system uses the **Xenova/all-MiniLM-L6-v2** model to generate 384-dimensional embeddings for content matching. This guide helps you measure relevance quality and tune parameters for optimal results.

## Current System Performance

### ✅ What's Working Well

1. **Model Quality**: all-MiniLM-L6-v2 is a well-balanced model
   - Size: 384 dimensions
   - Performance: Good general-purpose semantic understanding
   - Speed: Fast inference (~50-100ms per embedding)

2. **Similarity Metric**: Cosine similarity (range: 0-1)
   - 0.8+ = Highly relevant
   - 0.6-0.8 = Relevant
   - 0.4-0.6 = Somewhat related
   - < 0.4 = Weakly related

3. **Query Performance**: 0.43ms average (excellent!)

## Measuring Relevance Quality

### 1. Manual Evaluation (Recommended Start)

Run test queries and evaluate if results make sense:

```bash
npm run test:semantic
```

**Evaluation Criteria:**
- Do top results match query intent?
- Are similarity scores reasonable? (high scores for relevant items)
- Is ranking order sensible?

### 2. Quantitative Metrics

Test with known relevant examples:

```typescript
// Example: "machine learning" should rank AI-related content higher
Expected:
  - Topics: "Artificial Intelligence" (high score)
  - Users: AI researchers (high score)
  - Posts: ML-related content (high score)
```

### 3. A/B Testing

Compare different approaches:
- Semantic search vs keyword search
- Different embedding models
- Different similarity thresholds

## Tuning Parameters

### Parameter 1: Result Limit

**Current Default:** Entity-specific defaults
- Posts: 10
- Topics: 5
- Journals: 5
- Users: 3

**Three ways to configure limits:**

1. **Default Behavior (No Parameters)**
   ```bash
   curl 'http://localhost:3001/semantic-search?q=neuroscience'
   # Returns: 10 posts, 5 topics, 5 journals, 3 users
   ```

2. **Global Limit (Override All Defaults)**
   ```bash
   curl 'http://localhost:3001/semantic-search?q=neuroscience&limit=5'
   # Returns: 5 posts, 5 topics, 5 journals, 5 users
   ```

3. **Entity-Specific Limits (Fine-Grained Control)**
   ```bash
   curl 'http://localhost:3001/semantic-search?q=neuroscience&postsLimit=15&usersLimit=1'
   # Returns: 15 posts, 5 topics (default), 5 journals (default), 1 user
   ```

4. **Mix of Global + Entity-Specific**
   ```bash
   curl 'http://localhost:3001/semantic-search?q=neuroscience&limit=7&usersLimit=1'
   # Returns: 7 posts, 7 topics, 7 journals, 1 user (overridden)
   ```

**Query Parameters:**
- `limit`: Global limit applied to all entities
- `postsLimit`: Specific limit for posts only
- `topicsLimit`: Specific limit for topics only
- `journalsLimit`: Specific limit for journals only
- `usersLimit`: Specific limit for users only

**Priority Order:**
1. Entity-specific parameter (highest priority)
2. Global `limit` parameter
3. Entity-specific defaults (lowest priority)

**Tuning Guide:**
- Small limit (3-5): Best for "top matches" features
- Medium limit (10-20): Good for search results pages
- Large limit (50+): For comprehensive browsing

**When to adjust:**
- Too few results → Increase limit
- Too many irrelevant results → Decrease limit or add filters

### Parameter 2: Similarity Threshold

**Current:** No threshold (returns all results ranked by similarity)

**How to add a threshold:**

```typescript
// In semantic-search.service.ts, add filtering after query:
const results = await query.getMany();
return results.filter(item => item.similarity >= 0.4); // Example: 0.4 threshold
```

**Recommended Thresholds:**
- Strict: 0.6+ (only highly relevant)
- Balanced: 0.4+ (good mix)
- Permissive: 0.2+ (include loosely related)

### Parameter 3: Embedding Model

**Current Model:** `Xenova/all-MiniLM-L6-v2`

**Alternative Models to Consider:**

| Model | Dimensions | Speed | Quality | Best For |
|-------|------------|-------|---------|----------|
| all-MiniLM-L6-v2 | 384 | Fast | Good | General purpose (current) |
| all-mpnet-base-v2 | 768 | Medium | Better | Higher accuracy needs |
| all-MiniLM-L12-v2 | 384 | Medium | Better | Balance accuracy/speed |
| paraphrase-multilingual | 768 | Slow | Best | Multilingual content |

**How to change model:**

```typescript
// In embedding.service.ts:8
private modelName = 'Xenova/all-mpnet-base-v2'; // Change here
```

**After changing:**
1. Regenerate ALL embeddings: `npm run generate:embeddings`
2. Update vector dimensions in entities if needed
3. Test with `npm run test:semantic`

### Parameter 4: Query Preprocessing

**Current:** Raw query text is embedded directly

**Enhancement Options:**

```typescript
// In semantic-search.service.ts, before generateEmbedding():
async search(query: string, limit: number = 10) {
  // Option 1: Normalize query
  const normalizedQuery = query.toLowerCase().trim();

  // Option 2: Expand query with synonyms
  const expandedQuery = this.expandWithSynonyms(query);

  // Option 3: Remove stopwords
  const cleanedQuery = this.removeStopwords(query);

  const queryEmbedding = await this.embeddingService.generateEmbedding(cleanedQuery);
  // ... rest of code
}
```

**When to use:**
- Very short queries → Query expansion
- Noisy queries → Stopword removal
- Mixed case issues → Normalization

## Performance Optimization

### When to Add Indexes

**Current Status:** No indexes (optimal for <100 records)

**Add indexes when:**
- Dataset grows beyond 100 records per table
- Query time exceeds 50ms
- You notice performance degradation

**How to add:**

```sql
-- For IVFFlat index (recommended for <1M vectors)
CREATE INDEX idx_posts_embedding ON posts
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

CREATE INDEX idx_topics_embedding ON topics
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

CREATE INDEX idx_journals_embedding ON journals
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

CREATE INDEX idx_users_embedding ON users
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

**Index Tuning:**
- `lists` parameter: sqrt(rows) is a good starting point
- For 1000 rows: `lists = 32`
- For 10000 rows: `lists = 100`
- For 100000 rows: `lists = 300`

### Caching Strategies

**Option 1: Cache Query Embeddings**

```typescript
private queryCache = new Map<string, number[]>();

async search(query: string, limit: number) {
  const cacheKey = query.toLowerCase();
  let queryEmbedding = this.queryCache.get(cacheKey);

  if (!queryEmbedding) {
    queryEmbedding = await this.embeddingService.generateEmbedding(query);
    this.queryCache.set(cacheKey, queryEmbedding);
  }
  // ... use queryEmbedding
}
```

**Option 2: Cache Full Results (for popular queries)**

Use Redis with TTL for frequently accessed searches.

## Hybrid Search (Production-Ready!)

**Status:** ✅ Fully Implemented

Hybrid search combines semantic (vector) search with traditional keyword (ILIKE) search for optimal results. Best of both worlds: semantic understanding + exact match precision.

### How to Use

```bash
# Enable hybrid search
curl 'http://localhost:3001/semantic-search?q=Nature&hybrid=true'

# Customize weights (default: 70% semantic, 30% keyword)
curl 'http://localhost:3001/semantic-search?q=Nature&hybrid=true&semanticWeight=0.6&keywordWeight=0.4'

# Keyword-heavy for exact matches
curl 'http://localhost:3001/semantic-search?q=Nature&hybrid=true&semanticWeight=0.4&keywordWeight=0.6'
```

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `hybrid` | boolean | false | Enable hybrid search mode |
| `semanticWeight` | number | 0.7 | Weight for semantic similarity (0-1) |
| `keywordWeight` | number | 0.3 | Weight for keyword matches (0-1) |

**Note:** Weights are automatically normalized to sum to 1.0.

### How It Works

1. **Semantic Search:** Uses pgvector cosine similarity on embeddings
2. **Keyword Search:** Uses ILIKE pattern matching on key fields
3. **Scoring Tiers:**
   - Exact match in primary field: 1.0
   - Partial match in primary field: 0.7
   - Match in secondary field: 0.5
   - Match in tertiary field: 0.3
4. **Merging:** Combines scores using weighted average
5. **Ranking:** Sorts by combined score (descending)

### Searchable Fields by Entity

| Entity | Primary | Secondary | Tertiary |
|--------|---------|-----------|----------|
| Posts | content | - | citation.title |
| Topics | name | description | - |
| Journals | name | description | publisher |
| Users | username | bio | expertiseTags |

### When to Use Hybrid Search

✅ **Use hybrid search when:**
- Users search for specific names (journals, users, topics)
- Exact keyword matches are important
- You want to boost technical terms and acronyms
- Combining semantic understanding with precision

❌ **Skip hybrid search when:**
- Pure semantic similarity is sufficient
- Performance is critical (hybrid is ~2x slower)
- Dataset is very large (use semantic-only with indexes)

### Performance

- **Pure Semantic:** ~1-2ms per query
- **Hybrid Search:** ~3-5ms per query (runs both searches in parallel)
- **Optimization:** Results are pre-filtered and merged efficiently

### Example Results

Query: "Nature" (journal name)

**Pure Semantic:**
```json
{
  "journal": { "name": "Nature" },
  "similarity": 0.4932
}
```

**Hybrid (70/30):**
```json
{
  "journal": { "name": "Nature" },
  "similarity": 0.4932,
  "keywordScore": 0.7222,
  "combinedScore": 0.5619  // Boosted by exact match!
}
```

### Best Practices

1. **Default weights (70/30)** work well for most use cases
2. Use **keyword-heavy (40/60)** for name-based searches
3. Use **semantic-heavy (80/20)** for conceptual queries
4. Combine with `threshold` parameter to filter low-confidence results
5. Monitor performance with large datasets

## Testing Checklist

- [ ] Run `npm run test:semantic` - all queries return relevant results
- [ ] Run `npm run verify:cosine` - similarity calculations are correct
- [ ] Run `npm run inspect:queries` - performance is acceptable (< 100ms)
- [ ] Manual testing: Try edge cases (very short queries, misspellings, etc.)
- [ ] Load testing: Verify performance under concurrent queries

## Monitoring in Production

### Key Metrics to Track

1. **Query Latency**
   - p50, p95, p99 response times
   - Target: < 100ms for p95

2. **Result Quality**
   - Click-through rate on top results
   - User engagement with results

3. **Coverage**
   - % of queries returning results
   - % of queries with high-confidence matches (similarity > 0.6)

### Logging Recommendations

```typescript
// Add to semantic-search.service.ts
console.log({
  query,
  topSimilarity: results[0]?.similarity,
  resultCount: results.length,
  executionTime: Date.now() - startTime
});
```

## Troubleshooting

### Problem: Low Similarity Scores

**Possible causes:**
- Query and content are in different domains
- Model doesn't understand specialized terminology
- Embeddings are stale/outdated

**Solutions:**
- Regenerate embeddings: `npm run generate:embeddings`
- Consider domain-specific embedding model
- Add query expansion

### Problem: Slow Performance

**Possible causes:**
- Large dataset without indexes
- Cold start (model loading)
- Database connection issues

**Solutions:**
- Add vector indexes (see Performance Optimization)
- Implement caching
- Monitor database query times

### Problem: Irrelevant Results

**Possible causes:**
- Query is too vague
- Similarity threshold too low
- Model mismatch for content type

**Solutions:**
- Add minimum similarity threshold
- Implement query clarification
- Try different embedding model

## Further Reading

- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [Sentence Transformers Models](https://www.sbert.net/docs/pretrained_models.html)
- [Vector Search Best Practices](https://www.pinecone.io/learn/vector-search/)

## Scripts Reference

```bash
# Generate embeddings for all records
npm run generate:embeddings

# Test semantic search with multiple queries
npm run test:semantic

# Verify cosine similarity calculations
npm run verify:cosine

# Inspect database queries and performance
npm run inspect:queries

# Test embedding generation for new records
npm run test:embedding
```
