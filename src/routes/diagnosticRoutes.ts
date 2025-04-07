/**
 * Import required dependencies
 * Router from express for handling routes
 * multer for handling file uploads
 * processDiagnosticFile controller for processing diagnostic files
 */
import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { processDiagnosticFile } from '../controllers/diagnosticController';

/**
 * Initialize Express Router
 */
const router = Router();

/**
 * Configure multer for memory storage
 * This stores uploaded files in memory instead of disk
 */
const upload = multer({ storage: multer.memoryStorage() });

/**
 * Define route for processing diagnostic files
 * POST /process
 * Accepts a single file upload with field name 'file'
 * Processes the file using processDiagnosticFile controller
 */
const uploadMiddleware = upload.single('file');
router.post('/process', uploadMiddleware as any, (req: Request, res: Response, next: NextFunction) => {
  if (!req.file) {
    console.error('✗ No file uploaded'.red);
    return res.status(400).json({ 
      success: false,
      error: 'No file uploaded or invalid file format' 
    });
  }
  next();
}, processDiagnosticFile);

export default router;