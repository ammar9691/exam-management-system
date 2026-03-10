import mongoose from 'mongoose';
import config from '../config.js';
import {
  MODULE_BLUEPRINTS,
  EXAM_TYPES,
  getTotalMcqCount,
  getTotalTimeMinutes
} from '../config/moduleBlueprints.js';

const questionWeightageSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: true
  },
  topic: {
    type: String,
    required: true
  },
  percentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  difficulty: {
    easy: { type: Number, default: 0, min: 0, max: 100 },
    medium: { type: Number, default: 0, min: 0, max: 100 },
    hard: { type: Number, default: 0, min: 0, max: 100 }
  }
}, { _id: false });

const examSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Exam title is required'],
    trim: true,
    maxLength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxLength: [1000, 'Description cannot exceed 1000 characters']
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true
  },
  subjects: [{
    subject: {
      type: String,
      required: true,
      trim: true
    },
    weightage: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    }
  }],
  type: {
    type: String,
    enum: ['practice', 'assignment', 'midterm', 'mock', 'final', 'quiz'],
    default: 'quiz'
  },

  // ============ MODULE-DRIVEN EXAM FIELDS ============
  // Module ID from blueprint (e.g., 'MODULE_1')
  moduleId: {
    type: String,
    validate: {
      validator: function(value) {
        if (!value) return true; // Optional for legacy exams
        return value in MODULE_BLUEPRINTS;
      },
      message: props => `"${props.value}" is not a valid module`
    },
    index: true
  },
  // Module display name
  moduleName: {
    type: String,
    trim: true
  },
  // Exam type for module-driven exams
  examType: {
    type: String,
    enum: Object.values(EXAM_TYPES).concat([null]),
    default: null,
    index: true
  },
  // Canonical question IDs (baseline paper before shuffling)
  paperQuestionIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question'
  }],
  // Total questions from blueprint
  blueprintTotalQuestions: {
    type: Number,
    default: 0
  },
  // Total time from blueprint (in minutes)
  blueprintTotalTimeMinutes: {
    type: Number,
    default: 0
  },
  // Category breakdown (from blueprint)
  categoryBreakdown: [{
    category: String,
    mcqCount: Number,
    essayCount: Number,
    timeAllowedMinutes: Number
  }],
  // Exam sequence number (per module+examType scope for cooldown tracking)
  examSequence: {
    type: Number,
    default: 0,
    index: true
  },
  // Assigned candidates (students who can take this exam)
  assignedCandidateIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // Module-driven exam status
  examStatus: {
    type: String,
    enum: ['scheduled', 'active', 'ended', 'archived', null],
    default: null,
    index: true
  },
  // Exam start and end times (for late login restriction)
  startAt: {
    type: Date,
    index: true
  },
  endAt: {
    type: Date,
    index: true
  },
  // Flag to indicate this is a module-driven exam
  isModuleDriven: {
    type: Boolean,
    default: false,
    index: true
  },
  // Rest/rotation tracking
  questionsRested: {
    type: Boolean,
    default: false
    // Set to true after 5% rotation is applied post-exam
  },
  restedQuestionIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question'
  }],
  // ============ END MODULE-DRIVEN EXAM FIELDS ============

  duration: {
    type: Number,
    required: [true, 'Duration is required'],
    min: [5, 'Duration must be at least 5 minutes'],
    max: [config.exam.maxDuration, `Duration cannot exceed ${config.exam.maxDuration} minutes`],
    default: config.exam.defaultDuration
  },
  totalMarks: {
    type: Number,
    required: [true, 'Total marks are required'],
    min: [1, 'Total marks must be at least 1']
  },
  passingMarks: {
    type: Number,
    required: [true, 'Passing marks are required'],
    min: [0, 'Passing marks cannot be negative']
  },
  questions: [{
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true
    },
    marks: {
      type: Number,
      required: true,
      min: 0.25
    },
    negativeMarks: {
      type: Number,
      default: 0,
      min: 0
    },
    order: {
      type: Number,
      required: true
    }
  }],
  questionWeightage: [questionWeightageSchema],
  instructions: {
    type: String,
    trim: true,
    maxLength: [2000, 'Instructions cannot exceed 2000 characters']
  },
  settings: {
    randomizeQuestions: {
      type: Boolean,
      default: false
    },
    randomizeOptions: {
      type: Boolean,
      default: false
    },
    showResults: {
      type: Boolean,
      default: true
    },
    showCorrectAnswers: {
      type: Boolean,
      default: false
    },
    allowReview: {
      type: Boolean,
      default: true
    },
    allowBackNavigation: {
      type: Boolean,
      default: true
    },
    enableProctoring: {
      type: Boolean,
      default: false
    },
    preventCopyPaste: {
      type: Boolean,
      default: true
    },
    fullScreenMode: {
      type: Boolean,
      default: false
    },
    autoSubmit: {
      type: Boolean,
      default: true
    },
    warningBeforeTimeUp: {
      type: Number,
      default: 300 // 5 minutes in seconds
    }
  },
  schedule: {
    startTime: {
      type: Date,
      required: [true, 'Start time is required']
    },
    endTime: {
      type: Date,
      required: [true, 'End time is required']
    },
    timezone: {
      type: String,
      default: 'UTC'
    },
    buffer: {
      before: {
        type: Number,
        default: 10 // minutes
      },
      after: {
        type: Number,
        default: 10 // minutes
      }
    }
  },
  eligibility: {
    students: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    groups: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group'
    }],
    requirements: {
      minimumScore: {
        type: Number,
        min: 0,
        max: 100
      },
      prerequisiteExams: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exam'
      }]
    },
    maxAttempts: {
      type: Number,
      default: 1,
      min: 1,
      max: 10
    }
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'cancelled'],
    default: 'draft'
  },
  analytics: {
    totalAttempts: {
      type: Number,
      default: 0
    },
    completedAttempts: {
      type: Number,
      default: 0
    },
    averageScore: {
      type: Number,
      default: 0
    },
    averageTime: {
      type: Number,
      default: 0 // in minutes
    },
    passRate: {
      type: Number,
      default: 0 // percentage
    },
    questionStats: [{
      question: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question'
      },
      correctAttempts: {
        type: Number,
        default: 0
      },
      totalAttempts: {
        type: Number,
        default: 0
      },
      averageTime: {
        type: Number,
        default: 0 // in seconds
      }
    }]
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  version: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
examSchema.index({ status: 1 });
examSchema.index({ 'schedule.startTime': 1 });
examSchema.index({ 'schedule.endTime': 1 });
examSchema.index({ subject: 1 });
examSchema.index({ createdBy: 1 });
examSchema.index({ createdAt: -1 });
examSchema.index({ title: 'text', description: 'text', subject: 'text' });
// Module-driven exam indexes
examSchema.index({ moduleId: 1, examType: 1 });
examSchema.index({ moduleId: 1, examType: 1, examSequence: 1 });
examSchema.index({ isModuleDriven: 1, examStatus: 1 });
examSchema.index({ assignedCandidateIds: 1 });
examSchema.index({ startAt: 1, endAt: 1 });

