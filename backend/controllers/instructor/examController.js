/**
 * Instructor Exam Controller
 * Handles exam-related operations for instructors
 */

import Exam from '../../models/Exam.js';
import Question from '../../models/Question.js';
import Result from '../../models/Result.js';
import User from '../../models/User.js';
import { asyncHandler } from '../../middleware/error.js';

// Get all exams created by the instructor
export const getInstructorExams = asyncHandler(async (req, res) => {
  const exams = await Exam.find({ createdBy: req.user._id })
    .populate('questions', 'text subject difficulty')
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 });

  res.json({
    status: 'success',
    message: 'Instructor exams retrieved successfully',
    data: { exams },
    timestamp: new Date().toISOString()
  });
});

// Get exam statistics for instructor dashboard
export const getExamStats = asyncHandler(async (req, res) => {
  const instructorId = req.user._id;
  
  const totalExams = await Exam.countDocuments({ createdBy: instructorId });
  const publishedExams = await Exam.countDocuments({ 
    createdBy: instructorId, 
    status: 'published' 
  });
  const draftExams = await Exam.countDocuments({ 
    createdBy: instructorId, 
    status: 'draft' 
  });

  // Get recent exam activity
  const recentExams = await Exam.find({ createdBy: instructorId })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('title status createdAt totalQuestions duration');

  res.json({
    status: 'success',
    message: 'Instructor exam statistics retrieved successfully',
    data: {
      stats: {
        totalExams,
        publishedExams,
        draftExams,
        recentExams
      }
    },
    timestamp: new Date().toISOString()
  });
});

// Create a new exam
export const createExam = asyncHandler(async (req, res) => {
  const examData = {
    ...req.body,
    createdBy: req.user._id,
    status: 'draft'
  };

  const exam = await Exam.create(examData);
  await exam.populate('createdBy', 'name email');

  res.status(201).json({
    status: 'success',
    message: 'Exam created successfully',
    data: { exam },
    timestamp: new Date().toISOString()
  });
});

// Update an exam
export const updateExam = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const exam = await Exam.findOne({ 
    _id: id, 
    createdBy: req.user._id 
  });
  
  if (!exam) {
    return res.status(404).json({
      status: 'error',
      message: 'Exam not found or access denied',
      timestamp: new Date().toISOString()
    });
  }

  Object.assign(exam, req.body);
  await exam.save();
  await exam.populate('createdBy', 'name email');

  res.json({
    status: 'success',
    message: 'Exam updated successfully',
    data: { exam },
    timestamp: new Date().toISOString()
  });
});

// Delete an exam
export const deleteExam = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const exam = await Exam.findOne({ 
    _id: id, 
    createdBy: req.user._id 
  });
  
  if (!exam) {
    return res.status(404).json({
      status: 'error',
      message: 'Exam not found or access denied',
      timestamp: new Date().toISOString()
    });
  }

  // Check if exam has any results
  const hasResults = await Result.countDocuments({ examId: id });
  if (hasResults > 0) {
    return res.status(400).json({
      status: 'error',
      message: 'Cannot delete exam with existing results',
      timestamp: new Date().toISOString()
    });
  }

  await Exam.findByIdAndDelete(id);

  res.json({
    status: 'success',
    message: 'Exam deleted successfully',
    timestamp: new Date().toISOString()
  });
});

// Get exam by ID
export const getExamById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const exam = await Exam.findOne({ 
    _id: id, 
    createdBy: req.user._id 
  })
    .populate('questions')
    .populate('createdBy', 'name email');
  
  if (!exam) {
    return res.status(404).json({
      status: 'error',
      message: 'Exam not found or access denied',
      timestamp: new Date().toISOString()
    });
  }

  res.json({
    status: 'success',
    message: 'Exam retrieved successfully',
    data: { exam },
    timestamp: new Date().toISOString()
  });
});

// Publish an exam
export const publishExam = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const exam = await Exam.findOne({ 
    _id: id, 
    createdBy: req.user._id 
  });
  
  if (!exam) {
    return res.status(404).json({
      status: 'error',
      message: 'Exam not found or access denied',
      timestamp: new Date().toISOString()
    });
  }

  exam.status = 'published';
  exam.publishedAt = new Date();
  await exam.save();

  res.json({
    status: 'success',
    message: 'Exam published successfully',
    data: { exam },
    timestamp: new Date().toISOString()
  });
});

// Get exam monitoring data
export const getExamMonitorData = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const exam = await Exam.findOne({ 
    _id: id, 
    createdBy: req.user._id 
  });
  
  if (!exam) {
    return res.status(404).json({
      status: 'error',
      message: 'Exam not found or access denied',
      timestamp: new Date().toISOString()
    });
  }

  // Get active exam sessions
  const results = await Result.find({ examId: id })
    .populate('studentId', 'name email')
    .select('studentId status startedAt submittedAt score');

  const monitorData = {
    exam: {
      id: exam._id,
      title: exam.title,
      status: exam.status,
      totalQuestions: exam.totalQuestions,
      duration: exam.duration
    },
    sessions: results.map(result => ({
      student: result.studentId,
      status: result.status,
      startedAt: result.startedAt,
      submittedAt: result.submittedAt,
      score: result.score,
      timeRemaining: result.status === 'in-progress' ? 
        Math.max(0, (exam.duration * 60) - Math.floor((Date.now() - new Date(result.startedAt)) / 1000)) : 
        null
    }))
  };

  res.json({
    status: 'success',
    message: 'Exam monitor data retrieved successfully',
    data: monitorData,
    timestamp: new Date().toISOString()
  });
});

// Get exam results
export const getExamResults = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const exam = await Exam.findOne({ 
    _id: id, 
    createdBy: req.user._id 
  });
  
  if (!exam) {
    return res.status(404).json({
      status: 'error',
      message: 'Exam not found or access denied',
      timestamp: new Date().toISOString()
    });
  }

  const results = await Result.find({ examId: id })
    .populate('studentId', 'name email')
    .sort({ submittedAt: -1 });

  const resultsWithStats = {
    exam: {
      id: exam._id,
      title: exam.title,
      totalQuestions: exam.totalQuestions,
      totalMarks: exam.totalMarks
    },
    results: results.map(result => ({
      id: result._id,
      student: result.studentId,
      score: result.score,
      percentage: (result.score / exam.totalMarks) * 100,
      status: result.status,
      startedAt: result.startedAt,
      submittedAt: result.submittedAt,
      timeTaken: result.submittedAt ? 
        Math.floor((new Date(result.submittedAt) - new Date(result.startedAt)) / 1000 / 60) : 
        null
    })),
    stats: {
      totalAttempts: results.length,
      averageScore: results.length > 0 ? 
        results.reduce((sum, r) => sum + r.score, 0) / results.length : 0,
      highestScore: results.length > 0 ? 
        Math.max(...results.map(r => r.score)) : 0,
      lowestScore: results.length > 0 ? 
        Math.min(...results.map(r => r.score)) : 0
    }
  };

  res.json({
    status: 'success',
    message: 'Exam results retrieved successfully',
    data: resultsWithStats,
    timestamp: new Date().toISOString()
  });
});

export default {
  getInstructorExams,
  getExamStats,
  createExam,
  updateExam,
  deleteExam,
  getExamById,
  publishExam,
  getExamMonitorData,
  getExamResults
};