/**
 * Instructor Student Controller
 * Handles student-related operations for instructors
 */

import User from '../../models/User.js';
import Result from '../../models/Result.js';
import Exam from '../../models/Exam.js';
import { asyncHandler } from '../../middleware/error.js';

// Get students assigned to instructor's exams
export const getAssignedStudents = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Find exams created by this instructor
  const instructorExams = await Exam.find({ createdBy: req.user._id }).select('_id');
  const examIds = instructorExams.map(exam => exam._id);

  // Get student IDs from results of instructor's exams
  const studentResults = await Result.find({ examId: { $in: examIds } })
    .distinct('studentId');

  // Build student query
  let studentQuery = {
    _id: { $in: studentResults },
    role: 'student'
  };

  if (search) {
    studentQuery.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { studentId: { $regex: search, $options: 'i' } }
    ];
  }

  // Get students with pagination
  const students = await User.find(studentQuery)
    .select('name email studentId createdAt')
    .sort({ name: 1 })
    .skip(skip)
    .limit(parseInt(limit));

  const totalCount = await User.countDocuments(studentQuery);

  // Get student statistics for each student
  const studentsWithStats = await Promise.all(
    students.map(async (student) => {
      const studentResults = await Result.find({
        studentId: student._id,
        examId: { $in: examIds }
      });

      const totalExams = studentResults.length;
      const completedExams = studentResults.filter(r => r.status === 'graded').length;
      const inProgressExams = studentResults.filter(r => r.status === 'in-progress').length;
      const averageScore = totalExams > 0 
        ? studentResults.reduce((sum, r) => sum + (r.score || 0), 0) / totalExams 
        : 0;

      return {
        ...student.toObject(),
        stats: {
          totalExams,
          completedExams,
          inProgressExams,
          averageScore: Math.round(averageScore * 100) / 100
        }
      };
    })
  );

  res.json({
    status: 'success',
    message: 'Assigned students retrieved successfully',
    data: {
      students: studentsWithStats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / parseInt(limit))
      }
    },
    timestamp: new Date().toISOString()
  });
});

// Get student statistics
export const getStudentStats = asyncHandler(async (req, res) => {
  const instructorExams = await Exam.find({ createdBy: req.user._id }).select('_id');
  const examIds = instructorExams.map(exam => exam._id);

  // Get unique students from results
  const uniqueStudentIds = await Result.find({ examId: { $in: examIds } })
    .distinct('studentId');

  const totalStudents = uniqueStudentIds.length;

  // Get active students (students with in-progress exams)
  const activeStudents = await Result.find({
    examId: { $in: examIds },
    status: 'in-progress'
  }).distinct('studentId');

  // Get students with completed exams
  const studentsWithCompleted = await Result.find({
    examId: { $in: examIds },
    status: 'graded'
  }).distinct('studentId');

  // Get performance distribution
  const allResults = await Result.find({
    examId: { $in: examIds },
    status: 'graded'
  }).populate('examId', 'totalMarks');

  const performanceDistribution = {
    excellent: 0, // 90-100%
    good: 0,      // 70-89%
    average: 0,   // 50-69%
    poor: 0       // <50%
  };

  allResults.forEach(result => {
    const percentage = (result.score / result.examId.totalMarks) * 100;
    if (percentage >= 90) performanceDistribution.excellent++;
    else if (percentage >= 70) performanceDistribution.good++;
    else if (percentage >= 50) performanceDistribution.average++;
    else performanceDistribution.poor++;
  });

  res.json({
    status: 'success',
    message: 'Student statistics retrieved successfully',
    data: {
      stats: {
        totalStudents,
        activeStudents: activeStudents.length,
        studentsWithCompleted: studentsWithCompleted.length,
        performanceDistribution
      }
    },
    timestamp: new Date().toISOString()
  });
});

// Get student by ID
export const getStudentById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Verify student has taken instructor's exams
  const instructorExams = await Exam.find({ createdBy: req.user._id }).select('_id');
  const examIds = instructorExams.map(exam => exam._id);

  const hasResults = await Result.exists({
    studentId: id,
    examId: { $in: examIds }
  });

  if (!hasResults) {
    return res.status(404).json({
      status: 'error',
      message: 'Student not found or has not taken your exams',
      timestamp: new Date().toISOString()
    });
  }

  const student = await User.findById(id).select('name email studentId createdAt');

  if (!student) {
    return res.status(404).json({
      status: 'error',
      message: 'Student not found',
      timestamp: new Date().toISOString()
    });
  }

  // Get student's exam history with instructor's exams
  const results = await Result.find({
    studentId: id,
    examId: { $in: examIds }
  })
    .populate('examId', 'title totalMarks totalQuestions')
    .sort({ createdAt: -1 });

  const examHistory = results.map(result => ({
    examId: result.examId._id,
    examTitle: result.examId.title,
    status: result.status,
    score: result.score,
    totalMarks: result.examId.totalMarks,
    percentage: result.score ? Math.round((result.score / result.examId.totalMarks) * 100) : null,
    startedAt: result.startedAt,
    submittedAt: result.submittedAt,
    gradedAt: result.gradedAt
  }));

  // Calculate student statistics
  const completedExams = results.filter(r => r.status === 'graded');
  const averageScore = completedExams.length > 0 
    ? completedExams.reduce((sum, r) => sum + r.score, 0) / completedExams.length 
    : 0;
  const averagePercentage = completedExams.length > 0
    ? completedExams.reduce((sum, r) => sum + ((r.score / r.examId.totalMarks) * 100), 0) / completedExams.length
    : 0;

  res.json({
    status: 'success',
    message: 'Student details retrieved successfully',
    data: {
      student: {
        ...student.toObject(),
        stats: {
          totalExams: results.length,
          completedExams: completedExams.length,
          inProgressExams: results.filter(r => r.status === 'in-progress').length,
          averageScore: Math.round(averageScore * 100) / 100,
          averagePercentage: Math.round(averagePercentage * 100) / 100
        },
        examHistory
      }
    },
    timestamp: new Date().toISOString()
  });
});

