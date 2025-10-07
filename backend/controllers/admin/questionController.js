/**
 * Admin Question Controller
 * Handles admin-specific question management operations
 */

import Question from '../../models/Question.js';
import Subject from '../../models/Subject.js';
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

// Get all questions with advanced admin features
export const getAllQuestions = asyncHandler(async (req, res) => {
  const options = {
    searchFields: ['question', 'subject', 'topic', 'tags'],
    allowedFilters: [
      'subject', 'topic', 'type', 'difficulty', 'status', 
      'createdBy', 'createdFrom', 'createdTo'
    ],
    defaultSort: { createdAt: -1 },
    populate: [
      { path: 'createdBy', select: 'name email' },
      { path: 'lastModifiedBy', select: 'name email' }
    ]
  };

  const result = await getPaginatedResults(Question, req, options);
  sendPaginatedResponse(res, result.data, result.pagination, 'Questions retrieved successfully');
});

// Get question statistics
export const getQuestionStats = asyncHandler(async (req, res) => {
  const stats = await Question.aggregate([
    {
      $group: {
        _id: null,
        totalQuestions: { $sum: 1 },
        activeQuestions: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
        draftQuestions: { $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] } },
        archivedQuestions: { $sum: { $cond: [{ $eq: ['$status', 'archived'] }, 1, 0] } },
        multipleChoice: { $sum: { $cond: [{ $eq: ['$type', 'multiple-choice'] }, 1, 0] } },
        trueFalse: { $sum: { $cond: [{ $eq: ['$type', 'true-false'] }, 1, 0] } },
        fillInBlank: { $sum: { $cond: [{ $eq: ['$type', 'fill-in-blank'] }, 1, 0] } },
        essay: { $sum: { $cond: [{ $eq: ['$type', 'essay'] }, 1, 0] } },
        easy: { $sum: { $cond: [{ $eq: ['$difficulty', 'easy'] }, 1, 0] } },
        medium: { $sum: { $cond: [{ $eq: ['$difficulty', 'medium'] }, 1, 0] } },
        hard: { $sum: { $cond: [{ $eq: ['$difficulty', 'hard'] }, 1, 0] } },
        averageMarks: { $avg: '$marks' },
        totalMarks: { $sum: '$marks' }
      }
    }
  ]);

  // Get subject-wise distribution
  const subjectDistribution = await Question.aggregate([
    { $match: { status: 'active' } },
    {
      $group: {
        _id: '$subject',
        count: { $sum: 1 },
        averageMarks: { $avg: '$marks' }
      }
    },
    { $sort: { count: -1 } }
  ]);

  // Get recent questions (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentQuestions = await Question.countDocuments({
    createdAt: { $gte: thirtyDaysAgo }
  });

  const result = {
    ...stats[0],
    subjectDistribution,
    recentQuestions
  };

  sendSuccessResponse(res, 'Question statistics retrieved successfully', { stats: result });
});

// Create new question with validation
export const createQuestion = asyncHandler(async (req, res) => {
  const {
    question, type, subject, topic, difficulty, marks, options,
    correctAnswer, explanation, hints, tags, multimedia
  } = req.body;

  // Validate question type requirements
  if (type === 'multiple-choice' && (!options || options.length < 2)) {
    return sendErrorResponse(res, 'Multiple choice questions must have at least 2 options', 400);
  }

  if (type === 'multiple-choice') {
    const correctOptions = options.filter(opt => opt.isCorrect);
    if (correctOptions.length === 0) {
      return sendErrorResponse(res, 'At least one option must be marked as correct', 400);
    }
  }

  // Create question
  const newQuestion = new Question({
    question,
    type,
    subject,
    topic,
    difficulty,
    marks: marks || 1,
    options: ['multiple-choice', 'true-false'].includes(type) ? options : undefined,
    correctAnswer,
    explanation,
    hints: hints || [],
    tags: tags || [],
    multimedia: multimedia || { images: [], videos: [], audio: [] },
    createdBy: req.user.id,
    status: 'active'
  });

  await newQuestion.save();

  const populatedQuestion = await Question.findById(newQuestion._id)
    .populate('createdBy', 'name email');

  sendSuccessResponse(res, 'Question created successfully', { question: populatedQuestion }, 201);
});

