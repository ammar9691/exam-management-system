/**
 * Question Model - QDB (Question Database)
 * Implements full audit trail, module-category enforcement, and approval workflow
 */

import mongoose from 'mongoose';
import {
  QDB_MODULES,
  DIFFICULTY_LEVELS,
  KNOWLEDGE_LEVELS,
  isValidModule,
  isValidCategoryForModule
} from '../config/qdbModules.js';

// Option schema for MCQ/True-False
const optionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: [true, 'Option text is required'],
    trim: true,
    maxLength: [500, 'Option text cannot exceed 500 characters']
  },
  isCorrect: {
    type: Boolean,
    default: false
  }
}, { _id: true });

// Revision history entry schema
const revisionSchema = new mongoose.Schema({
  revisedAt: {
    type: Date,
    default: Date.now,
    required: true
  },
  revisedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  revisedByName: {
    type: String,
    required: true,
    trim: true
  },
  changeType: {
    type: String,
    enum: ['create', 'edit', 'approve', 'reject', 'import', 'use', 'rest', 'unrest'],
    required: true
  },
  changes: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
    // Format: { fieldName: { from: oldValue, to: newValue } }
  },
  comment: {
    type: String,
    trim: true,
    maxLength: [1000, 'Comment cannot exceed 1000 characters']
  }
}, { _id: true });

