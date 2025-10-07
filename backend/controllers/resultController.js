/**
 * Result Controller
 * Handles exam result operations
 */

import Result from '../models/Result.js';
import Exam from '../models/Exam.js';
import User from '../models/User.js';
import { 
  sendSuccessResponse, 
  sendErrorResponse, 
  sendNotFoundResponse,
  sendPaginatedResponse,
  asyncHandler
} from '../utils/response.js';
import { getPaginatedResults, aggregateWithPagination } from '../utils/pagination.js';

// Get all results (admin/instructor only)
export const getAllResults = asyncHandler(async (req, res) => {
  const options = {
    searchFields: ['student', 'exam'],
    allowedFilters: ['status', 'grade', 'exam', 'student', 'submittedFrom', 'submittedTo'],
    defaultSort: { updatedAt: -1 },
    populate: [
      { path: 'student', select: 'name email' },
      { path: 'exam', select: 'title subject type totalMarks' }
    ]
  };

  const result = await getPaginatedResults(Result, req, options);
  sendPaginatedResponse(res, result.data, result.pagination, 'Results retrieved successfully');
});

// Get result by ID
export const getResultById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const result = await Result.findById(id)
    .populate('student', 'name email profile')
    .populate('exam', 'title subject type duration totalMarks questions')
    .populate('exam.questions.question', 'question type options explanation');
    
  if (!result) {
    return sendNotFoundResponse(res, 'Result');
  }

  // Check if user can view this result
  if (req.user.role === 'student' && result.student._id.toString() !== req.user.id) {
    return sendErrorResponse(res, 'Access denied', 403);
  }

  sendSuccessResponse(res, 'Result retrieved successfully', { result });
});

// Get student's results
export const getMyResults = asyncHandler(async (req, res) => {
  const options = {
    searchFields: ['exam'],
    allowedFilters: ['status', 'grade', 'subject'],
    defaultSort: { updatedAt: -1 },
    populate: [
      { path: 'exam', select: 'title subject type totalMarks duration' }
    ]
  };

  req.query.student = req.user.id;
  
  const result = await getPaginatedResults(Result, req, options);
  sendPaginatedResponse(res, result.data, result.pagination, 'My results retrieved successfully');
});

// Get results by exam
export const getResultsByExam = asyncHandler(async (req, res) => {
  const { examId } = req.params;
  
  const exam = await Exam.findById(examId);
  if (!exam) {
    return sendNotFoundResponse(res, 'Exam');
  }

  const options = {
    searchFields: ['student'],
    allowedFilters: ['status', 'grade', 'submittedFrom', 'submittedTo'],
    defaultSort: { 'scoring.percentage': -1, updatedAt: -1 },
    populate: [
      { path: 'student', select: 'name email profile.avatar' }
    ]
  };

  req.query.exam = examId;
  
  const result = await getPaginatedResults(Result, req, options);
  sendPaginatedResponse(res, result.data, result.pagination, 'Exam results retrieved successfully');
});

// Get results by student
export const getResultsByStudent = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  
  const student = await User.findById(studentId);
  if (!student) {
    return sendNotFoundResponse(res, 'Student');
  }

  const options = {
    searchFields: ['exam'],
    allowedFilters: ['status', 'grade', 'subject'],
    defaultSort: { updatedAt: -1 },
    populate: [
      { path: 'exam', select: 'title subject type totalMarks' }
    ]
  };

  req.query.student = studentId;
  
  const result = await getPaginatedResults(Result, req, options);
  sendPaginatedResponse(res, result.data, result.pagination, 'Student results retrieved successfully');
});

