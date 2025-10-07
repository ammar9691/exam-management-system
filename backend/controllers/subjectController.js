/**
 * Subject Controller
 * Handles subject management operations
 */

import Subject from '../models/Subject.js';
import User from '../models/User.js';
import Question from '../models/Question.js';
import Exam from '../models/Exam.js';
import { 
  sendSuccessResponse, 
  sendErrorResponse, 
  sendNotFoundResponse,
  sendPaginatedResponse,
  asyncHandler
} from '../utils/response.js';
import { getPaginatedResults } from '../utils/pagination.js';

// Get all subjects
export const getAllSubjects = asyncHandler(async (req, res) => {
  const options = {
    searchFields: ['name', 'code', 'description'],
    allowedFilters: ['status', 'credits', 'createdBy'],
    defaultSort: { name: 1 },
    populate: [
      { path: 'instructors.userId', select: 'name email' },
      { path: 'createdBy', select: 'name email' }
    ]
  };

  const result = await getPaginatedResults(Subject, req, options);
  sendPaginatedResponse(res, result.data, result.pagination, 'Subjects retrieved successfully');
});

// Get subject by ID
export const getSubjectById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const subject = await Subject.findById(id)
    .populate('instructors.userId', 'name email profile.avatar')
    .populate('createdBy', 'name email');
    
  if (!subject) {
    return sendNotFoundResponse(res, 'Subject');
  }

  // Get additional statistics
  const stats = await Subject.getSubjectStats(id);

  sendSuccessResponse(res, 'Subject retrieved successfully', { 
    subject,
    stats 
  });
});

// Create new subject
export const createSubject = asyncHandler(async (req, res) => {
  const {
    name, code, description, credits, topics, instructors, resources, settings
  } = req.body;

  // Check if subject code already exists
  const existingSubject = await Subject.findOne({ code });
  if (existingSubject) {
    return sendErrorResponse(res, 'Subject code already exists', 409);
  }

  // Validate instructors exist
  if (instructors && instructors.length > 0) {
    const instructorIds = instructors.map(i => i.userId);
    const existingInstructors = await User.find({ 
      _id: { $in: instructorIds },
      role: { $in: ['instructor', 'admin'] }
    });
    
    if (existingInstructors.length !== instructorIds.length) {
      return sendErrorResponse(res, 'Some instructors do not exist or are not eligible', 400);
    }
  }

  // Create subject
  const subject = new Subject({
    name,
    code,
    description,
    credits,
    topics: topics || [],
    instructors: instructors || [],
    resources: resources || [],
    settings: settings || {},
    createdBy: req.user.id
  });

  await subject.save();

  sendSuccessResponse(res, 'Subject created successfully', { subject }, 201);
});

// Update subject
export const updateSubject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    name, code, description, credits, instructors, resources, settings, status
  } = req.body;

  const subject = await Subject.findById(id);
  if (!subject) {
    return sendNotFoundResponse(res, 'Subject');
  }

  // Check if subject code is being changed and already exists
  if (code && code !== subject.code) {
    const existingSubject = await Subject.findOne({ code });
    if (existingSubject) {
      return sendErrorResponse(res, 'Subject code already exists', 409);
    }
  }

  // Validate instructors if being updated
  if (instructors) {
    const instructorIds = instructors.map(i => i.userId);
    const existingInstructors = await User.find({ 
      _id: { $in: instructorIds },
      role: { $in: ['instructor', 'admin'] }
    });
    
    if (existingInstructors.length !== instructorIds.length) {
      return sendErrorResponse(res, 'Some instructors do not exist or are not eligible', 400);
    }
  }

  // Update fields
  if (name) subject.name = name;
  if (code) subject.code = code;
  if (description) subject.description = description;
  if (credits) subject.credits = credits;
  if (instructors) subject.instructors = instructors;
  if (resources) subject.resources = resources;
  if (settings) subject.settings = { ...subject.settings, ...settings };
  if (status) subject.status = status;

  subject.updatedAt = new Date();
  await subject.save();

  sendSuccessResponse(res, 'Subject updated successfully', { subject });
});

// Delete subject (soft delete)
export const deleteSubject = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const subject = await Subject.findById(id);
  if (!subject) {
    return sendNotFoundResponse(res, 'Subject');
  }

  // Check if subject has questions or exams
  const hasQuestions = await Question.exists({ subject: subject.name });
  const hasExams = await Exam.exists({ subject: subject.name });
  
  if (hasQuestions || hasExams) {
    return sendErrorResponse(res, 'Cannot delete subject with existing questions or exams', 400);
  }

  subject.status = 'deleted';
  subject.updatedAt = new Date();
  await subject.save();

  sendSuccessResponse(res, 'Subject deleted successfully');
});

