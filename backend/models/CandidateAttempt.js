/**
 * CandidateAttempt Model
 * Tracks candidate attempts for module-driven exams
 * Includes per-candidate shuffling, heartbeat timing, and result tracking
 */

import mongoose from 'mongoose';
import {
  HEARTBEAT_INTERVAL_SECONDS,
  HEARTBEAT_TIMEOUT_SECONDS
} from '../config/moduleBlueprints.js';

// Answer schema for each question
const answerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  },
  // Index of selected option (0-based) in the SHUFFLED order
  selectedOptionIndex: {
    type: Number,
    default: null
  },
  // Original option ID for validation
  selectedOptionId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  // For True/False or direct answer
  selectedAnswer: {
    type: String,
    default: null
  },
  // Correctness evaluated at submit time
  isCorrect: {
    type: Boolean,
    default: null
  },
  // Marks for this question (always 1 for MCQ)
  marksObtained: {
    type: Number,
    default: 0
  },
  // Time spent on this question in seconds
  timeSpent: {
    type: Number,
    default: 0
  },
  // When answer was last updated
  answeredAt: {
    type: Date,
    default: null
  },
  // Flagged for review
  isFlagged: {
    type: Boolean,
    default: false
  }
}, { _id: false });

// Options shuffle map for a single question
const optionShuffleSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  },
  // Maps display index to original index
  // e.g., [2, 0, 1] means: display position 0 shows original option 2, etc.
  shuffleMap: [{
    type: Number
  }],
  // Inverse map: original index to display index (for answer validation)
  inverseMap: [{
    type: Number
  }]
}, { _id: false });

// Heartbeat entry for tracking connection
const heartbeatLogSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    required: true
  },
  type: {
    type: String,
    enum: ['ping', 'pause', 'resume', 'disconnect', 'reconnect'],
    required: true
  },
  activeTimeAtPoint: {
    type: Number,
    default: 0
    // Active time in seconds at this heartbeat
  }
}, { _id: false });

const candidateAttemptSchema = new mongoose.Schema({
  // ============ REFERENCES ============
  examId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true,
    index: true
  },
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // ============ TIMING ============
  startedAt: {
    type: Date,
    default: null
    // When candidate actually started the exam
  },
  endedAt: {
    type: Date,
    default: null
    // When attempt was finalized (submit/timeout/quit)
  },

  // ============ STATUS ============
  status: {
    type: String,
    enum: [
      'not_started',   // Assigned but not started
      'in_progress',   // Currently taking exam
      'paused',        // Disconnected, timer paused
      'completed',     // Successfully submitted
      'quit',          // Voluntarily quit before completion
      'timeout',       // Time expired
      'blocked_late'   // Tried to start after exam ended
    ],
    default: 'not_started',
    index: true
  },

  // ============ ACTIVE TIME TRACKING (for disconnect handling) ============
  // Total active time in seconds (only counts connected time)
  activeTimeSeconds: {
    type: Number,
    default: 0
  },
  // Last heartbeat received
  lastHeartbeatAt: {
    type: Date,
    default: null
  },
  // Whether timer is currently paused (due to disconnect)
  isPaused: {
    type: Boolean,
    default: false
  },
  // When pause started (for calculating pause duration)
  pauseStartedAt: {
    type: Date,
    default: null
  },
  // Total pause duration in seconds (for audit)
  totalPauseDurationSeconds: {
    type: Number,
    default: 0
  },
  // Heartbeat log (for audit trail)
  heartbeatLog: {
    type: [heartbeatLogSchema],
    default: []
  },

  // ============ SHUFFLING (per-candidate) ============
  // Shuffled order of question IDs (same questions, different order)
  shuffledQuestionsOrder: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question'
  }],
  // Per-question option shuffling
  shuffledOptionsMap: {
    type: [optionShuffleSchema],
    default: []
  },
  // Shuffle seed (for reproducibility if needed)
  shuffleSeed: {
    type: Number,
    default: null
  },

  // ============ ANSWERS ============
  answers: {
    type: [answerSchema],
    default: []
  },
  // Current question index (for resume)
  currentQuestionIndex: {
    type: Number,
    default: 0
  },

  // ============ RESULT (computed at submit) ============
  result: {
    correctCount: {
      type: Number,
      default: 0
    },
    incorrectCount: {
      type: Number,
      default: 0
    },
    unansweredCount: {
      type: Number,
      default: 0
    },
    totalQuestions: {
      type: Number,
      default: 0
    },
    totalMarks: {
      type: Number,
      default: 0
    },
    marksObtained: {
      type: Number,
      default: 0
    },
    percentage: {
      type: Number,
      default: 0
    },
    passed: {
      type: Boolean,
      default: false
    },
    // Passing threshold percentage
    passingPercentage: {
      type: Number,
      default: 75 // Default 75% passing mark
    },
    // Time stats
    totalTimeSpentSeconds: {
      type: Number,
      default: 0
    },
    // Calculated at submit
    calculatedAt: {
      type: Date,
      default: null
    }
  },

  // ============ SUBMISSION INFO ============
  submissionType: {
    type: String,
    enum: ['manual', 'auto_timeout', 'force_submit', null],
    default: null
  },
  submittedFromIp: {
    type: String,
    default: null
  },
  userAgent: {
    type: String,
    default: null
  },

  // ============ BLOCKING INFO (for late login) ============
  blockedAt: {
    type: Date,
    default: null
  },
  blockReason: {
    type: String,
    default: null
  },

  // ============ AUDIT ============
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ============ INDEXES ============
candidateAttemptSchema.index({ examId: 1, candidateId: 1 }, { unique: true });
candidateAttemptSchema.index({ examId: 1, status: 1 });
candidateAttemptSchema.index({ candidateId: 1, status: 1 });
candidateAttemptSchema.index({ status: 1, lastHeartbeatAt: 1 });
candidateAttemptSchema.index({ examId: 1, 'result.percentage': -1 });

