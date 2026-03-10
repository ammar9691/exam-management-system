/**
 * Attempt Controller
 * Handles candidate exam attempts: start, answer, heartbeat, submit, results
 */

import Exam from '../models/Exam.js';
import Question from '../models/Question.js';
import CandidateAttempt from '../models/CandidateAttempt.js';
import {
  sendSuccessResponse,
  sendErrorResponse,
  sendNotFoundResponse,
  asyncHandler
} from '../utils/response.js';
import {
  generateCandidateShuffle,
  getShuffledQuestionsForDisplay,
  validateAnswer,
  calculateRemainingTime,
  isAttemptTimedOut,
  canStartExam,
  processQuestionsAfterExam
} from '../utils/examUtils.js';
import {
  generateIndividualResultPDF
} from '../utils/pdfGenerator.js';
import {
  HEARTBEAT_TIMEOUT_SECONDS
} from '../config/moduleBlueprints.js';

/**
 * Get assigned exams for current student
 * GET /api/attempts/my-exams
 */
export const getMyExams = asyncHandler(async (req, res) => {
  const { user } = req;

  // Get all attempts for this candidate
  const attempts = await CandidateAttempt.find({
    candidateId: user._id
  }).populate({
    path: 'examId',
    select: 'title moduleId moduleName examType blueprintTotalQuestions blueprintTotalTimeMinutes startAt endAt examStatus'
  });

  // Categorize by status
  const upcoming = [];
  const active = [];
  const completed = [];
  const now = new Date();

  for (const attempt of attempts) {
    const exam = attempt.examId;
    if (!exam) continue;

    const examData = {
      attemptId: attempt._id,
      examId: exam._id,
      title: exam.title,
      moduleId: exam.moduleId,
      moduleName: exam.moduleName,
      examType: exam.examType,
      totalQuestions: exam.blueprintTotalQuestions,
      totalTimeMinutes: exam.blueprintTotalTimeMinutes,
      startAt: exam.startAt,
      endAt: exam.endAt,
      attemptStatus: attempt.status,
      result: attempt.result
    };

    if (['completed', 'quit', 'timeout', 'blocked_late'].includes(attempt.status)) {
      completed.push(examData);
    } else if (exam.startAt <= now && exam.endAt >= now) {
      active.push(examData);
    } else if (exam.startAt > now) {
      upcoming.push(examData);
    }
  }

  sendSuccessResponse(res, 'Exams retrieved successfully', {
    upcoming,
    active,
    completed
  });
});

/**
 * Start an exam attempt
 * POST /api/attempts/:examId/start
 */
export const startAttempt = asyncHandler(async (req, res) => {
  const { examId } = req.params;
  const { user } = req;

  // Get exam
  const exam = await Exam.findById(examId);
  if (!exam) {
    return sendNotFoundResponse(res, 'Exam');
  }

  if (!exam.isModuleDriven) {
    return sendErrorResponse(res, 'This endpoint is only for module-driven exams', 400);
  }

  // Check if candidate is assigned
  if (!exam.isCandidateAssigned(user._id)) {
    return sendErrorResponse(res, 'You are not assigned to this exam', 403);
  }

  // Check time window (late login restriction)
  const canStart = canStartExam(exam);
  if (!canStart.canStart) {
    // Get or create attempt and block it
    let attempt = await CandidateAttempt.findByExamAndCandidate(examId, user._id);
    if (attempt && attempt.status === 'not_started') {
      await attempt.blockLateLogin(canStart.reason);
    }
    return sendErrorResponse(res, canStart.reason, 403);
  }

  // Get or create attempt
  let attempt = await CandidateAttempt.findByExamAndCandidate(examId, user._id);

  if (!attempt) {
    return sendErrorResponse(res, 'No attempt record found. Please contact administrator.', 404);
  }

  // Check attempt status
  if (attempt.status === 'blocked_late') {
    return sendErrorResponse(res, 'You were blocked from this exam due to late login', 403);
  }

  if (['completed', 'quit', 'timeout'].includes(attempt.status)) {
    return sendErrorResponse(res, 'You have already completed this exam', 400);
  }

  // Get questions for the exam
  const questions = await Question.find({
    _id: { $in: exam.paperQuestionIds }
  });

  // If not started yet, initialize
  if (attempt.status === 'not_started') {
    // Generate shuffled order
    const shuffle = generateCandidateShuffle(exam.paperQuestionIds, questions);

    attempt.shuffledQuestionsOrder = shuffle.shuffledQuestionsOrder;
    attempt.shuffledOptionsMap = shuffle.shuffledOptionsMap;
    attempt.shuffleSeed = shuffle.seed;
    attempt.result.totalQuestions = questions.length;
    attempt.result.passingPercentage = 75;

    await attempt.start();
  } else if (attempt.status === 'paused') {
    // Resume from pause
    await attempt.resume();
  }

  // Get shuffled questions for display (without correct answers)
  const displayQuestions = getShuffledQuestionsForDisplay(
    questions,
    attempt.shuffledQuestionsOrder,
    attempt.shuffledOptionsMap
  );

  // Calculate remaining time
  const remainingTimeSeconds = calculateRemainingTime(exam, attempt);

  sendSuccessResponse(res, 'Exam started successfully', {
    attemptId: attempt._id,
    examId: exam._id,
    examTitle: exam.title,
    totalQuestions: questions.length,
    totalTimeMinutes: exam.blueprintTotalTimeMinutes,
    remainingTimeSeconds,
    activeTimeSeconds: attempt.activeTimeSeconds,
    currentQuestionIndex: attempt.currentQuestionIndex,
    questions: displayQuestions,
    answers: attempt.answers.map(a => ({
      questionId: a.questionId,
      selectedOptionIndex: a.selectedOptionIndex,
      isFlagged: a.isFlagged
    }))
  });
});

