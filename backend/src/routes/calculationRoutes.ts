import express, { Request, Response, Router } from 'express';
import {
  calculateCamValues,
  calculateCamValueAtPoint,
  calculateCurves
} from '../controllers/calculationController';

const router: Router = express.Router();

// Calculate cam profile values for a given range
router.get('/:id/range/:start/:end/:step', calculateCamValues as any);

// Calculate cam profile values at a specific point
router.get('/:id/point/:point', calculateCamValueAtPoint as any);

// Calculate cam profile curves
router.post('/curves', calculateCurves as any);

export default router;
