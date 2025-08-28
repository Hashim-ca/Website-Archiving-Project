import { Router } from 'express';
import { JobController } from '../controllers/JobController';

const router = Router();
const jobController = new JobController();

// GET /api/jobs?ids=jobId1,jobId2 - Get multiple job statuses
router.get('/jobs', jobController.getMultipleJobStatuses);

// GET /api/jobs/:jobId - Get single job status
router.get('/jobs/:jobId', jobController.getJobStatus);

export default router;
