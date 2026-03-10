/**
 * Module Blueprints Configuration
 * Defines exam structure for each module:
 * - Categories with mcqCount, essayCount, timeAllowedMinutes
 * - Total questions and time calculated automatically
 * - Used for module-driven exam creation (no manual input required)
 *
 * Based on EASA Part-66 examination structure
 */

export const MODULE_BLUEPRINTS = {
  'MODULE_1': {
    id: 'MODULE_1',
    name: 'MODULE 1 - MATHEMATICS',
    shortName: 'MATHEMATICS',
    categories: {
      'Category A': { mcqCount: 16, essayCount: 0, timeAllowedMinutes: 20 },
      'Category B1': { mcqCount: 32, essayCount: 0, timeAllowedMinutes: 40 },
      'Category B2': { mcqCount: 32, essayCount: 0, timeAllowedMinutes: 40 },
      'Category B3': { mcqCount: 24, essayCount: 0, timeAllowedMinutes: 30 }
    }
  },
  'MODULE_2': {
    id: 'MODULE_2',
    name: 'MODULE 2 - PHYSICS',
    shortName: 'PHYSICS',
    categories: {
      'Category A': { mcqCount: 32, essayCount: 0, timeAllowedMinutes: 40 },
      'Category B1': { mcqCount: 52, essayCount: 0, timeAllowedMinutes: 65 },
      'Category B2': { mcqCount: 52, essayCount: 0, timeAllowedMinutes: 65 },
      'Category B3': { mcqCount: 40, essayCount: 0, timeAllowedMinutes: 50 }
    }
  },
  'MODULE_3': {
    id: 'MODULE_3',
    name: 'MODULE 3 - ELECTRICAL FUNDAMENTALS',
    shortName: 'ELECTRICAL FUNDAMENTALS',
    categories: {
      'Category A': { mcqCount: 20, essayCount: 0, timeAllowedMinutes: 25 },
      'Category B1': { mcqCount: 52, essayCount: 0, timeAllowedMinutes: 65 },
      'Category B2': { mcqCount: 52, essayCount: 0, timeAllowedMinutes: 65 },
      'Category B3': { mcqCount: 32, essayCount: 0, timeAllowedMinutes: 40 }
    }
  },
  'MODULE_4': {
    id: 'MODULE_4',
    name: 'MODULE 4 - ELECTRONIC FUNDAMENTALS',
    shortName: 'ELECTRONIC FUNDAMENTALS',
    categories: {
      'Category B1': { mcqCount: 20, essayCount: 0, timeAllowedMinutes: 25 },
      'Category B2': { mcqCount: 40, essayCount: 0, timeAllowedMinutes: 50 },
      'Category B3': { mcqCount: 16, essayCount: 0, timeAllowedMinutes: 20 }
    }
  },
  'MODULE_5': {
    id: 'MODULE_5',
    name: 'MODULE 5 - DIGITAL TECHNIQUES/ELECTRONIC INSTRUMENT SYSTEMS',
    shortName: 'DIGITAL TECHNIQUES',
    categories: {
      'Category A': { mcqCount: 16, essayCount: 0, timeAllowedMinutes: 20 },
      'Category B1.1': { mcqCount: 40, essayCount: 0, timeAllowedMinutes: 50 },
      'Category B1.2': { mcqCount: 40, essayCount: 0, timeAllowedMinutes: 50 },
      'Category B1.3': { mcqCount: 40, essayCount: 0, timeAllowedMinutes: 50 },
      'Category B1.4': { mcqCount: 40, essayCount: 0, timeAllowedMinutes: 50 },
      'Category B2': { mcqCount: 72, essayCount: 0, timeAllowedMinutes: 90 },
      'Category B3': { mcqCount: 28, essayCount: 0, timeAllowedMinutes: 35 }
    }
  },
  'MODULE_6': {
    id: 'MODULE_6',
    name: 'MODULE 6 - MATERIALS AND HARDWARE',
    shortName: 'MATERIALS AND HARDWARE',
    categories: {
      'Category A': { mcqCount: 52, essayCount: 0, timeAllowedMinutes: 65 },
      'Category B1': { mcqCount: 72, essayCount: 0, timeAllowedMinutes: 90 },
      'Category B2': { mcqCount: 60, essayCount: 0, timeAllowedMinutes: 75 },
      'Category B3': { mcqCount: 52, essayCount: 0, timeAllowedMinutes: 65 }
    }
  },
  'MODULE_7A': {
    id: 'MODULE_7A',
    name: 'MODULE 7A - MAINTENANCE PRACTICES',
    shortName: 'MAINTENANCE PRACTICES (7A)',
    categories: {
      'Category A': { mcqCount: 72, essayCount: 0, timeAllowedMinutes: 90 },
      'Category B1': { mcqCount: 80, essayCount: 0, timeAllowedMinutes: 100 },
      'Category B2': { mcqCount: 60, essayCount: 0, timeAllowedMinutes: 75 }
    }
  },
  'MODULE_7B': {
    id: 'MODULE_7B',
    name: 'MODULE 7B - MAINTENANCE PRACTICES',
    shortName: 'MAINTENANCE PRACTICES (7B)',
    categories: {
      'Category B3': { mcqCount: 60, essayCount: 0, timeAllowedMinutes: 75 }
    }
  },
  'MODULE_8': {
    id: 'MODULE_8',
    name: 'MODULE 8 - BASIC AERODYNAMICS',
    shortName: 'BASIC AERODYNAMICS',
    categories: {
      'Category A': { mcqCount: 20, essayCount: 0, timeAllowedMinutes: 25 },
      'Category B1': { mcqCount: 20, essayCount: 0, timeAllowedMinutes: 25 },
      'Category B2': { mcqCount: 20, essayCount: 0, timeAllowedMinutes: 25 },
      'Category B3': { mcqCount: 20, essayCount: 0, timeAllowedMinutes: 25 }
    }
  },
  'MODULE_9A': {
    id: 'MODULE_9A',
    name: 'MODULE 9A - HUMAN FACTORS',
    shortName: 'HUMAN FACTORS (9A)',
    categories: {
      'Category A': { mcqCount: 20, essayCount: 0, timeAllowedMinutes: 25 },
      'Category B1': { mcqCount: 20, essayCount: 0, timeAllowedMinutes: 25 },
      'Category B2': { mcqCount: 20, essayCount: 0, timeAllowedMinutes: 25 }
    }
  },
  'MODULE_9B': {
    id: 'MODULE_9B',
    name: 'MODULE 9B - HUMAN FACTORS',
    shortName: 'HUMAN FACTORS (9B)',
    categories: {
      'Category B3': { mcqCount: 20, essayCount: 0, timeAllowedMinutes: 25 }
    }
  },
  'MODULE_10': {
    id: 'MODULE_10',
    name: 'MODULE 10 - AVIATION LEGISLATION',
    shortName: 'AVIATION LEGISLATION',
    categories: {
      'Category A': { mcqCount: 40, essayCount: 0, timeAllowedMinutes: 50 },
      'Category B1': { mcqCount: 40, essayCount: 0, timeAllowedMinutes: 50 },
      'Category B2': { mcqCount: 40, essayCount: 0, timeAllowedMinutes: 50 },
      'Category B3': { mcqCount: 32, essayCount: 0, timeAllowedMinutes: 40 }
    }
  },
  'MODULE_11A': {
    id: 'MODULE_11A',
    name: 'MODULE 11A - TURBINE AEROPLANE AERODYNAMICS, STRUCTURES & SYSTEMS',
    shortName: 'TURBINE AEROPLANE (11A)',
    categories: {
      'Category A': { mcqCount: 108, essayCount: 0, timeAllowedMinutes: 135 },
      'Category B1': { mcqCount: 140, essayCount: 0, timeAllowedMinutes: 175 }
    }
  },
  'MODULE_11B': {
    id: 'MODULE_11B',
    name: 'MODULE 11B - PISTON AEROPLANE AERODYNAMICS, STRUCTURES & SYSTEMS',
    shortName: 'PISTON AEROPLANE (11B)',
    categories: {
      'Category A': { mcqCount: 72, essayCount: 0, timeAllowedMinutes: 90 },
      'Category B1': { mcqCount: 100, essayCount: 0, timeAllowedMinutes: 125 }
    }
  },
  'MODULE_11C': {
    id: 'MODULE_11C',
    name: 'MODULE 11C - PISTON AEROPLANE AERODYNAMICS, STRUCTURES AND SYSTEMS',
    shortName: 'PISTON AEROPLANE (11C)',
    categories: {
      'Category B3': { mcqCount: 80, essayCount: 0, timeAllowedMinutes: 100 }
    }
  },
  'MODULE_12': {
    id: 'MODULE_12',
    name: 'MODULE 12 - HELICOPTER AERODYNAMICS, STRUCTURES AND SYSTEMS',
    shortName: 'HELICOPTER SYSTEMS',
    categories: {
      'Category A': { mcqCount: 100, essayCount: 0, timeAllowedMinutes: 125 },
      'Category B1': { mcqCount: 128, essayCount: 0, timeAllowedMinutes: 160 }
    }
  },
  'MODULE_13': {
    id: 'MODULE_13',
    name: 'MODULE 13 - AIRCRAFT AERODYNAMICS, STRUCTURES AND SYSTEMS',
    shortName: 'AIRCRAFT SYSTEMS',
    categories: {
      'Category B2': { mcqCount: 180, essayCount: 0, timeAllowedMinutes: 225 }
    }
  },
  'MODULE_14': {
    id: 'MODULE_14',
    name: 'MODULE 14 - PROPULSION',
    shortName: 'PROPULSION',
    categories: {
      'Category B2': { mcqCount: 24, essayCount: 0, timeAllowedMinutes: 30 }
    }
  },
  'MODULE_15': {
    id: 'MODULE_15',
    name: 'MODULE 15 - GAS TURBINE ENGINE',
    shortName: 'GAS TURBINE ENGINE',
    categories: {
      'Category A': { mcqCount: 60, essayCount: 0, timeAllowedMinutes: 75 },
      'Category B1': { mcqCount: 92, essayCount: 0, timeAllowedMinutes: 115 }
    }
  },
  'MODULE_16': {
    id: 'MODULE_16',
    name: 'MODULE 16 - PISTON ENGINE',
    shortName: 'PISTON ENGINE',
    categories: {
      'Category A': { mcqCount: 52, essayCount: 0, timeAllowedMinutes: 65 },
      'Category B1': { mcqCount: 72, essayCount: 0, timeAllowedMinutes: 90 },
      'Category B3': { mcqCount: 60, essayCount: 0, timeAllowedMinutes: 75 }
    }
  },
  'MODULE_17A': {
    id: 'MODULE_17A',
    name: 'MODULE 17A - PROPELLER',
    shortName: 'PROPELLER (17A)',
    categories: {
      'Category A': { mcqCount: 20, essayCount: 0, timeAllowedMinutes: 25 },
      'Category B1': { mcqCount: 32, essayCount: 0, timeAllowedMinutes: 40 }
    }
  },
  'MODULE_17B': {
    id: 'MODULE_17B',
    name: 'MODULE 17B - PROPELLER',
    shortName: 'PROPELLER (17B)',
    categories: {
      'Category B3': { mcqCount: 20, essayCount: 0, timeAllowedMinutes: 25 }
    }
  }
};

