/**
 * QDB Modules and Categories Configuration
 * Must match backend/config/qdbModules.js
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

export const DIFFICULTY_LEVELS = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' }
];

export const KNOWLEDGE_LEVELS = [
  { value: 1, label: 'Level 1' },
  { value: 2, label: 'Level 2' },
  { value: 3, label: 'Level 3' }
];

export const QUESTION_TYPES = [
  { value: 'mcq', label: 'Multiple Choice (3 options)' },
  { value: 'true-false', label: 'True / False' }
];

export const QUESTION_STATUS = {
  DRAFT: 'draft',
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  ARCHIVED: 'archived'
};

export const STATUS_COLORS = {
  draft: 'default',
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
  archived: 'default'
};

export function getModuleOptions() {
  return Object.values(QDB_MODULES).map(m => ({
    id: m.id,
    name: m.name,
    shortName: m.shortName
  }));
}

export function getCategoriesForModule(moduleId) {
  const module = QDB_MODULES[moduleId];
  return module ? module.categories : [];
}

export function getModuleName(moduleId) {
  const module = QDB_MODULES[moduleId];
  return module ? module.name : moduleId;
}

export function canApproveQuestions(role) {
  return ['admin', 'exam_manager'].includes(role);
}

export function canSeeInternalReference(role) {
  return ['admin', 'exam_manager'].includes(role);
}

export default {
  QDB_MODULES,
  DIFFICULTY_LEVELS,
  KNOWLEDGE_LEVELS,
  QUESTION_TYPES,
  QUESTION_STATUS,
  STATUS_COLORS,
  getModuleOptions,
  getCategoriesForModule,
  getModuleName,
  canApproveQuestions,
  canSeeInternalReference
};