// Update result (manual grading for essay questions)
export const updateResult = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { manualScores, feedback, status } = req.body;

  const result = await Result.findById(id)
    .populate('exam', 'questions');
    
  if (!result) {
    return sendNotFoundResponse(res, 'Result');
  }

  if (result.status === 'graded' && status !== 'under-review') {
    return sendErrorResponse(res, 'Cannot modify graded result', 400);
  }

  // Update manual scores for essay/short-answer questions
  if (manualScores) {
    let totalManualScore = 0;
    Object.keys(manualScores).forEach(questionId => {
      const score = manualScores[questionId];
      result.manualScores.set(questionId, score);
      totalManualScore += score;
    });

    // Recalculate total score
    result.totalScore = (result.autoScore || 0) + totalManualScore;
    result.percentage = (result.totalScore / result.maxScore) * 100;
    result.grade = result.calculateGrade();
  }

  // Update feedback
  if (feedback) {
    result.feedback = { ...result.feedback, ...feedback };
  }

  // Update status
  if (status) {
    result.status = status;
  }

  result.gradedAt = new Date();
  result.gradedBy = req.user.id;
  await result.save();

  sendSuccessResponse(res, 'Result updated successfully', { result });
});

// Delete result
export const deleteResult = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await Result.findByIdAndDelete(id);
  if (!result) {
    return sendNotFoundResponse(res, 'Result');
  }

  sendSuccessResponse(res, 'Result deleted successfully');
});

