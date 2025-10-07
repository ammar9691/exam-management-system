/**
 * Question Routes
 */

import express from 'express';
import questionController from '../controllers/questionController.js';
import { questionValidations, commonValidations, paginationValidation } from '../utils/validation.js';
import { authenticate, authorize, hasPermission, checkResourceAccess } from '../middleware/auth.js';
import { questionMediaUpload, excelUpload, handleUploadError } from '../utils/upload.js';

const router = express.Router();

router.use(authenticate);

// GET /api/questions
router.get('/', 
  authorize('admin', 'instructor'), 
  paginationValidation,
  questionController.getAllQuestions
);

// GET /api/questions/stats
router.get('/stats', 
  authorize('admin', 'instructor'), 
  questionController.getQuestionStats
);

// GET /api/questions/random
router.get('/random', questionController.getRandomQuestions);

// GET /api/questions/export
router.get('/export', 
  authorize('admin', 'instructor'), 
  questionController.exportQuestions
);

// POST /api/questions/import
router.post('/import', 
  authorize('admin', 'instructor'),
  excelUpload.single('file'),
  handleUploadError,
  questionController.importQuestions
);

// POST /api/questions/bulk
router.post('/bulk', 
  authorize('admin', 'instructor'),
  questionController.bulkCreateQuestions
);

// PUT /api/questions/bulk
router.put('/bulk', 
  authorize('admin', 'instructor'),
  questionController.bulkUpdateQuestions
);

// GET /api/questions/subject/:subject
router.get('/subject/:subject', 
  paginationValidation,
  questionController.getQuestionsBySubject
);

// GET /api/questions/subject/:subject/:topic
router.get('/subject/:subject/:topic', 
  paginationValidation,
  questionController.getQuestionsByTopic
);

// GET /api/questions/difficulty/:difficulty
router.get('/difficulty/:difficulty', 
  paginationValidation,
  questionController.getQuestionsByDifficulty
);

// POST /api/questions
router.post('/', 
  authorize('admin', 'instructor'),
  questionMediaUpload.array('media', 3),
  handleUploadError,
  questionValidations.create,
  questionController.createQuestion
);

// GET /api/questions/:id
router.get('/:id', 
  commonValidations.objectId('id'),
  questionController.getQuestionById
);

// PUT /api/questions/:id
router.put('/:id', 
  authorize('admin', 'instructor'),
  questionMediaUpload.array('media', 3),
  handleUploadError,
  questionValidations.update,
  questionController.updateQuestion
);

// DELETE /api/questions/:id
router.delete('/:id', 
  authorize('admin', 'instructor'),
  questionController.deleteQuestion
);

// POST /api/questions/:id/restore
router.post('/:id/restore', 
  authorize('admin'),
  questionController.restoreQuestion
);

// PATCH /api/questions/:id/status
router.patch('/:id/status', 
  authorize('admin', 'instructor'),
  questionController.updateQuestionStatus
);

// POST /api/questions/:id/validate
router.post('/:id/validate', 
  questionController.validateAnswer
);

// GET /api/questions/:id/history
router.get('/:id/history', 
  authorize('admin', 'instructor'),
  questionController.getQuestionHistory
);

export default router;
