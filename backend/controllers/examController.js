/**
 * Exam Controller
 * Handles exam management operations
 */

import Exam from '../models/Exam.js';
import Question from '../models/Question.js';
import Result from '../models/Result.js';
import { 
  sendSuccessResponse, 
  sendErrorResponse, 
  sendNotFoundResponse,
  sendPaginatedResponse,
  asyncHandler
} from '../utils/response.js';
import { getPaginatedResults } from '../utils/pagination.js';

// Get all exams
export const getAllExams = asyncHandler(async (req, res) => {
  const options = {
    searchFields: ['title', 'description', 'subject'],
    allowedFilters: ['subject', 'type', 'status', 'createdBy', 'startTimeFrom', 'startTimeTo'],
    defaultSort: { startTime: -1 },
    populate: [
      { path: 'createdBy', select: 'name email' },
      { path: 'questions.question', select: 'question type difficulty marks' }
    ]
  };

  const result = await getPaginatedResults(Exam, req, options);
  sendPaginatedResponse(res, result.data, result.pagination, 'Exams retrieved successfully');
});

// Get exam by ID
export const getExamById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const exam = await Exam.findById(id)
    .populate('createdBy', 'name email')
    .populate('questions.question', 'question type difficulty marks options explanation hints')
    .populate('eligibility.allowedUsers', 'name email')
    .populate('eligibility.allowedRoles');
    
  if (!exam) {
    return sendNotFoundResponse(res, 'Exam');
  }

  // Check if user is eligible to view exam details
  const isEligible = await exam.checkEligibility(req.user.id, req.user.role);
  if (!isEligible && req.user.role !== 'admin' && req.user.id !== exam.createdBy.toString()) {
    return sendErrorResponse(res, 'You are not eligible for this exam', 403);
  }

  sendSuccessResponse(res, 'Exam retrieved successfully', { exam });
});

// Create new exam
export const createExam = asyncHandler(async (req, res) => {
  const {
    title, description, subject, type, duration, totalMarks, questions,
    startTime, endTime, instructions, settings, eligibility
  } = req.body;

  // Validate questions exist
  const questionIds = questions.map(q => q.questionId);
  const existingQuestions = await Question.find({ _id: { $in: questionIds } });
  
  if (existingQuestions.length !== questionIds.length) {
    return sendErrorResponse(res, 'Some questions do not exist', 400);
  }

  // Calculate total marks from questions if not provided
  let calculatedTotalMarks = totalMarks;
  if (!totalMarks) {
    calculatedTotalMarks = questions.reduce((sum, q) => {
      const question = existingQuestions.find(eq => eq._id.toString() === q.questionId);
      return sum + (q.marks || question.marks);
    }, 0);
  }

  // Create exam
  const exam = new Exam({
    title,
    description,
    subject,
    type,
    duration,
    totalMarks: calculatedTotalMarks,
    questions,
    startTime,
    endTime,
    instructions,
    settings,
    eligibility,
    createdBy: req.user.id
  });

  await exam.save();

  sendSuccessResponse(res, 'Exam created successfully', { exam }, 201);
});

// Update exam
export const updateExam = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    title, description, subject, type, duration, totalMarks, questions,
    startTime, endTime, instructions, settings, eligibility, status
  } = req.body;

  const exam = await Exam.findById(id);
  if (!exam) {
    return sendNotFoundResponse(res, 'Exam');
  }

  // Check if exam has started (prevent major changes)
  const now = new Date();
  if (exam.startTime <= now && exam.status === 'active') {
    const allowedFields = ['endTime', 'instructions', 'settings.allowLateSubmission'];
    const hasRestrictedUpdates = Object.keys(req.body).some(field => 
      !allowedFields.includes(field) && req.body[field] !== undefined
    );
    
    if (hasRestrictedUpdates) {
      return sendErrorResponse(res, 'Cannot modify exam structure after it has started', 400);
    }
  }

  // If questions are being updated, validate them
  if (questions) {
    const questionIds = questions.map(q => q.questionId);
    const existingQuestions = await Question.find({ _id: { $in: questionIds } });
    
    if (existingQuestions.length !== questionIds.length) {
      return sendErrorResponse(res, 'Some questions do not exist', 400);
    }
  }

  // Update fields
  if (title) exam.title = title;
  if (description) exam.description = description;
  if (subject) exam.subject = subject;
  if (type) exam.type = type;
  if (duration) exam.duration = duration;
  if (totalMarks) exam.totalMarks = totalMarks;
  if (questions) exam.questions = questions;
  if (startTime) exam.startTime = startTime;
  if (endTime) exam.endTime = endTime;
  if (instructions) exam.instructions = instructions;
  if (settings) exam.settings = { ...exam.settings, ...settings };
  if (eligibility) exam.eligibility = { ...exam.eligibility, ...eligibility };
  if (status) exam.status = status;

  exam.updatedAt = new Date();
  await exam.save();

  sendSuccessResponse(res, 'Exam updated successfully', { exam });
});