// Get subject topics
export const getSubjectTopics = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const subject = await Subject.findById(id).select('name topics');
  if (!subject) {
    return sendNotFoundResponse(res, 'Subject');
  }

  sendSuccessResponse(res, 'Subject topics retrieved successfully', { 
    subject: subject.name,
    topics: subject.topics 
  });
});

// Add topic to subject
export const addTopic = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  
  const subject = await Subject.findById(id);
  if (!subject) {
    return sendNotFoundResponse(res, 'Subject');
  }

  // Check if topic already exists
  const existingTopic = subject.topics.find(topic => topic.name === name);
  if (existingTopic) {
    return sendErrorResponse(res, 'Topic already exists in this subject', 409);
  }

  const newTopic = await subject.addTopic(name, description);
  await subject.save();

  sendSuccessResponse(res, 'Topic added successfully', { topic: newTopic });
});

// Update topic
export const updateTopic = asyncHandler(async (req, res) => {
  const { id, topicId } = req.params;
  const { name, description } = req.body;
  
  const subject = await Subject.findById(id);
  if (!subject) {
    return sendNotFoundResponse(res, 'Subject');
  }

  const topic = subject.topics.id(topicId);
  if (!topic) {
    return sendNotFoundResponse(res, 'Topic');
  }

  // Check if new name conflicts with existing topics
  if (name && name !== topic.name) {
    const existingTopic = subject.topics.find(t => t.name === name && t._id.toString() !== topicId);
    if (existingTopic) {
      return sendErrorResponse(res, 'Topic name already exists in this subject', 409);
    }
  }

  if (name) topic.name = name;
  if (description) topic.description = description;
  topic.updatedAt = new Date();

  await subject.save();

  sendSuccessResponse(res, 'Topic updated successfully', { topic });
});

// Delete topic
export const deleteTopic = asyncHandler(async (req, res) => {
  const { id, topicId } = req.params;
  
  const subject = await Subject.findById(id);
  if (!subject) {
    return sendNotFoundResponse(res, 'Subject');
  }

  const topic = subject.topics.id(topicId);
  if (!topic) {
    return sendNotFoundResponse(res, 'Topic');
  }

  // Check if topic has questions
  const hasQuestions = await Question.exists({ 
    subject: subject.name, 
    topic: topic.name 
  });
  
  if (hasQuestions) {
    return sendErrorResponse(res, 'Cannot delete topic with existing questions', 400);
  }

  await subject.removeTopic(topicId);
  await subject.save();

  sendSuccessResponse(res, 'Topic deleted successfully');
});

// Reorder topics
export const reorderTopics = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { topicIds } = req.body;
  
  const subject = await Subject.findById(id);
  if (!subject) {
    return sendNotFoundResponse(res, 'Subject');
  }

  if (!Array.isArray(topicIds) || topicIds.length !== subject.topics.length) {
    return sendErrorResponse(res, 'Invalid topic order array', 400);
  }

  await subject.reorderTopics(topicIds);
  await subject.save();

  sendSuccessResponse(res, 'Topics reordered successfully', { 
    topics: subject.topics 
  });
});

// Get subject instructors
export const getSubjectInstructors = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const subject = await Subject.findById(id)
    .populate('instructors.userId', 'name email profile.avatar role')
    .select('name instructors');
    
  if (!subject) {
    return sendNotFoundResponse(res, 'Subject');
  }

  sendSuccessResponse(res, 'Subject instructors retrieved successfully', { 
    subject: subject.name,
    instructors: subject.instructors 
  });
});

// Add instructor to subject
export const addInstructor = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { userId, permissions } = req.body;
  
  const subject = await Subject.findById(id);
  if (!subject) {
    return sendNotFoundResponse(res, 'Subject');
  }

  // Validate instructor exists and has proper role
  const instructor = await User.findById(userId);
  if (!instructor || !['instructor', 'admin'].includes(instructor.role)) {
    return sendErrorResponse(res, 'User does not exist or is not eligible to be an instructor', 400);
  }

  // Check if instructor is already assigned
  const existingInstructor = subject.instructors.find(inst => inst.userId.toString() === userId);
  if (existingInstructor) {
    return sendErrorResponse(res, 'Instructor is already assigned to this subject', 409);
  }

  await subject.addInstructor(userId, permissions);
  await subject.save();

  sendSuccessResponse(res, 'Instructor added successfully');
});

// Update instructor permissions
export const updateInstructorPermissions = asyncHandler(async (req, res) => {
  const { id, instructorId } = req.params;
  const { permissions } = req.body;
  
  const subject = await Subject.findById(id);
  if (!subject) {
    return sendNotFoundResponse(res, 'Subject');
  }

  const instructor = subject.instructors.find(inst => inst.userId.toString() === instructorId);
  if (!instructor) {
    return sendErrorResponse(res, 'Instructor not found in this subject', 404);
  }

  instructor.permissions = permissions;
  instructor.assignedAt = new Date();

  await subject.save();

  sendSuccessResponse(res, 'Instructor permissions updated successfully', { 
    instructor 
  });
});

