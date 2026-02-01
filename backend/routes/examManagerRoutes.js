import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticate);
router.use(authorize('exam_manager'));

// Dashboard only - question management removed as per requirements
router.get('/dashboard', async (req, res) => {
  try {
    // Basic dashboard stats
    const Question = (await import('../models/Question.js')).default;
    const Exam = (await import('../models/Exam.js')).default;

    const [totalQuestions, totalExams] = await Promise.all([
      Question.countDocuments({ status: { $in: ['active', 'approved'] } }),
      Exam.countDocuments()
    ]);

    res.json({
      status: 'success',
      data: {
        stats: { totalQuestions, totalExams },
        message: 'Question management will be available in module-based system'
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

export default router;