// ============ VIRTUALS ============
candidateAttemptSchema.virtual('remainingTimeSeconds').get(function() {
  // This would need exam duration from exam - computed in controller
  return null;
});

candidateAttemptSchema.virtual('isActive').get(function() {
  return this.status === 'in_progress';
});

candidateAttemptSchema.virtual('isCompleted').get(function() {
  return ['completed', 'quit', 'timeout'].includes(this.status);
});

candidateAttemptSchema.virtual('answeredCount').get(function() {
  return this.answers.filter(a => a.selectedOptionId !== null || a.selectedAnswer !== null).length;
});

// ============ METHODS ============

/**
 * Start the attempt
 */
candidateAttemptSchema.methods.start = function() {
  if (this.status !== 'not_started') {
    throw new Error('Attempt already started');
  }

  this.status = 'in_progress';
  this.startedAt = new Date();
  this.lastHeartbeatAt = new Date();

  this.heartbeatLog.push({
    timestamp: new Date(),
    type: 'ping',
    activeTimeAtPoint: 0
  });

  return this.save();
};

/**
 * Record a heartbeat ping
 */
candidateAttemptSchema.methods.recordHeartbeat = function() {
  const now = new Date();

  // If was paused, calculate pause duration and resume
  if (this.isPaused && this.pauseStartedAt) {
    const pauseDuration = Math.floor((now - this.pauseStartedAt) / 1000);
    this.totalPauseDurationSeconds += pauseDuration;

    this.heartbeatLog.push({
      timestamp: now,
      type: 'resume',
      activeTimeAtPoint: this.activeTimeSeconds
    });

    this.isPaused = false;
    this.pauseStartedAt = null;
  } else if (this.lastHeartbeatAt) {
    // Calculate time since last heartbeat (max HEARTBEAT_TIMEOUT_SECONDS to prevent manipulation)
    const timeSinceLastHeartbeat = Math.floor((now - this.lastHeartbeatAt) / 1000);
    const validTime = Math.min(timeSinceLastHeartbeat, HEARTBEAT_TIMEOUT_SECONDS);
    this.activeTimeSeconds += validTime;
  }

  this.lastHeartbeatAt = now;

  // Add heartbeat log entry (limit to last 100 entries to prevent unbounded growth)
  this.heartbeatLog.push({
    timestamp: now,
    type: 'ping',
    activeTimeAtPoint: this.activeTimeSeconds
  });

  if (this.heartbeatLog.length > 100) {
    this.heartbeatLog = this.heartbeatLog.slice(-100);
  }

  return this.save();
};

/**
 * Pause the timer (called when disconnect detected)
 */
candidateAttemptSchema.methods.pause = function() {
  if (this.status !== 'in_progress') return this;
  if (this.isPaused) return this;

  this.isPaused = true;
  this.pauseStartedAt = new Date();
  this.status = 'paused';

  this.heartbeatLog.push({
    timestamp: new Date(),
    type: 'pause',
    activeTimeAtPoint: this.activeTimeSeconds
  });

  return this.save();
};

/**
 * Resume from pause
 */
