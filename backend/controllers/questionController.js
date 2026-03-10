/**
 * Question Controller - QDB (Question Database)
 * Handles question CRUD, approval workflow, and bulk import
 */

import Question from '../models/Question.js';
import Counter, { COUNTER_IDS } from '../models/Counter.js';
import ExcelJS from 'exceljs';
import {
  sendSuccessResponse,
  sendErrorResponse,
  sendNotFoundResponse,
  sendPaginatedResponse,
  asyncHandler
} from '../utils/response.js';
import { getPaginatedResults } from '../utils/pagination.js';
import {
  QDB_MODULES,
  getModuleOptions,
  getCategoriesForModule,
  canAutoApprove,
  canApproveQuestions,
  canCreateQuestions,
  canSeeInternalReference,
  validateModuleCategory
} from '../config/qdbModules.js';
import {
  generateQuestionSerialNo,
  generateBulkSerialNumbers,
  createRevisionEntry,
  createEditRevisionEntry,
  validateQuestionData,
  getInitialStatus,
  sanitizeQuestionForResponse,
  sanitizeQuestionsForResponse,
  TEMPLATE_COLUMNS,
  parseExcelRow,
  processExcelRows,
  prepareTrueFalseOptions
} from '../utils/qdbUtils.js';

// ============ GET ALL QUESTIONS ============
export const getAllQuestions = asyncHandler(async (req, res) => {
  const { user } = req;
  const { module, category, difficulty, knowledgeLevel, status, type } = req.query;

  // Build filter
  const filter = {};
  if (module) filter.module = module;
  if (category) filter.category = category;
  if (difficulty) filter.difficulty = difficulty;
  if (knowledgeLevel) filter.knowledgeLevel = parseInt(knowledgeLevel, 10);
  if (status) filter.status = status;
  if (type) filter.type = type;

  // Instructors can only see their own questions + approved
  if (user.role === 'instructor') {
    filter.$or = [
      { createdBy: user._id },
      { status: 'approved' }
    ];
  }

  // Module-scoped access: restrict to assigned modules (PCAA Req 11)
  if (req.allowedModules && req.allowedModules.length > 0 && !filter.module) {
    filter.module = { $in: req.allowedModules };
  }

  const options = {
    searchFields: ['question', 'serialNo', 'syllabusReference'],
    allowedFilters: ['module', 'category', 'difficulty', 'knowledgeLevel', 'status', 'type', 'createdBy'],
    defaultSort: { createdAt: -1 },
    populate: [
      { path: 'createdBy', select: 'name email' },
      { path: 'reviewedBy', select: 'name email' }
    ],
    additionalFilter: filter
  };

  const result = await getPaginatedResults(Question, req, options);

  // Sanitize response based on role
  const sanitizedData = sanitizeQuestionsForResponse(result.data, user.role);

  sendPaginatedResponse(res, sanitizedData, result.pagination, 'Questions retrieved successfully');
});

// ============ GET QUESTION BY ID ============
export const getQuestionById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { user } = req;

  const question = await Question.findById(id)
    .populate('createdBy', 'name email')
    .populate('reviewedBy', 'name email')
    .populate('revisions.revisedBy', 'name email');

  if (!question) {
    return sendNotFoundResponse(res, 'Question');
  }

  // Instructors can only see their own or approved questions
  if (user.role === 'instructor') {
    const isOwner = question.createdBy._id.toString() === user._id.toString();
    if (!isOwner && question.status !== 'approved') {
      return sendErrorResponse(res, 'Access denied', 403);
    }
  }

  const sanitized = sanitizeQuestionForResponse(question, user.role);
  sendSuccessResponse(res, 'Question retrieved successfully', { question: sanitized });
});

