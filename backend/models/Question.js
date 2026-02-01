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
    enum: ['create', 'edit', 'approve', 'reject', 'import'],
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

export default mongoose.model('Question', questionSchema);
