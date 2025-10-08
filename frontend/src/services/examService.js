import api from './api.js';

const examService = {
  // Admin endpoints
  createExam: async (examData) => {
    const response = await api.post('/admin/exams', examData);
    return response.data;
  },

  updateExam: async (examId, examData) => {
    const response = await api.put(`/admin/exams/${examId}`, examData);
    return response.data;
  },

  deleteExam: async (examId) => {
    const response = await api.delete(`/admin/exams/${examId}`);
    return response.data;
  },

  getAllExams: async (params = {}) => {
    const response = await api.get('/admin/exams', { params });
    return response.data;
  },

  // Student endpoints
  getAvailableExams: async () => {
    const response = await api.get('/student/exams');
    return response.data;
  },

  getExamDetails: async (examId) => {
    const response = await api.get(`/exam/${examId}`);
    return response.data;
  },

  startExam: async (examId) => {
    const response = await api.post(`/exam/${examId}/start`);
    return response.data;
  },

  submitAnswer: async (examId, questionId, answer) => {
    const response = await api.post(`/exam/${examId}/answer`, {
      questionId,
      answer
    });
    return response.data;
  },

  submitExam: async (examId, answers) => {
    const response = await api.post(`/exam/${examId}/submit`, { answers });
    return response.data;
  },

  // Additional methods for admin
  updateExamStatus: async (examId, status) => {
    const response = await api.patch(`/admin/exams/${examId}/status`, { status });
    return response.data;
  },

  publishResults: async (examId) => {
    const response = await api.post(`/admin/exams/${examId}/publish-results`);
    return response.data;
  }
};

export default examService;
