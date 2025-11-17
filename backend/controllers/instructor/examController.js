/**
 * Instructor Exam Controller
 * Mirrors admin exam workflows while scoping data to the instructor
 */

import mongoose from 'mongoose';
import Exam from '../../models/Exam.js';
import Question from '../../models/Question.js';
import Result from '../../models/Result.js';
import User from '../../models/User.js';
import {
  sendSuccessResponse,
  sendErrorResponse,
  sendNotFoundResponse,
  asyncHandler
} from '../../utils/response.js';
import {
  parsePaginationParams,
  buildSearchQuery,
  buildFilterQuery,
  executePaginatedQuery
} from '../../utils/pagination.js';
import { Parser } from 'json2csv';
import ExcelJS from 'exceljs';

// Get all exams accessible to the instructor with search, filters & pagination
// Visibility rules:
// - Instructor can see exams created by any admin
// - Instructor can see exams they created themselves
// - Instructor CANNOT see exams created by other instructors
export const getInstructorExams = asyncHandler(async (req, res) => {
  const instructorId = req.user._id;

  const searchFields = ['title', 'description', 'subject'];
  const allowedFilters = ['subject', 'status', 'type'];

  const { page, limit, sort, search } = parsePaginationParams(req);

  // Find all admin user IDs
  const adminUsers = await User.find({ role: 'admin' }).select('_id');
  const adminIds = adminUsers.map(u => u._id);

  // Exams must be created either by this instructor or by an admin
  let query = { createdBy: { $in: [...adminIds, instructorId] } };

  if (search) {
    const searchQuery = buildSearchQuery(search, searchFields);
    query = { ...query, ...searchQuery };
  }

  const filterQuery = buildFilterQuery(req, allowedFilters);
  query = { ...query, ...filterQuery };

  const { data, pagination } = await executePaginatedQuery(Exam, query, {
    page,
    limit,
    sort: Object.keys(sort).length > 0 ? sort : { 'schedule.startTime': -1 },
    populate: [
      { path: 'createdBy', select: 'name email' },
      { path: 'questions.question', select: 'question type difficulty marks' },
      { path: 'eligibility.students', select: 'name email' }
    ]
  });

  return sendSuccessResponse(
    res,
    'Instructor exams retrieved successfully',
    {
      exams: data,
      pagination
    }
  );
});

// Get exam statistics for instructor dashboard (summary only)
export const getExamStats = asyncHandler(async (req, res) => {
  const instructorId = req.user._id;

  const totalExams = await Exam.countDocuments({ createdBy: instructorId });
  const publishedExams = await Exam.countDocuments({
    createdBy: instructorId,
    status: 'active'
  });
  const draftExams = await Exam.countDocuments({
    createdBy: instructorId,
    status: 'draft'
  });

  const recentExams = await Exam.find({ createdBy: instructorId })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('title status createdAt totalQuestions duration');

  return sendSuccessResponse(
    res,
    'Instructor exam statistics retrieved successfully',
    {
      stats: {
        totalExams,
        publishedExams,
        draftExams,
        recentExams
      }
    }
  );
});

// Get available subjects for instructor exam creation (mirrors admin but scoped)
export const getAvailableSubjects = asyncHandler(async (req, res) => {
  // Instructors should see subjects based on all questions they can access:
  // questions they created AND questions created by admins
  const adminUsers = await User.find({ role: 'admin' }).select('_id');
  const adminIds = adminUsers.map(u => u._id);

  const subjects = await Question.aggregate([
    {
      $match: {
        status: 'active',
        createdBy: { $in: [...adminIds, req.user._id] }
      }
    },
    {
      $group: {
        _id: {
          subject: '$subject',
          difficulty: '$difficulty'
        },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.subject',
        difficulties: {
          $push: {
            level: '$_id.difficulty',
            count: '$count'
          }
        },
        totalQuestions: { $sum: '$count' }
      }
    },
    {
      $project: {
        subject: '$_id',
        totalQuestions: 1,
        easy: {
          $arrayElemAt: [
            {
              $filter: {
                input: '$difficulties',
                cond: { $eq: ['$$this.level', 'easy'] }
              }
            },
            0
          ]
        },
        medium: {
          $arrayElemAt: [
            {
              $filter: {
                input: '$difficulties',
                cond: { $eq: ['$$this.level', 'medium'] }
              }
            },
            0
          ]
        },
        hard: {
          $arrayElemAt: [
            {
              $filter: {
                input: '$difficulties',
                cond: { $eq: ['$$this.level', 'hard'] }
              }
            },
            0
          ]
        }
      }
    },
    {
      $project: {
        subject: 1,
        totalQuestions: 1,
        easyCount: { $ifNull: ['$easy.count', 0] },
        mediumCount: { $ifNull: ['$medium.count', 0] },
        hardCount: { $ifNull: ['$hard.count', 0] }
      }
    },
    { $sort: { subject: 1 } }
  ]);

  return sendSuccessResponse(
    res,
    'Available subjects retrieved successfully',
    { subjects }
  );
});