// Virtuals
examSchema.virtual('isActive').get(function() {
  const now = new Date();
  return this.status === 'active' && 
         this.schedule.startTime <= now && 
         this.schedule.endTime >= now;
});

examSchema.virtual('isUpcoming').get(function() {
  return this.status === 'active' && this.schedule.startTime > new Date();
});

examSchema.virtual('isExpired').get(function() {
  return this.schedule.endTime < new Date();
});

examSchema.virtual('totalQuestions').get(function() {
  return this.questions ? this.questions.length : 0;
});

examSchema.virtual('remainingTime').get(function() {
  if (!this.isActive) return 0;
  const now = new Date();
  const endTime = new Date(this.schedule.endTime);
  return Math.max(0, Math.floor((endTime - now) / 1000 / 60)); // in minutes
});

// Pre-save middleware
examSchema.pre('save', function(next) {
  // Validate start and end times
  if (this.schedule.endTime <= this.schedule.startTime) {
    return next(new Error('End time must be after start time'));
  }
  
  // Calculate total marks if not provided
  if (!this.totalMarks && this.questions.length > 0) {
    this.totalMarks = this.questions.reduce((sum, q) => sum + q.marks, 0);
  }
  
  // Validate passing marks
  if (this.passingMarks > this.totalMarks) {
    return next(new Error('Passing marks cannot exceed total marks'));
  }
  
  // Auto-increment version on modification
  if (this.isModified() && !this.isNew) {
    this.version += 1;
  }
  
  next();
});

