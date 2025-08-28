import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { ViewService } from '../services/ViewService';

export class ViewController {
  private viewService: ViewService;

  constructor() {
    this.viewService = new ViewService();
  }

  /**
   * Handle GET /view/:snapshotId/* requests
   * Serves archived website content from Cloudflare R2
   */
  public serveContent = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { snapshotId } = req.params;
      // Extract the wildcard path from the URL
      const wildcardIndex = req.url.indexOf('/', req.url.indexOf(snapshotId) + snapshotId.length);
      let filePath = wildcardIndex !== -1 ? req.url.substring(wildcardIndex + 1) : 'index.html';
      
      // Default to index.html if path is empty or just a slash
      if (!filePath || filePath === '' || filePath === '/') {
        filePath = 'index.html';
      }

      // Validate snapshotId is a valid ObjectId
      if (!Types.ObjectId.isValid(snapshotId)) {
        res.status(400).json({ error: 'Invalid snapshot ID' });
        return;
      }

      // Stream the file from R2
      const { stream, contentType, contentLength } = await this.viewService.getArchivedFile(
        snapshotId,
        filePath
      );

      // Set appropriate headers
      res.setHeader('Content-Type', contentType);
      if (contentLength) {
        res.setHeader('Content-Length', contentLength);
      }

      // Stream the file to the response
      stream.pipe(res);
      
      stream.on('error', (error) => {
        console.error('Stream error:', error);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to serve content' });
        }
      });

    } catch (error) {
      console.error('Error serving content:', error);
      
      if (!res.headersSent) {
        if (error instanceof Error && error.message.includes('not found')) {
          res.status(404).json({ error: 'Content not found' });
        } else {
          res.status(500).json({ error: 'Internal server error' });
        }
      }
    }
  };
}