// Delete exam (soft delete)
export const deleteExam = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const exam = await Exam.findById(id);
  if (!exam) {
    return sendNotFoundResponse(res, 'Exam');
  }

  // Check if exam has results
  const hasResults = await Result.exists({ examId: id });
  if (hasResults) {
    return sendErrorResponse(res, 'Cannot delete exam with existing results', 400);
  }

  exam.status = 'deleted';
  exam.updatedAt = new Date();
  await exam.save();

  sendSuccessResponse(res, 'Exam deleted successfully');
});

// Get exam question paper (for students during exam)
export const getExamQuestionPaper = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const exam = await Exam.findById(id)
    .populate('questions.question', 'question type options hints multimedia');
    
  if (!exam) {
    return sendNotFoundResponse(res, 'Exam');
  }

  // Check eligibility
  const isEligible = await exam.checkEligibility(req.user.id, req.user.role);
  if (!isEligible) {
    return sendErrorResponse(res, 'You are not eligible for this exam', 403);
  }

  // Check if exam is active and within time window
  const now = new Date();
  if (exam.status !== 'active' || now < exam.startTime || now > exam.endTime) {
    return sendErrorResponse(res, 'Exam is not currently active', 400);
  }

  // Generate question paper (shuffle if enabled)
  const questionPaper = await exam.generateQuestionPaper();
  
  sendSuccessResponse(res, 'Question paper retrieved successfully', {
    exam: {
      id: exam._id,
      title: exam.title,
      duration: exam.duration,
      totalMarks: exam.totalMarks,
      instructions: exam.instructions,
      settings: exam.settings
    },
    questions: questionPaper
  });
});

// Start exam session
export const startExamSession = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const exam = await Exam.findById(id);
  if (!exam) {
    return sendNotFoundResponse(res, 'Exam');
  }

  // Check eligibility
  const isEligible = await exam.checkEligibility(req.user.id, req.user.role);
  if (!isEligible) {
    return sendErrorResponse(res, 'You are not eligible for this exam', 403);
  }

  // Check if user has already attempted this exam
  const existingAttempt = await Result.findOne({ 
    studentId: req.user.id, 
    examId: id,
    status: { $in: ['in-progress', 'submitted'] }
  });

  if (existingAttempt && !exam.settings.allowMultipleAttempts) {
    return sendErrorResponse(res, 'You have already attempted this exam', 400);
  }

  // Create new result/session
  const result = new Result({
    studentId: req.user.id,
    examId: id,
    startTime: new Date(),
    status: 'in-progress',
    sessionInfo: {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
      browserFingerprint: req.body.browserFingerprint
    }
  });

  await result.save();

  sendSuccessResponse(res, 'Exam session started successfully', {
    sessionId: result._id,
    startTime: result.startTime,
    duration: exam.duration
  });
});

// Submit exam answers
export const submitExamAnswers = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { sessionId, answers } = req.body;
  
  const exam = await Exam.findById(id)
    .populate('questions.questionId');
  
  if (!exam) {
    return sendNotFoundResponse(res, 'Exam');
  }

  const result = await Result.findById(sessionId);
  if (!result || result.studentId.toString() !== req.user.id) {
    return sendErrorResponse(res, 'Invalid session', 400);
  }

  if (result.status !== 'in-progress') {
    return sendErrorResponse(res, 'Exam session is not active', 400);
  }

  // Calculate scores
  const scoringResult = await exam.calculateScore(answers);
  
  // Update result
  result.answers = answers;
  result.endTime = new Date();
  result.status = 'submitted';
  result.totalScore = scoringResult.totalScore;
  result.maxScore = scoringResult.maxScore;
  result.percentage = scoringResult.percentage;
  result.grade = result.calculateGrade();
  result.analytics = scoringResult.analytics;

  await result.save();

  // Update exam analytics
  await exam.updateAnalytics();

  sendSuccessResponse(res, 'Exam submitted successfully', {
    sessionId: result._id,
    totalScore: result.totalScore,
    maxScore: result.maxScore,
    percentage: result.percentage,
    grade: result.grade,
    submittedAt: result.endTime
  });
});

// Get exam results (for instructors/admins)
export const getExamResults = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const exam = await Exam.findById(id);
  if (!exam) {
    return sendNotFoundResponse(res, 'Exam');
  }

  const options = {
    searchFields: ['studentId'],
    allowedFilters: ['status', 'grade', 'submittedFrom', 'submittedTo'],
    defaultSort: { percentage: -1, endTime: -1 },
    populate: [
      { path: 'studentId', select: 'name email' }
    ]
  };

  // Add exam filter
  req.query.examId = id;
  
  const result = await getPaginatedResults(Result, req, options);
  sendPaginatedResponse(res, result.data, result.pagination, 'Exam results retrieved successfully');
});

