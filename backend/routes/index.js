/**
 * API Routes Index
 * Combines all route modules
 */

import express from 'express';
import authRoutes from './auth.js';
import userRoutes from './users.js';
import questionRoutes from './questions.js';
import examRoutes from './exams.js';
import subjectRoutes from './subjects.js';
import resultRoutes from './results.js';
import adminRoutes from './adminRoutes.js';
import studentRoutes from './studentRoutes.js';
import instructorRoutes from './instructorRoutes.js';
import { serveUploadedFile } from '../utils/upload.js';

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'success',
    message: 'API is running',
    timestamp: new Date().toISOString(),
    version: process.env.API_VERSION || '1.0.0'
  });
});

// API info endpoint
router.get('/', (req, res) => {
  res.json({
    name: 'Exam Management System API',
    version: process.env.API_VERSION || '1.0.0',
    description: 'RESTful API for exam management system',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users', 
      questions: '/api/questions',
      exams: '/api/exams',
      subjects: '/api/subjects',
      results: '/api/results',
      admin: '/api/admin',
      instructor: '/api/instructor',
      uploads: '/uploads'
    },
    documentation: '/api/docs' // TODO: Add API documentation
  });
});

// Mount route modules
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/questions', questionRoutes);
router.use('/exams', examRoutes);
router.use('/subjects', subjectRoutes);
router.use('/results', resultRoutes);
router.use('/admin', adminRoutes);
router.use('/student', studentRoutes);
router.use('/instructor', instructorRoutes);

// Serve uploaded files
router.get('/uploads/*', serveUploadedFile);

// 404 handler for API routes
router.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: `API endpoint ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

export default router;