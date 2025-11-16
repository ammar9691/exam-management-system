/**
 * Instructor Grading Controller
 * Mirrors admin/result grading concepts but aligned to the new Result model
 * and scoped strictly to exams created by the instructor.
 */

import Result from '../../models/Result.js';
import Exam from '../../models/Exam.js';
import User from '../../models/User.js';
import {
  sendSuccessResponse,
  sendErrorResponse,
  sendNotFoundResponse,
  asyncHandler
} from '../../utils/response.js';

// Get grading queue (results that are completed but not yet reviewed)
export const getGradingQueue = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  const skip = (pageNum - 1) * limitNum;

  // Find exams created by this instructor
  const instructorExams = await Exam.find({ createdBy: req.user._id }).select('_id');
  const examIds = instructorExams.map(exam => exam._id);

  const statusFilter = status || 'completed';

  const match = {
    exam: { $in: examIds },
    status: statusFilter,
    reviewedAt: { $exists: false }
  };

  const results = await Result.find(match)
    .populate('student', 'name email')
    .populate('exam', 'title totalMarks duration')
    .sort({ submittedAt: 1 }) // Oldest first
    .skip(skip)
    .limit(limitNum);

  const totalCount = await Result.countDocuments(match);

  const payload = results.map(result => ({
    id: result._id,
    student: result.student,
    exam: result.exam,
    status: result.status,
    scoring: result.scoring,
    stats: result.stats,
    submittedAt: result.submittedAt,
    session: result.session
  }));

  return sendSuccessResponse(res, 'Grading queue retrieved successfully', {
    results: payload,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: totalCount,
      pages: Math.ceil(totalCount / limitNum)
    }
  });
});

// Get grading statistics for instructor dashboard widgets
export const getGradingStats = asyncHandler(async (req, res) => {
  const instructorExams = await Exam.find({ createdBy: req.user._id }).select('_id');
  const examIds = instructorExams.map(exam => exam._id);

  const completedMatch = {
    exam: { $in: examIds },
    status: { $in: ['completed', 'submitted', 'auto-submitted'] }
  };

  const pendingGrading = await Result.countDocuments({
    ...completedMatch,
    reviewedAt: { $exists: false }
  });

  const totalReviewed = await Result.countDocuments({
    ...completedMatch,
    reviewedAt: { $exists: true }
  });

  const inProgressResults = await Result.countDocuments({
    exam: { $in: examIds },
    status: 'in-progress'
  });

  const recentlyReviewed = await Result.find({
    exam: { $in: examIds },
    reviewedAt: { $exists: true }
  })
    .populate('student', 'name')
    .populate('exam', 'title')
    .sort({ reviewedAt: -1 })
    .limit(5)
    .select('scoring.percentage reviewedAt student exam');

  return sendSuccessResponse(
    res,
    'Grading statistics retrieved successfully',
    {
      stats: {
        pendingGrading,
        totalReviewed,
        inProgressResults,
        recentlyReviewed
      }
    }
  );
});

// Grade a specific result (manual override of final score)
export const gradeResult = asyncHandler(async (req, res) => {
  const { resultId } = req.params;
  const { score, feedback } = req.body;

  const result = await Result.findById(resultId).populate(
    'exam',
    'title totalMarks passingMarks createdBy'
  );

  if (!result) {
    return sendNotFoundResponse(res, 'Result');
  }

  if (result.exam.createdBy.toString() !== req.user._id.toString()) {
    return sendErrorResponse(
      res,
      'Access denied. This result does not belong to your exam.',
      403
    );
  }

  if (typeof score !== 'number') {
    return sendErrorResponse(res, 'Score is required and must be a number', 400);
  }

  if (score < 0 || score > result.scoring.totalMarks) {
    return sendErrorResponse(
      res,
      `Score must be between 0 and ${result.scoring.totalMarks}`,
      400
    );
  }

  // Update scoring based on manual score
  result.scoring.marksObtained = score;
  result.scoring.percentage =
    result.scoring.totalMarks > 0
      ? (score / result.scoring.totalMarks) * 100
      : 0;
  result.scoring.passed =
    typeof result.exam.passingMarks === 'number'
      ? score >= result.exam.passingMarks
      : result.scoring.passed;

  // Attach high-level feedback to the structured feedback field
  if (feedback) {
    result.feedback = {
      ...result.feedback,
      overall: feedback
    };
  }

  result.reviewedAt = new Date();
  result.reviewedBy = req.user._id;

  await result.save();

  await result.populate([
    { path: 'student', select: 'name email' },
    { path: 'exam', select: 'title totalMarks' },
    { path: 'reviewedBy', select: 'name' }
  ]);

  return sendSuccessResponse(res, 'Result graded successfully', { result });
});

