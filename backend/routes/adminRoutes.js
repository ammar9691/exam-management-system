/**
 * Admin Routes
 * Consolidated admin-specific routes for enhanced management features
 */

import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';

// Import admin controllers
import adminUserController from '../controllers/admin/userController.js';
import adminQuestionController from '../controllers/admin/questionController.js';
import adminExamController from '../controllers/admin/examController.js';
import adminResultController from '../controllers/admin/resultController.js';
import subjectController from '../controllers/subjectController.js';
import { 
  importQuestionsFromCSV, 
  getImportTemplate, 
  getImportHistory,
  upload 
} from '../controllers/admin/questionImportController.js';

// Import upload middleware
import { excelUpload, handleUploadError } from '../utils/upload.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

// =================
// USER MANAGEMENT
// =================
router.get('/users', adminUserController.getAllUsers);
router.get('/users/stats', adminUserController.getUserStats);
router.post('/users', adminUserController.createUser);
router.put('/users/:id', adminUserController.updateUser);
router.delete('/users/:id', adminUserController.deleteUser);
router.put('/users/bulk', adminUserController.bulkUpdateUsers);
router.post('/users/:id/reset-password', adminUserController.resetUserPassword);
router.get('/users/:id/activity', adminUserController.getUserActivity);
router.get('/users/export', adminUserController.exportUsers);

// ===================
// QUESTION MANAGEMENT
// ===================
router.get('/questions', adminQuestionController.getAllQuestions);
router.get('/questions/stats', adminQuestionController.getQuestionStats);
router.post('/questions', adminQuestionController.createQuestion);
router.put('/questions/:id', adminQuestionController.updateQuestion);
router.delete('/questions/:id', adminQuestionController.deleteQuestion);
router.put('/questions/bulk', adminQuestionController.bulkUpdateQuestions);
router.post('/questions/:id/duplicate', adminQuestionController.duplicateQuestion);
router.get('/questions/:id/analytics', adminQuestionController.getQuestionAnalytics);

// CSV Import endpoints
router.post('/questions/import-csv', 
  upload.single('csvFile'),
  importQuestionsFromCSV
);
router.get('/questions/import-template', getImportTemplate);
router.get('/questions/import-history', getImportHistory);

// Legacy import support
router.post('/questions/import', 
  excelUpload.single('file'),
  handleUploadError,
  adminQuestionController.importQuestions
);
router.get('/questions/export', adminQuestionController.exportQuestions);

// ================
// EXAM MANAGEMENT
// ================
router.get('/exams', adminExamController.getAllExams);
router.get('/exams/stats', adminExamController.getExamStats);
router.get('/exams/available-subjects', adminExamController.getAvailableSubjects);
router.post('/exams', adminExamController.createExam);
router.put('/exams/:id', adminExamController.updateExam);
router.delete('/exams/:id', adminExamController.deleteExam);
router.post('/exams/:id/publish', adminExamController.publishExam);
router.put('/exams/bulk', adminExamController.bulkUpdateExams);
router.post('/exams/:id/duplicate', adminExamController.duplicateExam);
router.get('/exams/:id/analytics', adminExamController.getExamAnalytics);
router.get('/exams/:id/export-results', adminExamController.exportExamResults);

// ==================
// RESULT MANAGEMENT
// ==================
router.get('/results', adminResultController.getAllResults);
router.get('/results/stats', adminResultController.getResultStats);
router.get('/results/:id', adminResultController.getResultById);
router.post('/results/:id/grade', adminResultController.gradeResult);
router.put('/results/bulk', adminResultController.bulkUpdateResults);
router.delete('/results/:id', adminResultController.deleteResult);
router.get('/results/export', adminResultController.exportResults);
router.get('/results/analytics/performance', adminResultController.getPerformanceAnalytics);

// ==================
// SUBJECT MANAGEMENT
// ==================
router.get('/subjects', subjectController.getAllSubjects);
router.get('/subjects/stats', subjectController.getAllSubjectStats);
router.post('/subjects', subjectController.createSubject);
router.get('/subjects/search', subjectController.searchSubjects);
router.put('/subjects/bulk', subjectController.bulkUpdateSubjects);
router.get('/subjects/:id', subjectController.getSubjectById);
router.put('/subjects/:id', subjectController.updateSubject);
router.delete('/subjects/:id', subjectController.deleteSubject);
router.get('/subjects/:id/stats', subjectController.getSubjectStats);

// =================
// DASHBOARD STATS
// =================
router.get('/dashboard/overview', adminUserController.getDashboardOverview);

// =================
// SYSTEM ANALYTICS
// =================
router.get('/analytics/system', async (req, res) => {
  try {
    // System-wide analytics combining all modules
    const systemAnalytics = {
      // This would include cross-module analytics
      timestamp: new Date().toISOString(),
      modules: ['users', 'questions', 'exams', 'results']
    };

    res.json({
      status: 'success',
      message: 'System analytics retrieved successfully',
      data: { analytics: systemAnalytics },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error', 
      message: 'Failed to fetch system analytics',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;