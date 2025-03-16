import express, { Router } from 'express';
import {
  getAllCamProfiles,
  getCamProfileById,
  createCamProfile,
  updateCamProfile,
  deleteCamProfile,
  addSegment,
  updateSegment,
  deleteSegment,
  updateSpreadsheetData
} from '../controllers/camProfileController';

const router: Router = express.Router();

// Cam profile routes
router.get('/', getAllCamProfiles as any);
router.get('/:id', getCamProfileById as any);
router.post('/', createCamProfile as any);
router.put('/:id', updateCamProfile as any);
router.delete('/:id', deleteCamProfile as any);

// Segment routes
router.post('/:id/segments', addSegment as any);
router.put('/:id/segments/:segmentId', updateSegment as any);
router.delete('/:id/segments/:segmentId', deleteSegment as any);

// Spreadsheet data route
router.put('/:id/spreadsheet', updateSpreadsheetData as any);

export default router;
