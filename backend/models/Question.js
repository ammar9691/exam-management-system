import mongoose from 'mongoose';

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
  },
  explanation: {
    type: String,
    trim: true,
    maxLength: [1000, 'Explanation cannot exceed 1000 characters']
  }
}, { _id: true });

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: [true, 'Question text is required'],
    trim: true,
    maxLength: [2000, 'Question cannot exceed 2000 characters']
  },
  type: {
    type: String,
    enum: ['multiple-choice', 'true-false', 'fill-in-blank', 'essay'],
    default: 'multiple-choice',
    required: true
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
    maxLength: [100, 'Subject cannot exceed 100 characters']
  },
  topic: {
    type: String,
    required: [true, 'Topic is required'],
    trim: true,
    maxLength: [100, 'Topic cannot exceed 100 characters']
  },
  subtopic: {
    type: String,
    trim: true,
    maxLength: [100, 'Subtopic cannot exceed 100 characters']
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium',
    required: true
  },
  marks: {
    type: Number,
    required: [true, 'Marks are required'],
    min: [0.25, 'Marks must be at least 0.25'],
    max: [100, 'Marks cannot exceed 100'],
    default: 1
  },
  negativeMarks: {
    type: Number,
    default: 0,
    min: [0, 'Negative marks cannot be less than 0'],
    max: [50, 'Negative marks cannot exceed 50']
  },
  options: {
    type: [optionSchema],
    validate: {
      validator: function(options) {
        if (this.type === 'multiple-choice') {
          return options.length >= 2 && options.length <= 6;
        }
        if (this.type === 'true-false') {
          return options.length === 2;
        }
        return true;
      },
      message: 'Invalid number of options for question type'
    }
  },
  correctAnswer: {
    type: String, // For fill-in-blank or essay questions
    trim: true
  },
  explanation: {
    type: String,
    trim: true,
    maxLength: [2000, 'Explanation cannot exceed 2000 characters']
  },
  hints: [{
    type: String,
    trim: true,
    maxLength: [500, 'Hint cannot exceed 500 characters']
  }],
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  multimedia: {
    images: [{
      url: String,
      caption: String,
      alt: String
    }],
    videos: [{
      url: String,
      caption: String,
      duration: Number // in seconds
    }],
    audio: [{
      url: String,
      caption: String,
      duration: Number // in seconds
    }]
  },
  metadata: {
    source: {
      type: String,
      trim: true,
      maxLength: [200, 'Source cannot exceed 200 characters']
    },
    author: {
      type: String,
      trim: true,
      maxLength: [100, 'Author cannot exceed 100 characters']
    },
    language: {
      type: String,
      default: 'en',
      trim: true
    },
    keywords: [{
      type: String,
      trim: true,
      lowercase: true
    }],
    learningObjectives: [{
      type: String,
      trim: true
    }]
  },
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
    },
    difficultyRating: {
      type: Number,
      min: 1,
      max: 5
    }
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'archived', 'disabled'],
    default: 'active'
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
  },
  parentQuestion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question' // For versioning and history
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
questionSchema.index({ subject: 1, topic: 1 });
questionSchema.index({ difficulty: 1 });
questionSchema.index({ tags: 1 });
questionSchema.index({ status: 1 });
questionSchema.index({ createdBy: 1 });
questionSchema.index({ createdAt: -1 });
questionSchema.index({ 'metadata.keywords': 1 });

// Text search index
questionSchema.index({
  question: 'text',
  'options.text': 'text',
  subject: 'text',
  topic: 'text',
  tags: 'text'
});

// Virtuals
questionSchema.virtual('successRate').get(function() {
  if (this.analytics.totalAttempts === 0) return 0;
  return (this.analytics.correctAttempts / this.analytics.totalAttempts) * 100;
});

questionSchema.virtual('isMultipleChoice').get(function() {
  return this.type === 'multiple-choice';
});

