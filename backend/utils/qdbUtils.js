/**
 * QDB Utility Functions
 * Serial number generation, revision logging, and validation helpers
 */

import Counter, { COUNTER_IDS } from '../models/Counter.js';
import {
  validateModuleCategory,
  isValidKnowledgeLevel,
  isValidDifficulty,
  canAutoApprove,
  QUESTION_TYPES
} from '../config/qdbModules.js';

// ============ SERIAL NUMBER GENERATION ============

/**
 * Initialize the question serial counter (run once on startup or migration)
 */
export async function initializeQuestionCounter() {
  await Counter.initializeCounter(COUNTER_IDS.QUESTION_SERIAL, {
    prefix: 'Q',
    padding: 6,
    startValue: 0
  });
}

/**
 * Generate a single serial number for a new question
 * @returns {Promise<string>} Serial number (e.g., 'Q000001')
 */
export async function generateQuestionSerialNo() {
  return await Counter.generateSerialNumbers(COUNTER_IDS.QUESTION_SERIAL, 1);
}

/**
 * Generate multiple serial numbers for bulk import
 * @param {number} count - Number of serial numbers needed
 * @returns {Promise<string[]>} Array of serial numbers
 */
export async function generateBulkSerialNumbers(count) {
  return await Counter.generateSerialNumbers(COUNTER_IDS.QUESTION_SERIAL, count);
}

// ============ REVISION LOGGING ============

/**
 * Create a revision entry for question creation
 * @param {Object} user - User object (id, name)
 * @param {string} changeType - 'create' | 'import'
 * @param {string} comment - Optional comment
 * @returns {Object} Revision entry
 */
export function createRevisionEntry(user, changeType = 'create', comment = null) {
  return {
    revisedAt: new Date(),
    revisedBy: user._id || user.id,
    revisedByName: user.name,
    changeType,
    changes: {},
    comment
  };
}

/**
 * Create a revision entry for question edit
 * @param {Object} user - User object
 * @param {Object} oldData - Previous question data
 * @param {Object} newData - New question data
 * @param {string} comment - Optional comment
 * @returns {Object} Revision entry with changes
 */
export function createEditRevisionEntry(user, oldData, newData, comment = null) {
  const changes = {};
  const trackFields = [
    'question', 'module', 'category', 'type', 'difficulty',
    'knowledgeLevel', 'syllabusReference', 'answerReference',
    'internalReference', 'options'
  ];

  for (const field of trackFields) {
    const oldVal = oldData[field];
    const newVal = newData[field];

    // Compare values (stringify for deep comparison)
    const oldStr = JSON.stringify(oldVal);
    const newStr = JSON.stringify(newVal);

    if (oldStr !== newStr && newVal !== undefined) {
      changes[field] = { from: oldVal, to: newVal };
    }
  }

  return {
    revisedAt: new Date(),
    revisedBy: user._id || user.id,
    revisedByName: user.name,
    changeType: 'edit',
    changes,
    comment
  };
}

// ============ VALIDATION HELPERS ============

