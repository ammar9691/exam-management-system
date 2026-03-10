/**
 * Module-Driven Exam Routes
 * Handles exam creation, management, and attempts for module-driven exams
 */

import express from 'express';
import { authenticate, authorize, adminOnly, instructorOrAdmin, studentOnly } from '../middleware/auth.js';
import {
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
} from '../controllers/examController.js';
import {
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
} from '../controllers/attemptController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// ============ EXAM MANAGEMENT ROUTES (Instructor/Admin) ============

/**
 * @route   GET /api/module-exams/modules
 * @desc    Get available modules for exam creation
 * @access  Instructor, Admin
 */
router.get('/modules', instructorOrAdmin, getExamModules);

/**
 * @route   POST /api/module-exams/check-sufficiency
 * @desc    Check if QDB has sufficient questions for an exam
 * @access  Instructor, Admin
 */
router.post('/check-sufficiency', instructorOrAdmin, checkSufficiency);

/**
 * @route   POST /api/module-exams
 * @desc    Create a new module-driven exam
 * @access  Instructor, Admin
 */
router.post('/', instructorOrAdmin, createModuleExam);

/**
 * @route   GET /api/module-exams
 * @desc    Get all module-driven exams
 * @access  Instructor, Admin
 */
router.get('/', instructorOrAdmin, getModuleExams);

/**
 * @route   GET /api/module-exams/:id
 * @desc    Get module exam by ID
 * @access  Instructor, Admin
 */
router.get('/:id', instructorOrAdmin, getModuleExamById);

/**
 * @route   POST /api/module-exams/:id/assign
 * @desc    Assign candidates to an exam
 * @access  Instructor, Admin
 */
router.post('/:id/assign', instructorOrAdmin, assignCandidates);

/**
 * @route   GET /api/module-exams/:id/consolidated-result
 * @desc    Get consolidated results for an exam
 * @access  Instructor, Admin
 */
router.get('/:id/consolidated-result', instructorOrAdmin, getConsolidatedResult);

/**
 * @route   GET /api/module-exams/:id/consolidated-result.pdf
 * @desc    Get consolidated results as PDF
 * @access  Instructor, Admin
 */
router.get('/:id/consolidated-result.pdf', instructorOrAdmin, getConsolidatedResultPDF);

/**
 * @route   POST /api/module-exams/:id/end
 * @desc    End an exam
 * @access  Instructor, Admin
 */
router.post('/:id/end', instructorOrAdmin, endModuleExam);

/**
 * @route   GET /api/module-exams/:id/stats
 * @desc    Get exam statistics
 * @access  Instructor, Admin
 */
router.get('/:id/stats', instructorOrAdmin, getModuleExamStats);

/**
 * @route   GET /api/module-exams/:id/qpa
 * @desc    Get Question Paper Analysis for an exam
 * @access  Instructor, Admin
 */
router.get('/:id/qpa', instructorOrAdmin, getQuestionPaperAnalysis);

/**
 * @route   GET /api/module-exams/:id/qpa.pdf
 * @desc    Get QPA as PDF
 * @access  Instructor, Admin
 */
router.get('/:id/qpa.pdf', instructorOrAdmin, getQuestionPaperAnalysisPDF);

// ============ STUDENT ATTEMPT ROUTES ============

/**
 * @route   GET /api/module-exams/my-exams
 * @desc    Get assigned exams for current student
 * @access  Student
 */
router.get('/student/my-exams', studentOnly, getMyExams);

/**
 * @route   POST /api/module-exams/attempt/:examId/start
 * @desc    Start an exam attempt
 * @access  Student
 */
router.post('/attempt/:examId/start', studentOnly, startAttempt);

/**
 * @route   POST /api/module-exams/attempt/:attemptId/answer
 * @desc    Save an answer
 * @access  Student
 */
router.post('/attempt/:attemptId/answer', studentOnly, saveAnswer);

/**
 * @route   POST /api/module-exams/attempt/:attemptId/flag
 * @desc    Toggle flag for a question
 * @access  Student
 */
router.post('/attempt/:attemptId/flag', studentOnly, toggleFlag);

/**
 * @route   POST /api/module-exams/attempt/:attemptId/heartbeat
 * @desc    Heartbeat ping for timer tracking
 * @access  Student
 */
router.post('/attempt/:attemptId/heartbeat', studentOnly, heartbeat);

/**
 * @route   GET /api/module-exams/attempt/:attemptId/review
 * @desc    Get review data before submission
 * @access  Student
 */
router.get('/attempt/:attemptId/review', studentOnly, getReviewData);

/**
 * @route   POST /api/module-exams/attempt/:attemptId/submit
 * @desc    Submit exam
 * @access  Student
 */
router.post('/attempt/:attemptId/submit', studentOnly, submitExam);

/**
 * @route   GET /api/module-exams/attempt/:attemptId/state
 * @desc    Get current attempt state
 * @access  Student
 */
router.get('/attempt/:attemptId/state', studentOnly, getAttemptState);

/**
 * @route   POST /api/module-exams/attempt/:attemptId/quit
 * @desc    Quit exam voluntarily
 * @access  Student
 */
router.post('/attempt/:attemptId/quit', studentOnly, quitExam);

// ============ RESULT ROUTES (Student can view own, Instructor/Admin can view all) ============

/**
 * @route   GET /api/module-exams/result/:attemptId
 * @desc    Get attempt result
 * @access  Student (own), Instructor, Admin
 */
router.get('/result/:attemptId', authenticate, getResult);

/**
 * @route   GET /api/module-exams/result/:attemptId/pdf
 * @desc    Get result as PDF
 * @access  Student (own), Instructor, Admin
 */
router.get('/result/:attemptId/pdf', authenticate, getResultPDF);

export default router;
