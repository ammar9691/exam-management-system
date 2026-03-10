/**
 * Exam Controller
 * Handles exam management operations
 */

import Exam from '../models/Exam.js';
import Question from '../models/Question.js';
import Result from '../models/Result.js';
import CandidateAttempt from '../models/CandidateAttempt.js';
import User from '../models/User.js';
import {
  sendSuccessResponse,
  sendErrorResponse,
  sendNotFoundResponse,
  sendPaginatedResponse,
  asyncHandler
} from '../utils/response.js';
import { getPaginatedResults } from '../utils/pagination.js';
import {
  MODULE_BLUEPRINTS,
  EXAM_TYPES,
  getModuleBlueprint,
  getTotalMcqCount,
  getTotalTimeMinutes,
  getCategoryBreakdown,
  getModulesForExam,
  getExamTypes
} from '../config/moduleBlueprints.js';
import {
  checkQDBSufficiency,
  selectQuestionsForExam,
  generateExamTitle,
  calculateExamStatistics,
  processQuestionsAfterExam
} from '../utils/examUtils.js';
import {
  generateConsolidatedResultPDF
} from '../utils/pdfGenerator.js';

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

  const allowedStatuses = ['draft', 'active', 'cancelled'];
  if (status && !allowedStatuses.includes(status)) {
    return sendErrorResponse(res, `Invalid status. Allowed statuses: ${allowedStatuses.join(', ')}`, 400);
  }

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

  exam.status = 'cancelled';
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

  exam.status = 'cancelled';
  exam.updatedAt = new Date();
  await exam.save();

  sendSuccessResponse(res, 'Exam archived successfully');
});

// Update exam status (generic API)
export const updateExamStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const allowedStatuses = ['draft', 'active', 'cancelled'];
  if (!allowedStatuses.includes(status)) {
    return sendErrorResponse(
      res,
      `Invalid status. Allowed statuses: ${allowedStatuses.join(', ')}`,
      400
    );
  }

  const exam = await Exam.findById(id);
  if (!exam) {
    return sendNotFoundResponse(res, 'Exam');
  }

  exam.status = status;
  exam.updatedAt = new Date();
  await exam.save();

  sendSuccessResponse(res, 'Exam status updated successfully', { exam });
});

// ============ MODULE-DRIVEN EXAM FUNCTIONS ============

/**
 * Get available modules for exam creation
 * GET /api/module-exams/modules
 */
export const getExamModules = asyncHandler(async (req, res) => {
  const modules = getModulesForExam();
  const examTypes = getExamTypes();

  sendSuccessResponse(res, 'Modules and exam types retrieved successfully', {
    modules,
    examTypes
  });
});

/**
 * Check QDB sufficiency for a module and exam type
 * POST /api/module-exams/check-sufficiency
 */
export const checkSufficiency = asyncHandler(async (req, res) => {
  const { moduleId, examType } = req.body;

  if (!moduleId || !examType) {
    return sendErrorResponse(res, 'Module ID and exam type are required', 400);
  }

  if (!Object.values(EXAM_TYPES).includes(examType)) {
    return sendErrorResponse(res, 'Invalid exam type. Must be "basic" or "type"', 400);
  }

  const sufficiency = await checkQDBSufficiency(moduleId, examType);

  sendSuccessResponse(res, 'Sufficiency check completed', sufficiency);
});

/**
 * Create a new module-driven exam
 * POST /api/module-exams
 * Body: { moduleId, examType, startAt, endAt }
 */
