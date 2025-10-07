/**
 * Student Exam Controller
 * Handles exam-taking functionality for students
 */

import Exam from '../../models/Exam.js';
import Question from '../../models/Question.js';
import Result from '../../models/Result.js';
import {
  sendSuccessResponse,
  sendErrorResponse,
  sendNotFoundResponse,
  asyncHandler
} from '../../utils/response.js';

// Get exam details for student
export const getExamById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const studentId = req.user._id;

  const exam = await Exam.findById(id)
    .populate({
      path: 'questions.question',
      model: 'Question',
      select: 'question type options marks difficulty subject topic'
    });

  if (!exam) {
    return sendNotFoundResponse(res, 'Exam');
  }

  // Check if student can attempt this exam
  const canAttempt = exam.canUserAttempt(studentId);
  if (!canAttempt.allowed) {
    return sendErrorResponse(res, canAttempt.reason, 403);
  }

  // Check if student has already attempted
  const existingAttempt = await Result.findOne({
    student: studentId,
    exam: id,
    status: { $in: ['in-progress', 'completed', 'submitted'] }
  });

  if (existingAttempt && existingAttempt.status !== 'in-progress') {
    return sendErrorResponse(res, 'You have already completed this exam', 400);
  }

  const examData = {
    _id: exam._id,
    title: exam.title,
    description: exam.description,
    subject: exam.subject,
    duration: exam.duration,
    totalMarks: exam.totalMarks,
    instructions: exam.instructions,
    questions: exam.questions.map(q => ({
      _id: q.question._id,
      question: q.question.question,
      type: q.question.type,
      options: q.question.options,
      marks: q.marks,
      difficulty: q.question.difficulty
    })),
    settings: exam.settings,
    timeRemaining: exam.remainingTime
  };

  sendSuccessResponse(res, 'Exam details retrieved successfully', examData);
});

// Start exam attempt
export const startExam = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const studentId = req.user._id;

  const exam = await Exam.findById(id)
    .populate({
      path: 'questions.question',
      model: 'Question'
    });

  if (!exam) {
    return sendNotFoundResponse(res, 'Exam');
  }

  // Check if student can attempt
  const canAttempt = exam.canUserAttempt(studentId);
  if (!canAttempt.allowed) {
    return sendErrorResponse(res, canAttempt.reason, 403);
  }

  // Check for existing attempt
  let result = await Result.findOne({
    student: studentId,
    exam: id,
    status: 'in-progress'
  });

  if (!result) {
    // Create new exam attempt
    result = new Result({
      student: studentId,
      exam: id,
      attemptNumber: 1,
      answers: exam.questions.map(q => ({
        question: q.question._id,
        selectedOptions: [],
        isCorrect: false,
        marksObtained: 0,
        timeSpent: 0
      })),
      session: {
        startTime: new Date(),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      },
      scoring: {
        totalMarks: exam.totalMarks,
        marksObtained: 0,
        percentage: 0,
        passed: false
      },
      stats: {
        totalQuestions: exam.questions.length,
        attemptedQuestions: 0,
        correctAnswers: 0,
        incorrectAnswers: 0,
        skippedQuestions: exam.questions.length
      },
      status: 'in-progress'
    });

    await result.save();
  }

  const examData = {
    _id: exam._id,
    title: exam.title,
    description: exam.description,
    subject: exam.subject,
    duration: exam.duration,
    totalMarks: exam.totalMarks,
    instructions: exam.instructions,
    questions: exam.questions.map(q => ({
      _id: q.question._id,
      question: q.question.question,
      type: q.question.type,
      options: q.question.options,
      marks: q.marks
    })),
    settings: exam.settings,
    resultId: result._id,
    startTime: result.session.startTime
  };

  sendSuccessResponse(res, 'Exam started successfully', { exam: examData });
});

