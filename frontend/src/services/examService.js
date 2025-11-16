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

  // Fetch exam details for a student (without starting an attempt)
  getExamDetails: async (examId) => {
    const response = await api.get(`/student/exam/${examId}`);
    return response.data;
  },

  // Start a student exam attempt
  startExam: async (examId) => {
    const response = await api.post(`/student/exam/${examId}/start`);
    return response.data;
  },

  // Save progress for a single answer (wrapper over progress endpoint)
  submitAnswer: async (examId, questionId, answer) => {
    const response = await api.post(`/student/exam/${examId}/progress`, {
      answers: [
        {
          question: questionId,
          selectedOptions: Array.isArray(answer) ? answer : [answer]
        }
      ]
    });
    return response.data;
  },

  // Submit final answers for an exam attempt
  submitExam: async (examId, answers) => {
    const response = await api.post(`/student/exam/${examId}/submit`, { answers });
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
