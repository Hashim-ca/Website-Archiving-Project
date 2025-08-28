import { Router } from 'express';
import { ArchiveController } from '../controllers/ArchiveController';

const router = Router();
const archiveController = new ArchiveController();

// POST /api/archive - Create new archive job
router.post('/archive', archiveController.createArchive);

export default router;
