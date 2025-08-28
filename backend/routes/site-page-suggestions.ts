import { Router } from 'express';
import { SitePageSuggestionsController } from '../controllers/SitePageSuggestionsController';

const router = Router();
const sitePageSuggestionsController = new SitePageSuggestionsController();

// GET /api/site-page-suggestions - Get page suggestions for a domain using Firecrawl
router.get('/site-page-suggestions', sitePageSuggestionsController.getSitePageSuggestions);

export default router;