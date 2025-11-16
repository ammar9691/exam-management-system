/**
 * Instructor Question Controller
 * Mirrors admin question management patterns for instructors (own questions only)
 */

import Question from '../../models/Question.js';
import User from '../../models/User.js';
import {
  sendSuccessResponse,
  sendErrorResponse,
  sendNotFoundResponse,
  asyncHandler
} from '../../utils/response.js';
import {
  parsePaginationParams,
  buildSearchQuery,
  buildFilterQuery,
  executePaginatedQuery
} from '../../utils/pagination.js';
import { Parser } from 'json2csv';
import ExcelJS from 'exceljs';

// Get questions accessible to the instructor with search, filters & pagination
// Visibility rules:
// - Instructor can see questions created by any admin
// - Instructor can see questions they created themselves
// - Instructor CANNOT see questions created by other instructors
export const getQuestions = asyncHandler(async (req, res) => {
  const instructorId = req.user._id;

  const searchFields = ['question', 'subject', 'topic', 'tags'];
  const allowedFilters = ['subject', 'topic', 'difficulty', 'status'];

  const { page, limit, sort, search } = parsePaginationParams(req);

  // Find all admin user IDs
  const adminUsers = await User.find({ role: 'admin' }).select('_id');
  const adminIds = adminUsers.map(u => u._id);

  // Questions must be created either by this instructor or by an admin
  let query = { createdBy: { $in: [...adminIds, instructorId] } };

  if (search) {
    const searchQuery = buildSearchQuery(search, searchFields);
    query = { ...query, ...searchQuery };
  }

  const filterQuery = buildFilterQuery(req, allowedFilters);
  query = { ...query, ...filterQuery };

  const { data, pagination } = await executePaginatedQuery(Question, query, {
    page,
    limit,
    sort: Object.keys(sort).length > 0 ? sort : { createdAt: -1 },
    populate: [
      { path: 'createdBy', select: 'name email' },
      { path: 'lastModifiedBy', select: 'name email' }
    ]
  });

  return sendSuccessResponse(
    res,
    'Instructor questions retrieved successfully',
    {
      questions: data,
      pagination
    }
  );
});

// Create a new question owned by the instructor (mirrors admin createQuestion)
export const createQuestion = asyncHandler(async (req, res) => {
  const {
    question,
    type,
    subject,
    topic,
    difficulty,
    marks,
    options,
    correctAnswer,
    explanation,
    hints,
    tags,
    multimedia
  } = req.body;

  if (!question || !subject || !difficulty) {
    return sendErrorResponse(
      res,
      'Question, subject and difficulty are required',
      400
    );
  }

  const questionType = type || 'multiple-choice';

  if (questionType === 'multiple-choice' && (!options || options.length < 2)) {
    return sendErrorResponse(
      res,
      'Multiple choice questions must have at least 2 options',
      400
    );
  }

  if (questionType === 'multiple-choice') {
    const correctOptions = options.filter(opt => opt.isCorrect);
    if (correctOptions.length === 0) {
      return sendErrorResponse(
        res,
        'At least one option must be marked as correct',
        400
      );
    }
  }

  const newQuestion = new Question({
    question,
    type: questionType,
    subject,
    topic,
    difficulty,
    marks: marks || 1,
    options,
    correctAnswer,
    explanation,
    hints: hints || [],
    tags: tags || [],
    multimedia: multimedia || { images: [], videos: [], audio: [] },
    createdBy: req.user._id,
    status: 'active'
  });

  await newQuestion.save();

  const populatedQuestion = await Question.findById(newQuestion._id)
    .populate('createdBy', 'name email');

  return sendSuccessResponse(
    res,
    'Question created successfully',
    { question: populatedQuestion },
    201
  );
});

// Update a question owned by the instructor (with versioning like admin)
export const updateQuestion = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const question = await Question.findById(id);
  if (!question) {
    return sendNotFoundResponse(res, 'Question');
  }

  // Permission: question must be created either by this instructor or by an admin
  const adminUsers = await User.find({ role: 'admin' }).select('_id');
  const adminIds = adminUsers.map(u => String(u._id));
  const createdByStr = String(question.createdBy);
  const instructorIdStr = String(req.user._id);

  if (createdByStr !== instructorIdStr && !adminIds.includes(createdByStr)) {
    return sendErrorResponse(res, 'Not authorized to modify this question', 403);
  }

  const contentChanged =
    (updateData.question && updateData.question !== question.question) ||
    (updateData.options &&
      JSON.stringify(updateData.options) !== JSON.stringify(question.options));

  if (question.status === 'active' && contentChanged) {
    question.version = (question.version || 1) + 1;
  }

  Object.keys(updateData).forEach(key => {
    if (key !== '_id' && key !== 'createdBy' && key !== 'createdAt') {
      question[key] = updateData[key];
    }
  });

  question.lastModifiedBy = req.user._id;
  await question.save();

  const populatedQuestion = await Question.findById(id)
    .populate('createdBy', 'name email')
    .populate('lastModifiedBy', 'name email');

  return sendSuccessResponse(
    res,
    'Question updated successfully',
    { question: populatedQuestion }
  );
});