// ============ CREATE QUESTION ============
export const createQuestion = asyncHandler(async (req, res) => {
  const { user } = req;

  // Check permission
  if (!canCreateQuestions(user.role)) {
    return sendErrorResponse(res, 'You do not have permission to create questions', 403);
  }

  const {
    module,
    category,
    type,
    question,
    options,
    difficulty,
    knowledgeLevel,
    syllabusReference,
    answerReference,
    internalReference,
    originatorInstructorName,
    correctAnswer // For True/False: 'True' or 'False'
  } = req.body;

  // Prepare options for True/False
  let finalOptions = options;
  let finalType = type || 'mcq';

  if (type === 'true-false' || correctAnswer?.toLowerCase() === 'true' || correctAnswer?.toLowerCase() === 'false') {
    finalType = 'true-false';
    finalOptions = prepareTrueFalseOptions(correctAnswer);
  }

  // Build question data
  const questionData = {
    module,
    category,
    type: finalType,
    question,
    options: finalOptions,
    difficulty,
    knowledgeLevel: parseInt(knowledgeLevel, 10),
    syllabusReference,
    answerReference,
    originatorInstructorName: originatorInstructorName || user.name
  };

  // Only admin/exam_manager can set internal reference
  if (internalReference && canSeeInternalReference(user.role)) {
    questionData.internalReference = internalReference;
  }

  // Validate
  const validation = validateQuestionData(questionData, user.role);
  if (!validation.valid) {
    return sendErrorResponse(res, validation.errors.join('; '), 400);
  }

  // Generate serial number
  const serialNo = await generateQuestionSerialNo();

  // Determine initial status based on role
  const initialStatus = getInitialStatus(user.role);

  // Create question
  const newQuestion = new Question({
    ...questionData,
    serialNo,
    status: initialStatus,
    createdBy: user._id,
    revisions: [createRevisionEntry(user, 'create')]
  });

  // If auto-approved, set reviewer info
  if (initialStatus === 'approved') {
    newQuestion.reviewedBy = user._id;
    newQuestion.reviewedByName = user.name;
    newQuestion.reviewedAt = new Date();
  }

  await newQuestion.save();

  sendSuccessResponse(res, 'Question created successfully', {
    question: sanitizeQuestionForResponse(newQuestion, user.role),
    serialNo,
    status: initialStatus
  }, 201);
});

// ============ UPDATE QUESTION ============
export const updateQuestion = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { user } = req;

  const question = await Question.findById(id);
  if (!question) {
    return sendNotFoundResponse(res, 'Question');
  }

  // Check permissions
  const isOwner = question.createdBy.toString() === user._id.toString();
  const isAdminOrManager = ['admin', 'exam_manager'].includes(user.role);

  if (!isOwner && !isAdminOrManager) {
    return sendErrorResponse(res, 'You can only edit your own questions', 403);
  }

  // Store old data for revision log
  const oldData = question.toObject();

  // Update allowed fields
  const allowedFields = [
    'module', 'category', 'type', 'question', 'options',
    'difficulty', 'knowledgeLevel', 'syllabusReference',
    'answerReference', 'originatorInstructorName'
  ];

  // Admin/Exam Manager can also update internal reference
  if (canSeeInternalReference(user.role)) {
    allowedFields.push('internalReference');
  }

  const updates = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }

  // Handle True/False conversion
  if (req.body.correctAnswer && (req.body.type === 'true-false' || req.body.correctAnswer.toLowerCase() === 'true' || req.body.correctAnswer.toLowerCase() === 'false')) {
    updates.type = 'true-false';
    updates.options = prepareTrueFalseOptions(req.body.correctAnswer);
  }

  // Apply updates
  Object.assign(question, updates);
  question.lastModifiedBy = user._id;

  // Add revision entry
  const revisionEntry = createEditRevisionEntry(user, oldData, updates, req.body.editComment);
  if (Object.keys(revisionEntry.changes).length > 0) {
    question.revisions.push(revisionEntry);
  }

  // If question was approved and edited by non-admin, reset to pending
  if (question.status === 'approved' && user.role === 'instructor') {
    question.status = 'pending';
    question.reviewedBy = null;
    question.reviewedByName = null;
    question.reviewedAt = null;
  }

  await question.save();

  sendSuccessResponse(res, 'Question updated successfully', {
    question: sanitizeQuestionForResponse(question, user.role)
  });
});

// ============ DELETE QUESTION ============
export const deleteQuestion = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { user } = req;

  const question = await Question.findById(id);
  if (!question) {
    return sendNotFoundResponse(res, 'Question');
  }

  // Only admin/exam_manager or owner can delete
  const isOwner = question.createdBy.toString() === user._id.toString();
  const isAdminOrManager = ['admin', 'exam_manager'].includes(user.role);

  if (!isOwner && !isAdminOrManager) {
    return sendErrorResponse(res, 'You can only delete your own questions', 403);
  }

  // Soft delete - archive the question
  question.status = 'archived';
  question.lastModifiedBy = user._id;
  question.revisions.push(createRevisionEntry(user, 'edit', 'Archived/Deleted'));

  await question.save();

  sendSuccessResponse(res, 'Question archived successfully');
});

