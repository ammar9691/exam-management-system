/**
 * Exam Utilities
 * Functions for exam creation, question selection, shuffling, and rotation
 */

import Question from '../models/Question.js';
import Exam from '../models/Exam.js';
import {
  MODULE_BLUEPRINTS,
  EXAM_TYPES,
  QDB_SUFFICIENCY_MULTIPLIERS,
  QUESTION_COOLDOWN_EXAMS,
  REST_PERCENTAGE,
  DEFAULT_REST_DAYS,
  getModuleBlueprint,
  getTotalMcqCount,
  getTotalTimeMinutes,
  getCategoryBreakdown
} from '../config/moduleBlueprints.js';

/**
 * Check if QDB has sufficient questions for an exam
 * @param {string} moduleId - Module ID
 * @param {string} examType - 'basic' or 'type'
 * @returns {Object} { sufficient: boolean, details: Object }
 */
export async function checkQDBSufficiency(moduleId, examType) {
  const blueprint = getModuleBlueprint(moduleId);
  if (!blueprint) {
    return {
      sufficient: false,
      error: `Invalid module: ${moduleId}`,
      details: null
    };
  }

  const multiplier = QDB_SUFFICIENCY_MULTIPLIERS[examType] || 4;
  const categoryBreakdown = getCategoryBreakdown(moduleId);

  // Get current exam sequence for cooldown check
  const currentSequence = await Exam.getNextExamSequence(moduleId, examType);

  // Get eligible question counts by category
  const eligibleCounts = await Question.countEligibleByCategory(
    moduleId,
    examType,
    currentSequence,
    QUESTION_COOLDOWN_EXAMS
  );

  const insufficientCategories = [];
  const categoryDetails = [];

  for (const category of categoryBreakdown) {
    const required = category.mcqCount;
    const requiredInQDB = required * multiplier;
    const available = eligibleCounts[category.category] || 0;

    const isSufficient = available >= requiredInQDB;

    categoryDetails.push({
      category: category.category,
      required,
      requiredInQDB,
      available,
      sufficient: isSufficient,
      shortage: isSufficient ? 0 : requiredInQDB - available
    });

    if (!isSufficient) {
      insufficientCategories.push({
        category: category.category,
        needed: requiredInQDB,
        available,
        shortage: requiredInQDB - available
      });
    }
  }

  const totalRequired = getTotalMcqCount(moduleId);
  const totalRequiredInQDB = totalRequired * multiplier;
  const totalAvailable = Object.values(eligibleCounts).reduce((a, b) => a + b, 0);

  return {
    sufficient: insufficientCategories.length === 0,
    moduleId,
    examType,
    multiplier,
    totalRequired,
    totalRequiredInQDB,
    totalAvailable,
    insufficientCategories,
    categoryDetails,
    error: insufficientCategories.length > 0
      ? `Insufficient questions. Need ${totalRequiredInQDB} eligible questions (${multiplier}x), but only ${totalAvailable} available.`
      : null
  };
}

/**
 * Select questions for an exam based on blueprint
 * @param {string} moduleId - Module ID
 * @param {string} examType - 'basic' or 'type'
 * @param {number} examSequence - Current exam sequence number
 * @returns {Object} { success: boolean, questionIds: Array, categorySelections: Object }
 */
export async function selectQuestionsForExam(moduleId, examType, examSequence) {
  const blueprint = getModuleBlueprint(moduleId);
  if (!blueprint) {
    return { success: false, error: `Invalid module: ${moduleId}` };
  }

  const categoryBreakdown = getCategoryBreakdown(moduleId);
  const selectedQuestionIds = [];
  const categorySelections = {};

  for (const category of categoryBreakdown) {
    const requiredCount = category.mcqCount;

    // Get eligible questions for this category
    const eligibleQuestions = await Question.findEligibleForExam(
      moduleId,
      category.category,
      examType,
      examSequence,
      QUESTION_COOLDOWN_EXAMS
    );

    if (eligibleQuestions.length < requiredCount) {
      return {
        success: false,
        error: `Not enough eligible questions for category "${category.category}". Need ${requiredCount}, have ${eligibleQuestions.length}.`
      };
    }

    // Randomly select the required number of questions
    const shuffled = shuffleArray([...eligibleQuestions]);
    const selected = shuffled.slice(0, requiredCount);

    categorySelections[category.category] = {
      required: requiredCount,
      selected: selected.map(q => q._id)
    };

    selectedQuestionIds.push(...selected.map(q => q._id));
  }

  return {
    success: true,
    questionIds: selectedQuestionIds,
    categorySelections,
    totalQuestions: selectedQuestionIds.length
  };
}

/**
 * Generate shuffled question and option order for a candidate
 * Uses a deterministic seed for reproducibility
 * @param {Array} questionIds - Array of question ObjectIds
 * @param {Array} questions - Full question documents
 * @param {number} seed - Random seed for reproducibility (optional)
 * @returns {Object} { shuffledQuestionsOrder, shuffledOptionsMap, seed }
 */