// Soft-delete (archive) a question owned by the instructor
export const deleteQuestion = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const question = await Question.findById(id);
  if (!question) {
    return sendNotFoundResponse(res, 'Question');
  }

  // Permission: question must be created either by this instructor or by an admin
  const adminUsers = await User.find({ role: 'admin' }).select('_id');
  const adminIds = adminUsers.map(u => String(u._id));
  const createdByStr = String(question.createdBy);
  const instructorIdStr = String(req.user._id);

  if (createdByStr !== instructorIdStr && !adminIds.includes(createdByStr)) {
    return sendErrorResponse(res, 'Not authorized to delete this question', 403);
  }

  question.status = 'archived';
  question.lastModifiedBy = req.user._id;
  await question.save();

  return sendSuccessResponse(res, 'Question archived successfully');
});

// Bulk update questions owned by the instructor (status / difficulty / subject)
export const bulkUpdateQuestions = asyncHandler(async (req, res) => {
  const { questionIds, action, data } = req.body;

  if (!Array.isArray(questionIds) || questionIds.length === 0) {
    return sendErrorResponse(res, 'Question IDs array is required', 400);
  }

  let updateQuery = { lastModifiedBy: req.user._id };
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
      if (!data?.difficulty) {
        return sendErrorResponse(res, 'Difficulty is required', 400);
      }
      updateQuery.difficulty = data.difficulty;
      successMessage = `Questions difficulty changed to ${data.difficulty} successfully`;
      break;
    case 'changeSubject':
      if (!data?.subject) {
        return sendErrorResponse(res, 'Subject is required', 400);
      }
      updateQuery.subject = data.subject;
      successMessage = `Questions subject changed to ${data.subject} successfully`;
      break;
    default:
      return sendErrorResponse(res, 'Invalid action', 400);
  }

  // Only update questions created by this instructor or admins
  const adminUsers = await User.find({ role: 'admin' }).select('_id');
  const adminIds = adminUsers.map(u => u._id);

  const result = await Question.updateMany(
    { _id: { $in: questionIds }, createdBy: { $in: [...adminIds, req.user._id] } },
    updateQuery
  );

  return sendSuccessResponse(res, successMessage, {
    modifiedCount: result.modifiedCount,
    matchedCount: result.matchedCount
  });
});

// Export instructor questions (CSV/Excel) mirroring admin exportQuestions
export const exportQuestions = asyncHandler(async (req, res) => {
  const { format = 'excel', subject, difficulty, status } = req.query;

  // Export only questions created by this instructor or admins
  const adminUsers = await User.find({ role: 'admin' }).select('_id');
  const adminIds = adminUsers.map(u => u._id);

  const query = { createdBy: { $in: [...adminIds, req.user._id] } };
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
    res.setHeader('Content-Disposition', 'attachment; filename="instructor-questions.csv"');
    return res.send(csv);
  }

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Questions');

  worksheet.addRow([
    'Question', 'Type', 'Subject', 'Topic', 'Difficulty', 'Marks',
    'Correct Answer', 'Explanation', 'Options', 'Status', 'Created By', 'Created At'
  ]);

  questions.forEach(q => {
    const optionsText = q.options ? q.options.map(opt => opt.text).join('|') : '';
    worksheet.addRow([
      q.question,
      q.type,
      q.subject,
      q.topic,
      q.difficulty,
      q.marks,
      q.correctAnswer,
      q.explanation,
      optionsText,
      q.status,
      q.createdBy?.name,
      q.createdAt
    ]);
  });

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader(
    'Content-Disposition',
    'attachment; filename="instructor-questions.xlsx"'
  );

  await workbook.xlsx.write(res);
  res.end();
});

export default {
  getQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  bulkUpdateQuestions,
  exportQuestions
};
