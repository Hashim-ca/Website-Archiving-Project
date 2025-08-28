import { URL } from 'url';
import { Website, IWebsite } from '../models/Website';
import { Job } from '../models/Job';
import { ValidationError } from '../types/errors';

export class ArchiveService {
  /**
   * Validates a URL string
   */
  private validateUrl(urlString: string): URL {
    try {
      const url = new URL(urlString);

      // Only allow HTTP and HTTPS protocols
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        throw new ValidationError('Only HTTP and HTTPS URLs are allowed');
      }

      return url;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new ValidationError(
        `Invalid URL: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Extracts domain from URL
   */
  private extractDomain(url: URL): string {
    return url.hostname;
  }

  /**
   * Finds or creates a Website document
   */
  private async findOrCreateWebsite(url: URL): Promise<IWebsite> {
    const domain = this.extractDomain(url);

    let website = await Website.findOne({ domain });

    if (!website) {
      website = new Website({
        domain,
        originalUrl: url.toString(),
        snapshots: [],
      });
      await website.save();
    }

    return website;
  }

  /**
   * Creates a new archiving job
   */
  public async createArchiveJob(urlString: string): Promise<string> {
    // Validate URL
    const url = this.validateUrl(urlString);

    // Find or create website
    const website = await this.findOrCreateWebsite(url);

    // Create new job
    const job = new Job({
      urlToArchive: url.toString(),
      website: website._id,
      status: 'pending',
    });

    await job.save();

    return job._id.toString();
  }
}
