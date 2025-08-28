import { Router } from 'express';
import { ViewController } from '../controllers/ViewController';

const router = Router();
const viewController = new ViewController();

// GET /view/:snapshotId/*
// Serve archived website content from R2
router.get('/:snapshotId/*', viewController.serveContent);

export default router;