/**
 * Validate question data for creation/import
 * @param {Object} data - Question data
 * @param {string} userRole - User's role
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateQuestionData(data, userRole = 'instructor') {
  const errors = [];

  // Module & Category validation
  const moduleValidation = validateModuleCategory(data.module, data.category);
  if (!moduleValidation.valid) {
    errors.push(moduleValidation.error);
  }

  // Question text
  if (!data.question || data.question.trim().length === 0) {
    errors.push('Question text is required');
  }

  // Type validation
  if (!data.type || !['mcq', 'true-false'].includes(data.type)) {
    errors.push('Question type must be "mcq" or "true-false"');
  }

  // Options validation
  if (data.type === 'mcq') {
    if (!data.options || data.options.length !== 3) {
      errors.push('MCQ questions must have exactly 3 options');
    } else {
      const correctCount = data.options.filter(o => o.isCorrect).length;
      if (correctCount !== 1) {
        errors.push('MCQ must have exactly one correct answer');
      }
      const emptyOptions = data.options.filter(o => !o.text || o.text.trim().length === 0);
      if (emptyOptions.length > 0) {
        errors.push('All options must have text');
      }
    }
  }

  if (data.type === 'true-false') {
    if (!data.options || data.options.length !== 2) {
      errors.push('True/False questions must have exactly 2 options');
    }
  }

  // Difficulty
  if (!isValidDifficulty(data.difficulty)) {
    errors.push('Difficulty must be easy, medium, or hard');
  }

  // Knowledge Level
  if (!isValidKnowledgeLevel(data.knowledgeLevel)) {
    errors.push('Knowledge level must be 1, 2, or 3');
  }

  // Syllabus Reference
  if (!data.syllabusReference || data.syllabusReference.trim().length === 0) {
    errors.push('Syllabus reference is required');
  }

  // Answer Reference
  if (!data.answerReference || data.answerReference.trim().length === 0) {
    errors.push('Answer reference is required');
  }

  // Originator name
  if (!data.originatorInstructorName || data.originatorInstructorName.trim().length === 0) {
    errors.push('Originator instructor name is required');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Prepare True/False options
 * @param {string} correctAnswer - 'True' or 'False'
 * @returns {Array} Options array
 */
export function prepareTrueFalseOptions(correctAnswer) {
  const isTrue = correctAnswer?.toLowerCase() === 'true';
  return [
    { text: 'True', isCorrect: isTrue },
    { text: 'False', isCorrect: !isTrue }
  ];
}

/**
 * Determine initial status based on user role
 * @param {string} role - User role
 * @returns {string} Initial status
 */
export function getInitialStatus(role) {
  return canAutoApprove(role) ? 'approved' : 'pending';
}

// ============ EXCEL IMPORT HELPERS ============

/**
 * Excel column mapping for import
 */
export const EXCEL_COLUMNS = {
  module: 'Module',
  category: 'Category',
  difficulty: 'Difficulty',
  knowledgeLevel: 'Knowledge Level',
  question: 'Question',
  optionA: 'Option A',
  optionB: 'Option B',
  optionC: 'Option C',
  correctAnswer: 'Correct Answer',
  syllabusReference: 'Syllabus Reference',
  answerReference: 'Answer Reference',
  originatorName: 'Originator Instructor Name',
  internalReference: 'Internal Reference'
};

/**
 * Template columns in order
 */
export const TEMPLATE_COLUMNS = [
  'Module',
  'Category',
  'Difficulty',
  'Knowledge Level',
  'Question',
  'Option A',
  'Option B',
  'Option C',
  'Correct Answer',
  'Syllabus Reference',
  'Answer Reference',
  'Originator Instructor Name',
  'Internal Reference'
];

/**
 * Parse correct answer to determine type and options
 * @param {string} correctAnswer - 'A', 'B', 'C', 'True', or 'False'
 * @param {string} optionA - Option A text
 * @param {string} optionB - Option B text
 * @param {string} optionC - Option C text (empty for True/False)
 * @returns {{ type: string, options: Array }}
 */
export function parseCorrectAnswer(correctAnswer, optionA, optionB, optionC) {
  const answer = correctAnswer?.toString().trim().toUpperCase();

  // Check if it's True/False
  if (answer === 'TRUE' || answer === 'FALSE') {
    return {
      type: 'true-false',
      options: prepareTrueFalseOptions(answer)
    };
  }

  // MCQ - correct answer is A, B, or C
  const options = [
    { text: optionA || '', isCorrect: answer === 'A' },
    { text: optionB || '', isCorrect: answer === 'B' },
    { text: optionC || '', isCorrect: answer === 'C' }
  ];

  return {
    type: 'mcq',
    options
  };
}

/**
 * Parse a single Excel row to question data
 * @param {Object} row - Excel row data
 * @param {number} rowIndex - Row number for error reporting
 * @returns {{ data: Object|null, errors: string[] }}
 */