// Create a new exam – mirrors admin subject/weightage workflow but scoped to instructor
export const createExam = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    subjects,
    type,
    duration,
    totalMarks,
    passingMarks,
    schedule,
    instructions,
    settings,
    eligibility,
    status
  } = req.body;

  const allowedStatuses = ['draft', 'active', 'cancelled'];
  const examStatus = status || 'draft';

  if (!allowedStatuses.includes(examStatus)) {
    return sendErrorResponse(
      res,
      `Invalid status. Allowed statuses: ${allowedStatuses.join(', ')}`,
      400
    );
  }

  if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
    return sendErrorResponse(res, 'At least one subject with weightage is required', 400);
  }

  const totalWeightage = subjects.reduce((sum, s) => sum + (s.weightage || 0), 0);
  if (Math.abs(totalWeightage - 100) > 0.01) {
    return sendErrorResponse(res, 'Subject weightages must add up to 100', 400);
  }

  if (!totalMarks || totalMarks <= 0) {
    return sendErrorResponse(res, 'Total marks must be specified', 400);
  }

  if (!schedule?.startTime || !schedule?.endTime) {
    return sendErrorResponse(
      res,
      'Schedule startTime and endTime are required',
      400
    );
  }

  if (new Date(schedule.endTime) <= new Date(schedule.startTime)) {
    return sendErrorResponse(res, 'End time must be after start time', 400);
  }

  let examQuestions = [];
  let calculatedTotalMarks = 0;

  for (const subjectInfo of subjects) {
    const { subject, weightage } = subjectInfo;
    const subjectMarks = Math.round((totalMarks * weightage) / 100);
    const questionsNeeded = subjectMarks;

    if (questionsNeeded === 0) continue;

    const questionsPerDifficulty = Math.floor(questionsNeeded / 3);
    const remainingQuestions = questionsNeeded % 3;

    const difficulties = [
      { level: 'easy', count: questionsPerDifficulty + (remainingQuestions > 0 ? 1 : 0) },
      { level: 'medium', count: questionsPerDifficulty + (remainingQuestions > 1 ? 1 : 0) },
      { level: 'hard', count: questionsPerDifficulty }
    ];

    for (const diff of difficulties) {
      if (diff.count === 0) continue;

      const availableQuestions = await Question.find({
        subject,
        difficulty: diff.level,
        status: 'active'
      }).limit(diff.count * 2);

      if (availableQuestions.length < diff.count) {
        return sendErrorResponse(
          res,
          `Not enough ${diff.level} questions available for subject ${subject}. Need ${diff.count}, found ${availableQuestions.length}`,
          400
        );
      }

      const shuffled = availableQuestions.sort(() => 0.5 - Math.random());
      const selectedQuestions = shuffled.slice(0, diff.count);

      selectedQuestions.forEach(q => {
        examQuestions.push({
          question: q._id,
          marks: 1,
          order: examQuestions.length + 1
        });
        calculatedTotalMarks += 1;
      });
    }
  }

  examQuestions = examQuestions
    .sort(() => 0.5 - Math.random())
    .map((q, index) => ({ ...q, order: index + 1 }));

  const exam = new Exam({
    title,
    description,
    subject: subjects[0].subject,
    subjects,
    type: type || 'quiz',
    duration,
    totalMarks: calculatedTotalMarks,
    passingMarks: passingMarks || Math.ceil(calculatedTotalMarks * 0.6),
    questions: examQuestions,
    schedule: {
      startTime: new Date(schedule.startTime),
      endTime: new Date(schedule.endTime),
      timezone: schedule.timezone || 'UTC',
      buffer: schedule.buffer || { before: 10, after: 10 }
    },
    instructions,
    settings: {
      randomizeQuestions: true,
      autoSubmit: true,
      showResults: false,
      ...settings
    },
    eligibility: eligibility || {},
    createdBy: req.user._id,
    status: examStatus
  });

  await exam.save();

  const populatedExam = await Exam.findById(exam._id)
    .populate('createdBy', 'name email')
    .populate('questions.question', 'question type difficulty marks');

  return sendSuccessResponse(
    res,
    'Exam created successfully',
    { exam: populatedExam },
    201
  );
});

