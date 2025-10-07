/**
 * Admin Exam Controller
 * Handles admin-specific exam management operations
 */

import Exam from '../../models/Exam.js';
import Question from '../../models/Question.js';
import Result from '../../models/Result.js';
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

// Get all exams with advanced admin features
export const getAllExams = asyncHandler(async (req, res) => {
  const options = {
    searchFields: ['title', 'description', 'subject'],
    allowedFilters: [
      'subject', 'type', 'status', 'createdBy',
      'startDateFrom', 'startDateTo', 'endDateFrom', 'endDateTo'
    ],
    defaultSort: { 'schedule.startTime': -1 },
    populate: [
      { path: 'createdBy', select: 'name email' },
      { path: 'questions.question', select: 'question type difficulty marks' }
    ]
  };

  const result = await getPaginatedResults(Exam, req, options);
  sendPaginatedResponse(res, result.data, result.pagination, 'Exams retrieved successfully');
});

// Get exam statistics
export const getExamStats = asyncHandler(async (req, res) => {
  const stats = await Exam.aggregate([
    {
      $group: {
        _id: null,
        totalExams: { $sum: 1 },
        activeExams: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
        draftExams: { $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] } },
        completedExams: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        cancelledExams: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
        quizzes: { $sum: { $cond: [{ $eq: ['$type', 'quiz'] }, 1, 0] } },
        practiceExams: { $sum: { $cond: [{ $eq: ['$type', 'practice'] }, 1, 0] } },
        finalExams: { $sum: { $cond: [{ $eq: ['$type', 'final'] }, 1, 0] } },
        averageDuration: { $avg: '$duration' },
        averageMarks: { $avg: '$totalMarks' },
        totalMarks: { $sum: '$totalMarks' }
      }
    }
  ]);

  // Get subject-wise distribution
  const subjectDistribution = await Exam.aggregate([
    { $match: { status: { $ne: 'cancelled' } } },
    {
      $group: {
        _id: '$subject',
        count: { $sum: 1 },
        averageMarks: { $avg: '$totalMarks' },
        averageDuration: { $avg: '$duration' }
      }
    },
    { $sort: { count: -1 } }
  ]);

  // Get upcoming and ongoing exams
  const now = new Date();
  const upcomingExams = await Exam.countDocuments({
    'schedule.startTime': { $gt: now },
    status: 'active'
  });

  const ongoingExams = await Exam.countDocuments({
    'schedule.startTime': { $lte: now },
    'schedule.endTime': { $gte: now },
    status: 'active'
  });

  // Get monthly exam creation data
  const monthlyExams = await Exam.aggregate([
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
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  const result = {
    ...stats[0],
    subjectDistribution,
    upcomingExams,
    ongoingExams,
    monthlyExams
  };

  sendSuccessResponse(res, 'Exam statistics retrieved successfully', { stats: result });
});

// Create new exam
export const createExam = asyncHandler(async (req, res) => {
  const {
    title, description, subject, type, duration, totalMarks, passingMarks,
    questions, schedule, instructions, settings, eligibility
  } = req.body;

  // Validate questions exist
  if (questions && questions.length > 0) {
    const questionIds = questions.map(q => q.question);
    const existingQuestions = await Question.find({ _id: { $in: questionIds } });
    
    if (existingQuestions.length !== questionIds.length) {
      return sendErrorResponse(res, 'Some questions do not exist', 400);
    }
  }

  // Validate schedule
  if (schedule && schedule.endTime <= schedule.startTime) {
    return sendErrorResponse(res, 'End time must be after start time', 400);
  }

  // Calculate total marks from questions if not provided
  let calculatedTotalMarks = totalMarks;
  if (!totalMarks && questions && questions.length > 0) {
    calculatedTotalMarks = questions.reduce((sum, q) => sum + (q.marks || 1), 0);
  }

  // Create exam
  const exam = new Exam({
    title,
    description,
    subject,
    type: type || 'quiz',
    duration,
    totalMarks: calculatedTotalMarks,
    passingMarks: passingMarks || Math.ceil(calculatedTotalMarks * 0.6),
    questions: questions || [],
    schedule: schedule || {
      startTime: new Date(),
      endTime: new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours from now
    },
    instructions,
    settings: settings || {},
    eligibility: eligibility || {},
    createdBy: req.user.id,
    status: 'draft'
  });

  await exam.save();

  const populatedExam = await Exam.findById(exam._id)
    .populate('createdBy', 'name email')
    .populate('questions.question', 'question type difficulty marks');

  sendSuccessResponse(res, 'Exam created successfully', { exam: populatedExam }, 201);
});

