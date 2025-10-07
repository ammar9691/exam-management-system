import api from './api.js';

const studentService = {
  getStats: async () => {
    // Get user dashboard data for student stats
    return await api.get('/users/dashboard');
  },

  getUpcomingExams: async () => {
    // Get exams with active status
    return await api.get('/exams', { params: { status: 'active' } });
  },

  getRecentResults: async () => {
    // Get user's results
    return await api.get('/results/my');
  },

  getExamHistory: async () => {
    // Get exams history
    return await api.get('/exams/history');
  },

  getResultDetails: async (resultId) => {
    return await api.get(`/results/${resultId}`);
  },

  // Additional methods for exam functionality
  getExams: async () => {
    return await api.get('/exams');
  },

  getExamById: async (examId) => {
    return await api.get(`/exams/${examId}`);
  },

  startExam: async (examId) => {
    return await api.post(`/exams/${examId}/start`);
  },

  saveExamProgress: async (examId, progressData) => {
    return await api.post(`/exams/${examId}/progress`, progressData);
  },

  getExamProgress: async (examId) => {
    return await api.get(`/exams/${examId}/progress`);
  },

  submitExam: async (submissionData) => {
    return await api.post('/exams/submit', submissionData);
  },

  getResults: async (params = {}) => {
    return await api.get('/results', { params });
  },

  getDashboardStats: async () => {
    return await api.get('/users/dashboard');
  }
};

export default studentService;