questionSchema.virtual('correctOptions').get(function() {
  return this.options ? this.options.filter(option => option.isCorrect) : [];
});

// Pre-save middleware
questionSchema.pre('save', function(next) {
  // Ensure at least one correct answer for multiple choice
  if (this.type === 'multiple-choice') {
    const correctOptions = this.options.filter(option => option.isCorrect);
    if (correctOptions.length === 0) {
      return next(new Error('Multiple choice questions must have at least one correct option'));
    }
  }
  
  // Auto-increment version on modification
  if (this.isModified() && !this.isNew) {
    this.version += 1;
  }
  
  next();
});

// Methods
questionSchema.methods.validateAnswer = function(userAnswer) {
  if (this.type === 'multiple-choice') {
    const correctOptionIds = this.options
      .filter(option => option.isCorrect)
      .map(option => option._id.toString());
    
    if (Array.isArray(userAnswer)) {
      // Multiple correct answers
      return userAnswer.every(id => correctOptionIds.includes(id.toString())) &&
             correctOptionIds.every(id => userAnswer.map(a => a.toString()).includes(id));
    } else {
      // Single correct answer
      return correctOptionIds.includes(userAnswer.toString());
    }
  }
  
  if (this.type === 'fill-in-blank' || this.type === 'essay') {
    // For fill-in-blank, do case-insensitive comparison
    if (this.type === 'fill-in-blank') {
      return this.correctAnswer.toLowerCase().trim() === userAnswer.toLowerCase().trim();
    }
    // For essay, return userAnswer for manual grading
    return userAnswer;
  }
  
  return false;
};

questionSchema.methods.updateAnalytics = function(isCorrect, timeSpent) {
  this.analytics.totalAttempts += 1;
  this.analytics.timesUsed += 1;
  
  if (isCorrect) {
    this.analytics.correctAttempts += 1;
  }
  
  if (timeSpent) {
    // Update average time spent
    const totalTime = this.analytics.averageTimeSpent * (this.analytics.totalAttempts - 1) + timeSpent;
    this.analytics.averageTimeSpent = totalTime / this.analytics.totalAttempts;
  }
  
  return this.save();
};

questionSchema.methods.createVersion = function(updates, userId) {
  const newQuestion = new this.constructor({
    ...this.toObject(),
    _id: undefined,
    version: this.version + 1,
    parentQuestion: this._id,
    lastModifiedBy: userId,
    createdAt: undefined,
    updatedAt: undefined,
    ...updates
  });
  
  return newQuestion.save();
};

// Static methods
questionSchema.statics.findBySubjectAndTopic = function(subject, topic, options = {}) {
  return this.find({ 
    subject: subject, 
    topic: topic, 
    status: 'active',
    ...options 
  });
};

questionSchema.statics.findByDifficulty = function(difficulty, limit = 10) {
  return this.find({ 
    difficulty: difficulty, 
    status: 'active' 
  }).limit(limit);
};

questionSchema.statics.getRandomQuestions = function(filters = {}, count = 10) {
  const pipeline = [
    { $match: { status: 'active', ...filters } },
    { $sample: { size: count } }
  ];
  
  return this.aggregate(pipeline);
};

questionSchema.statics.getSubjects = function() {
  return this.distinct('subject', { status: 'active' });
};

questionSchema.statics.getTopics = function(subject) {
  const filter = { status: 'active' };
  if (subject) filter.subject = subject;
  
  return this.distinct('topic', filter);
};

questionSchema.statics.getStatistics = function(filters = {}) {
  const pipeline = [
    { $match: { status: 'active', ...filters } },
    {
      $group: {
        _id: null,
        totalQuestions: { $sum: 1 },
        averageMarks: { $avg: '$marks' },
        difficultyDistribution: {
          $push: '$difficulty'
        },
        subjectDistribution: {
          $push: '$subject'
        }
      }
    }
  ];
  
  return this.aggregate(pipeline);
};

export default mongoose.model('Question', questionSchema);