/**
 * QDB Modules and Categories Configuration
 * Fixed structure - DO NOT allow free text entries
 * Used by: Backend validation, Frontend dropdowns, Future exam auto-generation
 */

export const QDB_MODULES = {
  'MODULE_1': {
    id: 'MODULE_1',
    name: 'MODULE 1 - MATHEMATICS',
    shortName: 'MATHEMATICS',
    categories: ['Category A', 'Category B1', 'Category B2', 'Category B3']
  },
  'MODULE_2': {
    id: 'MODULE_2',
    name: 'MODULE 2 - PHYSICS',
    shortName: 'PHYSICS',
    categories: ['Category A', 'Category B1', 'Category B2', 'Category B3']
  },
  'MODULE_3': {
    id: 'MODULE_3',
    name: 'MODULE 3 - ELECTRICAL FUNDAMENTALS',
    shortName: 'ELECTRICAL FUNDAMENTALS',
    categories: ['Category A', 'Category B1', 'Category B2', 'Category B3']
  },
  'MODULE_4': {
    id: 'MODULE_4',
    name: 'MODULE 4 - ELECTRONIC FUNDAMENTALS',
    shortName: 'ELECTRONIC FUNDAMENTALS',
    categories: ['Category B1', 'Category B2', 'Category B3']
  },
  'MODULE_5': {
    id: 'MODULE_5',
    name: 'MODULE 5 - DIGITAL TECHNIQUES/ELECTRONIC INSTRUMENT SYSTEMS',
    shortName: 'DIGITAL TECHNIQUES',
    categories: ['Category A', 'Category B1.1', 'Category B1.2', 'Category B1.3', 'Category B1.4', 'Category B2', 'Category B3']
  },
  'MODULE_6': {
    id: 'MODULE_6',
    name: 'MODULE 6 - MATERIALS AND HARDWARE',
    shortName: 'MATERIALS AND HARDWARE',
    categories: ['Category A', 'Category B1', 'Category B2', 'Category B3']
  },
  'MODULE_7A': {
    id: 'MODULE_7A',
    name: 'MODULE 7A - MAINTENANCE PRACTICES',
    shortName: 'MAINTENANCE PRACTICES (7A)',
    categories: ['Category A', 'Category B1', 'Category B2']
  },
  'MODULE_7B': {
    id: 'MODULE_7B',
    name: 'MODULE 7B - MAINTENANCE PRACTICES',
    shortName: 'MAINTENANCE PRACTICES (7B)',
    categories: ['Category B3']
  },
  'MODULE_8': {
    id: 'MODULE_8',
    name: 'MODULE 8 - BASIC AERODYNAMICS',
    shortName: 'BASIC AERODYNAMICS',
    categories: ['Category A', 'Category B1', 'Category B2', 'Category B3']
  },
  'MODULE_9A': {
    id: 'MODULE_9A',
    name: 'MODULE 9A - HUMAN FACTORS',
    shortName: 'HUMAN FACTORS (9A)',
    categories: ['Category A', 'Category B1', 'Category B2']
  },
  'MODULE_9B': {
    id: 'MODULE_9B',
    name: 'MODULE 9B - HUMAN FACTORS',
    shortName: 'HUMAN FACTORS (9B)',
    categories: ['Category B3']
  },
  'MODULE_10': {
    id: 'MODULE_10',
    name: 'MODULE 10 - AVIATION LEGISLATION',
    shortName: 'AVIATION LEGISLATION',
    categories: ['Category A', 'Category B1', 'Category B2', 'Category B3']
  },
  'MODULE_11A': {
    id: 'MODULE_11A',
    name: 'MODULE 11A - TURBINE AEROPLANE AERODYNAMICS, STRUCTURES & SYSTEMS',
    shortName: 'TURBINE AEROPLANE (11A)',
    categories: ['Category A', 'Category B1']
  },
  'MODULE_11B': {
    id: 'MODULE_11B',
    name: 'MODULE 11B - PISTON AEROPLANE AERODYNAMICS, STRUCTURES & SYSTEMS',
    shortName: 'PISTON AEROPLANE (11B)',
    categories: ['Category A', 'Category B1']
  },
  'MODULE_11C': {
    id: 'MODULE_11C',
    name: 'MODULE 11C - PISTON AEROPLANE AERODYNAMICS, STRUCTURES AND SYSTEMS',
    shortName: 'PISTON AEROPLANE (11C)',
    categories: ['Category B3']
  },
  'MODULE_12': {
    id: 'MODULE_12',
    name: 'MODULE 12 - HELICOPTER AERODYNAMICS, STRUCTURES AND SYSTEMS',
    shortName: 'HELICOPTER SYSTEMS',
    categories: ['Category A', 'Category B1']
  },
  'MODULE_13': {
    id: 'MODULE_13',
    name: 'MODULE 13 - AIRCRAFT AERODYNAMICS, STRUCTURES AND SYSTEMS',
    shortName: 'AIRCRAFT SYSTEMS',
    categories: ['Category B2']
  },
  'MODULE_14': {
    id: 'MODULE_14',
    name: 'MODULE 14 - PROPULSION',
    shortName: 'PROPULSION',
    categories: ['Category B2']
  },
  'MODULE_15': {
    id: 'MODULE_15',
    name: 'MODULE 15 - GAS TURBINE ENGINE',
    shortName: 'GAS TURBINE ENGINE',
    categories: ['Category A', 'Category B1']
  },
  'MODULE_16': {
    id: 'MODULE_16',
    name: 'MODULE 16 - PISTON ENGINE',
    shortName: 'PISTON ENGINE',
    categories: ['Category A', 'Category B1', 'Category B3']
  },
  'MODULE_17A': {
    id: 'MODULE_17A',
    name: 'MODULE 17A - PROPELLER',
    shortName: 'PROPELLER (17A)',
    categories: ['Category A', 'Category B1']
  },
  'MODULE_17B': {
    id: 'MODULE_17B',
    name: 'MODULE 17B - PROPELLER',
    shortName: 'PROPELLER (17B)',
    categories: ['Category B3']
  }
};

