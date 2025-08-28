import { Types } from 'mongoose';
import { Website, IWebsite } from '../models/Website';
import { ISnapshot } from '../models/Snapshot';
import { GetWebsiteResponse } from '../types';
import { ArchiveError } from '../types/errors';
import { normalizeDomain } from '../utils/url';

interface IWebsiteWithPopulatedSnapshots extends Omit<IWebsite, 'snapshots'> {
  snapshots: ISnapshot[];
}

export class WebsiteService {
  /**
   * Retrieve the full history of snapshots for a given domain
   */
  public async getWebsiteByDomain(
    domain: string
  ): Promise<GetWebsiteResponse | null> {
    try {
      const normalizedDomain = normalizeDomain(domain);
      
      // Find website by normalized domain and populate snapshots
      const website = await Website.findOne({ domain: normalizedDomain })
        .populate('snapshots')
        .exec() as IWebsiteWithPopulatedSnapshots | null;

      if (!website) {
        return null;
      }

      // Transform to response format - no type assertions needed
      const response: GetWebsiteResponse = {
        domain: website.domain,
        originalUrl: website.originalUrl,
        snapshots: website.snapshots.map((snapshot) => ({
          _id: (snapshot._id as Types.ObjectId).toString(),
          path: snapshot.path,
          status: snapshot.status,
          storagePath: snapshot.storagePath,
          entrypoint: snapshot.entrypoint,
          jobId: (snapshot.jobId as Types.ObjectId).toString(),
          createdAt: snapshot.createdAt,
          updatedAt: snapshot.updatedAt,
        })),
        createdAt: website.createdAt,
        updatedAt: website.updatedAt,
      };

      return response;
    } catch (error) {
      throw new ArchiveError(
        `Failed to retrieve website: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