// Methods
examSchema.methods.canUserAttempt = function(userId) {
  // Check if user is eligible
  if (this.eligibility.students.length > 0) {
    const isEligible = this.eligibility.students.some(id => id.toString() === userId.toString());
    if (!isEligible) return { allowed: false, reason: 'Not eligible for this exam' };
  }
  
  // Check if exam is active
  if (!this.isActive) {
    if (this.isUpcoming) return { allowed: false, reason: 'Exam has not started yet' };
    if (this.isExpired) return { allowed: false, reason: 'Exam has expired' };
    return { allowed: false, reason: 'Exam is not available' };
  }
  
  return { allowed: true };
};

examSchema.methods.generateQuestionPaper = function(randomize = false) {
  let questions = [...this.questions];
  
  if (randomize || this.settings.randomizeQuestions) {
    questions = questions.sort(() => Math.random() - 0.5);
  }
  
  return questions.map((q, index) => ({
    ...q.toObject(),
    order: index + 1
  }));
};

examSchema.methods.calculateScore = function(answers) {
  let totalScore = 0;
  let correctAnswers = 0;
  
  this.questions.forEach((examQuestion, index) => {
    const userAnswer = answers.find(a => 
      a.question.toString() === examQuestion.question.toString()
    );
    
    if (userAnswer && userAnswer.isCorrect) {
      totalScore += examQuestion.marks;
      correctAnswers++;
    } else if (userAnswer && examQuestion.negativeMarks > 0) {
      totalScore -= examQuestion.negativeMarks;
    }
  });
  
  return {
    score: Math.max(0, totalScore),
    totalMarks: this.totalMarks,
    correctAnswers,
    totalQuestions: this.questions.length,
    percentage: Math.round((Math.max(0, totalScore) / this.totalMarks) * 100),
    passed: Math.max(0, totalScore) >= this.passingMarks
  };
};

examSchema.methods.updateAnalytics = function(result) {
  this.analytics.totalAttempts += 1;
  
  if (result.completed) {
    this.analytics.completedAttempts += 1;
    
    // Update average score
    const totalScore = this.analytics.averageScore * (this.analytics.completedAttempts - 1) + result.percentage;
    this.analytics.averageScore = totalScore / this.analytics.completedAttempts;
    
    // Update average time
    if (result.timeSpent) {
      const totalTime = this.analytics.averageTime * (this.analytics.completedAttempts - 1) + result.timeSpent;
      this.analytics.averageTime = totalTime / this.analytics.completedAttempts;
    }
    
    // Update pass rate
    const passedAttempts = this.analytics.completedAttempts * (this.analytics.passRate / 100);
    const newPassedAttempts = result.passed ? passedAttempts + 1 : passedAttempts;
    this.analytics.passRate = (newPassedAttempts / this.analytics.completedAttempts) * 100;
  }
  
  return this.save();
};

// Static methods
examSchema.statics.findActiveExams = function() {
  const now = new Date();
  return this.find({
    status: 'active',
    'schedule.startTime': { $lte: now },
    'schedule.endTime': { $gte: now }
  });
};

examSchema.statics.findUpcomingExams = function(userId) {
  const now = new Date();
  const query = {
    status: 'active',
    'schedule.startTime': { $gt: now }
  };
  
  if (userId) {
    query.$or = [
      { 'eligibility.students': { $in: [userId] } },
      { 'eligibility.students': { $size: 0 } }
    ];
  }
  
  return this.find(query).sort({ 'schedule.startTime': 1 });
};