candidateAttemptSchema.methods.resume = function() {
  if (!this.isPaused) return this;

  const now = new Date();
  const pauseDuration = Math.floor((now - this.pauseStartedAt) / 1000);
  this.totalPauseDurationSeconds += pauseDuration;

  this.isPaused = false;
  this.pauseStartedAt = null;
  this.status = 'in_progress';
  this.lastHeartbeatAt = now;

  this.heartbeatLog.push({
    timestamp: now,
    type: 'reconnect',
    activeTimeAtPoint: this.activeTimeSeconds
  });

  return this.save();
};

/**
 * Save an answer
 */
candidateAttemptSchema.methods.saveAnswer = function(questionId, selectedOptionIndex, selectedOptionId, selectedAnswer = null) {
  const existingIndex = this.answers.findIndex(
    a => a.questionId.toString() === questionId.toString()
  );

  const answerData = {
    questionId,
    selectedOptionIndex,
    selectedOptionId,
    selectedAnswer,
    answeredAt: new Date()
  };

  if (existingIndex >= 0) {
    // Update existing answer
    const existingAnswer = this.answers[existingIndex];
    existingAnswer.selectedOptionIndex = selectedOptionIndex;
    existingAnswer.selectedOptionId = selectedOptionId;
    existingAnswer.selectedAnswer = selectedAnswer;
    existingAnswer.answeredAt = new Date();
  } else {
    // Add new answer
    this.answers.push(answerData);
  }

  return this;
};

/**
 * Toggle flag for a question
 */
candidateAttemptSchema.methods.toggleFlag = function(questionId) {
  const answer = this.answers.find(
    a => a.questionId.toString() === questionId.toString()
  );

  if (answer) {
    answer.isFlagged = !answer.isFlagged;
  } else {
    // Create answer entry with just the flag
    this.answers.push({
      questionId,
      selectedOptionIndex: null,
      selectedOptionId: null,
      isFlagged: true
    });
  }

  return this;
};

/**
 * Submit the exam and calculate results
 * @param {Array} questions - Full question documents for validation
 * @param {string} submissionType - 'manual', 'auto_timeout', or 'force_submit'
 */
candidateAttemptSchema.methods.submit = function(questions, submissionType = 'manual') {
  const now = new Date();

  // Finalize timing
  if (this.lastHeartbeatAt && !this.isPaused) {
    const timeSinceLastHeartbeat = Math.floor((now - this.lastHeartbeatAt) / 1000);
    this.activeTimeSeconds += Math.min(timeSinceLastHeartbeat, HEARTBEAT_TIMEOUT_SECONDS);
  }

  // Calculate results
  let correctCount = 0;
  let incorrectCount = 0;
  let marksObtained = 0;

  this.answers.forEach(answer => {
    const question = questions.find(q => q._id.toString() === answer.questionId.toString());
    if (!question) return;

    // Find the correct option
    const correctOption = question.options.find(opt => opt.isCorrect);
    if (!correctOption) return;

    // Check if answer is correct
    let isCorrect = false;
    if (answer.selectedOptionId) {
      isCorrect = answer.selectedOptionId.toString() === correctOption._id.toString();
    } else if (answer.selectedAnswer) {
      // For true/false
      isCorrect = answer.selectedAnswer.toLowerCase() === correctOption.text.toLowerCase();
    }

    answer.isCorrect = isCorrect;
    answer.marksObtained = isCorrect ? 1 : 0;

    if (isCorrect) {
      correctCount++;
      marksObtained++;
    } else if (answer.selectedOptionId || answer.selectedAnswer) {
      incorrectCount++;
    }
  });

  const totalQuestions = questions.length;
  const unansweredCount = totalQuestions - correctCount - incorrectCount;
  const percentage = totalQuestions > 0 ? Math.round((marksObtained / totalQuestions) * 100) : 0;

  // Update result
  this.result = {
    correctCount,
    incorrectCount,
    unansweredCount,
    totalQuestions,
    totalMarks: totalQuestions, // Each question is 1 mark
    marksObtained,
    percentage,
    passed: percentage >= this.result.passingPercentage,
    passingPercentage: this.result.passingPercentage,
    totalTimeSpentSeconds: this.activeTimeSeconds,
    calculatedAt: now
  };

  this.status = submissionType === 'auto_timeout' ? 'timeout' : 'completed';
  this.submissionType = submissionType;
  this.endedAt = now;

  return this.save();
};

/**
 * Mark as blocked due to late login
 */
candidateAttemptSchema.methods.blockLateLogin = function(reason) {
  this.status = 'blocked_late';
  this.blockedAt = new Date();
  this.blockReason = reason || 'Attempted to start after exam time window ended';
  return this.save();
};

