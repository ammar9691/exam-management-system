/**
 * Admin Result Controller
 * Handles admin-specific result management operations
 */

import Result from '../../models/Result.js';
import Exam from '../../models/Exam.js';
import User from '../../models/User.js';
import {
  sendSuccessResponse,
  sendErrorResponse,
  sendNotFoundResponse,
  sendPaginatedResponse,
  asyncHandler
} from '../../utils/response.js';
import { getPaginatedResults } from '../../utils/pagination.js';
import { Parser } from 'json2csv';
import ExcelJS from 'exceljs';

// Get all results with advanced admin features
export const getAllResults = asyncHandler(async (req, res) => {
  const options = {
    searchFields: ['student', 'exam'],
    allowedFilters: [
      'status', 'exam', 'student', 'grade', 
      'submittedFrom', 'submittedTo', 'scoreFrom', 'scoreTo'
    ],
    defaultSort: { updatedAt: -1 },
    populate: [
      { path: 'student', select: 'name email role' },
      { path: 'exam', select: 'title subject totalMarks duration' }
    ]
  };

  const result = await getPaginatedResults(Result, req, options);
  sendPaginatedResponse(res, result.data, result.pagination, 'Results retrieved successfully');
});

// Get result statistics
export const getResultStats = asyncHandler(async (req, res) => {
  const stats = await Result.aggregate([
    {
      $group: {
        _id: null,
        totalResults: { $sum: 1 },
        completedResults: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        inProgressResults: { $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] } },
        gradedResults: { $sum: { $cond: [{ $eq: ['$status', 'graded'] }, 1, 0] } },
        averageScore: { $avg: '$scoring.percentage' },
        averageMarks: { $avg: '$scoring.marksObtained' },
        highestScore: { $max: '$scoring.percentage' },
        lowestScore: { $min: '$scoring.percentage' },
        totalAttempts: { $sum: '$attemptNumber' },
        passedResults: { $sum: { $cond: ['$scoring.passed', 1, 0] } }
      }
    }
  ]);

  // Get grade distribution
  const gradeDistribution = await Result.aggregate([
    { $match: { status: { $in: ['completed', 'graded'] } } },
    {
      $group: {
        _id: '$scoring.grade',
        count: { $sum: 1 },
        averageScore: { $avg: '$scoring.percentage' }
      }
    },
    { $sort: { '_id': 1 } }
  ]);

  // Get subject-wise performance
  const subjectPerformance = await Result.aggregate([
    { $match: { status: { $in: ['completed', 'graded'] } } },
    {
      $lookup: {
        from: 'exams',
        localField: 'exam',
        foreignField: '_id',
        as: 'examInfo'
      }
    },
    { $unwind: '$examInfo' },
    {
      $group: {
        _id: '$examInfo.subject',
        count: { $sum: 1 },
        averageScore: { $avg: '$scoring.percentage' },
        passRate: {
          $avg: {
            $cond: ['$scoring.passed', 1, 0]
          }
        }
      }
    },
    { $sort: { count: -1 } }
  ]);

  // Get recent results (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentResults = await Result.countDocuments({
    createdAt: { $gte: thirtyDaysAgo }
  });

  // Get monthly results data
  const monthlyResults = await Result.aggregate([
    {
      $match: {
        createdAt: { $gte: new Date(new Date().getFullYear(), 0, 1) }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        count: { $sum: 1 },
        averageScore: { $avg: '$scoring.percentage' }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  const result = {
    ...stats[0],
    gradeDistribution,
    subjectPerformance,
    recentResults,
    monthlyResults
  };

  sendSuccessResponse(res, 'Result statistics retrieved successfully', { stats: result });
});

// Get result by ID with detailed analytics
export const getResultById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const result = await Result.findById(id)
    .populate('student', 'name email profile')
    .populate('exam', 'title subject type duration totalMarks questions')
    .populate('answers.question', 'question type options correctAnswer explanation');
    
  if (!result) {
    return sendNotFoundResponse(res, 'Result');
  }

  // Add additional analytics
  const analytics = {
    timeEfficiency: result.stats.totalTimeSpent / (result.exam.duration * 60), // as percentage
    accuracy: (result.stats.correctAnswers / result.stats.totalQuestions) * 100,
    completionRate: (result.stats.attemptedQuestions / result.stats.totalQuestions) * 100,
    averageTimePerQuestion: result.stats.totalTimeSpent / result.stats.totalQuestions
  };

  sendSuccessResponse(res, 'Result retrieved successfully', { 
    result: {
      ...result.toObject(),
      analytics
    }
  });
});