/**
 * Save an answer
 * POST /api/attempts/:attemptId/answer
 */
export const saveAnswer = asyncHandler(async (req, res) => {
  const { attemptId } = req.params;
  const { questionId, selectedOptionIndex, currentQuestionIndex } = req.body;
  const { user } = req;

  const attempt = await CandidateAttempt.findById(attemptId);
  if (!attempt) {
    return sendNotFoundResponse(res, 'Attempt');
  }

  if (attempt.candidateId.toString() !== user._id.toString()) {
    return sendErrorResponse(res, 'Access denied', 403);
  }

  if (!['in_progress', 'paused'].includes(attempt.status)) {
    return sendErrorResponse(res, 'Attempt is not active', 400);
  }

  // Get exam to check time
  const exam = await Exam.findById(attempt.examId);
  if (!exam) {
    return sendErrorResponse(res, 'Exam not found', 404);
  }

  // Check if timed out
  if (isAttemptTimedOut(exam, attempt)) {
    // Auto-submit
    const questions = await Question.find({
      _id: { $in: exam.paperQuestionIds }
    });
    await attempt.submit(questions, 'auto_timeout');
    return sendErrorResponse(res, 'Time expired. Exam has been auto-submitted.', 400);
  }

  // Get the question to validate
  const question = await Question.findById(questionId);
  if (!question) {
    return sendErrorResponse(res, 'Question not found', 400);
  }

  // Get option mapping for this question
  const optionMapping = attempt.shuffledOptionsMap.find(
    m => m.questionId.toString() === questionId
  );

  // Get original option ID from display index
  let selectedOptionId = null;
  if (selectedOptionIndex !== null && selectedOptionIndex >= 0 && optionMapping) {
    const originalIndex = optionMapping.shuffleMap[selectedOptionIndex];
    if (question.options[originalIndex]) {
      selectedOptionId = question.options[originalIndex]._id;
    }
  }

  // Save the answer
  attempt.saveAnswer(questionId, selectedOptionIndex, selectedOptionId);

  // Update current question index
  if (currentQuestionIndex !== undefined) {
    attempt.currentQuestionIndex = currentQuestionIndex;
  }

  await attempt.save();

  sendSuccessResponse(res, 'Answer saved successfully', {
    questionId,
    selectedOptionIndex,
    savedAt: new Date()
  });
});

/**
 * Toggle flag for a question
 * POST /api/attempts/:attemptId/flag
 */
export const toggleFlag = asyncHandler(async (req, res) => {
  const { attemptId } = req.params;
  const { questionId } = req.body;
  const { user } = req;

  const attempt = await CandidateAttempt.findById(attemptId);
  if (!attempt) {
    return sendNotFoundResponse(res, 'Attempt');
  }

  if (attempt.candidateId.toString() !== user._id.toString()) {
    return sendErrorResponse(res, 'Access denied', 403);
  }

  if (!['in_progress', 'paused'].includes(attempt.status)) {
    return sendErrorResponse(res, 'Attempt is not active', 400);
  }

  attempt.toggleFlag(questionId);
  await attempt.save();

  const answer = attempt.answers.find(a => a.questionId.toString() === questionId);

  sendSuccessResponse(res, 'Flag toggled successfully', {
    questionId,
    isFlagged: answer?.isFlagged || false
  });
});

/**
 * Heartbeat ping (for timer tracking)
 * POST /api/attempts/:attemptId/heartbeat
 */