const questionSchema = new mongoose.Schema({
  // ============ SERIAL NUMBER ============
  serialNo: {
    type: String,
    unique: true,
    required: true,
    index: true
    // Format: Q000001
  },

  // ============ MODULE & CATEGORY (Fixed, not free text) ============
  module: {
    type: String,
    required: [true, 'Module is required'],
    validate: {
      validator: function(value) {
        return isValidModule(value);
      },
      message: props => `"${props.value}" is not a valid module`
    },
    index: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    validate: {
      validator: function(value) {
        return isValidCategoryForModule(this.module, value);
      },
      message: props => `"${props.value}" is not valid for the selected module`
    },
    index: true
  },

  // ============ QUESTION CONTENT ============
  type: {
    type: String,
    enum: ['mcq', 'true-false'],
    required: true,
    default: 'mcq'
  },
  question: {
    type: String,
    required: [true, 'Question text is required'],
    trim: true,
    maxLength: [2000, 'Question cannot exceed 2000 characters']
  },
  options: {
    type: [optionSchema],
    validate: {
      validator: function(options) {
        if (this.type === 'mcq') {
          // MCQ must have exactly 3 options
          return options && options.length === 3;
        }
        if (this.type === 'true-false') {
          // True/False has exactly 2 options (auto-set)
          return options && options.length === 2;
        }
        return true;
      },
      message: function() {
        if (this.type === 'mcq') return 'MCQ questions must have exactly 3 options';
        if (this.type === 'true-false') return 'True/False questions must have exactly 2 options';
        return 'Invalid number of options';
      }
    }
  },

  // ============ DIFFICULTY & KNOWLEDGE LEVEL ============
  difficulty: {
    type: String,
    enum: DIFFICULTY_LEVELS,
    required: [true, 'Difficulty is required'],
    default: 'medium',
    index: true
  },
  knowledgeLevel: {
    type: Number,
    enum: KNOWLEDGE_LEVELS,
    required: [true, 'Knowledge level is required'],
    index: true
  },

  // ============ REFERENCES (Mandatory) ============
  syllabusReference: {
    type: String,
    required: [true, 'Syllabus reference is required'],
    trim: true,
    maxLength: [500, 'Syllabus reference cannot exceed 500 characters']
    // Example: "ANO-066 Regulation Appendix I / III"
  },
  answerReference: {
    type: String,
    required: [true, 'Answer reference is required'],
    trim: true,
    maxLength: [500, 'Answer reference cannot exceed 500 characters']
  },

  // ============ INTERNAL REFERENCE (Admin/Exam Manager only) ============
  internalReference: {
    type: String,
    trim: true,
    maxLength: [2000, 'Internal reference cannot exceed 2000 characters']
    // Never visible to students
  },

  // ============ ORIGINATOR (Knowledge Instructor) ============
  originatorInstructorName: {
    type: String,
    required: [true, 'Originator instructor name is required'],
    trim: true,
    maxLength: [200, 'Originator name cannot exceed 200 characters']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // ============ REVIEWER (Knowledge Examiner) ============
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reviewedByName: {
    type: String,
    trim: true,
    default: null
  },
  reviewedAt: {
    type: Date,
    default: null
  },
  rejectionReason: {
    type: String,
    trim: true,
    maxLength: [1000, 'Rejection reason cannot exceed 1000 characters']
  },

  // ============ STATUS & WORKFLOW ============
  status: {
    type: String,
    enum: ['draft', 'pending', 'approved', 'rejected', 'archived'],
    default: 'pending',
    required: true,
    index: true
  },

  // ============ REVISION HISTORY (Immutable audit log) ============
  revisions: {
    type: [revisionSchema],
    default: []
  },

  // ============ VERSION ============
  version: {
    type: Number,
    default: 1
  },

  // ============ MARKS (Fixed at 1) ============
  marks: {
    type: Number,
    default: 1,
    validate: {
      validator: function(value) {
        return value === 1;
      },
      message: 'All questions must be exactly 1 mark'
    }
  },

  // ============ ANALYTICS ============
  analytics: {
    timesUsed: {
      type: Number,
      default: 0
    },
    correctAttempts: {
      type: Number,
      default: 0
    },
    totalAttempts: {
      type: Number,
      default: 0
    },
    averageTimeSpent: {
      type: Number,
      default: 0 // in seconds
    }
  },

  // ============ RESTING/WITHDRAWAL FIELDS ============
  // 5% of questions are rested after each exam
  isRested: {
    type: Boolean,
    default: false,
    index: true
  },
  restedUntil: {
    type: Date,
    default: null
    // If set, question is rested until this date
  },
  restedAt: {
    type: Date,
    default: null
  },
  restReason: {
    type: String,
    trim: true,
    maxLength: [500, 'Rest reason cannot exceed 500 characters']
    // e.g., "Auto-rested after exam X (5% rotation)"
  },

  // ============ EXAM USAGE TRACKING (for cooldown) ============
  // Questions cannot reappear for 3 subsequent exams
  lastUsedAt: {
    type: Date,
    default: null,
    index: true
  },
  lastUsedInExamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    default: null
  },
  lastUsedExamType: {
    type: String,
    enum: ['basic', 'type', null],
    default: null
  },
  lastUsedExamSequence: {
    type: Number,
    default: 0,
    index: true
    // Exam sequence number within module+examType scope
  },

  // ============ LAST MODIFIED ============
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ============ INDEXES ============
questionSchema.index({ serialNo: 1 }, { unique: true });
questionSchema.index({ module: 1, category: 1 });
questionSchema.index({ module: 1, category: 1, difficulty: 1 });
questionSchema.index({ module: 1, category: 1, knowledgeLevel: 1 });
questionSchema.index({ status: 1, module: 1 });
questionSchema.index({ createdBy: 1 });
questionSchema.index({ createdAt: -1 });
// Indexes for resting/cooldown
questionSchema.index({ isRested: 1, module: 1 });
questionSchema.index({ lastUsedExamSequence: 1, module: 1, lastUsedExamType: 1 });
// Compound index for eligible questions query
questionSchema.index({
  status: 1,
  module: 1,
  category: 1,
  isRested: 1,
  lastUsedExamSequence: 1
});

// Text search index
questionSchema.index({
  question: 'text',
  'options.text': 'text',
  syllabusReference: 'text'
});

// ============ VIRTUALS ============
questionSchema.virtual('successRate').get(function() {
  if (this.analytics.totalAttempts === 0) return 0;
  return (this.analytics.correctAttempts / this.analytics.totalAttempts) * 100;
});

questionSchema.virtual('moduleName').get(function() {
  const mod = QDB_MODULES[this.module];
  return mod ? mod.name : this.module;
});

questionSchema.virtual('correctOption').get(function() {
  return this.options ? this.options.find(opt => opt.isCorrect) : null;
});

questionSchema.virtual('isApproved').get(function() {
  return this.status === 'approved';
});

// ============ PRE-SAVE MIDDLEWARE ============
questionSchema.pre('save', function(next) {
  // Auto-set True/False options if type is true-false
  if (this.type === 'true-false' && (!this.options || this.options.length !== 2)) {
    // Will be set by controller based on correct answer
  }

  // Validate at least one correct answer
  if (this.options && this.options.length > 0) {
    const correctOptions = this.options.filter(opt => opt.isCorrect);
    if (correctOptions.length === 0) {
      return next(new Error('At least one option must be marked as correct'));
    }
    if (correctOptions.length > 1) {
      return next(new Error('Only one option can be marked as correct'));
    }
  }

  // Increment version on modification (not on creation)
  if (this.isModified() && !this.isNew) {
    this.version += 1;
  }

  next();
});

// ============ METHODS ============

/**
 * Validate user answer
 */
questionSchema.methods.validateAnswer = function(userAnswer) {
  if (!this.options || this.options.length === 0) return false;

  const correctOption = this.options.find(opt => opt.isCorrect);
  if (!correctOption) return false;

  return correctOption._id.toString() === userAnswer.toString();
};

/**
 * Update analytics after an attempt
 */
questionSchema.methods.updateAnalytics = function(isCorrect, timeSpent) {
  this.analytics.totalAttempts += 1;
  this.analytics.timesUsed += 1;

  if (isCorrect) {
    this.analytics.correctAttempts += 1;
  }

  if (timeSpent) {
    const totalTime = this.analytics.averageTimeSpent * (this.analytics.totalAttempts - 1) + timeSpent;
    this.analytics.averageTimeSpent = totalTime / this.analytics.totalAttempts;
  }

  return this.save();
};

/**
 * Add a revision entry
 */
questionSchema.methods.addRevision = function(userId, userName, changeType, changes = {}, comment = null) {
  this.revisions.push({
    revisedAt: new Date(),
    revisedBy: userId,
    revisedByName: userName,
    changeType,
    changes,
    comment
  });
};

/**
 * Approve the question
 */
questionSchema.methods.approve = function(reviewerId, reviewerName, comment = null) {
  this.status = 'approved';
  this.reviewedBy = reviewerId;
  this.reviewedByName = reviewerName;
  this.reviewedAt = new Date();
  this.rejectionReason = null;

  this.addRevision(reviewerId, reviewerName, 'approve', {
    status: { from: 'pending', to: 'approved' }
  }, comment);
};

/**
 * Reject the question
 */
questionSchema.methods.reject = function(reviewerId, reviewerName, reason) {
  this.status = 'rejected';
  this.reviewedBy = reviewerId;
  this.reviewedByName = reviewerName;
  this.reviewedAt = new Date();
  this.rejectionReason = reason;

  this.addRevision(reviewerId, reviewerName, 'reject', {
    status: { from: 'pending', to: 'rejected' }
  }, reason);
};

/**
 * Mark question as used in an exam
 */
questionSchema.methods.markAsUsed = function(examId, examType, examSequence, userId, userName) {
  this.lastUsedAt = new Date();
  this.lastUsedInExamId = examId;
  this.lastUsedExamType = examType;
  this.lastUsedExamSequence = examSequence;
  this.analytics.timesUsed += 1;

  this.addRevision(userId, userName, 'use', {
    lastUsedInExamId: { from: null, to: examId },
    lastUsedExamSequence: { from: this.lastUsedExamSequence - 1, to: examSequence }
  }, `Used in ${examType} exam (sequence: ${examSequence})`);
};

/**
 * Rest/withdraw a question from use
 */
questionSchema.methods.rest = function(userId, userName, reason, restDays = 30) {
  const wasRested = this.isRested;
  this.isRested = true;
  this.restedAt = new Date();
  this.restedUntil = new Date(Date.now() + restDays * 24 * 60 * 60 * 1000);
  this.restReason = reason;

  this.addRevision(userId, userName, 'rest', {
    isRested: { from: wasRested, to: true },
    restedAt: { from: null, to: this.restedAt },
    restedUntil: { from: null, to: this.restedUntil }
  }, reason);
};

/**
 * Unrest/reactivate a question
 */
questionSchema.methods.unrest = function(userId, userName, reason = 'Manually unrested') {
  const wasRested = this.isRested;
  this.isRested = false;
  this.restedUntil = null;

  this.addRevision(userId, userName, 'unrest', {
    isRested: { from: wasRested, to: false },
    restedUntil: { from: this.restedUntil, to: null }
  }, reason);
};

/**
 * Check if question is eligible for use in exam
 * @param {string} examType - 'basic' or 'type'
 * @param {number} currentSequence - Current exam sequence for cooldown check
 * @param {number} cooldownExams - Number of exams to wait (default 3)
 */
questionSchema.methods.isEligibleForExam = function(examType, currentSequence, cooldownExams = 3) {
  // Must be approved
  if (this.status !== 'approved') return false;

  // Must not be rested
  if (this.isRested) {
    // Check if rest period has expired
    if (this.restedUntil && new Date() >= this.restedUntil) {
      // Rest period expired - should be unrested
      return true;
    }
    return false;
  }

  // Check cooldown: if used in this exam type, must wait 3 exams
  if (this.lastUsedExamType === examType && this.lastUsedExamSequence > 0) {
    const examsSinceLastUse = currentSequence - this.lastUsedExamSequence;
    if (examsSinceLastUse < cooldownExams) {
      return false;
    }
  }

  return true;
};

// ============ STATIC METHODS ============

/**
 * Find approved questions for exam generation
 */
questionSchema.statics.findForExam = function(filters = {}) {
  return this.find({
    status: 'approved',
    ...filters
  });
};

/**
 * Get random approved questions by criteria
 */
questionSchema.statics.getRandomApproved = function(filters = {}, count = 10) {
  return this.aggregate([
    { $match: { status: 'approved', ...filters } },
    { $sample: { size: count } }
  ]);
};

/**
 * Get questions by module and category
 */
questionSchema.statics.findByModuleCategory = function(module, category, additionalFilters = {}) {
  return this.find({
    module,
    category,
    status: 'approved',
    ...additionalFilters
  });
};

/**
 * Get pending questions (for approval queue)
 */
questionSchema.statics.getPendingQuestions = function(options = {}) {
  return this.find({ status: 'pending' })
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 })
    .limit(options.limit || 50);
};