export function generateCandidateShuffle(questionIds, questions, seed = null) {
  // Generate seed if not provided
  if (seed === null) {
    seed = Date.now() + Math.floor(Math.random() * 1000000);
  }

  // Create seeded random function
  const seededRandom = createSeededRandom(seed);

  // Shuffle question order
  const shuffledQuestionsOrder = shuffleArrayWithSeed([...questionIds], seededRandom);

  // Generate option shuffle for each question
  const shuffledOptionsMap = [];

  for (const questionId of shuffledQuestionsOrder) {
    const question = questions.find(q => q._id.toString() === questionId.toString());
    if (!question) continue;

    const optionCount = question.options.length;
    const originalIndices = Array.from({ length: optionCount }, (_, i) => i);
    const shuffledIndices = shuffleArrayWithSeed([...originalIndices], seededRandom);

    // Create inverse map (original -> display position)
    const inverseMap = new Array(optionCount);
    shuffledIndices.forEach((originalIdx, displayIdx) => {
      inverseMap[originalIdx] = displayIdx;
    });

    shuffledOptionsMap.push({
      questionId,
      shuffleMap: shuffledIndices, // display position -> original index
      inverseMap // original index -> display position
    });
  }

  return {
    shuffledQuestionsOrder,
    shuffledOptionsMap,
    seed
  };
}

/**
 * Create a seeded random number generator
 * Uses mulberry32 algorithm
 */
