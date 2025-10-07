import mongoose from 'mongoose';

const topicSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Topic name is required'],
    trim: true,
    maxLength: [100, 'Topic name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxLength: [500, 'Description cannot exceed 500 characters']
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  metadata: {
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'intermediate'
    },
    estimatedHours: {
      type: Number,
      min: 0
    },
    prerequisites: [{
      type: String,
      trim: true
    }]
  }
}, { _id: true });

const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Subject name is required'],
    unique: true,
    trim: true,
    maxLength: [100, 'Subject name cannot exceed 100 characters']
  },
  code: {
    type: String,
    required: [true, 'Subject code is required'],
    unique: true,
    trim: true,
    uppercase: true,
    maxLength: [10, 'Subject code cannot exceed 10 characters']
  },
  description: {
    type: String,
    trim: true,
    maxLength: [1000, 'Description cannot exceed 1000 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Science', 'Mathematics', 'Languages', 'Social Studies', 'Arts', 'Technology', 'Other'],
    default: 'Other'
  },
  topics: [topicSchema],
  metadata: {
    level: {
      type: String,
      enum: ['elementary', 'middle', 'high', 'college', 'professional'],
      default: 'college'
    },
    credits: {
      type: Number,
      min: 0,
      max: 20,
      default: 3
    },
    duration: {
      type: Number, // in weeks
      min: 1,
      max: 52,
      default: 16
    },
    language: {
      type: String,
      default: 'en'
    },
    tags: [{
      type: String,
      trim: true,
      lowercase: true
    }]
  },
  statistics: {
    totalQuestions: {
      type: Number,
      default: 0
    },
    totalExams: {
      type: Number,
      default: 0
    },
    totalStudents: {
      type: Number,
      default: 0
    },
    averageScore: {
      type: Number,
      default: 0
    },
    difficultyDistribution: {
      easy: { type: Number, default: 0 },
      medium: { type: Number, default: 0 },
      hard: { type: Number, default: 0 }
    }
  },
  settings: {
    isActive: {
      type: Boolean,
      default: true
    },
    allowSelfEnrollment: {
      type: Boolean,
      default: false
    },
    requireApproval: {
      type: Boolean,
      default: false
    },
    maxStudents: {
      type: Number,
      min: 1,
      default: 1000
    },
    passingScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 50
    }
  },
  instructors: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['primary', 'assistant', 'guest'],
      default: 'primary'
    },
    permissions: {
      canCreateExams: { type: Boolean, default: true },
      canGrade: { type: Boolean, default: true },
      canManageStudents: { type: Boolean, default: false },
      canEditSubject: { type: Boolean, default: false }
    }
  }],
  resources: [{
    title: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['book', 'article', 'video', 'website', 'document', 'other'],
      default: 'other'
    },
    url: {
      type: String,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    isRequired: {
      type: Boolean,
      default: false
    }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
subjectSchema.index({ name: 1 }, { unique: true });
subjectSchema.index({ code: 1 }, { unique: true });
subjectSchema.index({ category: 1 });
subjectSchema.index({ 'settings.isActive': 1 });
subjectSchema.index({ 'metadata.level': 1 });
subjectSchema.index({ createdAt: -1 });
subjectSchema.index({ name: 'text', description: 'text', 'metadata.tags': 'text' });

// Virtuals
subjectSchema.virtual('totalTopics').get(function() {
  return this.topics.length;
});

subjectSchema.virtual('activeTopics').get(function() {
  return this.topics.filter(topic => topic.isActive).length;
});

subjectSchema.virtual('primaryInstructor').get(function() {
  return this.instructors.find(inst => inst.role === 'primary');
});

subjectSchema.virtual('enrollmentCount').get(function() {
  return this.statistics.totalStudents;
});

// Pre-save middleware
subjectSchema.pre('save', function(next) {
  // Ensure topics have proper order if not set
  this.topics.forEach((topic, index) => {
    if (topic.order === undefined || topic.order === 0) {
      topic.order = index + 1;
    }
  });
  
  // Sort topics by order
  this.topics.sort((a, b) => a.order - b.order);
  
  next();
});

// Methods
subjectSchema.methods.addTopic = function(topicData) {
  const order = this.topics.length + 1;
  this.topics.push({ ...topicData, order });
  return this.save();
};

subjectSchema.methods.removeTopic = function(topicId) {
  this.topics.pull({ _id: topicId });
  // Reorder remaining topics
  this.topics.forEach((topic, index) => {
    topic.order = index + 1;
  });
  return this.save();
};

subjectSchema.methods.reorderTopics = function(newOrder) {
  // newOrder should be an array of topic IDs in the desired order
  const reorderedTopics = [];
  
  newOrder.forEach((topicId, index) => {
    const topic = this.topics.id(topicId);
    if (topic) {
      topic.order = index + 1;
      reorderedTopics.push(topic);
    }
  });
  
  this.topics = reorderedTopics;
  return this.save();
};

subjectSchema.methods.addInstructor = function(userId, role = 'assistant', permissions = {}) {
  // Check if user is already an instructor
  const existingInstructor = this.instructors.find(
    inst => inst.user.toString() === userId.toString()
  );
  
  if (existingInstructor) {
    throw new Error('User is already an instructor for this subject');
  }
  
  this.instructors.push({
    user: userId,
    role,
    permissions: {
      canCreateExams: permissions.canCreateExams !== undefined ? permissions.canCreateExams : true,
      canGrade: permissions.canGrade !== undefined ? permissions.canGrade : true,
      canManageStudents: permissions.canManageStudents !== undefined ? permissions.canManageStudents : false,
      canEditSubject: permissions.canEditSubject !== undefined ? permissions.canEditSubject : false
    }
  });
  
  return this.save();
};

subjectSchema.methods.removeInstructor = function(userId) {
  this.instructors.pull({ user: userId });
  return this.save();
};

subjectSchema.methods.updateStatistics = function(stats) {
  Object.keys(stats).forEach(key => {
    if (this.statistics.hasOwnProperty(key)) {
      this.statistics[key] = stats[key];
    }
  });
  return this.save();
};

subjectSchema.methods.getTopicByName = function(topicName) {
  return this.topics.find(topic => 
    topic.name.toLowerCase() === topicName.toLowerCase()
  );
};

// Static methods
subjectSchema.statics.findByCategory = function(category) {
  return this.find({ 
    category: category, 
    'settings.isActive': true 
  }).sort({ name: 1 });
};

subjectSchema.statics.findByLevel = function(level) {
  return this.find({ 
    'metadata.level': level, 
    'settings.isActive': true 
  }).sort({ name: 1 });
};

subjectSchema.statics.findByInstructor = function(instructorId) {
  return this.find({ 
    'instructors.user': instructorId,
    'settings.isActive': true 
  }).sort({ name: 1 });
};

subjectSchema.statics.searchSubjects = function(searchTerm, filters = {}) {
  const query = {
    $text: { $search: searchTerm },
    'settings.isActive': true,
    ...filters
  };
  
  return this.find(query, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' } });
};

subjectSchema.statics.getPopularSubjects = function(limit = 10) {
  return this.find({ 'settings.isActive': true })
    .sort({ 'statistics.totalStudents': -1, 'statistics.totalExams': -1 })
    .limit(limit);
};

subjectSchema.statics.getSubjectStatistics = function(subjectId) {
  return this.aggregate([
    { $match: { _id: subjectId } },
    {
      $lookup: {
        from: 'questions',
        localField: 'name',
        foreignField: 'subject',
        as: 'questions'
      }
    },
    {
      $lookup: {
        from: 'exams',
        localField: 'name',
        foreignField: 'subject',
        as: 'exams'
      }
    },
    {
      $project: {
        name: 1,
        totalQuestions: { $size: '$questions' },
        totalExams: { $size: '$exams' },
        difficultyDistribution: {
          $reduce: {
            input: '$questions',
            initialValue: { easy: 0, medium: 0, hard: 0 },
            in: {
              easy: {
                $cond: [
                  { $eq: ['$$this.difficulty', 'easy'] },
                  { $add: ['$$value.easy', 1] },
                  '$$value.easy'
                ]
              },
              medium: {
                $cond: [
                  { $eq: ['$$this.difficulty', 'medium'] },
                  { $add: ['$$value.medium', 1] },
                  '$$value.medium'
                ]
              },
              hard: {
                $cond: [
                  { $eq: ['$$this.difficulty', 'hard'] },
                  { $add: ['$$value.hard', 1] },
                  '$$value.hard'
                ]
              }
            }
          }
        }
      }
    }
  ]);
};

export default mongoose.model('Subject', subjectSchema);