export const createModuleExam = asyncHandler(async (req, res) => {
  const { moduleId, examType, startAt, endAt } = req.body;
  const { user } = req;

  // Validate inputs
  if (!moduleId) {
    return sendErrorResponse(res, 'Module ID is required', 400);
  }

  if (!examType || !Object.values(EXAM_TYPES).includes(examType)) {
    return sendErrorResponse(res, 'Valid exam type (basic/type) is required', 400);
  }

  if (!startAt || !endAt) {
    return sendErrorResponse(res, 'Start and end times are required', 400);
  }

  const startDate = new Date(startAt);
  const endDate = new Date(endAt);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return sendErrorResponse(res, 'Invalid date format for start or end time', 400);
  }

  if (startDate < new Date()) {
    return sendErrorResponse(res, 'Start time must be in the future', 400);
  }

  if (endDate <= startDate) {
    return sendErrorResponse(res, 'End time must be after start time', 400);
  }

  // Get blueprint
  const blueprint = getModuleBlueprint(moduleId);
  if (!blueprint) {
    return sendErrorResponse(res, `Invalid module: ${moduleId}`, 400);
  }

  // Check QDB sufficiency
  const sufficiency = await checkQDBSufficiency(moduleId, examType);
  if (!sufficiency.sufficient) {
    return sendErrorResponse(res, sufficiency.error, 400, {
      insufficientCategories: sufficiency.insufficientCategories,
      categoryDetails: sufficiency.categoryDetails
    });
  }

  // Get next exam sequence
  const examSequence = await Exam.getNextExamSequence(moduleId, examType);

  // Select questions
  const selection = await selectQuestionsForExam(moduleId, examType, examSequence);
  if (!selection.success) {
    return sendErrorResponse(res, selection.error, 400);
  }

  // Validate selection has expected question count
  const expectedCount = getTotalMcqCount(moduleId);
  if (selection.questionIds.length !== expectedCount) {
    return sendErrorResponse(res, `Question selection mismatch. Expected ${expectedCount}, got ${selection.questionIds.length}`, 500);
  }

  // Generate exam title
  const title = generateExamTitle(moduleId, examType, examSequence);

  // Get total questions and time from blueprint
  const totalQuestions = expectedCount;
  const totalTimeMinutes = getTotalTimeMinutes(moduleId);
  const categoryBreakdown = getCategoryBreakdown(moduleId);

  // Create exam
  const exam = new Exam({
    title,
    description: `${blueprint.name} - ${examType === 'basic' ? 'Basic' : 'Type'} Examination`,
    subject: blueprint.shortName,

    // Module-driven fields
    moduleId,
    moduleName: blueprint.name,
    examType,
    paperQuestionIds: selection.questionIds,
    blueprintTotalQuestions: totalQuestions,
    blueprintTotalTimeMinutes: totalTimeMinutes,
    categoryBreakdown,
    examSequence,
    isModuleDriven: true,
    examStatus: 'scheduled',
    startAt: startDate,
    endAt: endDate,

    // Legacy fields for compatibility
    type: 'final',
    duration: totalTimeMinutes,
    totalMarks: totalQuestions,
    passingMarks: Math.ceil(totalQuestions * 0.75),
    questions: selection.questionIds.map((qId, index) => ({
      question: qId,
      marks: 1,
      negativeMarks: 0,
      order: index + 1
    })),
    schedule: {
      startTime: startDate,
      endTime: endDate
    },
    settings: {
      randomizeQuestions: true,
      randomizeOptions: true,
      showResults: true,
      showCorrectAnswers: false,
      allowReview: true,
      allowBackNavigation: true,
      autoSubmit: true
    },
    status: 'active',
    createdBy: user._id
  });

  await exam.save();

  // Mark questions as used
  await Question.bulkMarkAsUsed(
    selection.questionIds,
    exam._id,
    examType,
    examSequence,
    user._id,
    user.name
  );

  sendSuccessResponse(res, 'Exam created successfully', {
    exam: {
      _id: exam._id,
      title: exam.title,
      moduleId: exam.moduleId,
      moduleName: exam.moduleName,
      examType: exam.examType,
      totalQuestions: exam.blueprintTotalQuestions,
      totalTimeMinutes: exam.blueprintTotalTimeMinutes,
      startAt: exam.startAt,
      endAt: exam.endAt,
      examSequence: exam.examSequence,
      examStatus: exam.examStatus,
      categoryBreakdown: exam.categoryBreakdown
    }
  }, 201);
});

/**
 * Get all module-driven exams
 * GET /api/module-exams
 */