examSchema.statics.getStatistics = function(filters = {}) {
  const pipeline = [
    { $match: filters },
    {
      $group: {
        _id: null,
        totalExams: { $sum: 1 },
        activeExams: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
        },
        completedExams: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        averageDuration: { $avg: '$duration' },
        totalAttempts: { $sum: '$analytics.totalAttempts' }
      }
    }
  ];

  return this.aggregate(pipeline);
};

// ============ MODULE-DRIVEN EXAM METHODS ============

/**
 * Get the next exam sequence number for a module+examType combination
 * Uses Counter model for atomic increment to prevent race conditions
 */
examSchema.statics.getNextExamSequence = async function(moduleId, examType) {
  const Counter = (await import('./Counter.js')).default;
  const counterId = `exam_seq_${moduleId}_${examType}`;
  return Counter.getNextSequence(counterId);
};

/**
 * Find module-driven exams by status
 */
examSchema.statics.findModuleDrivenByStatus = function(examStatus, additionalFilters = {}) {
  return this.find({
    isModuleDriven: true,
    examStatus,
    ...additionalFilters
  }).sort({ createdAt: -1 });
};

/**
 * Find active module-driven exams for a candidate
 */
examSchema.statics.findActiveForCandidate = function(candidateId) {
  const now = new Date();
  return this.find({
    isModuleDriven: true,
    examStatus: 'active',
    assignedCandidateIds: candidateId,
    startAt: { $lte: now },
    endAt: { $gte: now }
  }).sort({ startAt: 1 });
};

/**
 * Find scheduled module-driven exams for a candidate
 */
examSchema.statics.findScheduledForCandidate = function(candidateId) {
  const now = new Date();
  return this.find({
    isModuleDriven: true,
    examStatus: 'scheduled',
    assignedCandidateIds: candidateId,
    startAt: { $gt: now }
  }).sort({ startAt: 1 });
};

/**
 * Check if exam is currently within valid time window
 */
examSchema.methods.isWithinTimeWindow = function() {
  if (!this.startAt || !this.endAt) return false;
  const now = new Date();
  return now >= this.startAt && now <= this.endAt;
};

/**
 * Check if exam has ended
 */
examSchema.methods.hasEnded = function() {
  if (!this.endAt) return false;
  return new Date() > this.endAt;
};

/**
 * Check if candidate is assigned to this exam
 */
examSchema.methods.isCandidateAssigned = function(candidateId) {
  return this.assignedCandidateIds.some(
    id => id.toString() === candidateId.toString()
  );
};

/**
 * Start the exam (transition from scheduled to active)
 */
examSchema.methods.activate = function() {
  if (this.examStatus === 'scheduled') {
    this.examStatus = 'active';
  }
  return this.save();
};

/**
 * End the exam (transition from active to ended)
 */
examSchema.methods.end = function() {
  if (this.examStatus === 'active') {
    this.examStatus = 'ended';
  }
  return this.save();
};

/**
 * Archive the exam
 */
examSchema.methods.archive = function() {
  this.examStatus = 'archived';
  return this.save();
};

/**
 * Get all assigned candidates count
 */
examSchema.methods.getAssignedCount = function() {
  return this.assignedCandidateIds.length;
};

/**
 * Find all module-driven exams needing status update (scheduled -> active or active -> ended)
 */
examSchema.statics.updateExamStatuses = async function() {
  const now = new Date();

  // Scheduled -> Active (if start time has passed)
  await this.updateMany(
    {
      isModuleDriven: true,
      examStatus: 'scheduled',
      startAt: { $lte: now }
    },
    { $set: { examStatus: 'active' } }
  );

  // Active -> Ended (if end time has passed)
  await this.updateMany(
    {
      isModuleDriven: true,
      examStatus: 'active',
      endAt: { $lt: now }
    },
    { $set: { examStatus: 'ended' } }
  );
};

/**
 * Get exams pending question rest/rotation
 */
examSchema.statics.findPendingRest = function() {
  return this.find({
    isModuleDriven: true,
    examStatus: 'ended',
    questionsRested: false
  });
};

export default mongoose.model('Exam', examSchema);