// Update an exam (same rules as admin but scoped to instructor)
export const updateExam = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  if (updateData.status) {
    const allowedStatuses = ['draft', 'active', 'cancelled'];
    if (!allowedStatuses.includes(updateData.status)) {
      return sendErrorResponse(
        res,
        `Invalid status. Allowed statuses: ${allowedStatuses.join(', ')}`,
        400
      );
    }
  }

  const exam = await Exam.findById(id);
  if (!exam) {
    return sendNotFoundResponse(res, 'Exam');
  }

  // Permission: exam must be created either by this instructor or by an admin
  const adminUsers = await User.find({ role: 'admin' }).select('_id');
  const adminIds = adminUsers.map(u => String(u._id));
  const createdByStr = String(exam.createdBy);
  const instructorIdStr = String(req.user._id);

  if (createdByStr !== instructorIdStr && !adminIds.includes(createdByStr)) {
    return sendErrorResponse(res, 'Not authorized to modify this exam', 403);
  }

  const now = new Date();
  if (exam.schedule && exam.schedule.startTime <= now && exam.status === 'active') {
    const allowedFields = ['schedule.endTime', 'instructions', 'settings'];
    const hasRestrictedUpdates = Object.keys(updateData).some(field =>
      !allowedFields.includes(field) && updateData[field] !== undefined
    );

    if (hasRestrictedUpdates) {
      return sendErrorResponse(
        res,
        'Cannot modify exam structure after it has started',
        400
      );
    }
  }

  if (updateData.questions) {
    const questionIds = updateData.questions.map(q => q.question);
    const existingQuestions = await Question.find({ _id: { $in: questionIds } });

    if (existingQuestions.length !== questionIds.length) {
      return sendErrorResponse(res, 'Some questions do not exist', 400);
    }
  }

  Object.keys(updateData).forEach(key => {
    if (key !== '_id' && key !== 'createdBy' && key !== 'createdAt') {
      if (key === 'schedule' || key === 'settings' || key === 'eligibility') {
        exam[key] = { ...exam[key], ...updateData[key] };
      } else {
        exam[key] = updateData[key];
      }
    }
  });

  exam.lastModifiedBy = req.user._id;
  await exam.save();

  const populatedExam = await Exam.findById(id)
    .populate('createdBy', 'name email')
    .populate('questions.question', 'question type difficulty marks');

  return sendSuccessResponse(
    res,
    'Exam updated successfully',
    { exam: populatedExam }
  );
});

// Soft-cancel an exam (cannot delete if it has results)
export const deleteExam = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const exam = await Exam.findById(id);
  if (!exam) {
    return sendNotFoundResponse(res, 'Exam');
  }

  // Permission: exam must be created either by this instructor or by an admin
  const adminUsers = await User.find({ role: 'admin' }).select('_id');
  const adminIds = adminUsers.map(u => String(u._id));
  const createdByStr = String(exam.createdBy);
  const instructorIdStr = String(req.user._id);

  if (createdByStr !== instructorIdStr && !adminIds.includes(createdByStr)) {
    return sendErrorResponse(res, 'Not authorized to delete this exam', 403);
  }

  const hasResults = await Result.exists({ exam: id });
  if (hasResults) {
    return sendErrorResponse(
      res,
      'Cannot delete exam with existing results',
      400
    );
  }

  exam.status = 'cancelled';
  exam.lastModifiedBy = req.user._id;
  await exam.save();

  return sendSuccessResponse(res, 'Exam cancelled successfully');
});