// Update question
export const updateQuestion = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const question = await Question.findById(id);
  if (!question) {
    return sendNotFoundResponse(res, 'Question');
  }

  // Version control for published questions
  const contentChanged = updateData.question && updateData.question !== question.question ||
                        updateData.options && JSON.stringify(updateData.options) !== JSON.stringify(question.options);
  
  if (question.status === 'active' && contentChanged) {
    question.version = (question.version || 1) + 1;
  }

  // Update fields
  Object.keys(updateData).forEach(key => {
    if (key !== '_id' && key !== 'createdBy' && key !== 'createdAt') {
      question[key] = updateData[key];
    }
  });

  question.lastModifiedBy = req.user.id;
  await question.save();

  const populatedQuestion = await Question.findById(id)
    .populate('createdBy', 'name email')
    .populate('lastModifiedBy', 'name email');

  sendSuccessResponse(res, 'Question updated successfully', { question: populatedQuestion });
});

// Delete question (soft delete)
export const deleteQuestion = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const question = await Question.findById(id);
  if (!question) {
    return sendNotFoundResponse(res, 'Question');
  }

  question.status = 'archived';
  question.lastModifiedBy = req.user.id;
  await question.save();

  sendSuccessResponse(res, 'Question archived successfully');
});

// Bulk operations for questions
export const bulkUpdateQuestions = asyncHandler(async (req, res) => {
  const { questionIds, action, data } = req.body;

  if (!Array.isArray(questionIds) || questionIds.length === 0) {
    return sendErrorResponse(res, 'Question IDs array is required', 400);
  }

  let updateQuery = { lastModifiedBy: req.user.id };
  let successMessage = '';

  switch (action) {
    case 'activate':
      updateQuery.status = 'active';
      successMessage = 'Questions activated successfully';
      break;
    case 'archive':
      updateQuery.status = 'archived';
      successMessage = 'Questions archived successfully';
      break;
    case 'changeDifficulty':
      if (!data.difficulty) {
        return sendErrorResponse(res, 'Difficulty is required', 400);
      }
      updateQuery.difficulty = data.difficulty;
      successMessage = `Questions difficulty changed to ${data.difficulty} successfully`;
      break;
    case 'changeSubject':
      if (!data.subject) {
        return sendErrorResponse(res, 'Subject is required', 400);
      }
      updateQuery.subject = data.subject;
      successMessage = `Questions subject changed to ${data.subject} successfully`;
      break;
    default:
      return sendErrorResponse(res, 'Invalid action', 400);
  }

  const result = await Question.updateMany(
    { _id: { $in: questionIds } },
    updateQuery
  );

  sendSuccessResponse(res, successMessage, {
    modifiedCount: result.modifiedCount,
    matchedCount: result.matchedCount
  });
});

// Import questions from Excel/CSV
export const importQuestions = asyncHandler(async (req, res) => {
  if (!req.file) {
    return sendErrorResponse(res, 'No file uploaded', 400);
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(req.file.buffer);
  
  const worksheet = workbook.getWorksheet(1);
  const questions = [];
  const errors = [];

  // Skip header row
  for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
    const row = worksheet.getRow(rowNumber);
    
    try {
      const questionData = {
        question: row.getCell(1).value,
        type: row.getCell(2).value,
        subject: row.getCell(3).value,
        topic: row.getCell(4).value,
        difficulty: row.getCell(5).value,
        marks: parseFloat(row.getCell(6).value) || 1,
        correctAnswer: row.getCell(7).value,
        explanation: row.getCell(8).value,
        createdBy: req.user.id,
        status: 'active'
      };

      // Parse options for multiple choice questions
      if (questionData.type === 'multiple-choice') {
        const optionsText = row.getCell(9).value;
        if (optionsText) {
          questionData.options = optionsText.split('|').map((opt, index) => ({
            text: opt.trim(),
            isCorrect: index === 0 // Assume first option is correct
          }));
        }
      }

      questions.push(questionData);
    } catch (error) {
      errors.push({ row: rowNumber, error: error.message });
    }
  }

  // Save valid questions
  const savedQuestions = await Question.insertMany(questions.filter(q => q.question));

  sendSuccessResponse(res, 'Questions imported successfully', {
    imported: savedQuestions.length,
    errors: errors.length,
    errorDetails: errors
  });
});

