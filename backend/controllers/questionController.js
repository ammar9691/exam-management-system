/**
 * Question Controller
 * Handles question management operations
 */

import Question from '../models/Question.js';
import Subject from '../models/Subject.js';
import { 
  sendSuccessResponse, 
  sendErrorResponse, 
  sendNotFoundResponse,
  sendPaginatedResponse,
  asyncHandler
} from '../utils/response.js';
import { getPaginatedResults } from '../utils/pagination.js';

// Get all questions
export const getAllQuestions = asyncHandler(async (req, res) => {
  const options = {
    searchFields: ['text', 'subject', 'topic', 'tags'],
    allowedFilters: ['subject', 'topic', 'type', 'difficulty', 'status', 'createdBy'],
    defaultSort: { createdAt: -1 },
    populate: [
      { path: 'createdBy', select: 'name email' },
      { path: 'lastModifiedBy', select: 'name email' }
    ]
  };

  const result = await getPaginatedResults(Question, req, options);
  sendPaginatedResponse(res, result.data, result.pagination, 'Questions retrieved successfully');
});

// Get question by ID
export const getQuestionById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const question = await Question.findById(id)
    .populate('createdBy', 'name email')
    .populate('lastModifiedBy', 'name email');
    
  if (!question) {
    return sendNotFoundResponse(res, 'Question');
  }

  // Update view count
  await question.updateAnalytics('view');

  sendSuccessResponse(res, 'Question retrieved successfully', { question });
});

// Create new question
export const createQuestion = asyncHandler(async (req, res) => {
  const {
    text, type, subject, topic, difficulty, marks, options,
    explanation, hints, tags, multimedia
  } = req.body;

  // Validate question type specific requirements
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
  const question = new Question({
    text,
    type,
    subject,
    topic,
    difficulty,
    marks,
    options: type === 'multiple-choice' || type === 'true-false' ? options : undefined,
    explanation,
    hints,
    tags,
    multimedia,
    createdBy: req.user.id
  });

  await question.save();

  sendSuccessResponse(res, 'Question created successfully', { question }, 201);
});

// Update question
export const updateQuestion = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    text, type, subject, topic, difficulty, marks, options,
    explanation, hints, tags, multimedia, status
  } = req.body;

  const question = await Question.findById(id);
  if (!question) {
    return sendNotFoundResponse(res, 'Question');
  }

  // Version control - create new version if question is published and content changed
  const contentChanged = text && text !== question.text || 
                        options && JSON.stringify(options) !== JSON.stringify(question.options);
  
  if (question.status === 'published' && contentChanged) {
    question.version.history.push({
      version: question.version.current,
      text: question.text,
      options: question.options,
      updatedBy: question.lastModifiedBy,
      updatedAt: question.updatedAt
    });
    question.version.current += 1;
  }

  // Update fields
  if (text) question.text = text;
  if (type) question.type = type;
  if (subject) question.subject = subject;
  if (topic) question.topic = topic;
  if (difficulty) question.difficulty = difficulty;
  if (marks) question.marks = marks;
  if (options) question.options = options;
  if (explanation) question.explanation = explanation;
  if (hints) question.hints = hints;
  if (tags) question.tags = tags;
  if (multimedia) question.multimedia = multimedia;
  if (status) question.status = status;

  question.lastModifiedBy = req.user.id;
  question.updatedAt = new Date();

  await question.save();

  sendSuccessResponse(res, 'Question updated successfully', { question });
});

// Delete question (soft delete)
export const deleteQuestion = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const question = await Question.findById(id);
  if (!question) {
    return sendNotFoundResponse(res, 'Question');
  }

  question.status = 'deleted';
  question.lastModifiedBy = req.user.id;
  question.updatedAt = new Date();
  await question.save();

  sendSuccessResponse(res, 'Question deleted successfully');
});

// Permanently delete question
export const permanentlyDeleteQuestion = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const question = await Question.findByIdAndDelete(id);
  if (!question) {
    return sendNotFoundResponse(res, 'Question');
  }

  sendSuccessResponse(res, 'Question permanently deleted');
});

// Restore deleted question
export const restoreQuestion = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const question = await Question.findById(id);
  if (!question) {
    return sendNotFoundResponse(res, 'Question');
  }

  if (question.status !== 'deleted') {
    return sendErrorResponse(res, 'Question is not deleted', 400);
  }

  question.status = 'draft';
  question.lastModifiedBy = req.user.id;
  question.updatedAt = new Date();
  await question.save();

  sendSuccessResponse(res, 'Question restored successfully');
});