// Get exam by ID (instructor-owned)
export const getExamById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const exam = await Exam.findById(id)
    .populate('questions.question', 'question type difficulty marks')
    .populate('createdBy', 'name email');

  if (!exam) {
    return sendNotFoundResponse(res, 'Exam');
  }

  // Permission: exam must be created either by this instructor or by an admin
  const adminUsers = await User.find({ role: 'admin' }).select('_id');
  const adminIds = adminUsers.map(u => String(u._id));
  const createdByStr = String(exam.createdBy?._id || exam.createdBy);
  const instructorIdStr = String(req.user._id);

  if (createdByStr !== instructorIdStr && !adminIds.includes(createdByStr)) {
    return sendErrorResponse(res, 'Not authorized to access this exam', 403);
  }

  return sendSuccessResponse(res, 'Exam retrieved successfully', { exam });
});

// Publish an exam (make it active)
export const publishExam = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const exam = await Exam.findById(id);
  if (!exam) {
    return sendNotFoundResponse(res, 'Exam');
  }

  // Permission: exam must be created either by this instructor or by an admin
  const adminUsers = await User.find({ role: 'admin' }).select('_id');
  const adminIds = adminUsers.map(u => String(u._id));
  const createdByStr = String(exam.createdBy);
  const instructorIdStr = String(req.user._id);

  if (createdByStr !== instructorIdStr && !adminIds.includes(createdByStr)) {
    return sendErrorResponse(res, 'Not authorized to publish this exam', 403);
  }

  if (exam.status !== 'draft') {
    return sendErrorResponse(res, 'Only draft exams can be published', 400);
  }

  if (!exam.questions || exam.questions.length === 0) {
    return sendErrorResponse(res, 'Cannot publish exam without questions', 400);
  }

  exam.status = 'active';
  exam.lastModifiedBy = req.user._id;
  await exam.save();

  return sendSuccessResponse(res, 'Exam published successfully');
});

// Update exam status (draft / active / cancelled)
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

  // Permission: exam must be created either by this instructor or by an admin
  const adminUsers = await User.find({ role: 'admin' }).select('_id');
  const adminIds = adminUsers.map(u => String(u._id));
  const createdByStr = String(exam.createdBy);
  const instructorIdStr = String(req.user._id);

  if (createdByStr !== instructorIdStr && !adminIds.includes(createdByStr)) {
    return sendErrorResponse(res, 'Not authorized to update this exam status', 403);
  }

  exam.status = status;
  if (status === 'active') {
    exam.publishedAt = new Date();
  }
  exam.lastModifiedBy = req.user._id;
  await exam.save();

  return sendSuccessResponse(res, 'Exam status updated successfully', { exam });
});

// Bulk operations for exams (publish/cancel/updateDuration) for this instructor
export const bulkUpdateExams = asyncHandler(async (req, res) => {
  const { examIds, action, data } = req.body;

  if (!Array.isArray(examIds) || examIds.length === 0) {
    return sendErrorResponse(res, 'Exam IDs array is required', 400);
  }

  let updateQuery = { lastModifiedBy: req.user._id };
  let successMessage = '';

  switch (action) {
    case 'publish':
      updateQuery.status = 'active';
      successMessage = 'Exams published successfully';
      break;
    case 'cancel':
      updateQuery.status = 'cancelled';
      successMessage = 'Exams cancelled successfully';
      break;
    case 'updateDuration':
      if (!data?.duration) {
        return sendErrorResponse(res, 'Duration is required', 400);
      }
      updateQuery.duration = data.duration;
      successMessage = `Exam duration updated to ${data.duration} minutes successfully`;
      break;
    default:
      return sendErrorResponse(res, 'Invalid action', 400);
  }

  // Only update exams created by this instructor or admins
  const adminUsers = await User.find({ role: 'admin' }).select('_id');
  const adminIds = adminUsers.map(u => u._id);

  const result = await Exam.updateMany(
    { _id: { $in: examIds }, createdBy: { $in: [...adminIds, req.user._id] } },
    updateQuery
  );

  return sendSuccessResponse(res, successMessage, {
    modifiedCount: result.modifiedCount,
    matchedCount: result.matchedCount
  });
});