// Exam type constants
export const EXAM_TYPES = {
  BASIC: 'basic',
  TYPE: 'type'
};

// QDB sufficiency multipliers
export const QDB_SUFFICIENCY_MULTIPLIERS = {
  [EXAM_TYPES.BASIC]: 6, // Need 6x questions for Basic exam
  [EXAM_TYPES.TYPE]: 4   // Need 4x questions for Type exam
};

// Cooldown: Questions cannot reappear for N subsequent exams
export const QUESTION_COOLDOWN_EXAMS = 3;

// Rest percentage: % of used questions to rest after each exam
export const REST_PERCENTAGE = 5;

// Default rest duration in days (if using time-based resting)
export const DEFAULT_REST_DAYS = 30;

// Heartbeat interval in seconds (frontend should ping every X seconds)
export const HEARTBEAT_INTERVAL_SECONDS = 10;

// Heartbeat timeout: if no heartbeat for this many seconds, pause timer
export const HEARTBEAT_TIMEOUT_SECONDS = 30;

/**
 * Get blueprint for a specific module
 * @param {string} moduleId - Module ID (e.g., 'MODULE_1')
 * @returns {Object|null} Module blueprint or null if not found
 */
export function getModuleBlueprint(moduleId) {
  return MODULE_BLUEPRINTS[moduleId] || null;
}