/**
 * Get statistics by module
 */
questionSchema.statics.getModuleStats = async function() {
  return this.aggregate([
    { $match: { status: 'approved' } },
    {
      $group: {
        _id: { module: '$module', category: '$category' },
        count: { $sum: 1 },
        byDifficulty: {
          $push: '$difficulty'
        },
        byKnowledgeLevel: {
          $push: '$knowledgeLevel'
        }
      }
    },
    {
      $group: {
        _id: '$_id.module',
        totalQuestions: { $sum: '$count' },
        categories: {
          $push: {
            category: '$_id.category',
            count: '$count'
          }
        }
      }
    },
    { $sort: { _id: 1 } }
  ]);
};

/**
 * Get overall QDB statistics
 */
questionSchema.statics.getQDBStats = async function() {
  const [stats] = await this.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        approved: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
        pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
        rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
        draft: { $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] } },
        mcq: { $sum: { $cond: [{ $eq: ['$type', 'mcq'] }, 1, 0] } },
        trueFalse: { $sum: { $cond: [{ $eq: ['$type', 'true-false'] }, 1, 0] } },
        easy: { $sum: { $cond: [{ $eq: ['$difficulty', 'easy'] }, 1, 0] } },
        medium: { $sum: { $cond: [{ $eq: ['$difficulty', 'medium'] }, 1, 0] } },
        hard: { $sum: { $cond: [{ $eq: ['$difficulty', 'hard'] }, 1, 0] } },
        level1: { $sum: { $cond: [{ $eq: ['$knowledgeLevel', 1] }, 1, 0] } },
        level2: { $sum: { $cond: [{ $eq: ['$knowledgeLevel', 2] }, 1, 0] } },
        level3: { $sum: { $cond: [{ $eq: ['$knowledgeLevel', 3] }, 1, 0] } }
      }
    }
  ]);

  return stats || {
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
    draft: 0,
    mcq: 0,
    trueFalse: 0,
    easy: 0,
    medium: 0,
    hard: 0,
    level1: 0,
    level2: 0,
    level3: 0
  };
};

