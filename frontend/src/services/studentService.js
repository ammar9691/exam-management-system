import api from './api.js';

const studentService = {
  // Dashboard stats for the logged-in student
  getStats: async () => {
    const res = await api.get('/student/dashboard');
    // Backend uses sendSuccessResponse({ data: stats })
    return res.data?.data || res.data || {};
  },

  // Upcoming exams the student is eligible for
  getUpcomingExams: async () => {
    const res = await api.get('/student/exams/upcoming');
    return res.data?.data || res.data || [];
  },

  // Recent results for the student (simplified shape)
  getRecentResults: async () => {
    const res = await api.get('/student/results/my');
    return res.data?.data || res.data || [];
  },

  // Exam history (paginated) – returns { data, pagination, ... }
  getExamHistory: async (params = {}) => {
    const res = await api.get('/student/exams/history', { params });
    return res.data || {};
  },

  // Detailed result for a specific attempt
  getResultDetails: async (resultId) => {
    const res = await api.get(`/student/results/${resultId}`);
    return res.data?.data || res.data || {};
  },

  // Exams currently available for the student to take
  getExams: async () => {
    const res = await api.get('/student/exams');
    return res.data?.data || res.data || [];
  },

  // All results for the student (currently using the student-specific recent results)
  // If you later need full pagination, switch this to /results/my and handle pagination.
  getResults: async (params = {}) => {
    const res = await api.get('/student/results/my', { params });
    return res.data?.data || res.data || [];
  }
};

export default studentService;