/**
 * Quit the exam voluntarily
 */
candidateAttemptSchema.methods.quit = function(questions) {
  return this.submit(questions, 'force_submit');
};

/**
 * Get unanswered question IDs
 */
candidateAttemptSchema.methods.getUnansweredQuestionIds = function() {
  const answeredIds = new Set(
    this.answers
      .filter(a => a.selectedOptionId || a.selectedAnswer)
      .map(a => a.questionId.toString())
  );

  return this.shuffledQuestionsOrder.filter(
    qId => !answeredIds.has(qId.toString())
  );
};

/**
 * Get flagged question IDs
 */
candidateAttemptSchema.methods.getFlaggedQuestionIds = function() {
  return this.answers
    .filter(a => a.isFlagged)
    .map(a => a.questionId);
};

// ============ STATIC METHODS ============

/**
 * Find attempt by exam and candidate
 */
candidateAttemptSchema.statics.findByExamAndCandidate = function(examId, candidateId) {
  return this.findOne({ examId, candidateId });
};

/**
 * Find all attempts for an exam
 */
candidateAttemptSchema.statics.findByExam = function(examId, statusFilter = null) {
  const query = { examId };
  if (statusFilter) {
    query.status = statusFilter;
  }
  return this.find(query).populate('candidateId', 'name email');
};

/**
 * Get completed attempts for an exam (for consolidated results)
 */
candidateAttemptSchema.statics.getCompletedAttempts = function(examId) {
  return this.find({
    examId,
    status: { $in: ['completed', 'quit', 'timeout'] }
  }).populate('candidateId', 'name email').sort({ 'result.percentage': -1 });
};

/**
 * Check if all assigned candidates have completed
 */
candidateAttemptSchema.statics.allCandidatesCompleted = async function(examId, assignedCandidateIds) {
  const completedCount = await this.countDocuments({
    examId,
    candidateId: { $in: assignedCandidateIds },
    status: { $in: ['completed', 'quit', 'timeout', 'blocked_late'] }
  });

  return completedCount >= assignedCandidateIds.length;
};

/**
 * Get consolidated results for an exam
 */
candidateAttemptSchema.statics.getConsolidatedResults = async function(examId) {
  const attempts = await this.find({
    examId,
    status: { $in: ['completed', 'quit', 'timeout'] }
  }).populate('candidateId', 'name email');

  if (attempts.length === 0) {
    return {
      examId,
      totalCandidates: 0,
      completedCount: 0,
      candidates: [],
      stats: null
    };
  }

  const percentages = attempts.map(a => a.result.percentage);
  const stats = {
    average: percentages.reduce((a, b) => a + b, 0) / percentages.length,
    min: Math.min(...percentages),
    max: Math.max(...percentages),
    passedCount: attempts.filter(a => a.result.passed).length,
    failedCount: attempts.filter(a => !a.result.passed).length,
    passRate: (attempts.filter(a => a.result.passed).length / attempts.length) * 100
  };

  return {
    examId,
    totalCandidates: attempts.length,
    completedCount: attempts.length,
    candidates: attempts.map(a => ({
      candidateId: a.candidateId._id,
      name: a.candidateId.name,
      email: a.candidateId.email,
      status: a.status,
      result: a.result,
      startedAt: a.startedAt,
      endedAt: a.endedAt,
      totalTimeSpent: a.activeTimeSeconds
    })),
    stats
  };
};

/**
 * Find attempts that need to be auto-paused (no heartbeat for too long)
 */
candidateAttemptSchema.statics.findStaleInProgress = async function() {
  const threshold = new Date(Date.now() - HEARTBEAT_TIMEOUT_SECONDS * 1000);

  return this.find({
    status: 'in_progress',
    lastHeartbeatAt: { $lt: threshold }
  });
};

/**
 * Auto-pause stale attempts
 */
candidateAttemptSchema.statics.autoPauseStale = async function() {
  const threshold = new Date(Date.now() - HEARTBEAT_TIMEOUT_SECONDS * 1000);

  const result = await this.updateMany(
    {
      status: 'in_progress',
      lastHeartbeatAt: { $lt: threshold },
      isPaused: false
    },
    {
      $set: {
        isPaused: true,
        pauseStartedAt: new Date(),
        status: 'paused'
      },
      $push: {
        heartbeatLog: {
          timestamp: new Date(),
          type: 'disconnect',
          activeTimeAtPoint: '$activeTimeSeconds'
        }
      }
    }
  );

  return result.modifiedCount;
};

export default mongoose.model('CandidateAttempt', candidateAttemptSchema);
