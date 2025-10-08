import express from 'express';
import {
  getDashboardStats,
  getExams,
  createExam,
  updateExam,
  updateExamStatus,
  deleteExam,
  getQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getStudents,
  assignExamToStudents,
  getExamResults,
  monitorLiveExam,
  getGradingQueue,
  gradeExamResult,
  bulkGradeResults,
  getGradingStats
} from '../controllers/instructorController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication and role restriction to all routes
router.use(authenticate);
router.use(authorize('instructor'));

// Dashboard routes
router.get('/dashboard/overview', getDashboardStats);

// Exam management routes
router.route('/exams')
  .get(getExams)
  .post(createExam);

router.route('/exams/:id')
  .put(updateExam)
  .delete(deleteExam);

router.patch('/exams/:id/status', updateExamStatus);
router.post('/exams/:id/assign', assignExamToStudents);
router.get('/exams/:id/results', getExamResults);
router.get('/exams/:id/monitor', monitorLiveExam);

// Question management routes
router.route('/questions')
  .get(getQuestions)
  .post(createQuestion);

router.route('/questions/:id')
  .put(updateQuestion)
  .delete(deleteQuestion);

// Student management routes
router.get('/students', getStudents);

// Grading routes
router.get('/grading', getGradingQueue);
router.get('/grading/stats', getGradingStats);
router.post('/grading/:resultId', gradeExamResult);
router.post('/grading/bulk', bulkGradeResults);

// Additional exam routes
router.get('/exams/create', (req, res) => {
  // Return form data or subjects for exam creation
  res.json({ message: 'Exam creation form endpoint', subjects: [] });
});

export default router;