// Manual grading for essay/subjective questions
export const gradeResult = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { answers, feedback, finalGrade } = req.body;

  const result = await Result.findById(id)
    .populate('exam', 'questions');
    
  if (!result) {
    return sendNotFoundResponse(res, 'Result');
  }

  if (result.status === 'graded') {
    return sendErrorResponse(res, 'Result has already been graded', 400);
  }

  // Update manual scores for specific answers
  if (answers) {
    answers.forEach(answerUpdate => {
      const answerIndex = result.answers.findIndex(
        a => a.question.toString() === answerUpdate.questionId
      );
      
      if (answerIndex !== -1) {
        result.answers[answerIndex].marksObtained = answerUpdate.marksAwarded;
        result.answers[answerIndex].reviewStatus = 'graded';
        result.answers[answerIndex].reviewComments = answerUpdate.comments;
      }
    });
  }

  // Recalculate total score
  const totalMarksObtained = result.answers.reduce(
    (sum, answer) => sum + (answer.marksObtained || 0), 0
  );
  
  result.scoring.marksObtained = totalMarksObtained;
  result.scoring.percentage = (totalMarksObtained / result.scoring.totalMarks) * 100;
  result.scoring.passed = result.scoring.percentage >= 
    ((result.exam.passingMarks / result.exam.totalMarks) * 100);
  
  // Assign grade based on percentage
  const percentage = result.scoring.percentage;
  if (percentage >= 90) result.scoring.grade = 'A+';
  else if (percentage >= 80) result.scoring.grade = 'A';
  else if (percentage >= 70) result.scoring.grade = 'B+';
  else if (percentage >= 60) result.scoring.grade = 'B';
  else if (percentage >= 50) result.scoring.grade = 'C+';
  else if (percentage >= 40) result.scoring.grade = 'C';
  else if (percentage >= 30) result.scoring.grade = 'D';
  else result.scoring.grade = 'F';

  // Add feedback
  if (feedback) {
    result.feedback = {
      ...result.feedback,
      instructor: feedback,
      gradedBy: req.user.id,
      gradedAt: new Date()
    };
  }

  // Override grade if provided
  if (finalGrade) {
    result.scoring.grade = finalGrade;
  }

  result.status = 'graded';
  await result.save();

  sendSuccessResponse(res, 'Result graded successfully', { result });
});

// Bulk operations for results
export const bulkUpdateResults = asyncHandler(async (req, res) => {
  const { resultIds, action, data } = req.body;

  if (!Array.isArray(resultIds) || resultIds.length === 0) {
    return sendErrorResponse(res, 'Result IDs array is required', 400);
  }

  let updateQuery = {};
  let successMessage = '';

  switch (action) {
    case 'markGraded':
      updateQuery = { status: 'graded' };
      successMessage = 'Results marked as graded successfully';
      break;
    case 'markReview':
      updateQuery = { status: 'under-review' };
      successMessage = 'Results marked for review successfully';
      break;
    case 'addFeedback':
      if (!data.feedback) {
        return sendErrorResponse(res, 'Feedback is required', 400);
      }
      updateQuery = { 
        'feedback.instructor': data.feedback,
        'feedback.gradedBy': req.user.id,
        'feedback.gradedAt': new Date()
      };
      successMessage = 'Feedback added to results successfully';
      break;
    default:
      return sendErrorResponse(res, 'Invalid action', 400);
  }

  const result = await Result.updateMany(
    { _id: { $in: resultIds } },
    updateQuery
  );

  sendSuccessResponse(res, successMessage, {
    modifiedCount: result.modifiedCount,
    matchedCount: result.matchedCount
  });
});