// ============ APPROVE QUESTION ============
export const approveQuestion = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { user } = req;
  const { comment } = req.body;

  if (!canApproveQuestions(user.role)) {
    return sendErrorResponse(res, 'You do not have permission to approve questions', 403);
  }

  const question = await Question.findById(id);
  if (!question) {
    return sendNotFoundResponse(res, 'Question');
  }

  if (question.status !== 'pending') {
    return sendErrorResponse(res, `Cannot approve question with status: ${question.status}`, 400);
  }

  question.approve(user._id, user.name, comment);
  await question.save();

  sendSuccessResponse(res, 'Question approved successfully', {
    question: sanitizeQuestionForResponse(question, user.role)
  });
});

// ============ REJECT QUESTION ============
export const rejectQuestion = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { user } = req;
  const { reason } = req.body;

  if (!canApproveQuestions(user.role)) {
    return sendErrorResponse(res, 'You do not have permission to reject questions', 403);
  }

  if (!reason || reason.trim().length === 0) {
    return sendErrorResponse(res, 'Rejection reason is required', 400);
  }

  const question = await Question.findById(id);
  if (!question) {
    return sendNotFoundResponse(res, 'Question');
  }

  if (question.status !== 'pending') {
    return sendErrorResponse(res, `Cannot reject question with status: ${question.status}`, 400);
  }

  question.reject(user._id, user.name, reason);
  await question.save();

  sendSuccessResponse(res, 'Question rejected', {
    question: sanitizeQuestionForResponse(question, user.role)
  });
});

// ============ GET PENDING QUESTIONS (Approval Queue) ============
export const getPendingQuestions = asyncHandler(async (req, res) => {
  const { user } = req;

  if (!canApproveQuestions(user.role)) {
    return sendErrorResponse(res, 'You do not have permission to view pending questions', 403);
  }

  const questions = await Question.getPendingQuestions({ limit: 100 });

  sendSuccessResponse(res, 'Pending questions retrieved', {
    questions: sanitizeQuestionsForResponse(questions, user.role),
    count: questions.length
  });
});

// ============ GET QDB STATISTICS ============
export const getQDBStats = asyncHandler(async (req, res) => {
  const stats = await Question.getQDBStats();
  const moduleStats = await Question.getModuleStats();

  sendSuccessResponse(res, 'QDB statistics retrieved', {
    stats,
    moduleStats
  });
});

// ============ GET MODULES & CATEGORIES ============
export const getModulesAndCategories = asyncHandler(async (req, res) => {
  const modules = getModuleOptions();
  const moduleCategories = {};

  for (const mod of modules) {
    moduleCategories[mod.id] = getCategoriesForModule(mod.id);
  }

  sendSuccessResponse(res, 'Modules and categories retrieved', {
    modules,
    moduleCategories
  });
});

