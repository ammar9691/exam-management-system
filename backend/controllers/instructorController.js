import User from '../models/User.js';
import Exam from '../models/Exam.js';
import Question from '../models/Question.js';
import Result from '../models/Result.js';
import Subject from '../models/Subject.js';
import { asyncHandler } from '../middleware/error.js';
import mongoose from 'mongoose';

// @desc    Get instructor dashboard stats
// @route   GET /api/instructor/dashboard/overview
// @access  Private (Instructor)
export const getDashboardStats = asyncHandler(async (req, res) => {
  const instructorId = req.user._id;

  try {
    // Get instructor's subjects
    const subjects = await Subject.find({
      'instructors.user': instructorId
    });

    // Get basic stats first
    const [
      totalExams,
      activeExams,
      totalQuestions,
      totalStudents
    ] = await Promise.all([
      Exam.countDocuments({ createdBy: instructorId }),
      Exam.countDocuments({ 
        createdBy: instructorId, 
        status: 'active',
        'schedule.startTime': { $lte: new Date() },
        'schedule.endTime': { $gte: new Date() }
      }),
      Question.countDocuments({ createdBy: instructorId }),
      User.countDocuments({ 
        role: 'student',
        status: 'active'
      })
    ]);

    // Get instructor's exam IDs
    const instructorExamIds = await Exam.find({ createdBy: instructorId }).distinct('_id');
    
    // Get recent results
    const recentResults = instructorExamIds.length > 0 
      ? await Result.find({ 
          exam: { $in: instructorExamIds }
        })
        .populate('student', 'name email')
        .populate('exam', 'title')
        .sort({ createdAt: -1 })
        .limit(10)
      : [];

    // Get exam performance stats with better error handling
    let examStats = [];
    if (instructorExamIds.length > 0) {
      try {
        examStats = await Exam.aggregate([
          { $match: { createdBy: new mongoose.Types.ObjectId(instructorId) } },
          {
            $lookup: {
              from: 'results',
              localField: '_id',
              foreignField: 'exam',
              as: 'results'
            }
          },
          {
            $addFields: {
              studentsEnrolled: {
                $cond: {
                  if: { $isArray: '$eligibility.students' },
                  then: { $size: '$eligibility.students' },
                  else: 0
                }
              },
              studentsAttempted: { $size: '$results' },
              validResults: {
                $filter: {
                  input: '$results',
                  cond: {
                    $and: [
                      { $ne: ['$$this.scoring.marksObtained', null] },
                      { $gte: ['$$this.scoring.marksObtained', 0] }
                    ]
                  }
                }
              }
            }
          },
          {
            $project: {
              title: 1,
              status: 1,
              totalMarks: 1,
              studentsEnrolled: 1,
              studentsAttempted: 1,
              averageScore: {
                $cond: {
                  if: { $eq: [{ $size: '$validResults' }, 0] },
                  then: 0,
                  else: { $avg: '$validResults.scoring.marksObtained' }
                }
              },
              passRate: {
                $cond: {
                  if: { $eq: [{ $size: '$validResults' }, 0] },
                  then: 0,
                  else: {
                    $multiply: [
                      {
                        $divide: [
                          {
                            $size: {
                              $filter: {
                                input: '$validResults',
                                cond: { $eq: ['$$this.scoring.passed', true] }
                              }
                            }
                          },
                          { $size: '$validResults' }
                        ]
                      },
                      100
                    ]
                  }
                }
              }
            }
          }
        ]);
      } catch (aggregateError) {
        console.error('Aggregation error:', aggregateError);
        examStats = [];
      }
    }

    // Calculate additional stats safely
    const completedResults = recentResults.filter(r => r.status === 'completed' && r.scoring && typeof r.scoring.percentage === 'number');
    const averageScore = completedResults.length > 0 
      ? completedResults.reduce((sum, r) => sum + (r.scoring.percentage || 0), 0) / completedResults.length 
      : 0;

    res.status(200).json({
      status: 'success',
      data: {
        stats: {
          totalExams: totalExams || 0,
          activeExams: activeExams || 0,
          totalQuestions: totalQuestions || 0,
          totalStudents: totalStudents || 0,
          completedResults: completedResults.length,
          averageScore: Math.round((averageScore || 0) * 100) / 100,
          subjects: subjects.length,
          recentResults: recentResults.slice(0, 5),
          examPerformance: examStats || []
        }
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    
    // Return safe fallback data
    res.status(200).json({
      status: 'success',
      data: {
        stats: {
          totalExams: 0,
          activeExams: 0,
          totalQuestions: 0,
          totalStudents: 0,
          completedResults: 0,
          averageScore: 0,
          subjects: 0,
          recentResults: [],
          examPerformance: []
        }
      }
    });
  }
});

// @desc    Get instructor's exams
// @route   GET /api/instructor/exams
// @access  Private (Instructor)
export const getExams = asyncHandler(async (req, res) => {
  const instructorId = req.user._id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const status = req.query.status;
  const subject = req.query.subject;

  const query = { createdBy: instructorId };
  
  if (status && status !== 'all') {
    query.status = status;
  }
  
  if (subject) {
    query.subject = subject;
  }

  const exams = await Exam.find(query)
    .populate('questions.question', 'question type difficulty marks')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const total = await Exam.countDocuments(query);

  // Add result statistics for each exam
  const examsWithStats = await Promise.all(
    exams.map(async (exam) => {
      const results = await Result.find({ exam: exam._id });
      const attempted = results.length;
      const completed = results.filter(r => r.status === 'completed').length;
      const averageScore = completed > 0 
        ? results.reduce((sum, r) => sum + (r.scoring?.percentage || 0), 0) / completed 
        : 0;

      return {
        ...exam.toObject(),
        stats: {
          studentsEnrolled: exam.eligibility.students.length,
          studentsAttempted: attempted,
          studentsCompleted: completed,
          averageScore: Math.round(averageScore * 100) / 100,
          passRate: completed > 0 
            ? Math.round((results.filter(r => r.scoring?.passed).length / completed) * 100) 
            : 0
        }
      };
    })
  );

  res.status(200).json({
    status: 'success',
    data: {
      exams: examsWithStats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// @desc    Create new exam
// @route   POST /api/instructor/exams
// @access  Private (Instructor)
export const createExam = asyncHandler(async (req, res) => {
  const instructorId = req.user._id;
  
  const examData = {
    ...req.body,
    createdBy: instructorId,
    status: 'draft'
  };

  const exam = await Exam.create(examData);
  
  res.status(201).json({
    status: 'success',
    data: { exam }
  });
});

// @desc    Update exam
// @route   PUT /api/instructor/exams/:id
// @access  Private (Instructor)
export const updateExam = asyncHandler(async (req, res) => {
  const instructorId = req.user._id;
  const examId = req.params.id;

  const exam = await Exam.findOne({
    _id: examId,
    createdBy: instructorId
  });

  if (!exam) {
    return res.status(404).json({
      status: 'error',
      message: 'Exam not found or unauthorized'
    });
  }

  // Don't allow editing if exam is live and has attempts
  if (exam.status === 'active') {
    const hasAttempts = await Result.findOne({ exam: examId });
    if (hasAttempts) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot edit exam that has student attempts'
      });
    }
  }

  Object.assign(exam, req.body);
  await exam.save();

  res.status(200).json({
    status: 'success',
    data: { exam }
  });
});

// @desc    Publish/Unpublish exam
// @route   PATCH /api/instructor/exams/:id/status
// @access  Private (Instructor)
export const updateExamStatus = asyncHandler(async (req, res) => {
  const instructorId = req.user._id;
  const examId = req.params.id;
  const { status } = req.body;

  const exam = await Exam.findOne({
    _id: examId,
    createdBy: instructorId
  });

  if (!exam) {
    return res.status(404).json({
      status: 'error',
      message: 'Exam not found or unauthorized'
    });
  }

  // Validate exam before publishing
  if (status === 'active') {
    if (!exam.questions || exam.questions.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot publish exam without questions'
      });
    }
    
    if (!exam.eligibility.students || exam.eligibility.students.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot publish exam without assigned students'
      });
    }
  }

  exam.status = status;
  await exam.save();

  res.status(200).json({
    status: 'success',
    data: { exam }
  });
});

// @desc    Delete exam
// @route   DELETE /api/instructor/exams/:id
// @access  Private (Instructor)
export const deleteExam = asyncHandler(async (req, res) => {
  const instructorId = req.user._id;
  const examId = req.params.id;

  const exam = await Exam.findOne({
    _id: examId,
    createdBy: instructorId
  });

  if (!exam) {
    return res.status(404).json({
      status: 'error',
      message: 'Exam not found or unauthorized'
    });
  }

  // Check if exam has results
  const hasResults = await Result.findOne({ exam: examId });
  if (hasResults) {
    return res.status(400).json({
      status: 'error',
      message: 'Cannot delete exam that has student results'
    });
  }

  await exam.deleteOne();

  res.status(200).json({
    status: 'success',
    message: 'Exam deleted successfully'
  });
});

// @desc    Get instructor's questions
// @route   GET /api/instructor/questions
// @access  Private (Instructor)
export const getQuestions = asyncHandler(async (req, res) => {
  const instructorId = req.user._id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const subject = req.query.subject;
  const difficulty = req.query.difficulty;
  const type = req.query.type;

  const query = { createdBy: instructorId };
  
  if (subject) query.subject = subject;
  if (difficulty) query.difficulty = difficulty;
  if (type) query.type = type;

  const questions = await Question.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const total = await Question.countDocuments(query);

  res.status(200).json({
    status: 'success',
    data: {
      questions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// @desc    Create new question
// @route   POST /api/instructor/questions
// @access  Private (Instructor)
export const createQuestion = asyncHandler(async (req, res) => {
  const instructorId = req.user._id;
  
  const questionData = {
    ...req.body,
    createdBy: instructorId
  };

  const question = await Question.create(questionData);
  
  res.status(201).json({
    status: 'success',
    data: { question }
  });
});

// @desc    Update question
// @route   PUT /api/instructor/questions/:id
// @access  Private (Instructor)
export const updateQuestion = asyncHandler(async (req, res) => {
  const instructorId = req.user._id;
  const questionId = req.params.id;

  const question = await Question.findOne({
    _id: questionId,
    createdBy: instructorId
  });

  if (!question) {
    return res.status(404).json({
      status: 'error',
      message: 'Question not found or unauthorized'
    });
  }

  Object.assign(question, req.body);
  await question.save();

  res.status(200).json({
    status: 'success',
    data: { question }
  });
});

// @desc    Delete question
// @route   DELETE /api/instructor/questions/:id
// @access  Private (Instructor)
export const deleteQuestion = asyncHandler(async (req, res) => {
  const instructorId = req.user._id;
  const questionId = req.params.id;

  const question = await Question.findOne({
    _id: questionId,
    createdBy: instructorId
  });

  if (!question) {
    return res.status(404).json({
      status: 'error',
      message: 'Question not found or unauthorized'
    });
  }

  // Check if question is used in any active exam
  const examUsingQuestion = await Exam.findOne({
    'questions.question': questionId,
    status: 'active'
  });

  if (examUsingQuestion) {
    return res.status(400).json({
      status: 'error',
      message: 'Cannot delete question used in active exam'
    });
  }

  await question.deleteOne();

  res.status(200).json({
    status: 'success',
    message: 'Question deleted successfully'
  });
});

// @desc    Get students assigned to instructor
// @route   GET /api/instructor/students
// @access  Private (Instructor)
export const getStudents = asyncHandler(async (req, res) => {
  const instructorId = req.user._id;
  
  // Get instructor's subjects
  const subjects = await Subject.find({
    'instructors.user': instructorId
  });

  // Get all students (in a real system, this would be filtered by enrollment)
  const students = await User.find({ 
    role: 'student',
    status: 'active'
  }).select('name email profile createdAt');

  // Get student performance stats
  const studentsWithStats = await Promise.all(
    students.map(async (student) => {
      const results = await Result.find({ 
        student: student._id,
        exam: { $in: await Exam.find({ createdBy: instructorId }).distinct('_id') }
      });

      const completed = results.filter(r => r.status === 'completed');
      const averageScore = completed.length > 0 
        ? completed.reduce((sum, r) => sum + (r.scoring?.percentage || 0), 0) / completed.length 
        : 0;

      return {
        ...student.toObject(),
        stats: {
          examsAssigned: results.length,
          examsCompleted: completed.length,
          averageScore: Math.round(averageScore * 100) / 100,
          lastActivity: completed.length > 0 
            ? Math.max(...completed.map(r => new Date(r.updatedAt).getTime()))
            : null
        }
      };
    })
  );

  res.status(200).json({
    status: 'success',
    data: {
      students: studentsWithStats,
      totalStudents: studentsWithStats.length
    }
  });
});

// @desc    Assign exam to students
// @route   POST /api/instructor/exams/:id/assign
// @access  Private (Instructor)
export const assignExamToStudents = asyncHandler(async (req, res) => {
  const instructorId = req.user._id;
  const examId = req.params.id;
  const { studentIds } = req.body;

  const exam = await Exam.findOne({
    _id: examId,
    createdBy: instructorId
  });

  if (!exam) {
    return res.status(404).json({
      status: 'error',
      message: 'Exam not found or unauthorized'
    });
  }

  // Verify all student IDs exist
  const students = await User.find({
    _id: { $in: studentIds },
    role: 'student',
    status: 'active'
  });

  if (students.length !== studentIds.length) {
    return res.status(400).json({
      status: 'error',
      message: 'Some student IDs are invalid'
    });
  }

  exam.eligibility.students = studentIds;
  await exam.save();

  res.status(200).json({
    status: 'success',
    message: `Exam assigned to ${studentIds.length} students`,
    data: { exam }
  });
});

// @desc    Get exam results and analytics
// @route   GET /api/instructor/exams/:id/results
// @access  Private (Instructor)
export const getExamResults = asyncHandler(async (req, res) => {
  const instructorId = req.user._id;
  const examId = req.params.id;

  const exam = await Exam.findOne({
    _id: examId,
    createdBy: instructorId
  }).populate('questions.question');

  if (!exam) {
    return res.status(404).json({
      status: 'error',
      message: 'Exam not found or unauthorized'
    });
  }

  const results = await Result.find({ exam: examId })
    .populate('student', 'name email')
    .sort({ 'scoring.percentage': -1 });

  // Calculate analytics
  const completed = results.filter(r => r.status === 'completed');
  const analytics = {
    totalAssigned: exam.eligibility.students.length,
    totalAttempted: results.length,
    totalCompleted: completed.length,
    completionRate: exam.eligibility.students.length > 0 
      ? Math.round((completed.length / exam.eligibility.students.length) * 100) 
      : 0,
    averageScore: completed.length > 0 
      ? Math.round((completed.reduce((sum, r) => sum + (r.scoring?.percentage || 0), 0) / completed.length) * 100) / 100
      : 0,
    passRate: completed.length > 0 
      ? Math.round((completed.filter(r => r.scoring?.passed).length / completed.length) * 100) 
      : 0,
    highestScore: completed.length > 0 
      ? Math.max(...completed.map(r => r.scoring?.percentage || 0)) 
      : 0,
    lowestScore: completed.length > 0 
      ? Math.min(...completed.map(r => r.scoring?.percentage || 0)) 
      : 0
  };

  res.status(200).json({
    status: 'success',
    data: {
      exam,
      results,
      analytics
    }
  });
});

// @desc    Get live exam monitoring data
// @route   GET /api/instructor/exams/:id/monitor
// @access  Private (Instructor)
export const monitorLiveExam = asyncHandler(async (req, res) => {
  const instructorId = req.user._id;
  const examId = req.params.id;

  const exam = await Exam.findOne({
    _id: examId,
    createdBy: instructorId
  });

  if (!exam) {
    return res.status(404).json({
      status: 'error',
      message: 'Exam not found or unauthorized'
    });
  }

  // Get all results for this exam (including in-progress)
  const results = await Result.find({ exam: examId })
    .populate('student', 'name email')
    .sort({ 'session.startTime': -1 });

  // Categorize students
  const assigned = await User.find({
    _id: { $in: exam.eligibility.students },
    role: 'student'
  }).select('name email');

  const attempted = results.map(r => r.student);
  const notStarted = assigned.filter(s => 
    !attempted.some(a => a._id.toString() === s._id.toString())
  );

  const inProgress = results.filter(r => r.status === 'in-progress');
  const completed = results.filter(r => r.status === 'completed');

  res.status(200).json({
    status: 'success',
    data: {
      exam,
      monitoring: {
        totalAssigned: assigned.length,
        notStarted: notStarted.length,
        inProgress: inProgress.length,
        completed: completed.length,
        students: {
          notStarted,
          inProgress: inProgress.map(r => ({
            ...r.student.toObject(),
            startTime: r.session.startTime,
            timeElapsed: Date.now() - new Date(r.session.startTime).getTime(),
            questionsAnswered: r.answers.filter(a => a.textAnswer || a.selectedOptions?.length > 0).length,
            totalQuestions: r.answers.length
          })),
          completed: completed.map(r => ({
            ...r.student.toObject(),
            completedAt: r.session.endTime,
            score: r.scoring.percentage,
            passed: r.scoring.passed
          }))
        }
      }
    }
  });
});

// @desc    Get grading queue for instructor
// @route   GET /api/instructor/grading
// @access  Private (Instructor)
export const getGradingQueue = asyncHandler(async (req, res) => {
  const instructorId = req.user._id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const status = req.query.status || 'pending';

  // Get results that need grading from instructor's exams
  const query = {
    exam: { $in: await Exam.find({ createdBy: instructorId }).distinct('_id') },
    status: 'completed',
    'grading.status': status
  };

  const results = await Result.find(query)
    .populate('student', 'name email')
    .populate('exam', 'title subject totalMarks')
    .sort({ 'session.endTime': 1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const total = await Result.countDocuments(query);

  res.status(200).json({
    status: 'success',
    data: {
      results,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// @desc    Grade a specific exam result
// @route   POST /api/instructor/grading/:resultId
// @access  Private (Instructor)
export const gradeExamResult = asyncHandler(async (req, res) => {
  const instructorId = req.user._id;
  const resultId = req.params.resultId;
  const { grades, comments, overallFeedback } = req.body;

  const result = await Result.findById(resultId)
    .populate('exam', 'createdBy title');

  if (!result) {
    return res.status(404).json({
      status: 'error',
      message: 'Result not found'
    });
  }

  // Check if instructor owns the exam
  if (result.exam.createdBy.toString() !== instructorId.toString()) {
    return res.status(403).json({
      status: 'error',
      message: 'Unauthorized to grade this result'
    });
  }

  // Update grading
  result.grading = {
    status: 'completed',
    gradedBy: instructorId,
    gradedAt: new Date(),
    comments: comments || '',
    overallFeedback: overallFeedback || ''
  };

  // Update individual answer grades if provided
  if (grades && Array.isArray(grades)) {
    grades.forEach(grade => {
      const answer = result.answers.id(grade.answerId);
      if (answer) {
        answer.manualGrade = grade.score;
        answer.feedback = grade.feedback || '';
      }
    });
  }

  // Recalculate scores
  const totalMarks = result.answers.reduce((sum, answer) => {
    return sum + (answer.manualGrade !== undefined ? answer.manualGrade : (answer.isCorrect ? answer.marks : 0));
  }, 0);

  result.scoring.marksObtained = totalMarks;
  result.scoring.percentage = (totalMarks / result.scoring.totalMarks) * 100;
  result.scoring.passed = result.scoring.percentage >= result.exam.passingMarks;

  await result.save();

  res.status(200).json({
    status: 'success',
    message: 'Result graded successfully',
    data: { result }
  });
});

// @desc    Bulk grade multiple results
// @route   POST /api/instructor/grading/bulk
// @access  Private (Instructor)
export const bulkGradeResults = asyncHandler(async (req, res) => {
  const instructorId = req.user._id;
  const { resultIds, action } = req.body;

  if (!Array.isArray(resultIds) || resultIds.length === 0) {
    return res.status(400).json({
      status: 'error',
      message: 'Result IDs array is required'
    });
  }

  // Verify all results belong to instructor's exams
  const results = await Result.find({
    _id: { $in: resultIds },
    exam: { $in: await Exam.find({ createdBy: instructorId }).distinct('_id') }
  });

  if (results.length !== resultIds.length) {
    return res.status(403).json({
      status: 'error',
      message: 'Some results are unauthorized or not found'
    });
  }

  let updatedCount = 0;

  for (const result of results) {
    if (action === 'approve') {
      result.grading = {
        status: 'completed',
        gradedBy: instructorId,
        gradedAt: new Date(),
        comments: 'Auto-approved'
      };
      await result.save();
      updatedCount++;
    }
  }

  res.status(200).json({
    status: 'success',
    message: `${updatedCount} results processed successfully`,
    data: { processedCount: updatedCount }
  });
});

// @desc    Get grading statistics
// @route   GET /api/instructor/grading/stats
// @access  Private (Instructor)
export const getGradingStats = asyncHandler(async (req, res) => {
  const instructorId = req.user._id;

  // Get all results from instructor's exams
  const examIds = await Exam.find({ createdBy: instructorId }).distinct('_id');
  
  const stats = await Result.aggregate([
    { $match: { exam: { $in: examIds }, status: 'completed' } },
    {
      $group: {
        _id: '$grading.status',
        count: { $sum: 1 }
      }
    }
  ]);

  const gradingStats = {
    pending: 0,
    completed: 0,
    total: 0
  };

  stats.forEach(stat => {
    gradingStats[stat._id || 'pending'] = stat.count;
    gradingStats.total += stat.count;
  });

  res.status(200).json({
    status: 'success',
    data: { stats: gradingStats }
  });
});
