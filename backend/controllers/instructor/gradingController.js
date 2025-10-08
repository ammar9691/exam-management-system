/**
 * Instructor Grading Controller
 * Handles grading operations for instructors
 */

import Result from '../../models/Result.js';
import Exam from '../../models/Exam.js';
import User from '../../models/User.js';
import { asyncHandler } from '../../middleware/error.js';

// Get grading queue (pending results that need grading)
export const getGradingQueue = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status = 'submitted' } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Find exams created by this instructor
  const instructorExams = await Exam.find({ createdBy: req.user._id }).select('_id');
  const examIds = instructorExams.map(exam => exam._id);

  // Get results for these exams that need grading
  const results = await Result.find({
    examId: { $in: examIds },
    status: status,
    grade: { $exists: false }
  })
    .populate('studentId', 'name email')
    .populate('examId', 'title totalMarks totalQuestions duration')
    .sort({ submittedAt: 1 }) // Oldest first
    .skip(skip)
    .limit(parseInt(limit));

  const totalCount = await Result.countDocuments({
    examId: { $in: examIds },
    status: status,
    grade: { $exists: false }
  });

  res.json({
    status: 'success',
    message: 'Grading queue retrieved successfully',
    data: {
      results,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / parseInt(limit))
      }
    },
    timestamp: new Date().toISOString()
  });
});

// Get grading statistics
export const getGradingStats = asyncHandler(async (req, res) => {
  const instructorExams = await Exam.find({ createdBy: req.user._id }).select('_id');
  const examIds = instructorExams.map(exam => exam._id);

  const pendingGrading = await Result.countDocuments({
    examId: { $in: examIds },
    status: 'submitted',
    grade: { $exists: false }
  });

  const totalGraded = await Result.countDocuments({
    examId: { $in: examIds },
    status: 'graded',
    grade: { $exists: true }
  });

  const inProgressResults = await Result.countDocuments({
    examId: { $in: examIds },
    status: 'in-progress'
  });

  // Get recent grading activity
  const recentlyGraded = await Result.find({
    examId: { $in: examIds },
    status: 'graded',
    gradedAt: { $exists: true }
  })
    .populate('studentId', 'name')
    .populate('examId', 'title')
    .sort({ gradedAt: -1 })
    .limit(5);

  res.json({
    status: 'success',
    message: 'Grading statistics retrieved successfully',
    data: {
      stats: {
        pendingGrading,
        totalGraded,
        inProgressResults,
        recentlyGraded
      }
    },
    timestamp: new Date().toISOString()
  });
});

// Grade a specific result
export const gradeResult = asyncHandler(async (req, res) => {
  const { resultId } = req.params;
  const { score, feedback, grade } = req.body;

  // Validate the result belongs to instructor's exam
  const result = await Result.findById(resultId).populate('examId');
  
  if (!result) {
    return res.status(404).json({
      status: 'error',
      message: 'Result not found',
      timestamp: new Date().toISOString()
    });
  }

  if (result.examId.createdBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      status: 'error',
      message: 'Access denied. This result does not belong to your exam.',
      timestamp: new Date().toISOString()
    });
  }

  // Validate score
  if (score < 0 || score > result.examId.totalMarks) {
    return res.status(400).json({
      status: 'error',
      message: `Score must be between 0 and ${result.examId.totalMarks}`,
      timestamp: new Date().toISOString()
    });
  }

  // Update the result with grading information
  result.score = score;
  result.feedback = feedback || '';
  result.grade = grade || calculateGrade(score, result.examId.totalMarks);
  result.status = 'graded';
  result.gradedAt = new Date();
  result.gradedBy = req.user._id;

  await result.save();

  await result.populate([
    { path: 'studentId', select: 'name email' },
    { path: 'examId', select: 'title totalMarks' },
    { path: 'gradedBy', select: 'name' }
  ]);

  res.json({
    status: 'success',
    message: 'Result graded successfully',
    data: { result },
    timestamp: new Date().toISOString()
  });
});

// Update existing grading
export const updateGrading = asyncHandler(async (req, res) => {
  const { resultId } = req.params;
  const { score, feedback, grade } = req.body;

  const result = await Result.findById(resultId).populate('examId');
  
  if (!result) {
    return res.status(404).json({
      status: 'error',
      message: 'Result not found',
      timestamp: new Date().toISOString()
    });
  }

  if (result.examId.createdBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      status: 'error',
      message: 'Access denied',
      timestamp: new Date().toISOString()
    });
  }

  // Update grading information
  if (score !== undefined) {
    if (score < 0 || score > result.examId.totalMarks) {
      return res.status(400).json({
        status: 'error',
        message: `Score must be between 0 and ${result.examId.totalMarks}`,
        timestamp: new Date().toISOString()
      });
    }
    result.score = score;
    result.grade = grade || calculateGrade(score, result.examId.totalMarks);
  }

  if (feedback !== undefined) {
    result.feedback = feedback;
  }

  result.gradedAt = new Date();
  result.gradedBy = req.user._id;

  await result.save();

  await result.populate([
    { path: 'studentId', select: 'name email' },
    { path: 'examId', select: 'title totalMarks' },
    { path: 'gradedBy', select: 'name' }
  ]);

  res.json({
    status: 'success',
    message: 'Grading updated successfully',
    data: { result },
    timestamp: new Date().toISOString()
  });
});