// Update question status
export const updateQuestionStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const question = await Question.findById(id);
  if (!question) {
    return sendNotFoundResponse(res, 'Question');
  }

  question.status = status;
  question.updatedBy = req.user.id;
  question.updatedAt = new Date();
  await question.save();

  sendSuccessResponse(res, 'Question status updated successfully', {
    question: { id: question._id, status: question.status }
  });
});

// Get questions by subject
export const getQuestionsBySubject = asyncHandler(async (req, res) => {
  const { subject } = req.params;
  
  const options = {
    searchFields: ['text', 'topic', 'tags'],
    allowedFilters: ['topic', 'type', 'difficulty', 'status'],
    defaultSort: { difficulty: 1, createdAt: -1 }
  };

  req.query.subject = subject;
  
  const result = await getPaginatedResults(Question, req, options);
  sendPaginatedResponse(res, result.data, result.pagination, `Questions for ${subject} retrieved successfully`);
});

// Get questions by topic
export const getQuestionsByTopic = asyncHandler(async (req, res) => {
  const { subject, topic } = req.params;
  
  const options = {
    searchFields: ['text', 'tags'],
    allowedFilters: ['type', 'difficulty', 'status'],
    defaultSort: { difficulty: 1, createdAt: -1 }
  };

  req.query.subject = subject;
  req.query.topic = topic;
  
  const result = await getPaginatedResults(Question, req, options);
  sendPaginatedResponse(res, result.data, result.pagination, `Questions for ${subject}/${topic} retrieved successfully`);
});

// Get questions by difficulty
export const getQuestionsByDifficulty = asyncHandler(async (req, res) => {
  const { difficulty } = req.params;
  
  const options = {
    searchFields: ['text', 'subject', 'topic', 'tags'],
    allowedFilters: ['subject', 'topic', 'type', 'status'],
    defaultSort: { createdAt: -1 }
  };

  req.query.difficulty = difficulty;
  
  const result = await getPaginatedResults(Question, req, options);
  sendPaginatedResponse(res, result.data, result.pagination, `${difficulty} questions retrieved successfully`);
});

// Get random questions for practice
export const getRandomQuestions = asyncHandler(async (req, res) => {
  const { count = 10, subject, topic, difficulty, type } = req.query;
  
  const matchCriteria = { status: 'published' };
  if (subject) matchCriteria.subject = subject;
  if (topic) matchCriteria.topic = topic;
  if (difficulty) matchCriteria.difficulty = difficulty;
  if (type) matchCriteria.type = type;

  const questions = await Question.aggregate([
    { $match: matchCriteria },
    { $sample: { size: parseInt(count) } }
  ]);

  sendSuccessResponse(res, 'Random questions retrieved successfully', { questions });
});

// Validate question answer
export const validateAnswer = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { answer } = req.body;

  const question = await Question.findById(id);
  if (!question) {
    return sendNotFoundResponse(res, 'Question');
  }

  const isCorrect = question.validateAnswer(answer);
  
  // Update analytics
  await question.updateAnalytics('attempt', isCorrect);

  const response = {
    questionId: id,
    isCorrect,
    explanation: question.explanation,
    hints: question.hints
  };

  // Only show correct answer if answer was incorrect (for learning)
  if (!isCorrect && question.type === 'multiple-choice') {
    response.correctAnswer = question.options.find(opt => opt.isCorrect);
  }

  sendSuccessResponse(res, 'Answer validated', response);
});

// Get question statistics
export const getQuestionStats = asyncHandler(async (req, res) => {
  const stats = await Question.aggregate([
    {
      $group: {
        _id: null,
        totalQuestions: { $sum: 1 },
        publishedQuestions: { $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] } },
        draftQuestions: { $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] } },
        deletedQuestions: { $sum: { $cond: [{ $eq: ['$status', 'deleted'] }, 1, 0] } },
        multipleChoiceQuestions: { $sum: { $cond: [{ $eq: ['$type', 'multiple-choice'] }, 1, 0] } },
        trueFalseQuestions: { $sum: { $cond: [{ $eq: ['$type', 'true-false'] }, 1, 0] } },
        shortAnswerQuestions: { $sum: { $cond: [{ $eq: ['$type', 'short-answer'] }, 1, 0] } },
        essayQuestions: { $sum: { $cond: [{ $eq: ['$type', 'essay'] }, 1, 0] } },
        easyQuestions: { $sum: { $cond: [{ $eq: ['$difficulty', 'easy'] }, 1, 0] } },
        mediumQuestions: { $sum: { $cond: [{ $eq: ['$difficulty', 'medium'] }, 1, 0] } },
        hardQuestions: { $sum: { $cond: [{ $eq: ['$difficulty', 'hard'] }, 1, 0] } }
      }
    }
  ]);

  // Get questions by subject
  const subjectStats = await Question.aggregate([
    { $match: { status: 'published' } },
    {
      $group: {
        _id: '$subject',
        count: { $sum: 1 },
        avgMarks: { $avg: '$marks' }
      }
    },
    { $sort: { count: -1 } }
  ]);

  const result = {
    ...stats[0],
    subjectDistribution: subjectStats
  };

  sendSuccessResponse(res, 'Question statistics retrieved successfully', { stats: result });
});

