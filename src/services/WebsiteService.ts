import { Website } from '../models/Website';
import { GetWebsiteResponse } from '../types';

export class WebsiteService {
  /**
   * Retrieve the full history of snapshots for a given domain
   */
  public async getWebsiteByDomain(
    domain: string
  ): Promise<GetWebsiteResponse | null> {
    try {
      // Find website by domain and populate snapshots
      const website = await Website.findOne({ domain })
        .populate('snapshots')
        .exec();

      if (!website) {
        return null;
      }

      // Transform to response format
      const response: GetWebsiteResponse = {
        domain: website.domain,
        originalUrl: website.originalUrl,
        snapshots: website.snapshots.map((snapshot: any) => ({
          _id: snapshot._id.toString(),
          status: snapshot.status,
          storagePath: snapshot.storagePath,
          entrypoint: snapshot.entrypoint,
          jobId: snapshot.jobId.toString(),
          createdAt: snapshot.createdAt,
          updatedAt: snapshot.updatedAt,
        })),
        createdAt: website.createdAt,
        updatedAt: website.updatedAt,
      };

      return response;
    } catch (error) {
      throw new Error(
        `Failed to retrieve website: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
