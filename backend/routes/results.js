/**
 * Result Routes
 */

import express from 'express';
import resultController from '../controllers/resultController.js';
import { paginationValidation } from '../utils/validation.js';
import { authenticate, authorize, hasPermission, checkResourceAccess } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

// GET /api/results
router.get('/', 
  authorize('admin', 'instructor'),
  paginationValidation,
  resultController.getAllResults
);

// GET /api/results/stats
router.get('/stats', 
  authorize('admin', 'instructor'),
  resultController.getResultStats
);

// GET /api/results/my
router.get('/my', 
  authorize(['student']),
  paginationValidation,
  resultController.getMyResults
);

// GET /api/results/certificates
router.get('/certificates', 
  authorize(['student']),
  resultController.getStudentCertificates
);

// GET /api/results/report
router.get('/report', 
  authorize('admin', 'instructor'),
  resultController.generateResultReport
);

// PUT /api/results/bulk/grade
router.put('/bulk/grade', 
  authorize('admin', 'instructor'),
  resultController.bulkGradeResults
);

// GET /api/results/exam/:examId
router.get('/exam/:examId', 
  authorize('admin', 'instructor'),
  paginationValidation,
  resultController.getResultsByExam
);

// GET /api/results/student/:studentId
router.get('/student/:studentId', 
  checkResourceAccess('result'),
  paginationValidation,
  resultController.getResultsByStudent
);

// GET /api/results/student/:studentId/performance
router.get('/student/:studentId/performance', 
  checkResourceAccess('result'),
  resultController.getStudentPerformance
);

// GET /api/results/exam/:examId/analytics
router.get('/exam/:examId/analytics', 
  authorize('admin', 'instructor'),
  resultController.getExamAnalytics
);

// GET /api/results/:id
router.get('/:id', 
  checkResourceAccess('result'),
  resultController.getResultById
);

// PUT /api/results/:id
router.put('/:id', 
  authorize('admin', 'instructor'),
  resultController.updateResult
);

// DELETE /api/results/:id
router.delete('/:id', 
  authorize('admin'),
  resultController.deleteResult
);

// POST /api/results/:resultId/certificate
router.post('/:resultId/certificate', 
  checkResourceAccess('result'),
  resultController.generateCertificate
);

export default router;
