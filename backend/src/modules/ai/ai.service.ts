import { Injectable } from '@nestjs/common';

@Injectable()
export class AiService {
  /**
   * Generate descriptive alt text for an image
   * @param imageUrl - URL of the image to describe
   * @returns Promise<string> - Generated alt text (max ~120 chars)
   */
  async generateAltText(imageUrl: string): Promise<string> {
    // For now, return a simple descriptive alt text
    // In production, this would call an AI vision API like OpenAI GPT-4 Vision,
    // Google Cloud Vision, or similar service

    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Extract filename for basic description
    const filename = imageUrl.split('/').pop() || 'image';
    const extension = filename.split('.').pop()?.toLowerCase();

    // Generate a simple but descriptive alt text
    // In production, this would use actual image analysis
    const descriptions = [
      'Research data visualization',
      'Scientific figure or diagram',
      'Laboratory equipment or experiment',
      'Graph showing research results',
      'Microscopy or imaging data',
      'Scientific illustration',
    ];

    const randomDesc = descriptions[Math.floor(Math.random() * descriptions.length)];

    return `${randomDesc} (${extension?.toUpperCase() || 'IMG'} file)`;
  }

  /**
   * Generate alt text for multiple images
   * @param imageUrls - Array of image URLs
   * @returns Promise<string[]> - Array of generated alt texts
   */
  async generateAltTextBatch(imageUrls: string[]): Promise<string[]> {
    return Promise.all(imageUrls.map(url => this.generateAltText(url)));
  }
}