// Get exam monitoring data (for live exams)
export const getExamMonitorData = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const exam = await Exam.findById(id);
  if (!exam) {
    return sendNotFoundResponse(res, 'Exam');
  }

  // Permission: exam must be created either by this instructor or by an admin
  const adminUsers = await User.find({ role: 'admin' }).select('_id');
  const adminIds = adminUsers.map(u => String(u._id));
  const createdByStr = String(exam.createdBy);
  const instructorIdStr = String(req.user._id);

  if (createdByStr !== instructorIdStr && !adminIds.includes(createdByStr)) {
    return sendErrorResponse(res, 'Not authorized to monitor this exam', 403);
  }

  const results = await Result.find({ exam: id })
    .populate('student', 'name email')
    .select('student status session scoring');

  const assignedStudents = exam.eligibility?.students || [];

  const studentsMap = new Map();
  assignedStudents.forEach(s => {
    studentsMap.set(String(s), {
      _id: s,
      name: '',
      email: '',
      status: 'not-started',
      questionsAnswered: 0,
      totalQuestions: exam.questions?.length || 0,
      timeElapsed: 0,
      startTime: null,
      completedAt: null,
      score: null,
      passed: null
    });
  });

  results.forEach(r => {
    const key = String(r.student._id);
    const base = studentsMap.get(key) || {
      _id: r.student._id,
      name: r.student.name,
      email: r.student.email,
      totalQuestions: exam.questions?.length || 0,
      questionsAnswered: 0,
      timeElapsed: 0,
      startTime: null,
      completedAt: null,
      score: null,
      passed: null,
      status: 'not-started'
    };

    const now = new Date();
    const started = r.session?.startTime;
    const ended = r.session?.endTime;

    base.name = r.student.name;
    base.email = r.student.email;
    base.status = r.status;
    base.startTime = started;
    base.completedAt = ended;
    base.score = r.scoring?.percentage ?? null;
    base.passed = r.scoring?.passed ?? null;

    if (started) {
      const endRef = ended || now;
      base.timeElapsed = endRef - started;
    }

    studentsMap.set(key, base);
  });

  const studentsArray = Array.from(studentsMap.values());

  const inProgress = studentsArray.filter(s => s.status === 'in-progress');
  const completed = studentsArray.filter(s =>
    s.status === 'completed' || s.status === 'graded'
  );
  const notStarted = studentsArray.filter(s => s.status === 'not-started');

  const monitoring = {
    totalAssigned: studentsArray.length,
    inProgress: inProgress.length,
    completed: completed.length,
    notStarted: notStarted.length,
    students: {
      inProgress,
      completed,
      notStarted
    }
  };

  const monitorData = {
    exam: {
      id: exam._id,
      title: exam.title,
      status: exam.status,
      totalQuestions: exam.questions?.length || 0,
      duration: exam.duration,
      schedule: exam.schedule
    },
    monitoring
  };

  return sendSuccessResponse(
    res,
    'Exam monitor data retrieved successfully',
    monitorData
  );
});

// Get exam results with basic statistics
export const getExamResults = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const exam = await Exam.findById(id);
  if (!exam) {
    return sendNotFoundResponse(res, 'Exam');
  }

  // Permission: exam must be created either by this instructor or by an admin
  const adminUsers = await User.find({ role: 'admin' }).select('_id');
  const adminIds = adminUsers.map(u => String(u._id));
  const createdByStr = String(exam.createdBy);
  const instructorIdStr = String(req.user._id);

  if (createdByStr !== instructorIdStr && !adminIds.includes(createdByStr)) {
    return sendErrorResponse(res, 'Not authorized to view results for this exam', 403);
  }

  const results = await Result.find({ exam: id })
    .populate('student', 'name email')
    .sort({ createdAt: -1 });

  const resultsPayload = results.map(result => ({
    id: result._id,
    student: result.student,
    score: result.scoring?.marksObtained ?? 0,
    percentage: result.scoring?.percentage ?? 0,
    status: result.status,
    startedAt: result.session?.startTime,
    submittedAt: result.session?.endTime,
    timeTaken:
      result.session?.endTime && result.session?.startTime
        ? Math.floor(
            (new Date(result.session.endTime) -
              new Date(result.session.startTime)) /
              1000 /
              60
          )
        : null
  }));

  const scorePercentages = results.map(
    r => r.scoring?.percentage ?? 0
  );

  const stats = {
    totalAttempts: results.length,
    averageScore:
      results.length > 0
        ? scorePercentages.reduce((sum, v) => sum + v, 0) / results.length
        : 0,
    highestScore:
      results.length > 0 ? Math.max(...scorePercentages) : 0,
    lowestScore:
      results.length > 0 ? Math.min(...scorePercentages) : 0
  };

  const payload = {
    exam: {
      id: exam._id,
      title: exam.title,
      totalQuestions: exam.questions?.length || 0,
      totalMarks: exam.totalMarks
    },
    results: resultsPayload,
    stats
  };

  return sendSuccessResponse(
    res,
    'Exam results retrieved successfully',
    payload
  );
});

