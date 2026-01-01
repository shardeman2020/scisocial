import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { User } from './user.entity';
import { Post } from '../post/post.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
  ) {}

  async findById(id: string): Promise<User> {
    return this.userRepository.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<User> {
    return this.userRepository.findOne({ where: { email } });
  }

  async create(userData: Partial<User>): Promise<User> {
    const user = this.userRepository.create(userData);
    return this.userRepository.save(user);
  }

  // For MVP, create a default user
  async getOrCreateDefaultUser(): Promise<User> {
    let user = await this.findByEmail('demo@scisocial.com');

    if (!user) {
      user = await this.create({
        email: 'demo@scisocial.com',
        username: 'Demo User',
        expertiseTags: ['Physics', 'AI'],
      });
    }

    return user;
  }

  async getUserProfile(userId: string): Promise<{ user: User; posts: Post[] }> {
    const user = await this.findById(userId);
    const posts = await this.postRepository.find({
      where: { authorId: userId },
      order: { createdAt: 'DESC' },
      relations: ['citation', 'author'],
    });

    return { user, posts };
  }

  async searchUsers(query: string): Promise<User[]> {
    if (!query || query.trim().length === 0) {
      // Return all users if no query
      return this.userRepository.find({
        take: 20,
        order: { createdAt: 'DESC' },
      });
    }

    return this.userRepository.find({
      where: [
        { username: ILike(`%${query}%`) },
        { email: ILike(`%${query}%`) },
      ],
      take: 20,
    });
  }
}
