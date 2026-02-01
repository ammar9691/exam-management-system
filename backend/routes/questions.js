/**
 * Question Routes - QDB (Question Database)
 */

import express from 'express';
import questionController from '../controllers/questionController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { excelUpload, handleUploadError } from '../utils/upload.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// ============ PUBLIC ROUTES (for authenticated users) ============

// GET /api/questions/modules - Get all modules and categories
router.get('/modules',
  questionController.getModulesAndCategories
);

// ============ TEMPLATE & IMPORT ============

// GET /api/questions/template - Download Excel template
router.get('/template',
  authorize('admin', 'exam_manager', 'instructor'),
  questionController.downloadTemplate
);

// POST /api/questions/import - Import questions from Excel
router.post('/import',
  authorize('admin', 'exam_manager', 'instructor'),
  excelUpload.single('file'),
  handleUploadError,
  questionController.importQuestions
);

// ============ APPROVAL WORKFLOW ============

// GET /api/questions/pending - Get pending questions (approval queue)
router.get('/pending',
  authorize('admin', 'exam_manager'),
  questionController.getPendingQuestions
);

// POST /api/questions/bulk-approve - Bulk approve questions
router.post('/bulk-approve',
  authorize('admin', 'exam_manager'),
  questionController.bulkApprove
);

// POST /api/questions/bulk-reject - Bulk reject questions
router.post('/bulk-reject',
  authorize('admin', 'exam_manager'),
  questionController.bulkReject
);

// ============ STATISTICS ============

// GET /api/questions/stats - Get QDB statistics
router.get('/stats',
  authorize('admin', 'exam_manager', 'instructor'),
  questionController.getQDBStats
);

// ============ CRUD OPERATIONS ============

// GET /api/questions - Get all questions (with filters)
router.get('/',
  authorize('admin', 'exam_manager', 'instructor'),
  questionController.getAllQuestions
);

// POST /api/questions - Create a new question
router.post('/',
  authorize('admin', 'exam_manager', 'instructor'),
  questionController.createQuestion
);

// GET /api/questions/:id - Get question by ID
router.get('/:id',
  authorize('admin', 'exam_manager', 'instructor'),
  questionController.getQuestionById
);

// PUT /api/questions/:id - Update question
router.put('/:id',
  authorize('admin', 'exam_manager', 'instructor'),
  questionController.updateQuestion
);

// DELETE /api/questions/:id - Delete (archive) question
router.delete('/:id',
  authorize('admin', 'exam_manager', 'instructor'),
  questionController.deleteQuestion
);

// ============ APPROVAL ACTIONS ============

// POST /api/questions/:id/approve - Approve a question
router.post('/:id/approve',
  authorize('admin', 'exam_manager'),
  questionController.approveQuestion
);

// POST /api/questions/:id/reject - Reject a question
router.post('/:id/reject',
  authorize('admin', 'exam_manager'),
  questionController.rejectQuestion
);

// ============ HISTORY ============

// GET /api/questions/:id/history - Get question revision history
router.get('/:id/history',
  authorize('admin', 'exam_manager'),
  questionController.getQuestionHistory
);

export default router;
