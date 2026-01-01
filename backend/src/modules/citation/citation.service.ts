import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Citation } from './citation.entity';
import { AiSummarizationService } from './ai-summarization.service';

@Injectable()
export class CitationService {
  constructor(
    @InjectRepository(Citation)
    private citationRepository: Repository<Citation>,
    private httpService: HttpService,
    private aiSummarizationService: AiSummarizationService,
  ) {}

  async findByDoi(doi: string): Promise<Citation> {
    return this.citationRepository.findOne({ where: { doi } });
  }

  async fetchFromCrossref(doi: string): Promise<any> {
    const url = `https://api.crossref.org/works/${doi}`;

    try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: {
            'User-Agent': 'ScientificSocialApp/1.0 (mailto:contact@scisocial.com)',
          },
        }),
      );

      return response.data.message;
    } catch (error) {
      throw new NotFoundException(`DOI ${doi} not found in Crossref`);
    }
  }

  async fetchCitationCountFromSemanticScholar(doi: string): Promise<number> {
    const url = `https://api.semanticscholar.org/graph/v1/paper/DOI:${doi}`;

    try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          params: {
            fields: 'citationCount',
          },
        }),
      );

      return response.data.citationCount || 0;
    } catch (error) {
      // If Semantic Scholar doesn't have the paper, return 0 citations
      console.warn(`Citation count not available for DOI ${doi}`);
      return 0;
    }
  }

  async getOrCreateFromDoi(doi: string): Promise<Citation> {
    // Check if citation already exists
    let citation = await this.findByDoi(doi);

    if (citation) {
      return citation;
    }

    // Fetch from Crossref (validates DOI)
    const crossrefData = await this.fetchFromCrossref(doi);

    const title = crossrefData.title?.[0] || 'Unknown Title';
    const authors = this.extractAuthors(crossrefData);
    const abstract = crossrefData.abstract
      ? this.stripHtml(crossrefData.abstract)
      : null;

    // Fetch citation count from Semantic Scholar
    const citationCount = await this.fetchCitationCountFromSemanticScholar(doi);

    // Generate AI summary
    const aiSummary = await this.aiSummarizationService.summarizePaper(
      title,
      abstract,
      authors,
    );

    // Generate placeholder image URL (using journal/field-based gradient)
    const imageUrl = this.generateImageUrl(
      crossrefData['container-title']?.[0],
      title,
    );

    // Map Crossref data to our schema
    citation = this.citationRepository.create({
      doi,
      title,
      authors,
      journal: crossrefData['container-title']?.[0] || null,
      year: crossrefData.published?.['date-parts']?.[0]?.[0] || null,
      publisher: crossrefData.publisher || null,
      abstract,
      aiSummary,
      imageUrl,
      url: crossrefData.URL || `https://doi.org/${doi}`,
      isOpenAccess: this.checkOpenAccess(crossrefData),
      citationCount,
      metadata: crossrefData,
    });

    return this.citationRepository.save(citation);
  }

  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&[a-z]+;/gi, ' ')
      .trim();
  }

  private generateImageUrl(journal: string, title: string): string {
    // Use Unsplash API for science-related images
    const keywords = this.extractKeywords(title, journal);
    return `https://source.unsplash.com/800x600/?science,${keywords}`;
  }

  private extractKeywords(title: string, journal: string): string {
    const keywords = ['research', 'laboratory', 'science'];

    // Extract field-based keywords
    if (journal?.toLowerCase().includes('nature')) keywords.push('nature');
    if (journal?.toLowerCase().includes('physics')) keywords.push('physics');
    if (title?.toLowerCase().includes('quantum')) keywords.push('quantum');
    if (title?.toLowerCase().includes('gene')) keywords.push('genetics');
    if (title?.toLowerCase().includes('brain')) keywords.push('neuroscience');

    return keywords.slice(0, 2).join(',');
  }

  private extractAuthors(crossrefData: any): string[] {
    const authors = crossrefData.author || [];
    return authors.map((author: any) => {
      const { given, family } = author;
      return given && family ? `${given} ${family}` : family || 'Unknown';
    });
  }

  private checkOpenAccess(crossrefData: any): boolean {
    return crossrefData.link?.some((link: any) =>
      link['content-type'] === 'application/pdf' ||
      link['content-type'] === 'unspecified'
    ) || false;
  }
}
