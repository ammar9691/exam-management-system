/**
 * Student Routes
 * Student-specific routes for exam taking and results
 */

import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';

// Import student controllers
import studentDashboardController from '../controllers/student/dashboardController.js';
import studentExamController from '../controllers/student/examController.js';
import studentResultController from '../controllers/student/resultController.js';

const router = express.Router();

// All student routes require authentication and student role
router.use(authenticate);
router.use(authorize('student'));

// =================
// DASHBOARD ROUTES
// =================
router.get('/dashboard', studentDashboardController.getDashboardStats);
router.get('/exams', studentDashboardController.getAvailableExams);
router.get('/exams/upcoming', studentDashboardController.getUpcomingExams);
router.get('/exams/history', studentDashboardController.getExamHistory);

// =================
// EXAM ROUTES
// =================
router.get('/exam/:id', studentExamController.getExamById);
router.post('/exam/:id/start', studentExamController.startExam);
router.post('/exam/:id/progress', studentExamController.saveExamProgress);
router.post('/exam/:id/submit', studentExamController.submitExam);

// Alternative routes that frontend might expect
router.get('/exams/:id', studentExamController.getExamById);
router.post('/exams/:id/start', studentExamController.startExam);
router.post('/exams/:id/progress', studentExamController.saveExamProgress);
router.post('/exams/submit', studentExamController.submitExam);

// =================
// RESULT ROUTES
// =================
router.get('/results', studentDashboardController.getRecentResults);
router.get('/results/my', studentDashboardController.getRecentResults);
router.get('/results/:id', studentResultController.getResultById);

export default router;