// ============ DOWNLOAD EXCEL TEMPLATE ============
export const downloadTemplate = asyncHandler(async (req, res) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'QDB System';
  workbook.created = new Date();

  // Main template sheet
  const sheet = workbook.addWorksheet('Questions Template');

  // Add headers
  sheet.columns = TEMPLATE_COLUMNS.map((col, idx) => ({
    header: col,
    key: col.toLowerCase().replace(/ /g, '_'),
    width: idx === 4 ? 50 : 25 // Question column wider
  }));

  // Style header row
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  // Add example rows
  sheet.addRow({
    module: 'MODULE_1',
    category: 'Category A',
    difficulty: 'medium',
    knowledge_level: 2,
    question: 'What is 2 + 2?',
    option_a: '3',
    option_b: '4',
    option_c: '5',
    correct_answer: 'B',
    syllabus_reference: 'ANO-066 Appendix I',
    answer_reference: 'Mathematics Textbook Ch. 1',
    originator_instructor_name: 'John Doe',
    internal_reference: 'Basic arithmetic question'
  });

  sheet.addRow({
    module: 'MODULE_2',
    category: 'Category B1',
    difficulty: 'easy',
    knowledge_level: 1,
    question: 'Is gravity a force?',
    option_a: '',
    option_b: '',
    option_c: '',
    correct_answer: 'True',
    syllabus_reference: 'Physics Syllabus 2.1',
    answer_reference: 'Physics for Aviation Ch. 2',
    originator_instructor_name: 'Jane Smith',
    internal_reference: ''
  });

  // Add modules reference sheet
  const modulesSheet = workbook.addWorksheet('Modules Reference');
  modulesSheet.columns = [
    { header: 'Module ID', key: 'id', width: 20 },
    { header: 'Module Name', key: 'name', width: 60 },
    { header: 'Valid Categories', key: 'categories', width: 50 }
  ];
  modulesSheet.getRow(1).font = { bold: true };

  Object.values(QDB_MODULES).forEach(mod => {
    modulesSheet.addRow({
      id: mod.id,
      name: mod.name,
      categories: mod.categories.join(', ')
    });
  });

  // Add instructions sheet
  const instructionsSheet = workbook.addWorksheet('Instructions');
  instructionsSheet.columns = [{ header: 'Instructions', key: 'text', width: 100 }];
  instructionsSheet.getRow(1).font = { bold: true };

  const instructions = [
    'HOW TO USE THIS TEMPLATE:',
    '',
    '1. Fill in the "Questions Template" sheet with your questions',
    '2. Each row is one question',
    '3. Required fields: Module, Category, Difficulty, Knowledge Level, Question, Correct Answer, Syllabus Reference, Answer Reference, Originator Name',
    '',
    'FIELD DESCRIPTIONS:',
    '',
    'Module: Use exact module IDs from "Modules Reference" sheet (e.g., MODULE_1, MODULE_2)',
    'Category: Must match one of the valid categories for the selected module',
    'Difficulty: easy, medium, or hard',
    'Knowledge Level: 1, 2, or 3',
    'Question: The question text',
    'Option A, B, C: Answer options (leave empty for True/False questions)',
    'Correct Answer: A, B, C for MCQ; True or False for True/False questions',
    'Syllabus Reference: Reference to syllabus (mandatory)',
    'Answer Reference: Reference for correct answer (mandatory)',
    'Originator Instructor Name: Name of question creator (defaults to uploader if empty)',
    'Internal Reference: Admin/Manager notes (optional, not visible to students)'
  ];

  instructions.forEach(text => {
    instructionsSheet.addRow({ text });
  });

  // Set response headers
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader(
    'Content-Disposition',
    'attachment; filename=question_import_template.xlsx'
  );

  // Write to response
  await workbook.xlsx.write(res);
  res.end();
});

// ============ IMPORT QUESTIONS FROM EXCEL ============
export const importQuestions = asyncHandler(async (req, res) => {
  const { user } = req;

  if (!canCreateQuestions(user.role)) {
    return sendErrorResponse(res, 'You do not have permission to import questions', 403);
  }

  if (!req.file) {
    return sendErrorResponse(res, 'No file uploaded', 400);
  }

  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);

    const sheet = workbook.getWorksheet(1); // First sheet
    if (!sheet) {
      return sendErrorResponse(res, 'Excel file is empty or invalid', 400);
    }

    // Parse rows
    const rows = [];
    const headerRow = sheet.getRow(1);
    const headers = [];

    headerRow.eachCell((cell, colNumber) => {
      headers[colNumber] = cell.value?.toString().toLowerCase().replace(/ /g, '_');
    });

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header

      const rowData = {};
      row.eachCell((cell, colNumber) => {
        const header = headers[colNumber];
        if (header) {
          rowData[header] = cell.value;
        }
      });

      // Map to expected format
      rows.push({
        module: rowData.module,
        category: rowData.category,
        difficulty: rowData.difficulty,
        knowledgeLevel: rowData.knowledge_level,
        question: rowData.question,
        optionA: rowData.option_a,
        optionB: rowData.option_b,
        optionC: rowData.option_c,
        correctAnswer: rowData.correct_answer,
        syllabusReference: rowData.syllabus_reference,
        answerReference: rowData.answer_reference,
        originatorName: rowData.originator_instructor_name,
        internalReference: rowData.internal_reference
      });
    });

    if (rows.length === 0) {
      return sendErrorResponse(res, 'No data rows found in Excel file', 400);
    }

    // Process rows
    const { validQuestions, errors, summary } = await processExcelRows(rows, user);

    if (validQuestions.length === 0) {
      return sendErrorResponse(res, 'No valid questions found', 400, { errors, summary });
    }

    // Generate serial numbers for all valid questions
    const serialNumbers = await generateBulkSerialNumbers(validQuestions.length);

    // Determine status based on role
    const initialStatus = getInitialStatus(user.role);

    // Prepare questions for insert
    const questionsToInsert = validQuestions.map((q, idx) => ({
      ...q,
      serialNo: serialNumbers[idx],
      status: initialStatus,
      createdBy: user._id,
      revisions: [createRevisionEntry(user, 'import', `Bulk import row ${idx + 2}`)],
      ...(initialStatus === 'approved' ? {
        reviewedBy: user._id,
        reviewedByName: user.name,
        reviewedAt: new Date()
      } : {})
    }));

    // Bulk insert
    const insertedQuestions = await Question.insertMany(questionsToInsert, { ordered: false });

    sendSuccessResponse(res, 'Questions imported successfully', {
      imported: insertedQuestions.length,
      status: initialStatus,
      summary,
      errors: errors.length > 0 ? errors : undefined
    }, 201);

  } catch (error) {
    console.error('Import error:', error);

    if (error.writeErrors) {
      // Partial success in bulk insert
      const successCount = error.insertedDocs?.length || 0;
      const failedCount = error.writeErrors.length;

      return sendSuccessResponse(res, 'Partial import completed', {
        imported: successCount,
        failed: failedCount,
        errors: error.writeErrors.map(e => e.errmsg)
      }, 207);
    }

    return sendErrorResponse(res, `Import failed: ${error.message}`, 500);
  }
});