// Export results
export const exportResults = asyncHandler(async (req, res) => {
  const { 
    format = 'excel', 
    exam, 
    student, 
    status, 
    grade,
    dateFrom,
    dateTo
  } = req.query;
  
  let query = {};
  if (exam) query.exam = exam;
  if (student) query.student = student;
  if (status) query.status = status;
  if (grade) query['scoring.grade'] = grade;
  if (dateFrom || dateTo) {
    query.createdAt = {};
    if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
    if (dateTo) query.createdAt.$lte = new Date(dateTo);
  }

  const results = await Result.find(query)
    .populate('student', 'name email')
    .populate('exam', 'title subject totalMarks')
    .lean();

  if (format === 'csv') {
    const fields = [
      'student.name', 'student.email', 'exam.title', 'exam.subject',
      'scoring.marksObtained', 'scoring.totalMarks', 'scoring.percentage',
      'scoring.grade', 'scoring.passed', 'stats.correctAnswers',
      'stats.incorrectAnswers', 'stats.totalTimeSpent', 'status',
      'createdAt', 'updatedAt'
    ];
    
    const parser = new Parser({ fields });
    const csv = parser.parse(results);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="results.csv"');
    return res.send(csv);
  }

  // Excel format
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Results');
  
  // Add headers
  worksheet.addRow([
    'Student Name', 'Email', 'Exam Title', 'Subject', 'Marks Obtained',
    'Total Marks', 'Percentage', 'Grade', 'Passed', 'Correct Answers',
    'Incorrect Answers', 'Time Spent (min)', 'Status', 'Submitted At'
  ]);

  // Add data
  results.forEach(result => {
    worksheet.addRow([
      result.student?.name || 'N/A',
      result.student?.email || 'N/A',
      result.exam?.title || 'N/A',
      result.exam?.subject || 'N/A',
      result.scoring?.marksObtained || 0,
      result.scoring?.totalMarks || 0,
      result.scoring?.percentage || 0,
      result.scoring?.grade || 'F',
      result.scoring?.passed ? 'Yes' : 'No',
      result.stats?.correctAnswers || 0,
      result.stats?.incorrectAnswers || 0,
      Math.round((result.stats?.totalTimeSpent || 0) / 60),
      result.status || 'N/A',
      result.createdAt || 'N/A'
    ]);
  });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="results.xlsx"');
  
  await workbook.xlsx.write(res);
  res.end();
});

// Get performance analytics
export const getPerformanceAnalytics = asyncHandler(async (req, res) => {
  const { period = '30d', subject, examType } = req.query;
  
  // Calculate date range
  const now = new Date();
  let startDate;
  
  switch (period) {
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case '1y':
      startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      break;
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  let matchQuery = {
    createdAt: { $gte: startDate },
    status: { $in: ['completed', 'graded'] }
  };

  // Add filters if provided
  if (subject || examType) {
    const examFilters = {};
    if (subject) examFilters.subject = subject;
    if (examType) examFilters.type = examType;
    
    const examIds = await Exam.find(examFilters).distinct('_id');
    matchQuery.exam = { $in: examIds };
  }

  // Performance trends over time
  const performanceTrends = await Result.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        },
        averageScore: { $avg: '$scoring.percentage' },
        count: { $sum: 1 },
        passRate: {
          $avg: {
            $cond: ['$scoring.passed', 1, 0]
          }
        }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
  ]);

  // Top performing students
  const topStudents = await Result.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$student',
        averageScore: { $avg: '$scoring.percentage' },
        totalExams: { $sum: 1 },
        totalMarks: { $sum: '$scoring.marksObtained' }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'studentInfo'
      }
    },
    { $unwind: '$studentInfo' },
    { $sort: { averageScore: -1 } },
    { $limit: 10 }
  ]);

  // Difficulty analysis
  const difficultyAnalysis = await Result.aggregate([
    { $match: matchQuery },
    { $unwind: '$answers' },
    {
      $lookup: {
        from: 'questions',
        localField: 'answers.question',
        foreignField: '_id',
        as: 'questionInfo'
      }
    },
    { $unwind: '$questionInfo' },
    {
      $group: {
        _id: '$questionInfo.difficulty',
        totalAttempts: { $sum: 1 },
        correctAttempts: { $sum: { $cond: ['$answers.isCorrect', 1, 0] } },
        averageTimeSpent: { $avg: '$answers.timeSpent' }
      }
    },
    {
      $addFields: {
        successRate: {
          $multiply: [
            { $divide: ['$correctAttempts', '$totalAttempts'] },
            100
          ]
        }
      }
    }
  ]);

  const analytics = {
    period,
    dateRange: { from: startDate, to: now },
    performanceTrends,
    topStudents,
    difficultyAnalysis
  };

  sendSuccessResponse(res, 'Performance analytics retrieved successfully', { analytics });
});

// Delete result
export const deleteResult = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await Result.findByIdAndDelete(id);
  if (!result) {
    return sendNotFoundResponse(res, 'Result');
  }

  sendSuccessResponse(res, 'Result deleted successfully');
});

export default {
  getAllResults,
  getResultStats,
  getResultById,
  gradeResult,
  bulkUpdateResults,
  exportResults,
  getPerformanceAnalytics,
  deleteResult
};