/**
 * Get total MCQ count for a module (sum of all categories)
 * @param {string} moduleId - Module ID
 * @returns {number} Total MCQ count
 */
export function getTotalMcqCount(moduleId) {
  const blueprint = MODULE_BLUEPRINTS[moduleId];
  if (!blueprint) return 0;

  return Object.values(blueprint.categories).reduce(
    (sum, cat) => sum + (cat.mcqCount || 0),
    0
  );
}

/**
 * Get total essay count for a module (for future use)
 * @param {string} moduleId - Module ID
 * @returns {number} Total essay count
 */
export function getTotalEssayCount(moduleId) {
  const blueprint = MODULE_BLUEPRINTS[moduleId];
  if (!blueprint) return 0;

  return Object.values(blueprint.categories).reduce(
    (sum, cat) => sum + (cat.essayCount || 0),
    0
  );
}

/**
 * Get total time allowed for a module in minutes
 * @param {string} moduleId - Module ID
 * @returns {number} Total time in minutes
 */
export function getTotalTimeMinutes(moduleId) {
  const blueprint = MODULE_BLUEPRINTS[moduleId];
  if (!blueprint) return 0;

  return Object.values(blueprint.categories).reduce(
    (sum, cat) => sum + (cat.timeAllowedMinutes || 0),
    0
  );
}