export function parseExcelRow(row, rowIndex) {
  const errors = [];
  const rowNum = rowIndex + 2; // Excel rows are 1-indexed, plus header

  // Extract values (handle both object and array formats)
  const getValue = (key) => {
    return row[key] || row[EXCEL_COLUMNS[key]] || '';
  };

  const module = getValue('module')?.toString().trim();
  const category = getValue('category')?.toString().trim();
  const difficulty = getValue('difficulty')?.toString().toLowerCase().trim();
  const knowledgeLevel = parseInt(getValue('knowledgeLevel'), 10);
  const question = getValue('question')?.toString().trim();
  const optionA = getValue('optionA')?.toString().trim();
  const optionB = getValue('optionB')?.toString().trim();
  const optionC = getValue('optionC')?.toString().trim();
  const correctAnswer = getValue('correctAnswer')?.toString().trim();
  const syllabusReference = getValue('syllabusReference')?.toString().trim();
  const answerReference = getValue('answerReference')?.toString().trim();
  const originatorName = getValue('originatorName')?.toString().trim();
  const internalReference = getValue('internalReference')?.toString().trim();

  // Parse options and determine type
  const { type, options } = parseCorrectAnswer(correctAnswer, optionA, optionB, optionC);

  const data = {
    module,
    category,
    difficulty,
    knowledgeLevel,
    question,
    type,
    options,
    syllabusReference,
    answerReference,
    originatorInstructorName: originatorName,
    internalReference: internalReference || undefined
  };

  // Validate the row
  const validation = validateQuestionData(data);
  if (!validation.valid) {
    validation.errors.forEach(err => {
      errors.push(`Row ${rowNum}: ${err}`);
    });
  }

  return {
    data: errors.length === 0 ? data : null,
    errors
  };
}

/**
 * Process multiple Excel rows
 * @param {Array} rows - Array of row data
 * @param {Object} user - Importing user
 * @returns {{ validQuestions: Array, errors: Array, summary: Object }}
 */
export async function processExcelRows(rows, user) {
  const validQuestions = [];
  const errors = [];
  let skippedEmpty = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    // Skip completely empty rows
    const hasContent = Object.values(row).some(v => v && v.toString().trim().length > 0);
    if (!hasContent) {
      skippedEmpty++;
      continue;
    }

    const { data, errors: rowErrors } = parseExcelRow(row, i);

    if (data) {
      // Add user info
      data.createdBy = user._id || user.id;
      if (!data.originatorInstructorName) {
        data.originatorInstructorName = user.name;
      }

      validQuestions.push(data);
    }

    errors.push(...rowErrors);
  }

  return {
    validQuestions,
    errors,
    summary: {
      totalRows: rows.length,
      validCount: validQuestions.length,
      errorCount: errors.length,
      skippedEmpty
    }
  };
}

// ============ SANITIZATION ============

/**
 * Sanitize question data for response (hide internal reference for non-admin)
 * @param {Object} question - Question object
 * @param {string} userRole - Requesting user's role
 * @returns {Object} Sanitized question
 */
export function sanitizeQuestionForResponse(question, userRole) {
  const q = question.toObject ? question.toObject() : { ...question };

  // Hide internal reference from non-admin/exam_manager
  if (!['admin', 'exam_manager'].includes(userRole)) {
    delete q.internalReference;
    delete q.revisions; // Also hide audit history
  }

  return q;
}

/**
 * Sanitize multiple questions
 * @param {Array} questions - Array of questions
 * @param {string} userRole - Requesting user's role
 * @returns {Array} Sanitized questions
 */
export function sanitizeQuestionsForResponse(questions, userRole) {
  return questions.map(q => sanitizeQuestionForResponse(q, userRole));
}

export default {
  initializeQuestionCounter,
  generateQuestionSerialNo,
  generateBulkSerialNumbers,
  createRevisionEntry,
  createEditRevisionEntry,
  validateQuestionData,
  prepareTrueFalseOptions,
  getInitialStatus,
  EXCEL_COLUMNS,
  TEMPLATE_COLUMNS,
  parseCorrectAnswer,
  parseExcelRow,
  processExcelRows,
  sanitizeQuestionForResponse,
  sanitizeQuestionsForResponse
};