// Bulk create questions
export const bulkCreateQuestions = asyncHandler(async (req, res) => {
  const { questions } = req.body;

  if (!Array.isArray(questions) || questions.length === 0) {
    return sendErrorResponse(res, 'Questions array is required', 400);
  }

  // Add creator to each question
  const questionsWithCreator = questions.map(q => ({
    ...q,
    createdBy: req.user.id
  }));

  try {
    const createdQuestions = await Question.insertMany(questionsWithCreator, { ordered: false });
    
    sendSuccessResponse(res, 'Questions created successfully', {
      created: createdQuestions.length,
      questions: createdQuestions
    }, 201);
  } catch (error) {
    // Handle partial success in bulk insert
    const created = error.insertedDocs || [];
    const failed = questions.length - created.length;
    
    sendSuccessResponse(res, 'Bulk create completed with some failures', {
      created: created.length,
      failed,
      questions: created,
      errors: error.writeErrors
    }, 207);
  }
});

// Bulk update questions
export const bulkUpdateQuestions = asyncHandler(async (req, res) => {
  const { questionIds, updates } = req.body;

  if (!Array.isArray(questionIds) || questionIds.length === 0) {
    return sendErrorResponse(res, 'Question IDs array is required', 400);
  }

  const allowedUpdates = ['status', 'difficulty', 'tags'];
  const updateData = {};
  
  Object.keys(updates).forEach(key => {
    if (allowedUpdates.includes(key)) {
      updateData[key] = updates[key];
    }
  });

  if (Object.keys(updateData).length === 0) {
    return sendErrorResponse(res, 'No valid update fields provided', 400);
  }

  updateData.updatedBy = req.user.id;
  updateData.updatedAt = new Date();

  const result = await Question.updateMany(
    { _id: { $in: questionIds } },
    { $set: updateData }
  );

  sendSuccessResponse(res, 'Questions updated successfully', {
    matchedCount: result.matchedCount,
    modifiedCount: result.modifiedCount
  });
});

// Export questions
export const exportQuestions = asyncHandler(async (req, res) => {
  const { format = 'json', subject, topic, difficulty, type } = req.query;

  const query = { status: 'published' };
  if (subject) query.subject = subject;
  if (topic) query.topic = topic;
  if (difficulty) query.difficulty = difficulty;
  if (type) query.type = type;

  const questions = await Question.find(query)
    .populate('createdBy', 'name')
    .sort({ subject: 1, topic: 1, difficulty: 1 });

  // TODO: Implement different export formats (CSV, PDF, etc.)
  sendSuccessResponse(res, 'Questions exported successfully', {
    format,
    count: questions.length,
    questions
  });
});

// Import questions from file
export const importQuestions = asyncHandler(async (req, res) => {
  // TODO: Implement file parsing and question import
  // This would handle CSV, JSON, or other formats
  
  sendSuccessResponse(res, 'Question import feature coming soon', {
    message: 'This feature will be implemented to handle bulk question imports from various file formats'
  });
});

// Get question version history
export const getQuestionHistory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const question = await Question.findById(id)
    .populate('version.history.updatedBy', 'name email')
    .select('version');

  if (!question) {
    return sendNotFoundResponse(res, 'Question');
  }

  sendSuccessResponse(res, 'Question history retrieved successfully', {
    currentVersion: question.version.current,
    history: question.version.history
  });
});

export default {
  getAllQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  permanentlyDeleteQuestion,
  restoreQuestion,
  updateQuestionStatus,
  getQuestionsBySubject,
  getQuestionsByTopic,
  getQuestionsByDifficulty,
  getRandomQuestions,
  validateAnswer,
  getQuestionStats,
  bulkCreateQuestions,
  bulkUpdateQuestions,
  exportQuestions,
  importQuestions,
  getQuestionHistory
};