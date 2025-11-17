/**
 * Instructor Student Controller
 * Handles student-related operations for instructors using the new Result model
 */

import User from '../../models/User.js';
import Result from '../../models/Result.js';
import Exam from '../../models/Exam.js';
import {
  sendSuccessResponse,
  sendErrorResponse,
  sendNotFoundResponse,
  asyncHandler
} from '../../utils/response.js';

// Get students assigned to instructor's exams
export const getAssignedStudents = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search } = req.query;
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  const skip = (pageNum - 1) * limitNum;

  // Exams visible to this instructor: created by any admin or by this instructor
  const adminUsers = await User.find({ role: 'admin' }).select('_id');
  const adminIds = adminUsers.map(u => u._id);

  const instructorExams = await Exam.find({
    createdBy: { $in: [...adminIds, req.user._id] }
  }).select('_id eligibility.students');
  const examIds = instructorExams.map(exam => exam._id);

  // Instructors should see all students, but stats are computed only
  // from results on exams they can see (admin + own exams)
  let studentQuery = {
    role: 'student'
  };

  if (search) {
    studentQuery.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  const students = await User.find(studentQuery)
    .select('name email status profile createdAt stats')
    .sort({ name: 1 })
    .skip(skip)
    .limit(limitNum);

  const totalCount = await User.countDocuments(studentQuery);

  const studentsWithStats = await Promise.all(
    students.map(async student => {
      // Exams visible to this instructor that explicitly include this student in eligibility.students
      const assignedExamIds = new Set(
        instructorExams
          .filter(exam =>
            Array.isArray(exam.eligibility?.students) &&
            exam.eligibility.students.some(
              (s) => String(s) === String(student._id)
            )
          )
          .map(exam => String(exam._id))
      );

      const studentResults = await Result.find({
        student: student._id,
        exam: { $in: examIds }
      }).select('exam scoring status submittedAt updatedAt');

      const totalExams = studentResults.length;
      const completedExams = studentResults.filter(r =>
        ['completed', 'submitted', 'auto-submitted'].includes(r.status)
      ).length;
      const inProgressExams = studentResults.filter(
        r => r.status === 'in-progress'
      ).length;

      const averageScore =
        totalExams > 0
          ?
            studentResults.reduce(
              (sum, r) => sum + (r.scoring?.percentage || 0),
              0
            ) / totalExams
          : 0;

      const examsAssigned = assignedExamIds.size;

      const lastActivityDoc = studentResults.reduce((latest, r) => {
        const t = r.submittedAt || r.updatedAt;
        if (!t) return latest;
        if (!latest) return r;
        return t > (latest.submittedAt || latest.updatedAt || 0) ? r : latest;
      }, null);

      const lastActivity = lastActivityDoc
        ? lastActivityDoc.submittedAt || lastActivityDoc.updatedAt
        : null;

      return {
        ...student.toObject(),
        stats: {
          examsAssigned,
          examsCompleted: completedExams,
          inProgressExams,
          averageScore: Math.round(averageScore * 10) / 10,
          lastActivity
        }
      };
    })
  );

  return sendSuccessResponse(
    res,
    'Assigned students retrieved successfully',
    {
      students: studentsWithStats,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        pages: Math.ceil(totalCount / limitNum)
      }
    }
  );
});