// Update exam
export const updateExam = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const exam = await Exam.findById(id);
  if (!exam) {
    return sendNotFoundResponse(res, 'Exam');
  }

  // Check if exam has started (prevent major changes)
  const now = new Date();
  if (exam.schedule && exam.schedule.startTime <= now && exam.status === 'active') {
    const allowedFields = ['schedule.endTime', 'instructions', 'settings'];
    const hasRestrictedUpdates = Object.keys(updateData).some(field => 
      !allowedFields.includes(field) && updateData[field] !== undefined
    );
    
    if (hasRestrictedUpdates) {
      return sendErrorResponse(res, 'Cannot modify exam structure after it has started', 400);
    }
  }

  // Validate questions if being updated
  if (updateData.questions) {
    const questionIds = updateData.questions.map(q => q.question);
    const existingQuestions = await Question.find({ _id: { $in: questionIds } });
    
    if (existingQuestions.length !== questionIds.length) {
      return sendErrorResponse(res, 'Some questions do not exist', 400);
    }
  }

  // Update fields
  Object.keys(updateData).forEach(key => {
    if (key !== '_id' && key !== 'createdBy' && key !== 'createdAt') {
      if (key === 'schedule' || key === 'settings' || key === 'eligibility') {
        exam[key] = { ...exam[key], ...updateData[key] };
      } else {
        exam[key] = updateData[key];
      }
    }
  });

  exam.lastModifiedBy = req.user.id;
  await exam.save();

  const populatedExam = await Exam.findById(id)
    .populate('createdBy', 'name email')
    .populate('questions.question', 'question type difficulty marks');

  sendSuccessResponse(res, 'Exam updated successfully', { exam: populatedExam });
});

// Delete exam
export const deleteExam = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const exam = await Exam.findById(id);
  if (!exam) {
    return sendNotFoundResponse(res, 'Exam');
  }

  // Check if exam has results
  const hasResults = await Result.exists({ exam: id });
  if (hasResults) {
    return sendErrorResponse(res, 'Cannot delete exam with existing results', 400);
  }

  // Soft delete
  exam.status = 'cancelled';
  exam.lastModifiedBy = req.user.id;
  await exam.save();

  sendSuccessResponse(res, 'Exam cancelled successfully');
});

// Publish exam (make it active)
export const publishExam = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const exam = await Exam.findById(id);
  if (!exam) {
    return sendNotFoundResponse(res, 'Exam');
  }

  if (exam.status !== 'draft') {
    return sendErrorResponse(res, 'Only draft exams can be published', 400);
  }

  if (!exam.questions || exam.questions.length === 0) {
    return sendErrorResponse(res, 'Cannot publish exam without questions', 400);
  }

  exam.status = 'active';
  exam.lastModifiedBy = req.user.id;
  await exam.save();

  sendSuccessResponse(res, 'Exam published successfully');
});