/**
 * Find eligible questions for exam generation
 * Filters: approved, not rested, not in cooldown
 * @param {string} module - Module ID
 * @param {string} category - Category name
 * @param {string} examType - 'basic' or 'type'
 * @param {number} currentSequence - Current exam sequence
 * @param {number} cooldownExams - Number of exams for cooldown (default 3)
 */
questionSchema.statics.findEligibleForExam = async function(module, category, examType, currentSequence, cooldownExams = 3) {
  const minSequence = currentSequence - cooldownExams;
  const now = new Date();

  return this.find({
    status: 'approved',
    module,
    category,
    $and: [
      {
        $or: [
          { isRested: false },
          { isRested: true, restedUntil: { $lte: now } } // Rest period expired
        ]
      },
      {
        $or: [
          { lastUsedExamType: { $ne: examType } }, // Different exam type
          { lastUsedExamSequence: { $lte: minSequence } }, // Past cooldown
          { lastUsedExamSequence: { $exists: false } }, // Never used
          { lastUsedExamSequence: 0 } // Never used (explicit)
        ]
      }
    ]
  });
};

/**
 * Count eligible questions for QDB sufficiency check
 * @param {string} module - Module ID
 * @param {string} examType - 'basic' or 'type'
 * @param {number} currentSequence - Current exam sequence
 * @param {number} cooldownExams - Number of exams for cooldown (default 3)
 */