// Export questions to Excel/CSV
export const exportQuestions = asyncHandler(async (req, res) => {
  const { format = 'excel', subject, difficulty, status } = req.query;
  
  let query = {};
  if (subject) query.subject = subject;
  if (difficulty) query.difficulty = difficulty;
  if (status) query.status = status;

  const questions = await Question.find(query)
    .populate('createdBy', 'name')
    .lean();

  if (format === 'csv') {
    const fields = [
      'question', 'type', 'subject', 'topic', 'difficulty', 'marks',
      'correctAnswer', 'explanation', 'status', 'createdBy.name', 'createdAt'
    ];
    
    const parser = new Parser({ fields });
    const csv = parser.parse(questions);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="questions.csv"');
    return res.send(csv);
  }

  // Excel format
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Questions');
  
  // Add headers
  worksheet.addRow([
    'Question', 'Type', 'Subject', 'Topic', 'Difficulty', 'Marks',
    'Correct Answer', 'Explanation', 'Options', 'Status', 'Created By', 'Created At'
  ]);

  // Add data
  questions.forEach(q => {
    const options = q.options ? q.options.map(opt => opt.text).join('|') : '';
    worksheet.addRow([
      q.question, q.type, q.subject, q.topic, q.difficulty, q.marks,
      q.correctAnswer, q.explanation, options, q.status, 
      q.createdBy?.name, q.createdAt
    ]);
  });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="questions.xlsx"');
  
  await workbook.xlsx.write(res);
  res.end();
});

// Get question analytics
export const getQuestionAnalytics = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const question = await Question.findById(id)
    .populate('createdBy', 'name email');
    
  if (!question) {
    return sendNotFoundResponse(res, 'Question');
  }

  // Get usage analytics (this would be expanded with actual exam/result data)
  const analytics = {
    question: question,
    usage: {
      timesUsed: question.analytics.timesUsed || 0,
      correctAttempts: question.analytics.correctAttempts || 0,
      totalAttempts: question.analytics.totalAttempts || 0,
      successRate: question.successRate || 0,
      averageTimeSpent: question.analytics.averageTimeSpent || 0
    },
    performance: {
      difficulty: question.difficulty,
      difficultyRating: question.analytics.difficultyRating || 0,
      marks: question.marks
    }
  };

  sendSuccessResponse(res, 'Question analytics retrieved successfully', { analytics });
});

// Duplicate question
export const duplicateQuestion = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const originalQuestion = await Question.findById(id);
  if (!originalQuestion) {
    return sendNotFoundResponse(res, 'Question');
  }

  const duplicatedQuestion = new Question({
    ...originalQuestion.toObject(),
    _id: undefined,
    question: `${originalQuestion.question} (Copy)`,
    createdBy: req.user.id,
    lastModifiedBy: undefined,
    createdAt: undefined,
    updatedAt: undefined,
    analytics: {
      timesUsed: 0,
      correctAttempts: 0,
      totalAttempts: 0,
      averageTimeSpent: 0
    },
    version: 1
  });

  await duplicatedQuestion.save();

  const populatedQuestion = await Question.findById(duplicatedQuestion._id)
    .populate('createdBy', 'name email');

  sendSuccessResponse(res, 'Question duplicated successfully', { question: populatedQuestion }, 201);
});

export default {
  getAllQuestions,
  getQuestionStats,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  bulkUpdateQuestions,
  importQuestions,
  exportQuestions,
  getQuestionAnalytics,
  duplicateQuestion
};