// Get exam statistics
export const getExamStats = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const exam = await Exam.findById(id);
  if (!exam) {
    return sendNotFoundResponse(res, 'Exam');
  }

  const stats = await Result.aggregate([
    { $match: { examId: exam._id } },
    {
      $group: {
        _id: null,
        totalAttempts: { $sum: 1 },
        completedAttempts: { $sum: { $cond: [{ $eq: ['$status', 'submitted'] }, 1, 0] } },
        avgScore: { $avg: '$totalScore' },
        maxScore: { $max: '$totalScore' },
        minScore: { $min: '$totalScore' },
        avgPercentage: { $avg: '$percentage' }
      }
    }
  ]);

  // Grade distribution
  const gradeDistribution = await Result.aggregate([
    { $match: { examId: exam._id, status: 'submitted' } },
    {
      $group: {
        _id: '$grade',
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const result = {
    examInfo: {
      id: exam._id,
      title: exam.title,
      totalMarks: exam.totalMarks,
      duration: exam.duration
    },
    statistics: stats[0] || {
      totalAttempts: 0,
      completedAttempts: 0,
      avgScore: 0,
      maxScore: 0,
      minScore: 0,
      avgPercentage: 0
    },
    gradeDistribution
  };

  sendSuccessResponse(res, 'Exam statistics retrieved successfully', { stats: result });
});

// Get upcoming exams for student
export const getUpcomingExams = asyncHandler(async (req, res) => {
  const now = new Date();
  
  const exams = await Exam.find({
    status: 'active',
    startTime: { $gt: now },
    $or: [
      { 'eligibility.allowedUsers': req.user.id },
      { 'eligibility.allowedRoles': req.user.role },
      { 'eligibility.isPublic': true }
    ]
  })
  .populate('createdBy', 'name')
  .sort({ startTime: 1 })
  .select('title description subject type duration totalMarks startTime endTime instructions');

  sendSuccessResponse(res, 'Upcoming exams retrieved successfully', { exams });
});

// Get active exams for student
export const getActiveExams = asyncHandler(async (req, res) => {
  const now = new Date();
  
  const exams = await Exam.find({
    status: 'active',
    startTime: { $lte: now },
    endTime: { $gt: now },
    $or: [
      { 'eligibility.allowedUsers': req.user.id },
      { 'eligibility.allowedRoles': req.user.role },
      { 'eligibility.isPublic': true }
    ]
  })
  .populate('createdBy', 'name')
  .sort({ endTime: 1 })
  .select('title description subject type duration totalMarks startTime endTime instructions');

  // Check if student has already attempted each exam
  for (let exam of exams) {
    const attempt = await Result.findOne({
      studentId: req.user.id,
      examId: exam._id,
      status: { $in: ['in-progress', 'submitted'] }
    });
    
    exam._doc.hasAttempted = !!attempt;
    exam._doc.attemptStatus = attempt?.status;
  }

  sendSuccessResponse(res, 'Active exams retrieved successfully', { exams });
});

// Get student's exam history
export const getStudentExamHistory = asyncHandler(async (req, res) => {
  const options = {
    searchFields: ['examId'],
    allowedFilters: ['status', 'grade', 'subject'],
    defaultSort: { endTime: -1 },
    populate: [
      { path: 'examId', select: 'title subject type totalMarks' }
    ]
  };

  req.query.studentId = req.user.id;
  
  const result = await getPaginatedResults(Result, req, options);
  sendPaginatedResponse(res, result.data, result.pagination, 'Exam history retrieved successfully');
});

// Publish exam
export const publishExam = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const exam = await Exam.findById(id);
  if (!exam) {
    return sendNotFoundResponse(res, 'Exam');
  }

  // Validate exam before publishing
  if (!exam.questions || exam.questions.length === 0) {
    return sendErrorResponse(res, 'Cannot publish exam without questions', 400);
  }

  if (!exam.startTime || !exam.endTime) {
    return sendErrorResponse(res, 'Cannot publish exam without schedule', 400);
  }

  exam.status = 'active';
  exam.updatedAt = new Date();
  await exam.save();

  sendSuccessResponse(res, 'Exam published successfully');
});

// Archive exam
export const archiveExam = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const exam = await Exam.findById(id);
  if (!exam) {
    return sendNotFoundResponse(res, 'Exam');
  }

  exam.status = 'archived';
  exam.updatedAt = new Date();
  await exam.save();

  sendSuccessResponse(res, 'Exam archived successfully');
});

export default {
  getAllExams,
  getExamById,
  createExam,
  updateExam,
  deleteExam,
  getExamQuestionPaper,
  startExamSession,
  submitExamAnswers,
  getExamResults,
  getExamStats,
  getUpcomingExams,
  getActiveExams,
  getStudentExamHistory,
  publishExam,
  archiveExam
};