// Save exam progress
export const saveExamProgress = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { answers } = req.body;
  const studentId = req.user._id;

  const result = await Result.findOne({
    student: studentId,
    exam: id,
    status: 'in-progress'
  });

  if (!result) {
    return sendErrorResponse(res, 'No active exam attempt found', 404);
  }

  // Update answers
  if (answers && Array.isArray(answers)) {
    answers.forEach(answer => {
      const existingAnswer = result.answers.find(a => 
        a.question.toString() === answer.question
      );
      
      if (existingAnswer) {
        existingAnswer.selectedOptions = answer.selectedOptions || [];
        existingAnswer.textAnswer = answer.textAnswer;
        existingAnswer.timeSpent = answer.timeSpent || 0;
        existingAnswer.flagged = answer.flagged || false;
      }
    });
  }

  await result.save();

  sendSuccessResponse(res, 'Progress saved successfully');
});

// Submit exam
export const submitExam = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { answers } = req.body;
  const studentId = req.user._id;

  const exam = await Exam.findById(id)
    .populate('questions.question');

  if (!exam) {
    return sendNotFoundResponse(res, 'Exam');
  }

  let result = await Result.findOne({
    student: studentId,
    exam: id,
    status: 'in-progress'
  });

  if (!result) {
    return sendErrorResponse(res, 'No active exam attempt found', 404);
  }

  // Update final answers
  if (answers && Array.isArray(answers)) {
    answers.forEach(answer => {
      const existingAnswer = result.answers.find(a => 
        a.question.toString() === answer.question
      );
      
      if (existingAnswer) {
        existingAnswer.selectedOptions = answer.selectedOptions || [];
        existingAnswer.textAnswer = answer.textAnswer;
        existingAnswer.timeSpent = answer.timeSpent || 0;
      }
    });
  }

  // Calculate scores
  let totalMarks = 0;
  let correctAnswers = 0;

  for (let i = 0; i < result.answers.length; i++) {
    const answer = result.answers[i];
    const examQuestion = exam.questions[i];
    const question = examQuestion.question;

    if (question.type === 'multiple-choice') {
      const correctOptions = question.options
        .map((opt, idx) => opt.isCorrect ? idx : null)
        .filter(idx => idx !== null);

      const isCorrect = answer.selectedOptions.length === correctOptions.length &&
        answer.selectedOptions.every(opt => correctOptions.includes(opt));

      if (isCorrect) {
        answer.isCorrect = true;
        answer.marksObtained = examQuestion.marks;
        totalMarks += examQuestion.marks;
        correctAnswers++;
      } else {
        answer.isCorrect = false;
        answer.marksObtained = 0;
      }
    }
  }

  // Update result
  result.scoring.marksObtained = totalMarks;
  result.scoring.percentage = Math.round((totalMarks / exam.totalMarks) * 100);
  result.scoring.passed = totalMarks >= exam.passingMarks;
  result.stats.correctAnswers = correctAnswers;
  result.stats.incorrectAnswers = result.stats.totalQuestions - correctAnswers;
  result.stats.attemptedQuestions = result.answers.filter(a => 
    a.selectedOptions.length > 0 || a.textAnswer
  ).length;
  result.status = 'completed';
  result.submittedAt = new Date();
  result.session.endTime = new Date();

  await result.save();

  // Update exam analytics
  await exam.updateAnalytics({
    completed: true,
    percentage: result.scoring.percentage,
    timeSpent: Math.round((result.session.endTime - result.session.startTime) / (1000 * 60)),
    passed: result.scoring.passed
  });

  const resultData = {
    _id: result._id,
    score: result.scoring.marksObtained,
    totalMarks: result.scoring.totalMarks,
    percentage: result.scoring.percentage,
    passed: result.scoring.passed,
    correctAnswers: result.stats.correctAnswers,
    totalQuestions: result.stats.totalQuestions,
    submittedAt: result.submittedAt
  };

  sendSuccessResponse(res, 'Exam submitted successfully', resultData);
});

export default {
  getExamById,
  startExam,
  saveExamProgress,
  submitExam
};