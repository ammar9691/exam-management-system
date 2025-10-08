import api from './api';

const instructorService = {
  // Dashboard
  getDashboardStats: async () => {
    const response = await api.get('/instructor/dashboard/overview');
    return response.data;
  },

  // Exam Management
  getExams: async (params = {}) => {
    const response = await api.get('/instructor/exams', { params });
    return response.data;
  },

  getExam: async (examId) => {
    const response = await api.get(`/instructor/exams/${examId}`);
    return response.data;
  },

  createExam: async (examData) => {
    const response = await api.post('/instructor/exams', examData);
    return response.data;
  },

  updateExam: async (examId, examData) => {
    const response = await api.put(`/instructor/exams/${examId}`, examData);
    return response.data;
  },

  updateExamStatus: async (examId, status) => {
    const response = await api.patch(`/instructor/exams/${examId}/status`, { status });
    return response.data;
  },

  deleteExam: async (examId) => {
    const response = await api.delete(`/instructor/exams/${examId}`);
    return response.data;
  },

  // Exam Assignment and Monitoring
  assignExamToStudents: async (examId, studentIds) => {
    const response = await api.post(`/instructor/exams/${examId}/assign`, { studentIds });
    return response.data;
  },

  getExamResults: async (examId) => {
    const response = await api.get(`/instructor/exams/${examId}/results`);
    return response.data;
  },

  monitorLiveExam: async (examId) => {
    const response = await api.get(`/instructor/exams/${examId}/monitor`);
    return response.data;
  },

  // Question Management
  getQuestions: async (params = {}) => {
    const response = await api.get('/instructor/questions', { params });
    return response.data;
  },

  createQuestion: async (questionData) => {
    const response = await api.post('/instructor/questions', questionData);
    return response.data;
  },

  updateQuestion: async (questionId, questionData) => {
    const response = await api.put(`/instructor/questions/${questionId}`, questionData);
    return response.data;
  },

  deleteQuestion: async (questionId) => {
    const response = await api.delete(`/instructor/questions/${questionId}`);
    return response.data;
  },

  // Student Management
  getStudents: async () => {
    const response = await api.get('/instructor/students');
    return response.data;
  },

  // Bulk operations
  bulkUpdateExams: async (examIds, action, data = {}) => {
    const response = await api.put('/instructor/exams/bulk', { examIds, action, data });
    return response.data;
  },

  bulkUpdateQuestions: async (questionIds, action, data = {}) => {
    const response = await api.put('/instructor/questions/bulk', { questionIds, action, data });
    return response.data;
  },

  // Export functionality
  exportExamResults: async (examId, format = 'csv') => {
    const response = await api.get(`/instructor/exams/${examId}/export`, {
      params: { format },
      responseType: 'blob'
    });
    return response.data;
  },

  exportQuestions: async (params = {}) => {
    const response = await api.get('/instructor/questions/export', {
      params,
      responseType: 'blob'
    });
    return response.data;
  },

  // Analytics
  getExamAnalytics: async (examId, period = '30d') => {
    const response = await api.get(`/instructor/exams/${examId}/analytics`, {
      params: { period }
    });
    return response.data;
  },

  getStudentPerformance: async (studentId, examIds = []) => {
    const response = await api.get(`/instructor/students/${studentId}/performance`, {
      params: { examIds: examIds.join(',') }
    });
    return response.data;
  },

  // Notifications and Communication
  sendNotification: async (recipients, message, type = 'info') => {
    const response = await api.post('/instructor/notifications', {
      recipients,
      message,
      type
    });
    return response.data;
  },

  getNotifications: async () => {
    const response = await api.get('/instructor/notifications');
    return response.data;
  }
};

export default instructorService;