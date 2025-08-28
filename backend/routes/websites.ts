import { Router } from 'express';
import { WebsiteController } from '../controllers/WebsiteController';

const router = Router();
const websiteController = new WebsiteController();

// GET /api/websites - Retrieve website snapshots by domain
router.get('/websites', websiteController.getWebsites);

export default router;