// Remove instructor from subject
export const removeInstructor = asyncHandler(async (req, res) => {
  const { id, instructorId } = req.params;
  
  const subject = await Subject.findById(id);
  if (!subject) {
    return sendNotFoundResponse(res, 'Subject');
  }

  await subject.removeInstructor(instructorId);
  await subject.save();

  sendSuccessResponse(res, 'Instructor removed successfully');
});

// Get subject statistics
export const getSubjectStats = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const stats = await Subject.getSubjectStats(id);
  if (!stats) {
    return sendNotFoundResponse(res, 'Subject');
  }

  sendSuccessResponse(res, 'Subject statistics retrieved successfully', { stats });
});

// Get all subject statistics (admin only)
export const getAllSubjectStats = asyncHandler(async (req, res) => {
  const stats = await Subject.aggregate([
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
        code: 1,
        credits: 1,
        status: 1,
        topicCount: { $size: '$topics' },
        instructorCount: { $size: '$instructors' },
        questionCount: { $size: '$questions' },
        examCount: { $size: '$exams' },
        publishedQuestions: {
          $size: {
            $filter: {
              input: '$questions',
              cond: { $eq: ['$$this.status', 'published'] }
            }
          }
        },
        activeExams: {
          $size: {
            $filter: {
              input: '$exams',
              cond: { $eq: ['$$this.status', 'active'] }
            }
          }
        }
      }
    },
    { $sort: { name: 1 } }
  ]);

  sendSuccessResponse(res, 'All subject statistics retrieved successfully', { stats });
});

// Search subjects
export const searchSubjects = asyncHandler(async (req, res) => {
  const { query } = req.query;
  
  if (!query || query.trim().length === 0) {
    return sendErrorResponse(res, 'Search query is required', 400);
  }

  const searchRegex = new RegExp(query, 'i');
  
  const subjects = await Subject.find({
    $or: [
      { name: { $regex: searchRegex } },
      { code: { $regex: searchRegex } },
      { description: { $regex: searchRegex } }
    ],
    status: { $ne: 'deleted' }
  })
  .populate('instructors.userId', 'name')
  .select('name code description credits topics instructors')
  .limit(20)
  .sort({ name: 1 });

  sendSuccessResponse(res, 'Search results retrieved successfully', { subjects });
});

// Get subjects by instructor
export const getSubjectsByInstructor = asyncHandler(async (req, res) => {
  const { instructorId } = req.params;
  
  const subjects = await Subject.find({
    'instructors.userId': instructorId,
    status: 'active'
  })
  .populate('instructors.userId', 'name email')
  .sort({ name: 1 });

  sendSuccessResponse(res, 'Instructor subjects retrieved successfully', { subjects });
});

// Get my subjects (for current instructor)
export const getMySubjects = asyncHandler(async (req, res) => {
  const subjects = await Subject.find({
    'instructors.userId': req.user.id,
    status: 'active'
  })
  .populate('instructors.userId', 'name email')
  .sort({ name: 1 });

  // Add permissions for each subject
  const subjectsWithPermissions = subjects.map(subject => {
    const instructor = subject.instructors.find(inst => inst.userId._id.toString() === req.user.id);
    return {
      ...subject.toObject(),
      myPermissions: instructor ? instructor.permissions : []
    };
  });

  sendSuccessResponse(res, 'My subjects retrieved successfully', { subjects: subjectsWithPermissions });
});

// Bulk update subjects
export const bulkUpdateSubjects = asyncHandler(async (req, res) => {
  const { subjectIds, updates } = req.body;

  if (!Array.isArray(subjectIds) || subjectIds.length === 0) {
    return sendErrorResponse(res, 'Subject IDs array is required', 400);
  }

  const allowedUpdates = ['status', 'credits'];
  const updateData = {};
  
  Object.keys(updates).forEach(key => {
    if (allowedUpdates.includes(key)) {
      updateData[key] = updates[key];
    }
  });

  if (Object.keys(updateData).length === 0) {
    return sendErrorResponse(res, 'No valid update fields provided', 400);
  }

  updateData.updatedAt = new Date();

  const result = await Subject.updateMany(
    { _id: { $in: subjectIds } },
    { $set: updateData }
  );

  sendSuccessResponse(res, 'Subjects updated successfully', {
    matchedCount: result.matchedCount,
    modifiedCount: result.modifiedCount
  });
});

export default {
  getAllSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject,
  getSubjectTopics,
  addTopic,
  updateTopic,
  deleteTopic,
  reorderTopics,
  getSubjectInstructors,
  addInstructor,
  updateInstructorPermissions,
  removeInstructor,
  getSubjectStats,
  getAllSubjectStats,
  searchSubjects,
  getSubjectsByInstructor,
  getMySubjects,
  bulkUpdateSubjects
};