// Get exam analytics
export const getExamAnalytics = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const exam = await Exam.findById(id)
    .populate('questions.question', 'question type difficulty marks');
  
  if (!exam) {
    return sendNotFoundResponse(res, 'Exam');
  }

  // Get result statistics
  const resultStats = await Result.aggregate([
    { $match: { exam: exam._id } },
    {
      $group: {
        _id: null,
        totalAttempts: { $sum: 1 },
        completedAttempts: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        averageScore: { $avg: '$scoring.percentage' },
        highestScore: { $max: '$scoring.percentage' },
        lowestScore: { $min: '$scoring.percentage' },
        passedStudents: { $sum: { $cond: ['$scoring.passed', 1, 0] } }
      }
    }
  ]);

  // Get score distribution
  const scoreDistribution = await Result.aggregate([
    { $match: { exam: exam._id, status: 'completed' } },
    {
      $bucket: {
        groupBy: '$scoring.percentage',
        boundaries: [0, 20, 40, 60, 80, 100],
        default: '100+',
        output: {
          count: { $sum: 1 },
          averageScore: { $avg: '$scoring.percentage' }
        }
      }
    }
  ]);

  // Get question-wise performance
  const questionPerformance = await Result.aggregate([
    { $match: { exam: exam._id, status: 'completed' } },
    { $unwind: '$answers' },
    {
      $group: {
        _id: '$answers.question',
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
    exam: {
      id: exam._id,
      title: exam.title,
      totalQuestions: exam.questions.length,
      totalMarks: exam.totalMarks,
      duration: exam.duration,
      status: exam.status
    },
    results: resultStats[0] || {
      totalAttempts: 0,
      completedAttempts: 0,
      averageScore: 0,
      highestScore: 0,
      lowestScore: 0,
      passedStudents: 0
    },
    scoreDistribution,
    questionPerformance
  };

  sendSuccessResponse(res, 'Exam analytics retrieved successfully', { analytics });
});

// Export exam results
export const exportExamResults = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { format = 'excel' } = req.query;

  const exam = await Exam.findById(id);
  if (!exam) {
    return sendNotFoundResponse(res, 'Exam');
  }

  const results = await Result.find({ exam: id })
    .populate('student', 'name email')
    .populate('exam', 'title subject totalMarks')
    .lean();

  if (format === 'csv') {
    const fields = [
      'student.name', 'student.email', 'scoring.marksObtained',
      'scoring.percentage', 'scoring.grade', 'scoring.passed',
      'stats.correctAnswers', 'stats.incorrectAnswers',
      'session.startTime', 'session.endTime', 'status'
    ];
    
    const parser = new Parser({ fields });
    const csv = parser.parse(results);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${exam.title}_results.csv"`);
    return res.send(csv);
  }

  // Excel format
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Results');
  
  // Add headers
  worksheet.addRow([
    'Student Name', 'Email', 'Marks Obtained', 'Total Marks', 'Percentage',
    'Grade', 'Passed', 'Correct Answers', 'Incorrect Answers',
    'Start Time', 'End Time', 'Status'
  ]);

  // Add data
  results.forEach(result => {
    worksheet.addRow([
      result.student?.name || 'N/A',
      result.student?.email || 'N/A',
      result.scoring?.marksObtained || 0,
      result.scoring?.totalMarks || 0,
      result.scoring?.percentage || 0,
      result.scoring?.grade || 'F',
      result.scoring?.passed ? 'Yes' : 'No',
      result.stats?.correctAnswers || 0,
      result.stats?.incorrectAnswers || 0,
      result.session?.startTime || 'N/A',
      result.session?.endTime || 'N/A',
      result.status || 'N/A'
    ]);
  });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${exam.title}_results.xlsx"`);
  
  await workbook.xlsx.write(res);
  res.end();
});

// Bulk operations for exams
export const bulkUpdateExams = asyncHandler(async (req, res) => {
  const { examIds, action, data } = req.body;

  if (!Array.isArray(examIds) || examIds.length === 0) {
    return sendErrorResponse(res, 'Exam IDs array is required', 400);
  }

  let updateQuery = { lastModifiedBy: req.user.id };
  let successMessage = '';

  switch (action) {
    case 'publish':
      updateQuery.status = 'active';
      successMessage = 'Exams published successfully';
      break;
    case 'cancel':
      updateQuery.status = 'cancelled';
      successMessage = 'Exams cancelled successfully';
      break;
    case 'complete':
      updateQuery.status = 'completed';
      successMessage = 'Exams marked as completed successfully';
      break;
    case 'updateDuration':
      if (!data.duration) {
        return sendErrorResponse(res, 'Duration is required', 400);
      }
      updateQuery.duration = data.duration;
      successMessage = `Exam duration updated to ${data.duration} minutes successfully`;
      break;
    default:
      return sendErrorResponse(res, 'Invalid action', 400);
  }

  const result = await Exam.updateMany(
    { _id: { $in: examIds } },
    updateQuery
  );

  sendSuccessResponse(res, successMessage, {
    modifiedCount: result.modifiedCount,
    matchedCount: result.matchedCount
  });
});

// Duplicate exam
export const duplicateExam = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const originalExam = await Exam.findById(id);
  if (!originalExam) {
    return sendNotFoundResponse(res, 'Exam');
  }

  const duplicatedExam = new Exam({
    ...originalExam.toObject(),
    _id: undefined,
    title: `${originalExam.title} (Copy)`,
    status: 'draft',
    createdBy: req.user.id,
    lastModifiedBy: undefined,
    createdAt: undefined,
    updatedAt: undefined,
    analytics: {
      totalAttempts: 0,
      completedAttempts: 0,
      averageScore: 0,
      averageTime: 0,
      passRate: 0
    },
    version: 1
  });

  await duplicatedExam.save();

  const populatedExam = await Exam.findById(duplicatedExam._id)
    .populate('createdBy', 'name email')
    .populate('questions.question', 'question type difficulty marks');

  sendSuccessResponse(res, 'Exam duplicated successfully', { exam: populatedExam }, 201);
});

export default {
  getAllExams,
  getExamStats,
  createExam,
  updateExam,
  deleteExam,
  publishExam,
  getExamAnalytics,
  exportExamResults,
  bulkUpdateExams,
  duplicateExam
};