/**
 * Main Configuration File
 * Centralizes all application configuration
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const config = {
  // Server Configuration
  server: {
    port: process.env.PORT || 5000,
    env: process.env.NODE_ENV || 'development'
  },

  // Database Configuration
  db: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/exam-management-system',
    name: process.env.DB_NAME || 'exam-management-system'
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production-2024',
    expiresIn: process.env.JWT_EXPIRE || '7d',
    cookieExpire: process.env.JWT_COOKIE_EXPIRE || 7
  },

  // CORS Configuration
  cors: {
    origins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://127.0.0.1:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    credentials: true
  },

  // Upload Configuration
  upload: {
    baseDir: process.env.UPLOAD_BASE_DIR || './uploads',
    limits: {
      image: 5 * 1024 * 1024,      // 5MB
      document: 10 * 1024 * 1024,  // 10MB
      excel: 25 * 1024 * 1024,     // 25MB
      avatar: 2 * 1024 * 1024,     // 2MB
      media: 50 * 1024 * 1024,     // 50MB
      generic: 100 * 1024 * 1024   // 100MB
    }
  },

  // Rate Limiting Configuration
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100 // requests per window
  },

  // Pagination Configuration
  pagination: {
    defaultLimit: 20,
    maxLimit: 100,
    defaultSort: '-createdAt'
  },

  // Email Configuration
  email: {
    from: process.env.EMAIL_FROM || 'noreply@exam-system.com',
    service: process.env.EMAIL_SERVICE || 'gmail',
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  },

  // Security Configuration
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
    maxLoginAttempts: 5,
    lockoutTime: 15 * 60 * 1000, // 15 minutes
    passwordResetExpire: 10 * 60 * 1000 // 10 minutes
  },

  // Exam Configuration
  exam: {
    maxQuestions: 200,
    defaultDuration: 60, // minutes
    maxDuration: 300,    // 5 hours
    autoSubmitBuffer: 60, // seconds
    maxAttempts: 3
  }
};

export default config;