/**
 * Get category breakdown for exam creation
 * @param {string} moduleId - Module ID
 * @returns {Array} Array of { category, mcqCount, essayCount, timeAllowedMinutes }
 */
export function getCategoryBreakdown(moduleId) {
  const blueprint = MODULE_BLUEPRINTS[moduleId];
  if (!blueprint) return [];

  return Object.entries(blueprint.categories).map(([category, config]) => ({
    category,
    mcqCount: config.mcqCount || 0,
    essayCount: config.essayCount || 0,
    timeAllowedMinutes: config.timeAllowedMinutes || 0
  }));
}

/**
 * Get all available modules for dropdown
 * @returns {Array} Array of { id, name, shortName, totalQuestions, totalTime }
 */
export function getModulesForExam() {
  return Object.values(MODULE_BLUEPRINTS).map(blueprint => ({
    id: blueprint.id,
    name: blueprint.name,
    shortName: blueprint.shortName,
    totalQuestions: getTotalMcqCount(blueprint.id),
    totalTimeMinutes: getTotalTimeMinutes(blueprint.id),
    categories: Object.keys(blueprint.categories)
  }));
}

/**
 * Calculate required QDB question count for a module and exam type
 * @param {string} moduleId - Module ID
 * @param {string} examType - 'basic' or 'type'
 * @returns {number} Required question count in QDB
 */
export function getRequiredQDBCount(moduleId, examType) {
  const totalQuestions = getTotalMcqCount(moduleId);
  const multiplier = QDB_SUFFICIENCY_MULTIPLIERS[examType] || 4;
  return totalQuestions * multiplier;
}

/**
 * Validate if a module has a valid blueprint
 * @param {string} moduleId - Module ID
 * @returns {boolean}
 */
export function hasValidBlueprint(moduleId) {
  return moduleId in MODULE_BLUEPRINTS;
}

/**
 * Get exam types for dropdown
 * @returns {Array} Array of { value, label }
 */
export function getExamTypes() {
  return [
    { value: EXAM_TYPES.BASIC, label: 'Basic Examination' },
    { value: EXAM_TYPES.TYPE, label: 'Type Examination' }
  ];
}

export default {
  MODULE_BLUEPRINTS,
  EXAM_TYPES,
  QDB_SUFFICIENCY_MULTIPLIERS,
  QUESTION_COOLDOWN_EXAMS,
  REST_PERCENTAGE,
  DEFAULT_REST_DAYS,
  HEARTBEAT_INTERVAL_SECONDS,
  HEARTBEAT_TIMEOUT_SECONDS,
  getModuleBlueprint,
  getTotalMcqCount,
  getTotalEssayCount,
  getTotalTimeMinutes,
  getCategoryBreakdown,
  getModulesForExam,
  getRequiredQDBCount,
  hasValidBlueprint,
  getExamTypes
};