questionSchema.statics.countEligibleByCategory = async function(module, examType, currentSequence, cooldownExams = 3) {
  const minSequence = currentSequence - cooldownExams;
  const now = new Date();

  const results = await this.aggregate([
    {
      $match: {
        status: 'approved',
        module,
        $or: [
          { isRested: false },
          { isRested: true, restedUntil: { $lte: now } }
        ]
      }
    },
    {
      $match: {
        $or: [
          { lastUsedExamType: { $ne: examType } },
          { lastUsedExamSequence: { $lte: minSequence } },
          { lastUsedExamSequence: { $exists: false } },
          { lastUsedExamSequence: 0 }
        ]
      }
    },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 }
      }
    }
  ]);

  // Convert to map: { category: count }
  const countMap = {};
  results.forEach(r => {
    countMap[r._id] = r.count;
  });

  return countMap;
};

/**
 * Get total eligible question count for a module
 */
questionSchema.statics.countTotalEligible = async function(module, examType, currentSequence, cooldownExams = 3) {
  const minSequence = currentSequence - cooldownExams;
  const now = new Date();

  return this.countDocuments({
    status: 'approved',
    module,
    $and: [
      {
        $or: [
          { isRested: false },
          { isRested: true, restedUntil: { $lte: now } }
        ]
      },
      {
        $or: [
          { lastUsedExamType: { $ne: examType } },
          { lastUsedExamSequence: { $lte: minSequence } },
          { lastUsedExamSequence: { $exists: false } },
          { lastUsedExamSequence: 0 }
        ]
      }
    ]
  });
};

/**
 * Bulk update questions as used
 */
questionSchema.statics.bulkMarkAsUsed = async function(questionIds, examId, examType, examSequence, userId, userName) {
  const now = new Date();

  // Update all questions
  await this.updateMany(
    { _id: { $in: questionIds } },
    {
      $set: {
        lastUsedAt: now,
        lastUsedInExamId: examId,
        lastUsedExamType: examType,
        lastUsedExamSequence: examSequence
      },
      $inc: { 'analytics.timesUsed': 1 },
      $push: {
        revisions: {
          revisedAt: now,
          revisedBy: userId,
          revisedByName: userName,
          changeType: 'use',
          changes: { lastUsedExamSequence: { from: null, to: examSequence } },
          comment: `Used in ${examType} exam (sequence: ${examSequence})`
        }
      }
    }
  );
};

/**
 * Bulk rest questions (for 5% rotation after exam)
 */
questionSchema.statics.bulkRest = async function(questionIds, userId, userName, reason, restDays = 30) {
  const now = new Date();
  const restedUntil = new Date(Date.now() + restDays * 24 * 60 * 60 * 1000);

  await this.updateMany(
    { _id: { $in: questionIds } },
    {
      $set: {
        isRested: true,
        restedAt: now,
        restedUntil,
        restReason: reason
      },
      $push: {
        revisions: {
          revisedAt: now,
          revisedBy: userId,
          revisedByName: userName,
          changeType: 'rest',
          changes: { isRested: { from: false, to: true } },
          comment: reason
        }
      }
    }
  );
};

/**
 * Auto-unrest questions whose rest period has expired
 */
questionSchema.statics.autoUnrestExpired = async function() {
  const now = new Date();

  const result = await this.updateMany(
    {
      isRested: true,
      restedUntil: { $lte: now }
    },
    {
      $set: {
        isRested: false
      },
      $push: {
        revisions: {
          revisedAt: now,
          revisedBy: null,
          revisedByName: 'System',
          changeType: 'unrest',
          changes: { isRested: { from: true, to: false } },
          comment: 'Auto-unrested: rest period expired'
        }
      }
    }
  );

  return result.modifiedCount;
};

export default mongoose.model('Question', questionSchema);