// Update existing grading (re-grade)
export const updateGrading = asyncHandler(async (req, res) => {
  const { resultId } = req.params;
  const { score, feedback } = req.body;

  const result = await Result.findById(resultId).populate(
    'exam',
    'title totalMarks passingMarks createdBy'
  );

  if (!result) {
    return sendNotFoundResponse(res, 'Result');
  }

  if (result.exam.createdBy.toString() !== req.user._id.toString()) {
    return sendErrorResponse(res, 'Access denied', 403);
  }

  if (score !== undefined) {
    if (typeof score !== 'number') {
      return sendErrorResponse(
        res,
        'Score must be a number when provided',
        400
      );
    }

    if (score < 0 || score > result.scoring.totalMarks) {
      return sendErrorResponse(
        res,
        `Score must be between 0 and ${result.scoring.totalMarks}`,
        400
      );
    }

    result.scoring.marksObtained = score;
    result.scoring.percentage =
      result.scoring.totalMarks > 0
        ? (score / result.scoring.totalMarks) * 100
        : 0;
    result.scoring.passed =
      typeof result.exam.passingMarks === 'number'
        ? score >= result.exam.passingMarks
        : result.scoring.passed;
  }

  if (feedback !== undefined) {
    result.feedback = {
      ...result.feedback,
      overall: feedback
    };
  }

  result.reviewedAt = new Date();
  result.reviewedBy = req.user._id;

  await result.save();

  await result.populate([
    { path: 'student', select: 'name email' },
    { path: 'exam', select: 'title totalMarks' },
    { path: 'reviewedBy', select: 'name' }
  ]);

  return sendSuccessResponse(res, 'Grading updated successfully', { result });
});

// Get grading history for this instructor
export const getGradingHistory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, examId } = req.query;
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  const skip = (pageNum - 1) * limitNum;

  const baseFilter = {
    reviewedBy: req.user._id,
    reviewedAt: { $exists: true }
  };

  let filter = { ...baseFilter };

  if (examId) {
    const exam = await Exam.findById(examId);
    if (!exam || exam.createdBy.toString() !== req.user._id.toString()) {
      return sendErrorResponse(res, 'Access denied', 403);
    }
    filter.exam = examId;
  } else {
    const instructorExams = await Exam.find({ createdBy: req.user._id }).select('_id');
    const examIds = instructorExams.map(exam => exam._id);
    filter.exam = { $in: examIds };
  }

  const results = await Result.find(filter)
    .populate('student', 'name email')
    .populate('exam', 'title totalMarks')
    .sort({ reviewedAt: -1 })
    .skip(skip)
    .limit(limitNum);

  const totalCount = await Result.countDocuments(filter);

  return sendSuccessResponse(
    res,
    'Grading history retrieved successfully',
    {
      results,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        pages: Math.ceil(totalCount / limitNum)
      }
    }
  );
});

// Bulk grade multiple results with a final score override
export const bulkGradeResults = asyncHandler(async (req, res) => {
  const { grades } = req.body; // Array of { resultId, score, feedback }

  if (!Array.isArray(grades) || grades.length === 0) {
    return sendErrorResponse(
      res,
      'Grades array is required and cannot be empty',
      400
    );
  }

  const resultIds = grades.map(g => g.resultId);
  const results = await Result.find({ _id: { $in: resultIds } }).populate(
    'exam',
    'title totalMarks passingMarks createdBy'
  );

  const instructorExams = await Exam.find({ createdBy: req.user._id }).select('_id');
  const examIds = instructorExams.map(exam => exam._id.toString());

  for (const result of results) {
    if (!examIds.includes(result.exam._id.toString())) {
      return sendErrorResponse(
        res,
        'Access denied. One or more results do not belong to your exams.',
        403
      );
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

      if (typeof gradeData.score !== 'number') {
        errors.push({
          resultId: gradeData.resultId,
          error: 'Score must be a number'
        });
        continue;
      }

      if (gradeData.score < 0 || gradeData.score > result.scoring.totalMarks) {
        errors.push({
          resultId: gradeData.resultId,
          error: `Score must be between 0 and ${result.scoring.totalMarks}`
        });
        continue;
      }

      result.scoring.marksObtained = gradeData.score;
      result.scoring.percentage =
        result.scoring.totalMarks > 0
          ? (gradeData.score / result.scoring.totalMarks) * 100
          : 0;
      result.scoring.passed =
        typeof result.exam.passingMarks === 'number'
          ? gradeData.score >= result.exam.passingMarks
          : result.scoring.passed;

      if (gradeData.feedback) {
        result.feedback = {
          ...result.feedback,
          overall: gradeData.feedback
        };
      }

      result.reviewedAt = new Date();
      result.reviewedBy = req.user._id;

      await result.save();
      updatedResults.push(result._id);
    } catch (error) {
      errors.push({ resultId: gradeData.resultId, error: error.message });
    }
  }

  return sendSuccessResponse(
    res,
    `${updatedResults.length} results graded successfully`,
    {
      successfullyGraded: updatedResults,
      errors
    }
  );
});

