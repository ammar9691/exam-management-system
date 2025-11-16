/**
 * Instructor Routes
 * Routes for instructor-specific functionality including grading and exam management
 */

import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';

// Import instructor controllers
import instructorExamController from '../controllers/instructor/examController.js';
import instructorGradingController from '../controllers/instructor/gradingController.js';
import instructorStudentController from '../controllers/instructor/studentController.js';
import instructorQuestionController from '../controllers/instructor/questionController.js';
import { importQuestionsFromCSV } from '../controllers/admin/questionImportController.js';
import { excelUpload, handleUploadError } from '../utils/upload.js';

const router = express.Router();

// All instructor routes require authentication and instructor role
router.use(authenticate);
router.use(authorize('instructor'));

// =================
// EXAM MANAGEMENT
// =================
router.get('/exams', instructorExamController.getInstructorExams);
router.get('/exams/stats', instructorExamController.getExamStats);
router.get('/exams/available-subjects', instructorExamController.getAvailableSubjects);
router.post('/exams', instructorExamController.createExam);
router.put('/exams/:id', instructorExamController.updateExam);
router.delete('/exams/:id', instructorExamController.deleteExam);
router.get('/exams/:id', instructorExamController.getExamById);
router.post('/exams/:id/publish', instructorExamController.publishExam);
router.patch('/exams/:id/status', instructorExamController.updateExamStatus);
router.put('/exams/bulk', instructorExamController.bulkUpdateExams);
router.post('/exams/:id/assign', instructorExamController.assignExamToStudents);
router.get('/exams/:id/monitor', instructorExamController.getExamMonitorData);
router.get('/exams/:id/results', instructorExamController.getExamResults);
router.get('/exams/:id/export', instructorExamController.exportExamResults);
router.get('/exams/:id/analytics', instructorExamController.getExamAnalytics);

// =================
// QUESTION MANAGEMENT
// =================
router.get('/questions', instructorQuestionController.getQuestions);
router.post('/questions', instructorQuestionController.createQuestion);
router.put('/questions/:id', instructorQuestionController.updateQuestion);
router.delete('/questions/:id', instructorQuestionController.deleteQuestion);
router.put('/questions/bulk', instructorQuestionController.bulkUpdateQuestions);
router.get('/questions/export', instructorQuestionController.exportQuestions);

// Bulk question import (reuse admin CSV/Excel import logic)
router.post(
  '/questions/import-csv',
  excelUpload.single('csvFile'),
  handleUploadError,
  importQuestionsFromCSV
);

// =================
// GRADING MANAGEMENT
// =================
router.get('/grading/queue', instructorGradingController.getGradingQueue);
router.get('/grading/stats', instructorGradingController.getGradingStats);
router.post('/grading/:resultId', instructorGradingController.gradeResult);
router.put('/grading/:resultId', instructorGradingController.updateGrading);
router.get('/grading/history', instructorGradingController.getGradingHistory);
router.post('/grading/bulk', instructorGradingController.bulkGradeResults);

// ===================
// STUDENT MANAGEMENT
// ===================
router.get('/students', instructorStudentController.getAssignedStudents);
router.get('/students/stats', instructorStudentController.getStudentStats);
router.get('/students/:id', instructorStudentController.getStudentById);
router.get('/students/:id/performance', instructorStudentController.getStudentPerformance);
router.get('/students/:id/exams', instructorStudentController.getStudentExams);

// =================
// DASHBOARD DATA
// =================
router.get('/dashboard/overview', instructorGradingController.getDashboardOverview);

export default router;
