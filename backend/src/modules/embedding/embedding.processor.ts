import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from '../post/post.entity';
import { Topic } from '../topic/topic.entity';
import { Journal } from '../journal/journal.entity';
import { User } from '../user/user.entity';
import { EmbeddingService } from './embedding.service';

@Processor('embedding')
export class EmbeddingProcessor {
  constructor(
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
    @InjectRepository(Topic)
    private topicRepository: Repository<Topic>,
    @InjectRepository(Journal)
    private journalRepository: Repository<Journal>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private embeddingService: EmbeddingService,
  ) {}

  @Process('generate-all')
  async handleGenerateAll(job: Job) {
    console.log('Processing generate-all embeddings job...');
    try {
      await Promise.all([
        this.generatePostEmbeddings(),
        this.generateTopicEmbeddings(),
        this.generateJournalEmbeddings(),
        this.generateUserEmbeddings(),
      ]);
      console.log('Generate-all embeddings job completed successfully');
      return { success: true };
    } catch (error) {
      console.error('Generate-all embeddings job failed:', error);
      throw error;
    }
  }

  @Process('generate-posts')
  async handleGeneratePosts(job: Job) {
    console.log('Processing generate-posts embeddings job...');
    try {
      await this.generatePostEmbeddings();
      console.log('Generate-posts embeddings job completed successfully');
      return { success: true };
    } catch (error) {
      console.error('Generate-posts embeddings job failed:', error);
      throw error;
    }
  }

  private async generatePostEmbeddings(): Promise<void> {
    // Find posts without embeddings
    const posts = await this.postRepository.find({
      where: { embedding: null },
      take: 100, // Process in batches
    });

    console.log(`Generating embeddings for ${posts.length} posts...`);

    for (const post of posts) {
      try {
        const embedding = await this.embeddingService.generateEmbedding(
          post.content,
        );
        const embeddingStr = this.embeddingService.formatEmbeddingForDB(embedding);

        await this.postRepository.update(post.id, {
          embedding: embeddingStr as any,
        });
      } catch (error) {
        console.error(`Failed to generate embedding for post ${post.id}:`, error);
      }
    }

    console.log(`Completed ${posts.length} post embeddings`);
  }

  private async generateTopicEmbeddings(): Promise<void> {
    const topics = await this.topicRepository.find({
      where: { embedding: null },
      take: 100,
    });

    console.log(`Generating embeddings for ${topics.length} topics...`);

    for (const topic of topics) {
      try {
        // Combine name and description for better semantic representation
        const text = `${topic.name}. ${topic.description || ''}`.trim();
        const embedding = await this.embeddingService.generateEmbedding(text);
        const embeddingStr = this.embeddingService.formatEmbeddingForDB(embedding);

        await this.topicRepository.update(topic.id, {
          embedding: embeddingStr as any,
        });
      } catch (error) {
        console.error(`Failed to generate embedding for topic ${topic.id}:`, error);
      }
    }

    console.log(`Completed ${topics.length} topic embeddings`);
  }

  private async generateJournalEmbeddings(): Promise<void> {
    const journals = await this.journalRepository.find({
      where: { embedding: null },
      take: 100,
    });

    console.log(`Generating embeddings for ${journals.length} journals...`);

    for (const journal of journals) {
      try {
        // Combine name, description, and disciplines for better semantic representation
        const text = `${journal.name}. ${journal.description || ''}. ${journal.disciplines?.join(', ') || ''}`.trim();
        const embedding = await this.embeddingService.generateEmbedding(text);
        const embeddingStr = this.embeddingService.formatEmbeddingForDB(embedding);

        await this.journalRepository.update(journal.id, {
          embedding: embeddingStr as any,
        });
      } catch (error) {
        console.error(`Failed to generate embedding for journal ${journal.id}:`, error);
      }
    }

    console.log(`Completed ${journals.length} journal embeddings`);
  }

  private async generateUserEmbeddings(): Promise<void> {
    const users = await this.userRepository.find({
      where: { embedding: null },
      take: 100,
    });

    console.log(`Generating embeddings for ${users.length} users...`);

    for (const user of users) {
      try {
        // Combine bio and expertise tags for better semantic representation
        const text = `${user.bio || ''}. ${user.expertiseTags?.join(', ') || ''}`.trim();

        if (!text) {
          console.log(`Skipping user ${user.id} - no text content`);
          continue;
        }

        const embedding = await this.embeddingService.generateEmbedding(text);
        const embeddingStr = this.embeddingService.formatEmbeddingForDB(embedding);

        await this.userRepository.update(user.id, {
          embedding: embeddingStr as any,
        });
      } catch (error) {
        console.error(`Failed to generate embedding for user ${user.id}:`, error);
      }
    }

    console.log(`Completed ${users.length} user embeddings`);
  }
}