function createSeededRandom(seed) {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/**
 * Shuffle array using a seeded random function
 */
function shuffleArrayWithSeed(array, randomFn) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(randomFn() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * Standard Fisher-Yates shuffle
 */
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * Mark questions as used and apply 5% rotation/resting
 * @param {Array} questionIds - Array of question ObjectIds used in the exam
 * @param {ObjectId} examId - Exam ID
 * @param {string} examType - 'basic' or 'type'
 * @param {number} examSequence - Exam sequence number
 * @param {ObjectId} userId - User performing the action
 * @param {string} userName - User name for audit
 * @returns {Object} { markedAsUsed: number, rested: number, restedQuestionIds: Array }
 */
export async function processQuestionsAfterExam(questionIds, examId, examType, examSequence, userId, userName) {
  // Mark all questions as used
  await Question.bulkMarkAsUsed(questionIds, examId, examType, examSequence, userId, userName);

  // Calculate 5% to rest (minimum 1 if any questions used)
  const restCount = Math.max(1, Math.ceil(questionIds.length * (REST_PERCENTAGE / 100)));

  // Randomly select questions to rest
  const shuffledIds = shuffleArray([...questionIds]);
  const questionsToRest = shuffledIds.slice(0, restCount);

  // Rest the selected questions
  const restReason = `Auto-rested after exam ${examId} (5% rotation policy)`;
  await Question.bulkRest(questionsToRest, userId, userName, restReason, DEFAULT_REST_DAYS);

  return {
    markedAsUsed: questionIds.length,
    rested: questionsToRest.length,
    restedQuestionIds: questionsToRest
  };
}

/**
 * Get questions with shuffled options for display to candidate
 * @param {Array} questions - Full question documents
 * @param {Array} shuffledQuestionsOrder - Shuffled question ID order
 * @param {Array} shuffledOptionsMap - Option shuffle mappings
 * @returns {Array} Questions with shuffled options in display order
 */
export function getShuffledQuestionsForDisplay(questions, shuffledQuestionsOrder, shuffledOptionsMap) {
  const result = [];

  for (let displayIndex = 0; displayIndex < shuffledQuestionsOrder.length; displayIndex++) {
    const questionId = shuffledQuestionsOrder[displayIndex];
    const question = questions.find(q => q._id.toString() === questionId.toString());
    if (!question) continue;

    const optionMapping = shuffledOptionsMap.find(
      m => m.questionId.toString() === questionId.toString()
    );

    // Shuffle options according to mapping
    let displayOptions = question.options;
    if (optionMapping && optionMapping.shuffleMap) {
      displayOptions = optionMapping.shuffleMap.map(originalIdx => ({
        ...question.options[originalIdx].toObject(),
        _displayIndex: optionMapping.shuffleMap.indexOf(originalIdx)
      }));
    }

    result.push({
      _id: question._id,
      displayIndex: displayIndex + 1, // 1-based for display
      question: question.question,
      type: question.type,
      difficulty: question.difficulty,
      options: displayOptions.map((opt, idx) => ({
        _id: opt._id,
        text: opt.text,
        displayIndex: idx
        // Note: isCorrect is NOT included for security
      })),
      category: question.category,
      // Don't include: isCorrect, correctOption, internalReference, etc.
    });
  }

  return result;
}

/**
 * Validate an answer against the correct option
 * Handles option shuffling
 * @param {Object} question - Full question document
 * @param {Object} optionMapping - Option shuffle mapping for this question
 * @param {number} selectedDisplayIndex - Index selected by candidate (in display order)
 * @returns {Object} { isCorrect: boolean, correctOptionId: ObjectId }
 */
export function validateAnswer(question, optionMapping, selectedDisplayIndex) {
  const correctOption = question.options.find(opt => opt.isCorrect);
  if (!correctOption) {
    return { isCorrect: false, correctOptionId: null, error: 'No correct option found' };
  }

  // Get the original index of the selected option
  let originalIndex = selectedDisplayIndex;
  if (optionMapping && optionMapping.shuffleMap) {
    originalIndex = optionMapping.shuffleMap[selectedDisplayIndex];
  }

  const selectedOption = question.options[originalIndex];
  if (!selectedOption) {
    return { isCorrect: false, correctOptionId: correctOption._id, error: 'Invalid option index' };
  }

  return {
    isCorrect: selectedOption.isCorrect,
    selectedOptionId: selectedOption._id,
    correctOptionId: correctOption._id
  };
}

/**
 * Calculate time remaining for an attempt
 * @param {Object} exam - Exam document
 * @param {Object} attempt - CandidateAttempt document
 * @returns {number} Remaining time in seconds
 */
export function calculateRemainingTime(exam, attempt) {
  const totalAllowedSeconds = (exam.blueprintTotalTimeMinutes || exam.duration) * 60;
  const activeTime = attempt.activeTimeSeconds || 0;
  return Math.max(0, totalAllowedSeconds - activeTime);
}

/**
 * Check if an attempt has timed out
 * @param {Object} exam - Exam document
 * @param {Object} attempt - CandidateAttempt document
 * @returns {boolean}
 */
export function isAttemptTimedOut(exam, attempt) {
  return calculateRemainingTime(exam, attempt) <= 0;
}

/**
 * Check if exam is within valid time window for starting
 * @param {Object} exam - Exam document
 * @returns {Object} { canStart: boolean, reason: string }
 */
export function canStartExam(exam) {
  const now = new Date();

  if (!exam.startAt || !exam.endAt) {
    return { canStart: false, reason: 'Exam time window not configured' };
  }

  if (now < exam.startAt) {
    return {
      canStart: false,
      reason: `Exam has not started yet. Starts at ${exam.startAt.toISOString()}`
    };
  }

  if (now > exam.endAt) {
    return {
      canStart: false,
      reason: `Exam time window has ended. Ended at ${exam.endAt.toISOString()}`
    };
  }

  return { canStart: true, reason: null };
}

/**
 * Generate exam title from module
 * @param {string} moduleId - Module ID
 * @param {string} examType - 'basic' or 'type'
 * @param {number} sequence - Exam sequence number
 * @returns {string}
 */
export function generateExamTitle(moduleId, examType, sequence) {
  const blueprint = getModuleBlueprint(moduleId);
  const moduleName = blueprint ? blueprint.shortName : moduleId;
  const typeLabel = examType === 'basic' ? 'Basic' : 'Type';
  return `${moduleName} - ${typeLabel} Examination #${sequence}`;
}

/**
 * Format time for display (seconds to MM:SS or HH:MM:SS)
 * @param {number} seconds - Time in seconds
 * @returns {string}
 */
export function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Get statistics summary for an exam's results
 * @param {Array} attempts - Array of CandidateAttempt documents
 * @returns {Object}
 */
export function calculateExamStatistics(attempts) {
  const completedAttempts = attempts.filter(a =>
    ['completed', 'quit', 'timeout'].includes(a.status)
  );

  if (completedAttempts.length === 0) {
    return {
      totalAttempts: attempts.length,
      completedAttempts: 0,
      averagePercentage: 0,
      minPercentage: 0,
      maxPercentage: 0,
      passedCount: 0,
      failedCount: 0,
      passRate: 0,
      averageTimeSpent: 0
    };
  }

  const percentages = completedAttempts.map(a => a.result.percentage);
  const timeSpents = completedAttempts.map(a => a.activeTimeSeconds);

  return {
    totalAttempts: attempts.length,
    completedAttempts: completedAttempts.length,
    averagePercentage: percentages.reduce((a, b) => a + b, 0) / percentages.length,
    minPercentage: Math.min(...percentages),
    maxPercentage: Math.max(...percentages),
    passedCount: completedAttempts.filter(a => a.result.passed).length,
    failedCount: completedAttempts.filter(a => !a.result.passed).length,
    passRate: (completedAttempts.filter(a => a.result.passed).length / completedAttempts.length) * 100,
    averageTimeSpent: timeSpents.reduce((a, b) => a + b, 0) / timeSpents.length
  };
}

export default {
  checkQDBSufficiency,
  selectQuestionsForExam,
  generateCandidateShuffle,
  processQuestionsAfterExam,
  getShuffledQuestionsForDisplay,
  validateAnswer,
  calculateRemainingTime,
  isAttemptTimedOut,
  canStartExam,
  generateExamTitle,
  formatTime,
  calculateExamStatistics
};
