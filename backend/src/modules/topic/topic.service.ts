import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Topic } from './topic.entity';

@Injectable()
export class TopicService {
  constructor(
    @InjectRepository(Topic)
    private topicRepository: Repository<Topic>,
  ) {}

  async findAll(): Promise<Topic[]> {
    return this.topicRepository.find({
      order: { followerCount: 'DESC' },
    });
  }

  async findBySlug(slug: string): Promise<Topic> {
    return this.topicRepository.findOne({
      where: { slug },
    });
  }

  async findById(id: string): Promise<Topic> {
    return this.topicRepository.findOne({
      where: { id },
    });
  }

  async create(name: string, description?: string): Promise<Topic> {
    const slug = name.toLowerCase().replace(/\s+/g, '-');
    const topic = this.topicRepository.create({
      name,
      slug,
      description,
    });
    return this.topicRepository.save(topic);
  }

  async incrementFollowerCount(topicId: string): Promise<void> {
    await this.topicRepository.increment({ id: topicId }, 'followerCount', 1);
  }

  async decrementFollowerCount(topicId: string): Promise<void> {
    await this.topicRepository.decrement({ id: topicId }, 'followerCount', 1);
  }

  async incrementPostCount(topicId: string): Promise<void> {
    await this.topicRepository.increment({ id: topicId }, 'postCount', 1);
  }
}
