import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from './post.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { CitationService } from '../citation/citation.service';
import { UserService } from '../user/user.service';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
    private citationService: CitationService,
    private userService: UserService,
  ) {}

  async create(createPostDto: CreatePostDto): Promise<Post> {
    const { doi, content, images } = createPostDto;

    // Get or create citation from DOI
    const citation = await this.citationService.getOrCreateFromDoi(doi);

    // For MVP, use default user (later we'll use auth)
    const author = await this.userService.getOrCreateDefaultUser();

    const post = this.postRepository.create({
      content,
      images: images || [],
      citation,
      citationId: citation.id,
      author,
      authorId: author.id,
    });

    return this.postRepository.save(post);
  }

  async findAll(): Promise<Post[]> {
    return this.postRepository.find({
      order: { createdAt: 'DESC' },
      relations: ['citation', 'author'],
    });
  }

  async findById(id: string): Promise<Post> {
    return this.postRepository.findOne({
      where: { id },
      relations: ['citation', 'author'],
    });
  }
}