// Assign exam to students (update eligibility.students)
export const assignExamToStudents = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { studentIds } = req.body;

  if (!Array.isArray(studentIds) || studentIds.length === 0) {
    return sendErrorResponse(res, 'studentIds array is required', 400);
  }

  // Normalize incoming student IDs (handle strings, objects, and filter out invalid values)
  const normalizeId = (value) => {
    if (!value) return null;

    // If a full user object was sent accidentally, use its id/_id
    if (typeof value === 'object') {
      if (value._id) return String(value._id);
      if (value.id) return String(value.id);
      return null;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      // Accept only 24-char hex strings as valid ObjectId representations
      if (/^[0-9a-fA-F]{24}$/.test(trimmed)) {
        return trimmed;
      }
      return null;
    }

    return null;
  };

  const normalizedIncomingIds = studentIds
    .map(normalizeId)
    .filter(Boolean);

  if (normalizedIncomingIds.length === 0) {
    return sendErrorResponse(res, 'No valid student IDs provided', 400);
  }

  const exam = await Exam.findById(id);
  if (!exam) {
    return sendNotFoundResponse(res, 'Exam');
  }

  // Permission: exam must be created either by this instructor or by an admin
  const adminUsers = await User.find({ role: 'admin' }).select('_id');
  const adminIds = adminUsers.map(u => String(u._id));
  const createdByStr = String(exam.createdBy);
  const instructorIdStr = String(req.user._id);

  if (createdByStr !== instructorIdStr && !adminIds.includes(createdByStr)) {
    return sendErrorResponse(res, 'Not authorized to assign this exam', 403);
  }

  // Sanitize existing stored IDs (handle ObjectIds, populated docs, and drop invalid strings)
  const existingIds = (exam.eligibility?.students || [])
    .map((s) => {
      if (!s) return null;
      if (typeof s === 'string') {
        const trimmed = s.trim();
        return /^[0-9a-fA-F]{24}$/.test(trimmed) ? trimmed : null;
      }
      if (typeof s === 'object') {
        if (s._id) return String(s._id);
        if (s.id) return String(s.id);
        return null;
      }
      return null;
    })
    .filter(Boolean);

  // Merge existing + incoming, remove duplicates, and cast to ObjectId for storage
  const mergedIds = Array.from(new Set([...existingIds, ...normalizedIncomingIds]));

  exam.eligibility = exam.eligibility || {};
  exam.eligibility.students = mergedIds.map((id) => new mongoose.Types.ObjectId(id));

  await exam.save();

  return sendSuccessResponse(
    res,
    'Exam assigned to students successfully',
    { examId: exam._id, students: exam.eligibility.students }
  );
});

// Export exam results (CSV/Excel) – mirrors admin exportExamResults
export const exportExamResults = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { format = 'excel' } = req.query;

  const exam = await Exam.findById(id);
  if (!exam) {
    return sendNotFoundResponse(res, 'Exam');
  }

  // Permission: exam must be created either by this instructor or by an admin
  const adminUsers = await User.find({ role: 'admin' }).select('_id');
  const adminIds = adminUsers.map(u => String(u._id));
  const createdByStr = String(exam.createdBy);
  const instructorIdStr = String(req.user._id);

  if (createdByStr !== instructorIdStr && !adminIds.includes(createdByStr)) {
    return sendErrorResponse(res, 'Not authorized to export results for this exam', 403);
  }

  const results = await Result.find({ exam: id })
    .populate('student', 'name email')
    .populate('exam', 'title subject totalMarks')
    .lean();

  if (format === 'csv') {
    const fields = [
      'student.name',
      'student.email',
      'scoring.marksObtained',
      'scoring.percentage',
      'scoring.grade',
      'scoring.passed',
      'stats.correctAnswers',
      'stats.incorrectAnswers',
      'session.startTime',
      'session.endTime',
      'status'
    ];

    const parser = new Parser({ fields });
    const csv = parser.parse(results);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${exam.title}_results.csv"`
    );
    return res.send(csv);
  }

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Results');

  worksheet.addRow([
    'Student Name',
    'Email',
    'Marks Obtained',
    'Total Marks',
    'Percentage',
    'Grade',
    'Passed',
    'Correct Answers',
    'Incorrect Answers',
    'Start Time',
    'End Time',
    'Status'
  ]);

  results.forEach(result => {
    worksheet.addRow([
      result.student?.name || 'N/A',
      result.student?.email || 'N/A',
      result.scoring?.marksObtained || 0,
      result.scoring?.totalMarks || 0,
      result.scoring?.percentage || 0,
      result.scoring?.grade || 'F',
      result.scoring?.passed ? 'Yes' : 'No',
      result.stats?.correctAnswers || 0,
      result.stats?.incorrectAnswers || 0,
      result.session?.startTime || 'N/A',
      result.session?.endTime || 'N/A',
      result.status || 'N/A'
    ]);
  });

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${exam.title}_results.xlsx"`
  );

  await workbook.xlsx.write(res);
  res.end();
});