// Get aggregated student statistics for instructor dashboard
export const getStudentStats = asyncHandler(async (req, res) => {
  // Exams visible to this instructor: created by any admin or by this instructor
  const adminUsers = await User.find({ role: 'admin' }).select('_id');
  const adminIds = adminUsers.map(u => u._id);

  const instructorExams = await Exam.find({
    createdBy: { $in: [...adminIds, req.user._id] }
  }).select('_id');
  const examIds = instructorExams.map(exam => exam._id);

  const uniqueStudentIds = await Result.find({ exam: { $in: examIds } }).distinct(
    'student'
  );

  const totalStudents = uniqueStudentIds.length;

  const activeStudents = await Result.find({
    exam: { $in: examIds },
    status: 'in-progress'
  }).distinct('student');

  const studentsWithCompleted = await Result.find({
    exam: { $in: examIds },
    status: { $in: ['completed', 'submitted', 'auto-submitted'] }
  }).distinct('student');

  const allResults = await Result.find({
    exam: { $in: examIds },
    status: { $in: ['completed', 'submitted', 'auto-submitted'] }
  }).select('scoring.percentage');

  const performanceDistribution = {
    excellent: 0,
    good: 0,
    average: 0,
    poor: 0
  };

  allResults.forEach(result => {
    const percentage = result.scoring?.percentage || 0;
    if (percentage >= 90) performanceDistribution.excellent++;
    else if (percentage >= 70) performanceDistribution.good++;
    else if (percentage >= 50) performanceDistribution.average++;
    else performanceDistribution.poor++;
  });

  return sendSuccessResponse(
    res,
    'Student statistics retrieved successfully',
    {
      stats: {
        totalStudents,
        activeStudents: activeStudents.length,
        studentsWithCompleted: studentsWithCompleted.length,
        performanceDistribution
      }
    }
  );
});

// Get student by ID with exam history scoped to this instructor
export const getStudentById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Exams visible to this instructor: created by any admin or by this instructor
  const adminUsers = await User.find({ role: 'admin' }).select('_id');
  const adminIds = adminUsers.map(u => u._id);

  const instructorExams = await Exam.find({
    createdBy: { $in: [...adminIds, req.user._id] }
  }).select('_id');
  const examIds = instructorExams.map(exam => exam._id);

  const hasResults = await Result.exists({
    student: id,
    exam: { $in: examIds }
  });

  if (!hasResults) {
    return sendErrorResponse(
      res,
      'Student not found or has not taken your exams',
      404
    );
  }

  const student = await User.findById(id).select(
    'name email status profile stats createdAt'
  );

  if (!student) {
    return sendNotFoundResponse(res, 'Student');
  }

  const results = await Result.find({
    student: id,
    exam: { $in: examIds }
  })
    .populate('exam', 'title totalMarks totalQuestions subject')
    .sort({ submittedAt: -1 });

  const examHistory = results.map(result => ({
    examId: result.exam._id,
    examTitle: result.exam.title,
    status: result.status,
    score: result.scoring?.marksObtained || 0,
    totalMarks: result.scoring?.totalMarks || result.exam.totalMarks,
    percentage: result.scoring?.percentage || 0,
    submittedAt: result.submittedAt,
    subject: result.exam.subject
  }));

  const completedExams = results.filter(r =>
    ['completed', 'submitted', 'auto-submitted'].includes(r.status)
  );

  const averageScore =
    completedExams.length > 0
      ?
        completedExams.reduce(
          (sum, r) => sum + (r.scoring?.percentage || 0),
          0
        ) / completedExams.length
      : 0;

  return sendSuccessResponse(
    res,
    'Student details retrieved successfully',
    {
      student: {
        ...student.toObject(),
        stats: {
          totalExams: results.length,
          completedExams: completedExams.length,
          inProgressExams: results.filter(
            r => r.status === 'in-progress'
          ).length,
          averageScore: Math.round(averageScore * 10) / 10
        },
        examHistory
      }
    }
  );
});