// Difficulty levels
export const DIFFICULTY_LEVELS = ['easy', 'medium', 'hard'];

// Knowledge levels (1, 2, 3)
export const KNOWLEDGE_LEVELS = [1, 2, 3];

// Question types
export const QUESTION_TYPES = {
  MCQ: 'mcq',
  TRUE_FALSE: 'true-false'
};

// Question status values
export const QUESTION_STATUS = {
  DRAFT: 'draft',
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  ARCHIVED: 'archived'
};

// Roles that can auto-approve questions
export const AUTO_APPROVE_ROLES = ['admin', 'exam_manager'];

// Roles that can approve/reject questions
export const APPROVER_ROLES = ['admin', 'exam_manager'];

// Roles that can create questions
export const CREATOR_ROLES = ['admin', 'exam_manager', 'instructor'];

// Roles that can see internal references
export const INTERNAL_REF_ROLES = ['admin', 'exam_manager'];

/**
 * Get all module IDs
 */
export function getModuleIds() {
  return Object.keys(QDB_MODULES);
}

/**
 * Get all module names for dropdown
 */
export function getModuleOptions() {
  return Object.values(QDB_MODULES).map(m => ({
    id: m.id,
    name: m.name,
    shortName: m.shortName
  }));
}

/**
 * Get categories for a specific module
 * @param {string} moduleId - Module ID (e.g., 'MODULE_1')
 * @returns {string[]} Array of category names
 */
export function getCategoriesForModule(moduleId) {
  const module = QDB_MODULES[moduleId];
  return module ? module.categories : [];
}

/**
 * Validate if a module exists
 * @param {string} moduleId - Module ID to validate
 * @returns {boolean}
 */
export function isValidModule(moduleId) {
  return moduleId in QDB_MODULES;
}

/**
 * Validate if a category belongs to a module
 * @param {string} moduleId - Module ID
 * @param {string} category - Category name
 * @returns {boolean}
 */
export function isValidCategoryForModule(moduleId, category) {
  const module = QDB_MODULES[moduleId];
  if (!module) return false;
  return module.categories.includes(category);
}

/**
 * Validate module-category combination
 * @param {string} moduleId - Module ID
 * @param {string} category - Category name
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateModuleCategory(moduleId, category) {
  if (!moduleId) {
    return { valid: false, error: 'Module is required' };
  }
  if (!isValidModule(moduleId)) {
    return { valid: false, error: `Invalid module: ${moduleId}` };
  }
  if (!category) {
    return { valid: false, error: 'Category is required' };
  }
  if (!isValidCategoryForModule(moduleId, category)) {
    return { valid: false, error: `Category "${category}" is not valid for module "${moduleId}"` };
  }
  return { valid: true };
}

/**
 * Validate knowledge level
 * @param {number} level - Knowledge level (1, 2, or 3)
 * @returns {boolean}
 */
export function isValidKnowledgeLevel(level) {
  return KNOWLEDGE_LEVELS.includes(Number(level));
}

/**
 * Validate difficulty
 * @param {string} difficulty - Difficulty level
 * @returns {boolean}
 */
export function isValidDifficulty(difficulty) {
  return DIFFICULTY_LEVELS.includes(difficulty);
}

/**
 * Check if role can auto-approve questions
 * @param {string} role - User role
 * @returns {boolean}
 */
export function canAutoApprove(role) {
  return AUTO_APPROVE_ROLES.includes(role);
}

/**
 * Check if role can approve/reject questions
 * @param {string} role - User role
 * @returns {boolean}
 */
export function canApproveQuestions(role) {
  return APPROVER_ROLES.includes(role);
}

/**
 * Check if role can create questions
 * @param {string} role - User role
 * @returns {boolean}
 */
export function canCreateQuestions(role) {
  return CREATOR_ROLES.includes(role);
}

/**
 * Check if role can see internal references
 * @param {string} role - User role
 * @returns {boolean}
 */
export function canSeeInternalReference(role) {
  return INTERNAL_REF_ROLES.includes(role);
}

export default {
  QDB_MODULES,
  DIFFICULTY_LEVELS,
  KNOWLEDGE_LEVELS,
  QUESTION_TYPES,
  QUESTION_STATUS,
  AUTO_APPROVE_ROLES,
  APPROVER_ROLES,
  CREATOR_ROLES,
  INTERNAL_REF_ROLES,
  getModuleIds,
  getModuleOptions,
  getCategoriesForModule,
  isValidModule,
  isValidCategoryForModule,
  validateModuleCategory,
  isValidKnowledgeLevel,
  isValidDifficulty,
  canAutoApprove,
  canApproveQuestions,
  canCreateQuestions,
  canSeeInternalReference
};