// Get exam analytics (delegates to Result/Exam aggregates similar to admin)
export const getExamAnalytics = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const exam = await Exam.findById(id).populate(
    'questions.question',
    'question type difficulty marks'
  );
  if (!exam) {
    return sendNotFoundResponse(res, 'Exam');
  }

  // Permission: exam must be created either by this instructor or by an admin
  const adminUsers = await User.find({ role: 'admin' }).select('_id');
  const adminIds = adminUsers.map(u => String(u._id));
  const createdByStr = String(exam.createdBy);
  const instructorIdStr = String(req.user._id);

  if (createdByStr !== instructorIdStr && !adminIds.includes(createdByStr)) {
    return sendErrorResponse(res, 'Not authorized to view analytics for this exam', 403);
  }

  const resultStats = await Result.aggregate([
    { $match: { exam: exam._id } },
    {
      $group: {
        _id: null,
        totalAttempts: { $sum: 1 },
        completedAttempts: {
          $sum: {
            $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
          }
        },
        averageScore: { $avg: '$scoring.percentage' },
        highestScore: { $max: '$scoring.percentage' },
        lowestScore: { $min: '$scoring.percentage' },
        passedStudents: {
          $sum: { $cond: ['$scoring.passed', 1, 0] }
        }
      }
    }
  ]);

  const scoreDistribution = await Result.aggregate([
    { $match: { exam: exam._id, status: 'completed' } },
    {
      $bucket: {
        groupBy: '$scoring.percentage',
        boundaries: [0, 20, 40, 60, 80, 100],
        default: '100+',
        output: {
          count: { $sum: 1 },
          averageScore: { $avg: '$scoring.percentage' }
        }
      }
    }
  ]);

  const questionPerformance = await Result.aggregate([
    { $match: { exam: exam._id, status: 'completed' } },
    { $unwind: '$answers' },
    {
      $group: {
        _id: '$answers.question',
        totalAttempts: { $sum: 1 },
        correctAttempts: {
          $sum: { $cond: ['$answers.isCorrect', 1, 0] }
        },
        averageTimeSpent: { $avg: '$answers.timeSpent' }
      }
    },
    {
      $addFields: {
        successRate: {
          $multiply: [
            { $divide: ['$correctAttempts', '$totalAttempts'] },
            100
          ]
        }
      }
    }
  ]);

  const analytics = {
    exam: {
      id: exam._id,
      title: exam.title,
      totalQuestions: exam.questions.length,
      totalMarks: exam.totalMarks,
      duration: exam.duration,
      status: exam.status
    },
    results: resultStats[0] || {
      totalAttempts: 0,
      completedAttempts: 0,
      averageScore: 0,
      highestScore: 0,
      lowestScore: 0,
      passedStudents: 0
    },
    scoreDistribution,
    questionPerformance
  };

  return sendSuccessResponse(
    res,
    'Exam analytics retrieved successfully',
    { analytics }
  );
});

export default {
  getInstructorExams,
  getExamStats,
  getAvailableSubjects,
  createExam,
  updateExam,
  deleteExam,
  getExamById,
  publishExam,
  updateExamStatus,
  bulkUpdateExams,
  getExamMonitorData,
  getExamResults,
  assignExamToStudents,
  exportExamResults,
  getExamAnalytics
};
