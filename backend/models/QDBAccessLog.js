/**
 * QDB Access Log Model
 * Tracks all access (read/write) to the Question Database for PCAA compliance (Req 10)
 */

import mongoose from 'mongoose';

const qdbAccessLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  userName: {
    type: String,
    required: true
  },
  userRole: {
    type: String,
    required: true
  },
  action: {
    type: String,
    enum: [
      'view_list',
      'view_question',
      'create',
      'edit',
      'delete',
      'approve',
      'reject',
      'import',
      'export',
      'search'
    ],
    required: true,
    index: true
  },
  resourceType: {
    type: String,
    enum: ['question', 'question_list', 'module_questions'],
    default: 'question'
  },
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    default: null
  },
  questionSerialNo: {
    type: String,
    default: null
  },
  module: {
    type: String,
    default: null
  },
  details: {
    type: String,
    maxLength: 500,
    default: null
  },
  ipAddress: {
    type: String,
    default: null
  },
  userAgent: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Index for efficient querying
qdbAccessLogSchema.index({ createdAt: -1 });
qdbAccessLogSchema.index({ userId: 1, createdAt: -1 });
qdbAccessLogSchema.index({ action: 1, createdAt: -1 });

/**
 * Static helper to log an access event
 */
qdbAccessLogSchema.statics.logAccess = function(req, action, details = {}) {
  const user = req.user;
  if (!user) return Promise.resolve();

  return this.create({
    userId: user._id,
    userName: user.name,
    userRole: user.role,
    action,
    resourceType: details.resourceType || 'question',
    questionId: details.questionId || null,
    questionSerialNo: details.questionSerialNo || null,
    module: details.module || null,
    details: details.description || null,
    ipAddress: req.ip || req.connection?.remoteAddress,
    userAgent: req.get('User-Agent')
  }).catch(err => {
    // Don't let logging failures break the request
    console.error('QDB access log error:', err.message);
  });
};

export default mongoose.model('QDBAccessLog', qdbAccessLogSchema);