// Get student performance analytics
export const getStudentPerformance = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const instructorExams = await Exam.find({ createdBy: req.user._id }).select('_id title');
  const examIds = instructorExams.map(exam => exam._id);

  // Get student's results
  const results = await Result.find({
    studentId: id,
    examId: { $in: examIds },
    status: 'graded'
  })
    .populate('examId', 'title totalMarks subject')
    .sort({ gradedAt: 1 });

  if (results.length === 0) {
    return res.status(404).json({
      status: 'error',
      message: 'No performance data found for this student',
      timestamp: new Date().toISOString()
    });
  }

  // Performance over time
  const performanceOverTime = results.map(result => ({
    examTitle: result.examId.title,
    score: result.score,
    totalMarks: result.examId.totalMarks,
    percentage: Math.round((result.score / result.examId.totalMarks) * 100),
    date: result.gradedAt
  }));

  // Subject-wise performance
  const subjectPerformance = {};
  results.forEach(result => {
    const subject = result.examId.subject || 'General';
    if (!subjectPerformance[subject]) {
      subjectPerformance[subject] = {
        totalExams: 0,
        totalScore: 0,
        totalMarks: 0
      };
    }
    subjectPerformance[subject].totalExams++;
    subjectPerformance[subject].totalScore += result.score;
    subjectPerformance[subject].totalMarks += result.examId.totalMarks;
  });

  // Calculate averages for each subject
  const subjectAverages = Object.entries(subjectPerformance).map(([subject, data]) => ({
    subject,
    averagePercentage: Math.round((data.totalScore / data.totalMarks) * 100),
    totalExams: data.totalExams
  }));

  // Overall statistics
  const totalScore = results.reduce((sum, r) => sum + r.score, 0);
  const totalMarks = results.reduce((sum, r) => sum + r.examId.totalMarks, 0);
  const overallPercentage = Math.round((totalScore / totalMarks) * 100);

  // Performance trends
  const recentResults = results.slice(-5); // Last 5 results
  const recentAverage = recentResults.length > 0 
    ? Math.round((recentResults.reduce((sum, r) => sum + ((r.score / r.examId.totalMarks) * 100), 0)) / recentResults.length)
    : 0;

  const overallAverage = Math.round((results.reduce((sum, r) => sum + ((r.score / r.examId.totalMarks) * 100), 0)) / results.length);

  const trend = recentAverage > overallAverage ? 'improving' : 
                recentAverage < overallAverage ? 'declining' : 'stable';

  res.json({
    status: 'success',
    message: 'Student performance retrieved successfully',
    data: {
      performance: {
        overallStats: {
          totalExams: results.length,
          overallPercentage,
          recentAverage,
          trend
        },
        performanceOverTime,
        subjectPerformance: subjectAverages
      }
    },
    timestamp: new Date().toISOString()
  });
});

// Get student's exam attempts for instructor's exams
export const getStudentExams = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, page = 1, limit = 10 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const instructorExams = await Exam.find({ createdBy: req.user._id }).select('_id');
  const examIds = instructorExams.map(exam => exam._id);

  // Build query
  let query = {
    studentId: id,
    examId: { $in: examIds }
  };

  if (status) {
    query.status = status;
  }

  const results = await Result.find(query)
    .populate('examId', 'title totalMarks totalQuestions duration subject')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const totalCount = await Result.countDocuments(query);

  const examsWithDetails = results.map(result => ({
    id: result._id,
    exam: {
      id: result.examId._id,
      title: result.examId.title,
      subject: result.examId.subject,
      totalQuestions: result.examId.totalQuestions,
      totalMarks: result.examId.totalMarks,
      duration: result.examId.duration
    },
    status: result.status,
    score: result.score,
    percentage: result.score ? Math.round((result.score / result.examId.totalMarks) * 100) : null,
    startedAt: result.startedAt,
    submittedAt: result.submittedAt,
    gradedAt: result.gradedAt,
    feedback: result.feedback,
    grade: result.grade
  }));

  res.json({
    status: 'success',
    message: 'Student exams retrieved successfully',
    data: {
      exams: examsWithDetails,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / parseInt(limit))
      }
    },
    timestamp: new Date().toISOString()
  });
});

export default {
  getAssignedStudents,
  getStudentStats,
  getStudentById,
  getStudentPerformance,
  getStudentExams
};