// ============ GET QUESTION HISTORY ============
export const getQuestionHistory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { user } = req;

  if (!canSeeInternalReference(user.role)) {
    return sendErrorResponse(res, 'You do not have permission to view question history', 403);
  }

  const question = await Question.findById(id)
    .select('serialNo revisions version')
    .populate('revisions.revisedBy', 'name email');

  if (!question) {
    return sendNotFoundResponse(res, 'Question');
  }

  sendSuccessResponse(res, 'Question history retrieved', {
    serialNo: question.serialNo,
    version: question.version,
    revisions: question.revisions
  });
});

// ============ BULK APPROVE ============
export const bulkApprove = asyncHandler(async (req, res) => {
  const { user } = req;
  const { questionIds, comment } = req.body;

  if (!canApproveQuestions(user.role)) {
    return sendErrorResponse(res, 'You do not have permission to approve questions', 403);
  }

  if (!Array.isArray(questionIds) || questionIds.length === 0) {
    return sendErrorResponse(res, 'Question IDs are required', 400);
  }

  const results = {
    approved: 0,
    failed: 0,
    errors: []
  };

  for (const qId of questionIds) {
    try {
      const question = await Question.findById(qId);
      if (!question) {
        results.failed++;
        results.errors.push(`${qId}: Question not found`);
        continue;
      }

      if (question.status !== 'pending') {
        results.failed++;
        results.errors.push(`${qId}: Cannot approve (status: ${question.status})`);
        continue;
      }

      question.approve(user._id, user.name, comment);
      await question.save();
      results.approved++;
    } catch (err) {
      results.failed++;
      results.errors.push(`${qId}: ${err.message}`);
    }
  }

  sendSuccessResponse(res, 'Bulk approval completed', results);
});

// ============ BULK REJECT ============
export const bulkReject = asyncHandler(async (req, res) => {
  const { user } = req;
  const { questionIds, reason } = req.body;

  if (!canApproveQuestions(user.role)) {
    return sendErrorResponse(res, 'You do not have permission to reject questions', 403);
  }

  if (!reason || reason.trim().length === 0) {
    return sendErrorResponse(res, 'Rejection reason is required', 400);
  }

  if (!Array.isArray(questionIds) || questionIds.length === 0) {
    return sendErrorResponse(res, 'Question IDs are required', 400);
  }

  const results = {
    rejected: 0,
    failed: 0,
    errors: []
  };

  for (const qId of questionIds) {
    try {
      const question = await Question.findById(qId);
      if (!question) {
        results.failed++;
        results.errors.push(`${qId}: Question not found`);
        continue;
      }

      if (question.status !== 'pending') {
        results.failed++;
        results.errors.push(`${qId}: Cannot reject (status: ${question.status})`);
        continue;
      }

      question.reject(user._id, user.name, reason);
      await question.save();
      results.rejected++;
    } catch (err) {
      results.failed++;
      results.errors.push(`${qId}: ${err.message}`);
    }
  }

  sendSuccessResponse(res, 'Bulk rejection completed', results);
});

export default {
  getAllQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  approveQuestion,
  rejectQuestion,
  getPendingQuestions,
  getQDBStats,
  getModulesAndCategories,
  downloadTemplate,
  importQuestions,
  getQuestionHistory,
  bulkApprove,
  bulkReject
};