export const getModuleExams = asyncHandler(async (req, res) => {
  const { status, moduleId, examType, page = 1, limit = 20 } = req.query;
  const { user } = req;

  const query = { isModuleDriven: true };

  if (status) {
    query.examStatus = status;
  }
  if (moduleId) {
    query.moduleId = moduleId;
  }
  if (examType) {
    query.examType = examType;
  }

  // Instructors only see their own exams
  if (user.role === 'instructor') {
    query.createdBy = user._id;
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [exams, total] = await Promise.all([
    Exam.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-questions -paperQuestionIds'),
    Exam.countDocuments(query)
  ]);

  sendSuccessResponse(res, 'Module exams retrieved successfully', {
    exams,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

/**
 * Get module exam by ID
 * GET /api/module-exams/:id
 */
export const getModuleExamById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { user } = req;

  const exam = await Exam.findById(id)
    .populate('createdBy', 'name email')
    .populate('assignedCandidateIds', 'name email');

  if (!exam) {
    return sendNotFoundResponse(res, 'Exam');
  }

  if (!exam.isModuleDriven) {
    return sendErrorResponse(res, 'This is not a module-driven exam', 400);
  }

  // Check access rights
  if (user.role === 'instructor' && exam.createdBy._id.toString() !== user._id.toString()) {
    return sendErrorResponse(res, 'Access denied', 403);
  }

  // Get attempt statistics
  const attemptStats = await CandidateAttempt.aggregate([
    { $match: { examId: exam._id } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const statsMap = {};
  attemptStats.forEach(s => { statsMap[s._id] = s.count; });

  sendSuccessResponse(res, 'Module exam retrieved successfully', {
    exam,
    attemptStats: {
      notStarted: statsMap.not_started || 0,
      inProgress: statsMap.in_progress || 0,
      paused: statsMap.paused || 0,
      completed: statsMap.completed || 0,
      quit: statsMap.quit || 0,
      timeout: statsMap.timeout || 0,
      blockedLate: statsMap.blocked_late || 0
    }
  });
});

/**
 * Assign candidates to an exam
 * POST /api/module-exams/:id/assign
 */
export const assignCandidates = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { candidateIds } = req.body;
  const { user } = req;

  if (!candidateIds || !Array.isArray(candidateIds) || candidateIds.length === 0) {
    return sendErrorResponse(res, 'Candidate IDs array is required', 400);
  }

  const exam = await Exam.findById(id);
  if (!exam) {
    return sendNotFoundResponse(res, 'Exam');
  }

  if (!exam.isModuleDriven) {
    return sendErrorResponse(res, 'This endpoint is only for module-driven exams', 400);
  }

  // Check access rights
  if (user.role === 'instructor' && exam.createdBy.toString() !== user._id.toString()) {
    return sendErrorResponse(res, 'Access denied', 403);
  }

  // Verify all candidates exist and are students
  const candidates = await User.find({
    _id: { $in: candidateIds },
    role: 'student'
  });

  if (candidates.length !== candidateIds.length) {
    return sendErrorResponse(res, 'Some candidate IDs are invalid or not students', 400);
  }

  // Add new candidates
  const existingIds = new Set(exam.assignedCandidateIds.map(id => id.toString()));
  const newCandidateIds = candidateIds.filter(id => !existingIds.has(id.toString()));

  exam.assignedCandidateIds.push(...newCandidateIds);
  await exam.save();

  // Create CandidateAttempt records
  const attemptPromises = newCandidateIds.map(candidateId =>
    CandidateAttempt.findOneAndUpdate(
      { examId: exam._id, candidateId },
      {
        examId: exam._id,
        candidateId,
        status: 'not_started',
        createdBy: user._id
      },
      { upsert: true, new: true }
    )
  );

  await Promise.all(attemptPromises);

  sendSuccessResponse(res, 'Candidates assigned successfully', {
    assignedCount: newCandidateIds.length,
    totalAssigned: exam.assignedCandidateIds.length
  });
});

/**
 * Get consolidated results for an exam
 * GET /api/module-exams/:id/consolidated-result
 */
export const getConsolidatedResult = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { user } = req;

  const exam = await Exam.findById(id);
  if (!exam) {
    return sendNotFoundResponse(res, 'Exam');
  }

  // Check access rights
  if (user.role === 'instructor' && exam.createdBy.toString() !== user._id.toString()) {
    return sendErrorResponse(res, 'Access denied', 403);
  }

  const results = await CandidateAttempt.getConsolidatedResults(exam._id);

  sendSuccessResponse(res, 'Consolidated results retrieved successfully', {
    exam: {
      _id: exam._id,
      title: exam.title,
      moduleId: exam.moduleId,
      moduleName: exam.moduleName,
      examType: exam.examType,
      startAt: exam.startAt,
      endAt: exam.endAt
    },
    results
  });
});

/**
 * Get consolidated results as PDF
 * GET /api/module-exams/:id/consolidated-result.pdf
 */
export const getConsolidatedResultPDF = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { user } = req;

  const exam = await Exam.findById(id);
  if (!exam) {
    return sendNotFoundResponse(res, 'Exam');
  }

  // Check access rights
  if (user.role === 'instructor' && exam.createdBy.toString() !== user._id.toString()) {
    return sendErrorResponse(res, 'Access denied', 403);
  }

  const attempts = await CandidateAttempt.find({
    examId: exam._id,
    status: { $in: ['completed', 'quit', 'timeout'] }
  }).populate('candidateId', 'name email');

  const stats = calculateExamStatistics(attempts);

  const pdfBuffer = await generateConsolidatedResultPDF(exam, attempts, stats);

  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="consolidated_results_${exam._id}.pdf"`,
    'Content-Length': pdfBuffer.length
  });

  res.send(pdfBuffer);
});

/**
 * End an exam
 * POST /api/module-exams/:id/end
 */
export const endModuleExam = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { user } = req;

  const exam = await Exam.findById(id);
  if (!exam) {
    return sendNotFoundResponse(res, 'Exam');
  }

  if (exam.examStatus === 'ended' || exam.examStatus === 'archived') {
    return sendErrorResponse(res, 'Exam has already ended', 400);
  }

  // Get questions for result calculation
  const questions = await Question.find({
    _id: { $in: exam.paperQuestionIds }
  });

  // Force submit all active attempts
  const activeAttempts = await CandidateAttempt.find({
    examId: exam._id,
    status: { $in: ['in_progress', 'paused'] }
  });

  let submitErrors = 0;
  for (const attempt of activeAttempts) {
    try {
      await attempt.submit(questions, 'force_submit');
    } catch (err) {
      console.error(`Failed to force-submit attempt ${attempt._id}:`, err.message);
      submitErrors++;
    }
  }

  // Update exam status
  exam.examStatus = 'ended';
  await exam.save();

  // Apply 5% question rotation
  if (!exam.questionsRested) {
    const rotationResult = await processQuestionsAfterExam(
      exam.paperQuestionIds,
      exam._id,
      exam.examType,
      exam.examSequence,
      user._id,
      user.name
    );

    exam.questionsRested = true;
    exam.restedQuestionIds = rotationResult.restedQuestionIds;
    await exam.save();
  }

  sendSuccessResponse(res, 'Exam ended successfully', {
    forceSubmittedCount: activeAttempts.length,
    examStatus: exam.examStatus
  });
});

/**
 * Get module exam statistics
 * GET /api/module-exams/:id/stats
 */
/**
 * Get Question Paper Analysis (QPA) for an exam
 * Analyzes per-question performance and flags questions answered incorrectly by >50% candidates
 * GET /api/module-exams/:id/qpa
 */
export const getQuestionPaperAnalysis = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { user } = req;

  const exam = await Exam.findById(id);
  if (!exam) {
    return sendNotFoundResponse(res, 'Exam');
  }

  if (user.role === 'instructor' && exam.createdBy.toString() !== user._id.toString()) {
    return sendErrorResponse(res, 'Access denied', 403);
  }

  // Get all completed attempts with answers
  const attempts = await CandidateAttempt.find({
    examId: exam._id,
    status: { $in: ['completed', 'quit', 'timeout'] }
  });

  if (attempts.length === 0) {
    return sendSuccessResponse(res, 'No completed attempts for QPA', {
      exam: { _id: exam._id, title: exam.title, moduleId: exam.moduleId, moduleName: exam.moduleName },
      totalCandidates: 0,
      questions: [],
      flaggedQuestions: [],
      summary: null
    });
  }

  // Get all questions in the exam paper
  const questions = await Question.find({
    _id: { $in: exam.paperQuestionIds }
  }).select('serialNo questionText module category knowledgeLevel syllabusReference options analytics');

  const totalCandidates = attempts.length;

  // Analyze each question
  const questionAnalysis = questions.map(question => {
    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;
    let totalTimeSpent = 0;
    let timeCount = 0;

    // Per-option selection counts
    const optionSelections = {};
    question.options.forEach(opt => {
      optionSelections[opt._id.toString()] = { count: 0, text: opt.text, isCorrect: opt.isCorrect };
    });

    attempts.forEach(attempt => {
      const answer = attempt.answers.find(
        a => a.questionId.toString() === question._id.toString()
      );

      if (!answer || (!answer.selectedOptionId && !answer.selectedAnswer)) {
        unansweredCount++;
      } else if (answer.isCorrect) {
        correctCount++;
      } else {
        incorrectCount++;
      }

      // Track option selections
      if (answer?.selectedOptionId) {
        const optId = answer.selectedOptionId.toString();
        if (optionSelections[optId]) {
          optionSelections[optId].count++;
        }
      }

      // Track time spent
      if (answer?.timeSpent > 0) {
        totalTimeSpent += answer.timeSpent;
        timeCount++;
      }
    });

    const incorrectPercentage = totalCandidates > 0
      ? ((incorrectCount + unansweredCount) / totalCandidates) * 100
      : 0;

    const correctPercentage = totalCandidates > 0
      ? (correctCount / totalCandidates) * 100
      : 0;

    return {
      questionId: question._id,
      serialNo: question.serialNo,
      questionText: question.questionText,
      module: question.module,
      category: question.category,
      knowledgeLevel: question.knowledgeLevel,
      syllabusReference: question.syllabusReference,
      correctCount,
      incorrectCount,
      unansweredCount,
      totalCandidates,
      correctPercentage: Math.round(correctPercentage * 10) / 10,
      incorrectPercentage: Math.round(incorrectPercentage * 10) / 10,
      averageTimeSpent: timeCount > 0 ? Math.round(totalTimeSpent / timeCount) : 0,
      isFlagged: incorrectPercentage > 50,
      optionDistribution: Object.values(optionSelections)
    };
  });

  // Sort: flagged first, then by incorrect percentage descending
  questionAnalysis.sort((a, b) => {
    if (a.isFlagged !== b.isFlagged) return b.isFlagged - a.isFlagged;
    return b.incorrectPercentage - a.incorrectPercentage;
  });

  const flaggedQuestions = questionAnalysis.filter(q => q.isFlagged);

  const summary = {
    totalQuestions: questions.length,
    totalCandidates,
    flaggedCount: flaggedQuestions.length,
    flaggedPercentage: Math.round((flaggedQuestions.length / questions.length) * 100 * 10) / 10,
    averageCorrectPercentage: Math.round(
      (questionAnalysis.reduce((sum, q) => sum + q.correctPercentage, 0) / questionAnalysis.length) * 10
    ) / 10,
    hardestQuestion: questionAnalysis.length > 0 ? {
      serialNo: questionAnalysis[0].serialNo,
      incorrectPercentage: questionAnalysis[0].incorrectPercentage
    } : null,
    easiestQuestion: questionAnalysis.length > 0 ? {
      serialNo: questionAnalysis[questionAnalysis.length - 1].serialNo,
      correctPercentage: questionAnalysis[questionAnalysis.length - 1].correctPercentage
    } : null
  };

  sendSuccessResponse(res, 'Question Paper Analysis generated successfully', {
    exam: {
      _id: exam._id,
      title: exam.title,
      moduleId: exam.moduleId,
      moduleName: exam.moduleName,
      examType: exam.examType,
      startAt: exam.startAt,
      endAt: exam.endAt
    },
    totalCandidates,
    questions: questionAnalysis,
    flaggedQuestions,
    summary
  });
});

/**
 * Get QPA as PDF
 * GET /api/module-exams/:id/qpa.pdf
 */
export const getQuestionPaperAnalysisPDF = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { user } = req;

  const exam = await Exam.findById(id);
  if (!exam) {
    return sendNotFoundResponse(res, 'Exam');
  }

  if (user.role === 'instructor' && exam.createdBy.toString() !== user._id.toString()) {
    return sendErrorResponse(res, 'Access denied', 403);
  }

  const attempts = await CandidateAttempt.find({
    examId: exam._id,
    status: { $in: ['completed', 'quit', 'timeout'] }
  });

  const questions = await Question.find({
    _id: { $in: exam.paperQuestionIds }
  }).select('serialNo questionText module category knowledgeLevel options');

  const totalCandidates = attempts.length;

  // Build analysis data
  const questionAnalysis = questions.map(question => {
    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;

    attempts.forEach(attempt => {
      const answer = attempt.answers.find(
        a => a.questionId.toString() === question._id.toString()
      );
      if (!answer || (!answer.selectedOptionId && !answer.selectedAnswer)) {
        unansweredCount++;
      } else if (answer.isCorrect) {
        correctCount++;
      } else {
        incorrectCount++;
      }
    });

    const incorrectPercentage = totalCandidates > 0
      ? ((incorrectCount + unansweredCount) / totalCandidates) * 100
      : 0;

    return {
      serialNo: question.serialNo,
      questionText: question.questionText,
      category: question.category,
      knowledgeLevel: question.knowledgeLevel,
      correctCount,
      incorrectCount,
      unansweredCount,
      incorrectPercentage: Math.round(incorrectPercentage * 10) / 10,
      isFlagged: incorrectPercentage > 50
    };
  });

  questionAnalysis.sort((a, b) => b.incorrectPercentage - a.incorrectPercentage);

  const { generateQPAPDF } = await import('../utils/pdfGenerator.js');
  const pdfBuffer = await generateQPAPDF(exam, questionAnalysis, totalCandidates);

  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="qpa_${exam._id}.pdf"`,
    'Content-Length': pdfBuffer.length
  });

  res.send(pdfBuffer);
});