// Get result statistics
export const getResultStats = asyncHandler(async (req, res) => {
  const stats = await Result.aggregate([
    {
      $group: {
        _id: null,
        totalResults: { $sum: 1 },
        submittedResults: { $sum: { $cond: [{ $eq: ['$status', 'submitted'] }, 1, 0] } },
        gradedResults: { $sum: { $cond: [{ $eq: ['$status', 'graded'] }, 1, 0] } },
        avgScore: { $avg: '$totalScore' },
        avgPercentage: { $avg: '$percentage' },
        highestScore: { $max: '$totalScore' },
        lowestScore: { $min: '$totalScore' }
      }
    }
  ]);

  // Grade distribution
  const gradeDistribution = await Result.aggregate([
    { $match: { status: { $in: ['submitted', 'graded'] } } },
    {
      $group: {
        _id: '$grade',
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // Subject-wise performance
  const subjectPerformance = await Result.aggregate([
    { $match: { status: { $in: ['submitted', 'graded'] } } },
    {
      $lookup: {
        from: 'exams',
        localField: 'examId',
        foreignField: '_id',
        as: 'exam'
      }
    },
    { $unwind: '$exam' },
    {
      $group: {
        _id: '$exam.subject',
        avgScore: { $avg: '$totalScore' },
        avgPercentage: { $avg: '$percentage' },
        attemptCount: { $sum: 1 }
      }
    },
    { $sort: { avgPercentage: -1 } }
  ]);

  const result = {
    overall: stats[0] || {
      totalResults: 0,
      submittedResults: 0,
      gradedResults: 0,
      avgScore: 0,
      avgPercentage: 0,
      highestScore: 0,
      lowestScore: 0
    },
    gradeDistribution,
    subjectPerformance
  };

  sendSuccessResponse(res, 'Result statistics retrieved successfully', { stats: result });
});

// Get student performance analytics
export const getStudentPerformance = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  
  const student = await User.findById(studentId);
  if (!student) {
    return sendNotFoundResponse(res, 'Student');
  }

  // Overall performance
  const overallStats = await Result.aggregate([
    { $match: { studentId: student._id, status: { $in: ['submitted', 'graded'] } } },
    {
      $group: {
        _id: null,
        totalExams: { $sum: 1 },
        avgScore: { $avg: '$totalScore' },
        avgPercentage: { $avg: '$percentage' },
        bestScore: { $max: '$totalScore' },
        bestPercentage: { $max: '$percentage' }
      }
    }
  ]);

  // Subject-wise performance
  const subjectPerformance = await Result.aggregate([
    { $match: { studentId: student._id, status: { $in: ['submitted', 'graded'] } } },
    {
      $lookup: {
        from: 'exams',
        localField: 'examId',
        foreignField: '_id',
        as: 'exam'
      }
    },
    { $unwind: '$exam' },
    {
      $group: {
        _id: '$exam.subject',
        avgScore: { $avg: '$totalScore' },
        avgPercentage: { $avg: '$percentage' },
        examCount: { $sum: 1 },
        bestPercentage: { $max: '$percentage' },
        recentPercentage: { $last: '$percentage' }
      }
    },
    { $sort: { avgPercentage: -1 } }
  ]);

  // Performance trend (last 10 exams)
  const performanceTrend = await Result.find({
    studentId: student._id,
    status: { $in: ['submitted', 'graded'] }
  })
  .populate('examId', 'title subject startTime')
  .sort({ endTime: -1 })
  .limit(10)
  .select('totalScore percentage grade endTime');

  const result = {
    student: {
      id: student._id,
      name: student.name,
      email: student.email
    },
    overall: overallStats[0] || {
      totalExams: 0,
      avgScore: 0,
      avgPercentage: 0,
      bestScore: 0,
      bestPercentage: 0
    },
    subjectPerformance,
    performanceTrend: performanceTrend.reverse() // Show chronological order
  };

  sendSuccessResponse(res, 'Student performance retrieved successfully', { performance: result });
});

// Get exam analytics
export const getExamAnalytics = asyncHandler(async (req, res) => {
  const { examId } = req.params;
  
  const exam = await Exam.findById(examId).populate('questions.questionId', 'text type difficulty');
  if (!exam) {
    return sendNotFoundResponse(res, 'Exam');
  }

  // Overall exam statistics
  const examStats = await Result.aggregate([
    { $match: { examId: exam._id, status: { $in: ['submitted', 'graded'] } } },
    {
      $group: {
        _id: null,
        totalAttempts: { $sum: 1 },
        avgScore: { $avg: '$totalScore' },
        avgPercentage: { $avg: '$percentage' },
        maxScore: { $max: '$totalScore' },
        minScore: { $min: '$totalScore' },
        passCount: { $sum: { $cond: [{ $gte: ['$percentage', 60] }, 1, 0] } }
      }
    }
  ]);

  // Question-wise analytics
  const questionAnalytics = [];
  for (let examQuestion of exam.questions) {
    const questionId = examQuestion.questionId._id;
    
    const questionStats = await Result.aggregate([
      { $match: { examId: exam._id, status: { $in: ['submitted', 'graded'] } } },
      { $unwind: '$answers' },
      { $match: { 'answers.questionId': questionId } },
      {
        $group: {
          _id: null,
          totalAttempts: { $sum: 1 },
          correctAnswers: { $sum: { $cond: ['$answers.isCorrect', 1, 0] } },
          avgScore: { $avg: '$answers.score' }
        }
      }
    ]);

    const stats = questionStats[0] || { totalAttempts: 0, correctAnswers: 0, avgScore: 0 };
    
    questionAnalytics.push({
      questionId,
      question: examQuestion.questionId.text,
      type: examQuestion.questionId.type,
      difficulty: examQuestion.questionId.difficulty,
      maxMarks: examQuestion.marks,
      totalAttempts: stats.totalAttempts,
      correctAnswers: stats.correctAnswers,
      successRate: stats.totalAttempts > 0 ? (stats.correctAnswers / stats.totalAttempts) * 100 : 0,
      avgScore: stats.avgScore
    });
  }

  // Performance distribution
  const performanceDistribution = await Result.aggregate([
    { $match: { examId: exam._id, status: { $in: ['submitted', 'graded'] } } },
    {
      $bucket: {
        groupBy: '$percentage',
        boundaries: [0, 40, 60, 75, 90, 100],
        default: 'other',
        output: {
          count: { $sum: 1 },
          avgScore: { $avg: '$totalScore' }
        }
      }
    }
  ]);

  const result = {
    exam: {
      id: exam._id,
      title: exam.title,
      subject: exam.subject,
      totalMarks: exam.totalMarks,
      totalQuestions: exam.questions.length
    },
    overall: examStats[0] || {
      totalAttempts: 0,
      avgScore: 0,
      avgPercentage: 0,
      maxScore: 0,
      minScore: 0,
      passCount: 0
    },
    questionAnalytics,
    performanceDistribution
  };

  sendSuccessResponse(res, 'Exam analytics retrieved successfully', { analytics: result });
});

// Generate result report
export const generateResultReport = asyncHandler(async (req, res) => {
  const { examId, format = 'json' } = req.query;
  
  let query = {};
  if (examId) {
    const exam = await Exam.findById(examId);
    if (!exam) {
      return sendNotFoundResponse(res, 'Exam');
    }
    query.examId = examId;
  }

  const results = await Result.find({
    ...query,
    status: { $in: ['submitted', 'graded'] }
  })
  .populate('studentId', 'name email')
  .populate('examId', 'title subject type totalMarks')
  .sort({ 'examId.title': 1, percentage: -1 });

  // TODO: Implement different report formats (CSV, PDF, Excel)
  const report = {
    generatedAt: new Date(),
    format,
    totalResults: results.length,
    results: results.map(result => ({
      studentName: result.studentId.name,
      studentEmail: result.studentId.email,
      examTitle: result.examId.title,
      examSubject: result.examId.subject,
      score: result.totalScore,
      maxScore: result.maxScore,
      percentage: result.percentage,
      grade: result.grade,
      submittedAt: result.endTime,
      status: result.status
    }))
  };

  sendSuccessResponse(res, 'Result report generated successfully', { report });
});

// Get certificates for student
export const getStudentCertificates = asyncHandler(async (req, res) => {
  const certificates = await Result.find({
    studentId: req.user.id,
    status: 'graded',
    percentage: { $gte: 70 }, // Minimum passing grade for certificate
    'certificate.generated': true
  })
  .populate('examId', 'title subject type')
  .select('examId totalScore maxScore percentage grade certificate endTime')
  .sort({ endTime: -1 });

  sendSuccessResponse(res, 'Student certificates retrieved successfully', { certificates });
});

// Generate certificate
export const generateCertificate = asyncHandler(async (req, res) => {
  const { resultId } = req.params;
  
  const result = await Result.findById(resultId)
    .populate('studentId', 'name email')
    .populate('examId', 'title subject type');
    
  if (!result) {
    return sendNotFoundResponse(res, 'Result');
  }

  if (result.percentage < 70) {
    return sendErrorResponse(res, 'Certificate can only be generated for passing grades', 400);
  }

  if (result.certificate.generated) {
    return sendSuccessResponse(res, 'Certificate already generated', { 
      certificate: result.certificate 
    });
  }

  // Generate certificate
  const certificate = await result.generateCertificate();
  await result.save();

  sendSuccessResponse(res, 'Certificate generated successfully', { certificate });
});

// Bulk grade results
export const bulkGradeResults = asyncHandler(async (req, res) => {
  const { resultIds, manualScores, feedback } = req.body;

  if (!Array.isArray(resultIds) || resultIds.length === 0) {
    return sendErrorResponse(res, 'Result IDs array is required', 400);
  }

  const results = await Result.find({ 
    _id: { $in: resultIds },
    status: 'submitted'
  });

  const gradedResults = [];
  for (let result of results) {
    if (manualScores && manualScores[result._id.toString()]) {
      const scores = manualScores[result._id.toString()];
      let totalManualScore = 0;
      
      Object.keys(scores).forEach(questionId => {
        result.manualScores.set(questionId, scores[questionId]);
        totalManualScore += scores[questionId];
      });

      result.totalScore = (result.autoScore || 0) + totalManualScore;
      result.percentage = (result.totalScore / result.maxScore) * 100;
      result.grade = result.calculateGrade();
    }

    if (feedback && feedback[result._id.toString()]) {
      result.feedback = { ...result.feedback, ...feedback[result._id.toString()] };
    }

    result.status = 'graded';
    result.gradedAt = new Date();
    result.gradedBy = req.user.id;
    
    await result.save();
    gradedResults.push(result);
  }

  sendSuccessResponse(res, 'Results graded successfully', {
    gradedCount: gradedResults.length,
    results: gradedResults
  });
});

export default {
  getAllResults,
  getResultById,
  getMyResults,
  getResultsByExam,
  getResultsByStudent,
  updateResult,
  deleteResult,
  getResultStats,
  getStudentPerformance,
  getExamAnalytics,
  generateResultReport,
  getStudentCertificates,
  generateCertificate,
  bulkGradeResults
};