import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema({
  question: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  },
  selectedOptions: [{
    type: mongoose.Schema.Types.ObjectId
  }],
  textAnswer: {
    type: String,
    trim: true
  },
  isCorrect: {
    type: Boolean,
    default: false
  },
  marksObtained: {
    type: Number,
    default: 0
  },
  timeSpent: {
    type: Number,
    default: 0 // in seconds
  },
  attempts: {
    type: Number,
    default: 1
  },
  flagged: {
    type: Boolean,
    default: false
  },
  reviewStatus: {
    type: String,
    enum: ['not-reviewed', 'correct', 'incorrect', 'partially-correct', 'needs-review'],
    default: 'not-reviewed'
  },
  reviewComments: {
    type: String,
    trim: true
  }
}, { _id: true });

const sessionSchema = new mongoose.Schema({
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  activities: [{
    type: {
      type: String,
      enum: ['start', 'pause', 'resume', 'submit', 'warning', 'violation', 'tab-switch', 'window-blur'],
      required: true
    },
    timestamp: {
      type: Date,
      required: true
    },
    details: {
      type: String
    }
  }],
  violations: [{
    type: {
      type: String,
      enum: ['tab-switch', 'window-blur', 'copy-paste', 'right-click', 'full-screen-exit', 'suspicious-activity']
    },
    timestamp: {
      type: Date
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    description: String
  }]
}, { _id: false });

const resultSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  exam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true
  },
  attemptNumber: {
    type: Number,
    required: true,
    default: 1,
    min: 1
  },
  answers: [answerSchema],
  session: sessionSchema,
  scoring: {
    totalMarks: {
      type: Number,
      required: true
    },
    marksObtained: {
      type: Number,
      required: true,
      default: 0
    },
    percentage: {
      type: Number,
      required: true,
      default: 0
    },
    grade: {
      type: String,
      enum: ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F'],
      default: 'F'
    },
    passed: {
      type: Boolean,
      default: false
    },
    rank: {
      type: Number
    },
    percentile: {
      type: Number
    }
  },
  stats: {
    totalQuestions: {
      type: Number,
      required: true
    },
    attemptedQuestions: {
      type: Number,
      default: 0
    },
    correctAnswers: {
      type: Number,
      default: 0
    },
    incorrectAnswers: {
      type: Number,
      default: 0
    },
    skippedQuestions: {
      type: Number,
      default: 0
    },
    flaggedQuestions: {
      type: Number,
      default: 0
    },
    averageTimePerQuestion: {
      type: Number,
      default: 0 // in seconds
    },
    totalTimeSpent: {
      type: Number,
      default: 0 // in minutes
    }
  },
  analytics: {
    subjectWise: [{
      subject: {
        type: String,
        required: true
      },
      totalQuestions: {
        type: Number,
        required: true
      },
      correctAnswers: {
        type: Number,
        default: 0
      },
      marksObtained: {
        type: Number,
        default: 0
      },
      totalMarks: {
        type: Number,
        required: true
      },
      percentage: {
        type: Number,
        default: 0
      }
    }],
    topicWise: [{
      topic: {
        type: String,
        required: true
      },
      subject: {
        type: String,
        required: true
      },
      totalQuestions: {
        type: Number,
        required: true
      },
      correctAnswers: {
        type: Number,
        default: 0
      },
      percentage: {
        type: Number,
        default: 0
      }
    }],
    difficultyWise: {
      easy: {
        total: { type: Number, default: 0 },
        correct: { type: Number, default: 0 },
        percentage: { type: Number, default: 0 }
      },
      medium: {
        total: { type: Number, default: 0 },
        correct: { type: Number, default: 0 },
        percentage: { type: Number, default: 0 }
      },
      hard: {
        total: { type: Number, default: 0 },
        correct: { type: Number, default: 0 },
        percentage: { type: Number, default: 0 }
      }
    }
  },
  status: {
    type: String,
    enum: ['in-progress', 'completed', 'submitted', 'auto-submitted', 'incomplete'],
    default: 'in-progress'
  },
  submittedAt: {
    type: Date
  },
  reviewedAt: {
    type: Date
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  feedback: {
    overall: {
      type: String,
      trim: true
    },
    strengths: [{
      type: String,
      trim: true
    }],
    improvements: [{
      type: String,
      trim: true
    }],
    recommendations: [{
      type: String,
      trim: true
    }]
  },
  certificates: [{
    type: {
      type: String,
      enum: ['completion', 'achievement', 'participation']
    },
    issueDate: {
      type: Date,
      default: Date.now
    },
    certificateId: {
      type: String,
      unique: true
    },
    downloadUrl: {
      type: String
    }
  }],
  metadata: {
    examVersion: {
      type: Number,
      default: 1
    },
    browserInfo: {
      type: String
    },
    screenResolution: {
      type: String
    },
    deviceInfo: {
      type: String
    },
    isProctored: {
      type: Boolean,
      default: false
    },
    violationCount: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
resultSchema.index({ student: 1, exam: 1 });
resultSchema.index({ exam: 1 });
resultSchema.index({ student: 1 });
resultSchema.index({ status: 1 });
resultSchema.index({ submittedAt: -1 });
resultSchema.index({ 'scoring.percentage': -1 });
resultSchema.index({ 'scoring.rank': 1 });

// Compound indexes
resultSchema.index({ student: 1, exam: 1, attemptNumber: 1 }, { unique: true });
resultSchema.index({ exam: 1, 'scoring.percentage': -1 });

// Virtuals
resultSchema.virtual('isCompleted').get(function() {
  return ['completed', 'submitted', 'auto-submitted'].includes(this.status);
});

resultSchema.virtual('accuracy').get(function() {
  if (this.stats.attemptedQuestions === 0) return 0;
  return (this.stats.correctAnswers / this.stats.attemptedQuestions) * 100;
});

resultSchema.virtual('completionRate').get(function() {
  return (this.stats.attemptedQuestions / this.stats.totalQuestions) * 100;
});

resultSchema.virtual('timeEfficiency').get(function() {
  // Ratio of time spent vs allocated time (lower is better)
  const allocatedTime = this.exam?.duration || 60;
  return (this.stats.totalTimeSpent / allocatedTime) * 100;
});

// Pre-save middleware
resultSchema.pre('save', function(next) {
  // Calculate stats before saving
  this.calculateStats();
  
  // Calculate grade
  this.calculateGrade();
  
  // Calculate analytics
  this.calculateAnalytics();
  
  next();
});

// Methods
resultSchema.methods.calculateStats = function() {
  this.stats.attemptedQuestions = this.answers.filter(a => 
    a.selectedOptions.length > 0 || a.textAnswer
  ).length;
  
  this.stats.correctAnswers = this.answers.filter(a => a.isCorrect).length;
  this.stats.incorrectAnswers = this.stats.attemptedQuestions - this.stats.correctAnswers;
  this.stats.skippedQuestions = this.stats.totalQuestions - this.stats.attemptedQuestions;
  this.stats.flaggedQuestions = this.answers.filter(a => a.flagged).length;
  
  // Calculate time stats
  const totalTimeSpent = this.answers.reduce((sum, a) => sum + a.timeSpent, 0);
  this.stats.totalTimeSpent = Math.round(totalTimeSpent / 60); // convert to minutes
  this.stats.averageTimePerQuestion = this.stats.attemptedQuestions > 0 ? 
    totalTimeSpent / this.stats.attemptedQuestions : 0;
};

resultSchema.methods.calculateGrade = function() {
  const percentage = this.scoring.percentage;
  
  if (percentage >= 90) this.scoring.grade = 'A+';
  else if (percentage >= 85) this.scoring.grade = 'A';
  else if (percentage >= 80) this.scoring.grade = 'B+';
  else if (percentage >= 75) this.scoring.grade = 'B';
  else if (percentage >= 70) this.scoring.grade = 'C+';
  else if (percentage >= 60) this.scoring.grade = 'C';
  else if (percentage >= 50) this.scoring.grade = 'D';
  else this.scoring.grade = 'F';
};

resultSchema.methods.calculateAnalytics = async function() {
  const questionDetails = await mongoose.model('Question').find({
    _id: { $in: this.answers.map(a => a.question) }
  });
  
  // Subject-wise analytics
  const subjectStats = {};
  const topicStats = {};
  const difficultyStats = { easy: { total: 0, correct: 0 }, medium: { total: 0, correct: 0 }, hard: { total: 0, correct: 0 } };
  
  this.answers.forEach((answer, index) => {
    const question = questionDetails.find(q => q._id.toString() === answer.question.toString());
    if (!question) return;
    
    // Subject-wise
    if (!subjectStats[question.subject]) {
      subjectStats[question.subject] = {
        totalQuestions: 0,
        correctAnswers: 0,
        marksObtained: 0,
        totalMarks: 0
      };
    }
    
    subjectStats[question.subject].totalQuestions++;
    subjectStats[question.subject].totalMarks += question.marks;
    
    if (answer.isCorrect) {
      subjectStats[question.subject].correctAnswers++;
      subjectStats[question.subject].marksObtained += answer.marksObtained;
    }
    
    // Topic-wise
    const topicKey = `${question.subject}-${question.topic}`;
    if (!topicStats[topicKey]) {
      topicStats[topicKey] = {
        topic: question.topic,
        subject: question.subject,
        totalQuestions: 0,
        correctAnswers: 0
      };
    }
    
    topicStats[topicKey].totalQuestions++;
    if (answer.isCorrect) {
      topicStats[topicKey].correctAnswers++;
    }
    
    // Difficulty-wise
    difficultyStats[question.difficulty].total++;
    if (answer.isCorrect) {
      difficultyStats[question.difficulty].correct++;
    }
  });
  
  // Convert to arrays and calculate percentages
  this.analytics.subjectWise = Object.keys(subjectStats).map(subject => ({
    subject,
    ...subjectStats[subject],
    percentage: subjectStats[subject].totalMarks > 0 ? 
      (subjectStats[subject].marksObtained / subjectStats[subject].totalMarks) * 100 : 0
  }));
  
  this.analytics.topicWise = Object.values(topicStats).map(topic => ({
    ...topic,
    percentage: topic.totalQuestions > 0 ? (topic.correctAnswers / topic.totalQuestions) * 100 : 0
  }));
  
  // Calculate difficulty percentages
  Object.keys(difficultyStats).forEach(difficulty => {
    this.analytics.difficultyWise[difficulty] = {
      ...difficultyStats[difficulty],
      percentage: difficultyStats[difficulty].total > 0 ? 
        (difficultyStats[difficulty].correct / difficultyStats[difficulty].total) * 100 : 0
    };
  });
};

resultSchema.methods.generateCertificate = function(type = 'completion') {
  const certificate = {
    type,
    issueDate: new Date(),
    certificateId: `CERT-${this.exam.toString().slice(-6)}-${this.student.toString().slice(-6)}-${Date.now()}`
  };
  
  this.certificates.push(certificate);
  return this.save();
};

resultSchema.methods.addViolation = function(violationType, description, severity = 'medium') {
  this.session.violations.push({
    type: violationType,
    timestamp: new Date(),
    severity,
    description
  });
  
  this.metadata.violationCount = this.session.violations.length;
  return this.save();
};

// Static methods
resultSchema.statics.getExamStatistics = function(examId) {
  return this.aggregate([
    { $match: { exam: examId, status: { $in: ['completed', 'submitted', 'auto-submitted'] } } },
    {
      $group: {
        _id: null,
        totalAttempts: { $sum: 1 },
        averageScore: { $avg: '$scoring.percentage' },
        highestScore: { $max: '$scoring.percentage' },
        lowestScore: { $min: '$scoring.percentage' },
        passRate: {
          $avg: {
            $cond: [{ $eq: ['$scoring.passed', true] }, 1, 0]
          }
        },
        averageTime: { $avg: '$stats.totalTimeSpent' }
      }
    }
  ]);
};

resultSchema.statics.getStudentProgress = function(studentId, examIds) {
  const query = { student: studentId };
  if (examIds) query.exam = { $in: examIds };
  
  return this.find(query)
    .populate('exam', 'title subject')
    .sort({ submittedAt: -1 });
};

resultSchema.statics.getLeaderboard = function(examId, limit = 10) {
  return this.find({ 
    exam: examId, 
    status: { $in: ['completed', 'submitted', 'auto-submitted'] } 
  })
    .populate('student', 'name email')
    .sort({ 'scoring.percentage': -1, submittedAt: 1 })
    .limit(limit);
};

resultSchema.statics.getAnalytics = function(filters = {}) {
  const pipeline = [
    { $match: { status: { $in: ['completed', 'submitted', 'auto-submitted'] }, ...filters } },
    {
      $group: {
        _id: null,
        totalResults: { $sum: 1 },
        averageScore: { $avg: '$scoring.percentage' },
        averageTime: { $avg: '$stats.totalTimeSpent' },
        passRate: {
          $avg: {
            $cond: [{ $eq: ['$scoring.passed', true] }, 1, 0]
          }
        },
        gradeDistribution: {
          $push: '$scoring.grade'
        }
      }
    }
  ];
  
  return this.aggregate(pipeline);
};

export default mongoose.model('Result', resultSchema);