// Get grading history
export const getGradingHistory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, examId } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  let filter = {
    status: 'graded',
    gradedBy: req.user._id
  };

  if (examId) {
    // Verify the exam belongs to the instructor
    const exam = await Exam.findById(examId);
    if (!exam || exam.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied',
        timestamp: new Date().toISOString()
      });
    }
    filter.examId = examId;
  } else {
    // Filter by instructor's exams
    const instructorExams = await Exam.find({ createdBy: req.user._id }).select('_id');
    const examIds = instructorExams.map(exam => exam._id);
    filter.examId = { $in: examIds };
  }

  const results = await Result.find(filter)
    .populate('studentId', 'name email')
    .populate('examId', 'title totalMarks')
    .sort({ gradedAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const totalCount = await Result.countDocuments(filter);

  res.json({
    status: 'success',
    message: 'Grading history retrieved successfully',
    data: {
      results,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / parseInt(limit))
      }
    },
    timestamp: new Date().toISOString()
  });
});

// Bulk grade multiple results
export const bulkGradeResults = asyncHandler(async (req, res) => {
  const { grades } = req.body; // Array of { resultId, score, feedback, grade }

  if (!Array.isArray(grades) || grades.length === 0) {
    return res.status(400).json({
      status: 'error',
      message: 'Grades array is required and cannot be empty',
      timestamp: new Date().toISOString()
    });
  }

  const resultIds = grades.map(g => g.resultId);
  const results = await Result.find({ _id: { $in: resultIds } }).populate('examId');

  // Verify all results belong to instructor's exams
  const instructorExams = await Exam.find({ createdBy: req.user._id }).select('_id');
  const examIds = instructorExams.map(exam => exam._id.toString());

  for (const result of results) {
    if (!examIds.includes(result.examId._id.toString())) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. One or more results do not belong to your exams.',
        timestamp: new Date().toISOString()
      });
    }
  }

  const updatedResults = [];
  const errors = [];

  for (const gradeData of grades) {
    try {
      const result = results.find(r => r._id.toString() === gradeData.resultId);
      if (!result) {
        errors.push({ resultId: gradeData.resultId, error: 'Result not found' });
        continue;
      }

      // Validate score
      if (gradeData.score < 0 || gradeData.score > result.examId.totalMarks) {
        errors.push({ 
          resultId: gradeData.resultId, 
          error: `Score must be between 0 and ${result.examId.totalMarks}` 
        });
        continue;
      }

      // Update result
      result.score = gradeData.score;
      result.feedback = gradeData.feedback || '';
      result.grade = gradeData.grade || calculateGrade(gradeData.score, result.examId.totalMarks);
      result.status = 'graded';
      result.gradedAt = new Date();
      result.gradedBy = req.user._id;

      await result.save();
      updatedResults.push(result._id);

    } catch (error) {
      errors.push({ resultId: gradeData.resultId, error: error.message });
    }
  }

  res.json({
    status: errors.length > 0 ? 'partial_success' : 'success',
    message: `${updatedResults.length} results graded successfully`,
    data: {
      successfullyGraded: updatedResults,
      errors: errors
    },
    timestamp: new Date().toISOString()
  });
});

// Get dashboard overview for instructor
export const getDashboardOverview = asyncHandler(async (req, res) => {
  const instructorExams = await Exam.find({ createdBy: req.user._id }).select('_id');
  const examIds = instructorExams.map(exam => exam._id);

  // Get counts
  const totalExams = instructorExams.length;
  const pendingGrading = await Result.countDocuments({
    examId: { $in: examIds },
    status: 'submitted',
    grade: { $exists: false }
  });

  const totalGraded = await Result.countDocuments({
    examId: { $in: examIds },
    status: 'graded'
  });

  const activeExams = await Result.countDocuments({
    examId: { $in: examIds },
    status: 'in-progress'
  });

  // Get recent activity
  const recentGrading = await Result.find({
    examId: { $in: examIds },
    status: 'graded',
    gradedAt: { $exists: true }
  })
    .populate('studentId', 'name')
    .populate('examId', 'title')
    .sort({ gradedAt: -1 })
    .limit(5);

  const upcomingExams = await Exam.find({
    createdBy: req.user._id,
    status: 'published',
    startTime: { $gt: new Date() }
  })
    .sort({ startTime: 1 })
    .limit(5);

  res.json({
    status: 'success',
    message: 'Dashboard overview retrieved successfully',
    data: {
      overview: {
        totalExams,
        pendingGrading,
        totalGraded,
        activeExams,
        recentGrading,
        upcomingExams
      }
    },
    timestamp: new Date().toISOString()
  });
});

// Helper function to calculate grade based on score
function calculateGrade(score, totalMarks) {
  const percentage = (score / totalMarks) * 100;
  
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C+';
  if (percentage >= 40) return 'C';
  if (percentage >= 33) return 'D';
  return 'F';
}

export default {
  getGradingQueue,
  getGradingStats,
  gradeResult,
  updateGrading,
  getGradingHistory,
  bulkGradeResults,
  getDashboardOverview
};