// Get student performance analytics scoped to instructor exams
export const getStudentPerformance = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Exams visible to this instructor: created by any admin or by this instructor
  const adminUsers = await User.find({ role: 'admin' }).select('_id');
  const adminIds = adminUsers.map(u => u._id);

  const instructorExams = await Exam.find({
    createdBy: { $in: [...adminIds, req.user._id] }
  }).select('_id title subject');
  const examIds = instructorExams.map(exam => exam._id);

  const results = await Result.find({
    student: id,
    exam: { $in: examIds },
    status: { $in: ['completed', 'submitted', 'auto-submitted'] }
  })
    .populate('exam', 'title totalMarks subject')
    .sort({ submittedAt: 1 });

  if (results.length === 0) {
    return sendErrorResponse(
      res,
      'No performance data found for this student',
      404
    );
  }

  const performanceOverTime = results.map(result => ({
    examTitle: result.exam.title,
    score: result.scoring?.marksObtained || 0,
    totalMarks: result.scoring?.totalMarks || result.exam.totalMarks,
    percentage: Math.round(result.scoring?.percentage || 0),
    date: result.submittedAt
  }));

  const subjectPerformanceMap = {};
  results.forEach(result => {
    const subject = result.exam.subject || 'General';
    if (!subjectPerformanceMap[subject]) {
      subjectPerformanceMap[subject] = {
        totalExams: 0,
        totalPercentage: 0
      };
    }
    subjectPerformanceMap[subject].totalExams += 1;
    subjectPerformanceMap[subject].totalPercentage +=
      result.scoring?.percentage || 0;
  });

  const subjectPerformance = Object.entries(subjectPerformanceMap).map(
    ([subject, data]) => ({
      subject,
      averagePercentage: Math.round(
        data.totalPercentage / data.totalExams
      ),
      totalExams: data.totalExams
    })
  );

  const totalPercentage = results.reduce(
    (sum, r) => sum + (r.scoring?.percentage || 0),
    0
  );
  const overallPercentage = Math.round(totalPercentage / results.length);

  const recentResults = results.slice(-5);
  const recentAverage =
    recentResults.length > 0
      ?
        Math.round(
          recentResults.reduce(
            (sum, r) => sum + (r.scoring?.percentage || 0),
            0
          ) / recentResults.length
        )
      : 0;

  const overallAverage = overallPercentage;
  const trend =
    recentAverage > overallAverage
      ? 'improving'
      : recentAverage < overallAverage
        ? 'declining'
        : 'stable';

  return sendSuccessResponse(
    res,
    'Student performance retrieved successfully',
    {
      performance: {
        overallStats: {
          totalExams: results.length,
          overallPercentage,
          recentAverage,
          trend
        },
        performanceOverTime,
        subjectPerformance
      }
    }
  );
});

// Get student's exam attempts for instructor's exams
export const getStudentExams = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, page = 1, limit = 10 } = req.query;
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  const skip = (pageNum - 1) * limitNum;

  // Exams visible to this instructor: created by any admin or by this instructor
  const adminUsers = await User.find({ role: 'admin' }).select('_id');
  const adminIds = adminUsers.map(u => u._id);

  const instructorExams = await Exam.find({
    createdBy: { $in: [...adminIds, req.user._id] }
  }).select('_id');
  const examIds = instructorExams.map(exam => exam._id);

  const query = {
    student: id,
    exam: { $in: examIds }
  };

  if (status) {
    query.status = status;
  }

  const results = await Result.find(query)
    .populate('exam', 'title totalMarks duration subject questions')
    .sort({ submittedAt: -1 })
    .skip(skip)
    .limit(limitNum);

  const totalCount = await Result.countDocuments(query);

  const examsWithDetails = results.map(result => ({
    id: result._id,
    exam: {
      id: result.exam._id,
      title: result.exam.title,
      subject: result.exam.subject,
      totalQuestions: result.exam.questions?.length || 0,
      totalMarks: result.scoring?.totalMarks || result.exam.totalMarks,
      duration: result.exam.duration
    },
    status: result.status,
    score: result.scoring?.marksObtained || 0,
    percentage: result.scoring?.percentage || 0,
    submittedAt: result.submittedAt,
    feedback: result.feedback
  }));

  return sendSuccessResponse(
    res,
    'Student exams retrieved successfully',
    {
      exams: examsWithDetails,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        pages: Math.ceil(totalCount / limitNum)
      }
    }
  );
});

export default {
  getAssignedStudents,
  getStudentStats,
  getStudentById,
  getStudentPerformance,
  getStudentExams
};