export const heartbeat = asyncHandler(async (req, res) => {
  const { attemptId } = req.params;
  const { user } = req;

  const attempt = await CandidateAttempt.findById(attemptId);
  if (!attempt) {
    return sendNotFoundResponse(res, 'Attempt');
  }

  if (attempt.candidateId.toString() !== user._id.toString()) {
    return sendErrorResponse(res, 'Access denied', 403);
  }

  if (!['in_progress', 'paused'].includes(attempt.status)) {
    return sendSuccessResponse(res, 'Attempt already completed', {
      status: attempt.status,
      shouldStop: true
    });
  }

  // Get exam to check time
  const exam = await Exam.findById(attempt.examId);
  if (!exam) {
    return sendErrorResponse(res, 'Exam not found', 404);
  }

  // Record heartbeat
  await attempt.recordHeartbeat();

  // Calculate remaining time
  const remainingTimeSeconds = calculateRemainingTime(exam, attempt);

  // Check if timed out
  if (remainingTimeSeconds <= 0) {
    const questions = await Question.find({
      _id: { $in: exam.paperQuestionIds }
    });
    await attempt.submit(questions, 'auto_timeout');

    return sendSuccessResponse(res, 'Time expired. Exam auto-submitted.', {
      status: 'timeout',
      shouldStop: true,
      result: attempt.result
    });
  }

  sendSuccessResponse(res, 'Heartbeat recorded', {
    activeTimeSeconds: attempt.activeTimeSeconds,
    remainingTimeSeconds,
    isPaused: attempt.isPaused,
    status: attempt.status
  });
});

/**
 * Get review data before submission
 * GET /api/attempts/:attemptId/review
 */
export const getReviewData = asyncHandler(async (req, res) => {
  const { attemptId } = req.params;
  const { user } = req;

  const attempt = await CandidateAttempt.findById(attemptId);
  if (!attempt) {
    return sendNotFoundResponse(res, 'Attempt');
  }

  if (attempt.candidateId.toString() !== user._id.toString()) {
    return sendErrorResponse(res, 'Access denied', 403);
  }

  // Get unanswered and flagged questions
  const unansweredIds = attempt.getUnansweredQuestionIds();
  const flaggedIds = attempt.getFlaggedQuestionIds();

  // Map to display indices
  const unansweredIndices = unansweredIds.map(id =>
    attempt.shuffledQuestionsOrder.findIndex(qId => qId.toString() === id.toString()) + 1
  ).filter(i => i > 0);

  const flaggedIndices = flaggedIds.map(id =>
    attempt.shuffledQuestionsOrder.findIndex(qId => qId.toString() === id.toString()) + 1
  ).filter(i => i > 0);

  // Answer summary
  const answeredCount = attempt.answers.filter(
    a => a.selectedOptionId || a.selectedAnswer
  ).length;

  sendSuccessResponse(res, 'Review data retrieved', {
    totalQuestions: attempt.shuffledQuestionsOrder.length,
    answeredCount,
    unansweredCount: unansweredIds.length,
    flaggedCount: flaggedIds.length,
    unansweredIndices: unansweredIndices.sort((a, b) => a - b),
    flaggedIndices: flaggedIndices.sort((a, b) => a - b)
  });
});

/**
 * Submit exam
 * POST /api/attempts/:attemptId/submit
 */
export const submitExam = asyncHandler(async (req, res) => {
  const { attemptId } = req.params;
  const { user } = req;

  const attempt = await CandidateAttempt.findById(attemptId);
  if (!attempt) {
    return sendNotFoundResponse(res, 'Attempt');
  }

  if (attempt.candidateId.toString() !== user._id.toString()) {
    return sendErrorResponse(res, 'Access denied', 403);
  }

  if (['completed', 'quit', 'timeout'].includes(attempt.status)) {
    return sendErrorResponse(res, 'Exam has already been submitted', 400);
  }

  // Get exam and questions
  const exam = await Exam.findById(attempt.examId);
  if (!exam) {
    return sendErrorResponse(res, 'Exam not found', 404);
  }

  const questions = await Question.find({
    _id: { $in: exam.paperQuestionIds }
  });

  // Submit and calculate results
  await attempt.submit(questions, 'manual');

  // Record IP and user agent
  attempt.submittedFromIp = req.ip;
  attempt.userAgent = req.headers['user-agent'];
  await attempt.save();

  // Check if all candidates have completed - trigger question rotation
  const allCompleted = await CandidateAttempt.allCandidatesCompleted(
    exam._id,
    exam.assignedCandidateIds
  );

  if (allCompleted && !exam.questionsRested) {
    // Apply 5% question rotation
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
    exam.examStatus = 'ended';
    await exam.save();
  }

  sendSuccessResponse(res, 'Exam submitted successfully', {
    attemptId: attempt._id,
    status: attempt.status,
    result: attempt.result
  });
});

/**
 * Get attempt result
 * GET /api/attempts/:attemptId/result
 */
