/**
 * Exam Routes
 */

import express from 'express';
import examController from '../controllers/examController.js';
import { examValidations, paginationValidation } from '../utils/validation.js';
import { authenticate, authorize, hasPermission, checkResourceAccess } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

// GET /api/exams
router.get('/', 
  paginationValidation,
  examController.getAllExams
);

// GET /api/exams/upcoming
router.get('/upcoming', examController.getUpcomingExams);

// GET /api/exams/active
router.get('/active', examController.getActiveExams);

// GET /api/exams/history
router.get('/history', examController.getStudentExamHistory);

// POST /api/exams
router.post('/', 
  authorize('admin', 'instructor'),
  examValidations.create,
  examController.createExam
);

// GET /api/exams/:id
router.get('/:id', examController.getExamById);

// PUT /api/exams/:id
router.put('/:id', 
  checkResourceAccess('exam'),
  examValidations.update,
  examController.updateExam
);

// DELETE /api/exams/:id
router.delete('/:id', 
  authorize('admin', 'instructor'),
  examController.deleteExam
);

// GET /api/exams/:id/question-paper
router.get('/:id/question-paper', examController.getExamQuestionPaper);

// POST /api/exams/:id/start
router.post('/:id/start', examController.startExamSession);

// POST /api/exams/:id/submit
router.post('/:id/submit', examController.submitExamAnswers);

// GET /api/exams/:id/results
router.get('/:id/results', 
  authorize('admin', 'instructor'),
  paginationValidation,
  examController.getExamResults
);

// GET /api/exams/:id/stats
router.get('/:id/stats', 
  authorize('admin', 'instructor'),
  examController.getExamStats
);

// POST /api/exams/:id/publish
router.post('/:id/publish', 
  authorize('admin', 'instructor'),
  examController.publishExam
);

// POST /api/exams/:id/archive
router.post('/:id/archive', 
  authorize('admin', 'instructor'),
  examController.archiveExam
);

export default router;
