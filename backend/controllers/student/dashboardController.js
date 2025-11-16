/**
 * Student Dashboard Controller
 * Handles student dashboard operations
 */

import User from '../../models/User.js';
import Exam from '../../models/Exam.js';
import Result from '../../models/Result.js';
import {
  sendSuccessResponse,
  sendErrorResponse,
  sendPaginatedResponse,
  asyncHandler
} from '../../utils/response.js';

// Get student dashboard stats
export const getDashboardStats = asyncHandler(async (req, res) => {
  const studentId = req.user._id;

  try {
    // Get user's exam statistics
    const examStats = await Result.aggregate([
      { $match: { student: studentId } },
      {
        $group: {
          _id: null,
          totalExams: { $sum: 1 },
          completedExams: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          averageScore: { $avg: '$scoring.percentage' },
          totalTimeSpent: { $sum: '$stats.totalTimeSpent' }
        }
      }
    ]);

    // Get upcoming exams
    const upcomingExams = await Exam.countDocuments({
      status: 'active',
      'schedule.startTime': { $gt: new Date() },
      $or: [
        { 'eligibility.students': { $in: [studentId] } },
        { 'eligibility.students': { $size: 0 } }
      ]
    });

    // Get recent results
    const recentResults = await Result.find({
      student: studentId,
      status: 'completed'
    })
      .populate('exam', 'title subject')
      .sort({ submittedAt: -1 })
      .limit(5)
      .select('scoring.percentage scoring.passed submittedAt exam');

    const stats = {
      totalExams: examStats[0]?.totalExams || 0,
      completedExams: examStats[0]?.completedExams || 0,
      averageScore: Math.round(examStats[0]?.averageScore || 0),
      upcomingExams,
      totalTimeSpent: Math.round(examStats[0]?.totalTimeSpent || 0),
      recentResults
    };

    sendSuccessResponse(res, 'Dashboard stats retrieved successfully', stats);
  } catch (error) {
    console.error('Dashboard stats error:', error);
    sendErrorResponse(res, 'Error retrieving dashboard stats', 500);
  }
});

// Get upcoming exams for student
export const getUpcomingExams = asyncHandler(async (req, res) => {
  const studentId = req.user._id;

  const upcomingExams = await Exam.find({
    status: 'active',
    'schedule.startTime': { $gt: new Date() },
    'eligibility.students': { $in: [studentId] }
  })
    .select('title description subject duration totalMarks schedule instructions')
    .sort({ 'schedule.startTime': 1 })
    .limit(10);

  // Transform data for frontend
  const examsWithDetails = upcomingExams.map(exam => ({
    _id: exam._id,
    title: exam.title,
    description: exam.description,
    subject: exam.subject,
    duration: exam.duration,
    totalMarks: exam.totalMarks,
    startTime: exam.schedule.startTime,
    endTime: exam.schedule.endTime,
    instructions: exam.instructions
  }));

  sendSuccessResponse(res, 'Upcoming exams retrieved successfully', examsWithDetails);
});

// Get recent results for student
export const getRecentResults = asyncHandler(async (req, res) => {
  const studentId = req.user._id;

  const results = await Result.find({
    student: studentId,
    status: { $in: ['completed', 'submitted'] }
  })
    .populate('exam', 'title subject totalMarks')
    .sort({ submittedAt: -1 })
    .limit(10)
    .select('scoring exam submittedAt status stats');

  // Transform data for frontend
  const resultsWithDetails = results.map(result => ({
    _id: result._id,
    exam: {
      _id: result.exam._id,
      title: result.exam.title,
      subject: result.exam.subject
    },
    percentage: result.scoring.percentage,
    marksObtained: result.scoring.marksObtained,
    totalMarks: result.scoring.totalMarks,
    passed: result.scoring.passed,
    status: result.scoring.passed ? 'pass' : 'fail',
    submittedAt: result.submittedAt,
    correctAnswers: result.stats.correctAnswers,
    totalQuestions: result.stats.totalQuestions
  }));

  sendSuccessResponse(res, 'Recent results retrieved successfully', resultsWithDetails);
});

// Get available exams for student
export const getAvailableExams = asyncHandler(async (req, res) => {
  const studentId = req.user._id;

  const availableExams = await Exam.find({
    status: 'active',
    'schedule.startTime': { $lte: new Date() },
    'schedule.endTime': { $gte: new Date() },
    'eligibility.students': { $in: [studentId] }
  })
    .select('title description subject duration totalMarks schedule instructions settings')
    .sort({ 'schedule.startTime': 1 });

  // Check which exams student has already attempted
  const attemptedExams = await Result.find({
    student: studentId,
    exam: { $in: availableExams.map(e => e._id) }
  }).distinct('exam');

  const examsWithStatus = availableExams.map(exam => ({
    _id: exam._id,
    title: exam.title,
    description: exam.description,
    subject: exam.subject,
    duration: exam.duration,
    totalMarks: exam.totalMarks,
    startTime: exam.schedule.startTime,
    endTime: exam.schedule.endTime,
    instructions: exam.instructions,
    hasAttempted: attemptedExams.includes(exam._id),
    maxAttempts: exam.eligibility.maxAttempts || 1,
    timeRemaining: Math.max(0, (exam.schedule.endTime - new Date()) / (1000 * 60)) // in minutes
  }));

  sendSuccessResponse(res, 'Available exams retrieved successfully', examsWithStatus);
});

// Get exam history for student
export const getExamHistory = asyncHandler(async (req, res) => {
  const studentId = req.user._id;
  const { page = 1, limit = 10 } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const results = await Result.find({ student: studentId })
    .populate('exam', 'title subject totalMarks')
    .sort({ submittedAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .select('scoring exam submittedAt status stats');

  const total = await Result.countDocuments({ student: studentId });

  const pagination = {
    page: parseInt(page),
    totalPages: Math.ceil(total / parseInt(limit)),
    totalItems: total,
    limit: parseInt(limit)
  };

  const examHistory = results.map(result => ({
    _id: result._id,
    exam: result.exam,
    percentage: result.scoring.percentage,
    grade: result.scoring.grade,
    passed: result.scoring.passed,
    submittedAt: result.submittedAt,
    totalQuestions: result.stats.totalQuestions,
    correctAnswers: result.stats.correctAnswers,
    timeSpent: result.stats.totalTimeSpent
  }));

  sendPaginatedResponse(res, examHistory, pagination, 'Exam history retrieved successfully');
});

export default {
  getDashboardStats,
  getUpcomingExams,
  getRecentResults,
  getAvailableExams,
  getExamHistory
};