export const getModuleExamStats = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const exam = await Exam.findById(id);
  if (!exam) {
    return sendNotFoundResponse(res, 'Exam');
  }

  const attempts = await CandidateAttempt.find({ examId: exam._id });
  const stats = calculateExamStatistics(attempts);

  sendSuccessResponse(res, 'Exam stats retrieved successfully', {
    exam: {
      _id: exam._id,
      title: exam.title,
      moduleId: exam.moduleId,
      examType: exam.examType,
      examStatus: exam.examStatus,
      totalQuestions: exam.blueprintTotalQuestions,
      totalTimeMinutes: exam.blueprintTotalTimeMinutes
    },
    stats,
    assignedCount: exam.assignedCandidateIds.length,
    attemptBreakdown: {
      notStarted: attempts.filter(a => a.status === 'not_started').length,
      inProgress: attempts.filter(a => a.status === 'in_progress').length,
      paused: attempts.filter(a => a.status === 'paused').length,
      completed: attempts.filter(a => a.status === 'completed').length,
      quit: attempts.filter(a => a.status === 'quit').length,
      timeout: attempts.filter(a => a.status === 'timeout').length,
      blockedLate: attempts.filter(a => a.status === 'blocked_late').length
    }
  });
});

export default {
  // Legacy exam functions
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
  archiveExam,
  updateExamStatus,
  // Module-driven exam functions
  getExamModules,
  checkSufficiency,
  createModuleExam,
  getModuleExams,
  getModuleExamById,
  assignCandidates,
  getConsolidatedResult,
  getConsolidatedResultPDF,
  endModuleExam,
  getModuleExamStats,
  getQuestionPaperAnalysis,
  getQuestionPaperAnalysisPDF
};