// Get dashboard overview for instructor (used by frontend /instructor/dashboard)
export const getDashboardOverview = asyncHandler(async (req, res) => {
  const instructorExams = await Exam.find({
    createdBy: req.user._id
  }).select('_id title subject schedule status');
  const examIds = instructorExams.map(exam => exam._id);

  const totalExams = instructorExams.length;

  const pendingGrading = await Result.countDocuments({
    exam: { $in: examIds },
    status: { $in: ['completed', 'submitted', 'auto-submitted'] },
    reviewedAt: { $exists: false }
  });

  const totalReviewed = await Result.countDocuments({
    exam: { $in: examIds },
    status: { $in: ['completed', 'submitted', 'auto-submitted'] },
    reviewedAt: { $exists: true }
  });

  const activeExamSessions = await Result.countDocuments({
    exam: { $in: examIds },
    status: 'in-progress'
  });

  const recentGrading = await Result.find({
    exam: { $in: examIds },
    reviewedAt: { $exists: true }
  })
    .populate('student', 'name email')
    .populate('exam', 'title')
    .sort({ reviewedAt: -1 })
    .limit(5);

  const now = new Date();
  const upcomingExams = await Exam.find({
    createdBy: req.user._id,
    status: 'active',
    'schedule.startTime': { $gt: now }
  })
    .sort({ 'schedule.startTime': 1 })
    .limit(5);

  const performanceAgg = await Result.aggregate([
    {
      $match: {
        exam: { $in: examIds },
        status: { $in: ['completed', 'submitted', 'auto-submitted'] }
      }
    },
    {
      $group: {
        _id: '$exam',
        averageScore: { $avg: '$scoring.percentage' },
        passRate: {
          $avg: { $cond: ['$scoring.passed', 1, 0] }
        }
      }
    }
  ]);

  const examPerformanceMap = new Map(
    performanceAgg.map(p => [String(p._id), p])
  );
  const examPerformance = instructorExams.map(exam => {
    const perf = examPerformanceMap.get(String(exam._id));
    return {
      examId: exam._id,
      title: exam.title,
      averageScore: perf ? Math.round(perf.averageScore || 0) : 0,
      passRate: perf ? Math.round((perf.passRate || 0) * 100) : 0
    };
  });

  const totalResults = await Result.countDocuments({ exam: { $in: examIds } });
  const averageScoreAgg = await Result.aggregate([
    {
      $match: {
        exam: { $in: examIds },
        status: { $in: ['completed', 'submitted', 'auto-submitted'] }
      }
    },
    { $group: { _id: null, avg: { $avg: '$scoring.percentage' } } }
  ]);

  const overview = {
    totalExams,
    activeExams: instructorExams.filter(e => e.status === 'active').length,
    totalQuestions: 0,
    totalStudents: 0,
    pendingGrading,
    totalGraded: totalReviewed,
    activeExamSessions,
    totalResults,
    averageScore: Math.round(averageScoreAgg[0]?.avg || 0),
    recentResults: recentGrading,
    examPerformance,
    upcomingExams
  };

  // Frontend expects `response.data.stats` on /instructor/dashboard/overview
  return sendSuccessResponse(
    res,
    'Dashboard overview retrieved successfully',
    { stats: overview }
  );
});

export default {
  getGradingQueue,
  getGradingStats,
  gradeResult,
  updateGrading,
  getGradingHistory,
  bulkGradeResults,
  getDashboardOverview
};