export const getResult = asyncHandler(async (req, res) => {
  const { attemptId } = req.params;
  const { user } = req;

  const attempt = await CandidateAttempt.findById(attemptId)
    .populate('candidateId', 'name email')
    .populate('examId', 'title moduleId moduleName examType');

  if (!attempt) {
    return sendNotFoundResponse(res, 'Attempt');
  }

  // Only the candidate or instructors/admins can view
  const isOwner = attempt.candidateId._id.toString() === user._id.toString();
  const isPrivileged = ['admin', 'instructor', 'exam_manager'].includes(user.role);

  if (!isOwner && !isPrivileged) {
    return sendErrorResponse(res, 'Access denied', 403);
  }

  if (!['completed', 'quit', 'timeout'].includes(attempt.status)) {
    return sendErrorResponse(res, 'Exam not yet completed', 400);
  }

  sendSuccessResponse(res, 'Result retrieved successfully', {
    attempt: {
      _id: attempt._id,
      candidate: attempt.candidateId,
      exam: attempt.examId,
      status: attempt.status,
      startedAt: attempt.startedAt,
      endedAt: attempt.endedAt,
      activeTimeSeconds: attempt.activeTimeSeconds,
      result: attempt.result
    }
  });
});

/**
 * Get result as PDF
 * GET /api/attempts/:attemptId/result.pdf
 */
export const getResultPDF = asyncHandler(async (req, res) => {
  const { attemptId } = req.params;
  const { user } = req;

  const attempt = await CandidateAttempt.findById(attemptId)
    .populate('candidateId', 'name email')
    .populate('examId');

  if (!attempt) {
    return sendNotFoundResponse(res, 'Attempt');
  }

  // Only the candidate or instructors/admins can view
  const isOwner = attempt.candidateId._id.toString() === user._id.toString();
  const isPrivileged = ['admin', 'instructor', 'exam_manager'].includes(user.role);

  if (!isOwner && !isPrivileged) {
    return sendErrorResponse(res, 'Access denied', 403);
  }

  if (!['completed', 'quit', 'timeout'].includes(attempt.status)) {
    return sendErrorResponse(res, 'Exam not yet completed', 400);
  }

  const pdfBuffer = await generateIndividualResultPDF(attempt, attempt.examId);

  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="result_${attemptId}.pdf"`,
    'Content-Length': pdfBuffer.length
  });

  res.send(pdfBuffer);
});

/**
 * Get current attempt state (for resume/sync)
 * GET /api/attempts/:attemptId/state
 */
export const getAttemptState = asyncHandler(async (req, res) => {
  const { attemptId } = req.params;
  const { user } = req;

  const attempt = await CandidateAttempt.findById(attemptId);
  if (!attempt) {
    return sendNotFoundResponse(res, 'Attempt');
  }

  if (attempt.candidateId.toString() !== user._id.toString()) {
    return sendErrorResponse(res, 'Access denied', 403);
  }

  // Get exam for time calculation
  const exam = await Exam.findById(attempt.examId);
  if (!exam) {
    return sendErrorResponse(res, 'Exam not found', 404);
  }

  const remainingTimeSeconds = calculateRemainingTime(exam, attempt);

  sendSuccessResponse(res, 'Attempt state retrieved', {
    attemptId: attempt._id,
    status: attempt.status,
    activeTimeSeconds: attempt.activeTimeSeconds,
    remainingTimeSeconds,
    currentQuestionIndex: attempt.currentQuestionIndex,
    isPaused: attempt.isPaused,
    answers: attempt.answers.map(a => ({
      questionId: a.questionId,
      selectedOptionIndex: a.selectedOptionIndex,
      isFlagged: a.isFlagged
    })),
    result: attempt.result
  });
});

/**
 * Quit exam (voluntary early exit)
 * POST /api/attempts/:attemptId/quit
 */
export const quitExam = asyncHandler(async (req, res) => {
  const { attemptId } = req.params;
  const { user } = req;

  const attempt = await CandidateAttempt.findById(attemptId);
  if (!attempt) {
    return sendNotFoundResponse(res, 'Attempt');
  }

  if (attempt.candidateId.toString() !== user._id.toString()) {
    return sendErrorResponse(res, 'Access denied', 403);
  }

  if (['completed', 'quit', 'timeout'].includes(attempt.status)) {
    return sendErrorResponse(res, 'Exam has already been submitted', 400);
  }

  // Get exam and questions
  const exam = await Exam.findById(attempt.examId);
  const questions = await Question.find({
    _id: { $in: exam.paperQuestionIds }
  });

  // Quit and calculate results
  await attempt.quit(questions);

  sendSuccessResponse(res, 'Exam quit successfully', {
    attemptId: attempt._id,
    status: attempt.status,
    result: attempt.result
  });
});

export default {
  getMyExams,
  startAttempt,
  saveAnswer,
  toggleFlag,
  heartbeat,
  getReviewData,
  submitExam,
  getResult,
  getResultPDF,
  getAttemptState,
  quitExam
};
