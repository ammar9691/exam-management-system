// Application constants
export const APP_NAME = process.env.REACT_APP_NAME || 'Exam Management System';
export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// User roles
export const USER_ROLES = {
  ADMIN: 'admin',
  INSTRUCTOR: 'instructor', 
  STUDENT: 'student'
};

// Exam status
export const EXAM_STATUS = {
  UPCOMING: 'upcoming',
  LIVE: 'live',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

// Question difficulty
export const DIFFICULTY_LEVELS = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard'
};

// Routes
export const ROUTES = {
  // Public routes
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  
  // Admin routes
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_USERS: '/admin/users',
  ADMIN_QUESTIONS: '/admin/questions',
  ADMIN_EXAMS: '/admin/exams',
  ADMIN_RESULTS: '/admin/results',
  
  // Student routes
  STUDENT_DASHBOARD: '/student/dashboard',
  STUDENT_EXAMS: '/student/exams',
  STUDENT_TAKE_EXAM: '/student/exam/:id',
  STUDENT_RESULTS: '/student/results',
  
  // Instructor routes
  INSTRUCTOR_DASHBOARD: '/instructor/dashboard',
  INSTRUCTOR_GRADING: '/instructor/grading'
};

// Local storage keys
export const STORAGE_KEYS = {
  TOKEN: 'exam_token',
  USER: 'exam_user',
  THEME: 'exam_theme'
};
