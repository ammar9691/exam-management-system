/**
 * Question Routes - QDB (Question Database)
 */

import express from 'express';
import questionController from '../controllers/questionController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { excelUpload, handleUploadError } from '../utils/upload.js';
import { logQDBAccess } from '../middleware/qdbAccessLogger.js';
import { enforceModuleAccess } from '../middleware/moduleAccess.js';

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
  logQDBAccess('import', () => ({ resourceType: 'question_list', description: 'Imported questions from Excel' })),
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

// ============ QDB ACCESS LOGS (must be before /:id routes) ============

// GET /api/questions/access-logs - Get QDB access logs
router.get('/access-logs',
  authorize('admin', 'exam_manager'),
  async (req, res) => {
    const QDBAccessLog = (await import('../models/QDBAccessLog.js')).default;
    const { page = 1, limit = 50, userId, action, module: mod, startDate, endDate } = req.query;

    const filter = {};
    if (userId) filter.userId = userId;
    if (action) filter.action = action;
    if (mod) filter.module = mod;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [logs, total] = await Promise.all([
      QDBAccessLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      QDBAccessLog.countDocuments(filter)
    ]);

    res.json({
      status: 'success',
      data: {
        logs,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  }
);

// ============ CRUD OPERATIONS ============

// GET /api/questions - Get all questions (with filters)
router.get('/',
  authorize('admin', 'exam_manager', 'instructor'),
  enforceModuleAccess,
  logQDBAccess('view_list', (req) => ({
    resourceType: 'question_list',
    module: req.query.module || null,
    description: `Listed questions${req.query.module ? ` for module ${req.query.module}` : ''}`
  })),
  questionController.getAllQuestions
);

// POST /api/questions - Create a new question
router.post('/',
  authorize('admin', 'exam_manager', 'instructor'),
  enforceModuleAccess,
  logQDBAccess('create', (req) => ({
    module: req.body.module || null,
    description: `Created question in module ${req.body.module || 'unknown'}`
  })),
  questionController.createQuestion
);

// GET /api/questions/:id - Get question by ID
router.get('/:id',
  authorize('admin', 'exam_manager', 'instructor'),
  logQDBAccess('view_question', (req) => ({
    questionId: req.params.id,
    description: `Viewed question ${req.params.id}`
  })),
  questionController.getQuestionById
);

// PUT /api/questions/:id - Update question
router.put('/:id',
  authorize('admin', 'exam_manager', 'instructor'),
  logQDBAccess('edit', (req) => ({
    questionId: req.params.id,
    description: `Edited question ${req.params.id}`
  })),
  questionController.updateQuestion
);

// DELETE /api/questions/:id - Delete (archive) question
router.delete('/:id',
  authorize('admin', 'exam_manager', 'instructor'),
  logQDBAccess('delete', (req) => ({
    questionId: req.params.id,
    description: `Deleted question ${req.params.id}`
  })),
  questionController.deleteQuestion
);

// ============ APPROVAL ACTIONS ============

// POST /api/questions/:id/approve - Approve a question
router.post('/:id/approve',
  authorize('admin', 'exam_manager'),
  logQDBAccess('approve', (req) => ({
    questionId: req.params.id,
    description: `Approved question ${req.params.id}`
  })),
  questionController.approveQuestion
);

// POST /api/questions/:id/reject - Reject a question
router.post('/:id/reject',
  authorize('admin', 'exam_manager'),
  logQDBAccess('reject', (req) => ({
    questionId: req.params.id,
    description: `Rejected question ${req.params.id}`
  })),
  questionController.rejectQuestion
);

// ============ HISTORY ============

// GET /api/questions/:id/history - Get question revision history
router.get('/:id/history',
  authorize('admin', 'exam_manager'),
  questionController.getQuestionHistory
);

export default router;
