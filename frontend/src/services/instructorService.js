import api from './api';

const instructorService = {
  // Dashboard
  getDashboardStats: async () => {
    const response = await api.get('/instructor/dashboard/overview');
    return response.data;
  },

  // Exam Management
  getExams: async (params = {}) => {
    return await api.get('/instructor/exams', { params });
  },

  getExam: async (examId) => {
    const response = await api.get(`/instructor/exams/${examId}`);
    return response.data;
  },

  createExam: async (examData) => {
    return await api.post('/instructor/exams', examData);
  },

  updateExam: async (examId, examData) => {
    return await api.put(`/instructor/exams/${examId}`, examData);
  },

  updateExamStatus: async (examId, status) => {
    return await api.patch(`/instructor/exams/${examId}/status`, { status });
  },

  deleteExam: async (examId) => {
    return await api.delete(`/instructor/exams/${examId}`);
  },

  // Exam Assignment and Monitoring
  assignExamToStudents: async (examId, studentIds) => {
    return await api.post(`/instructor/exams/${examId}/assign`, { studentIds });
  },

  publishExam: async (examId) => {
    return await api.post(`/instructor/exams/${examId}/publish`);
  },

  getExamResults: async (examId) => {
    return await api.get(`/instructor/exams/${examId}/results`);
  },

  monitorLiveExam: async (examId) => {
    return await api.get(`/instructor/exams/${examId}/monitor`);
  },

  // Question Management
  getQuestions: async (params = {}) => {
    return await api.get('/instructor/questions', { params });
  },

  createQuestion: async (questionData) => {
    return await api.post('/instructor/questions', questionData);
  },

  updateQuestion: async (questionId, questionData) => {
    return await api.put(`/instructor/questions/${questionId}`, questionData);
  },

  deleteQuestion: async (questionId) => {
    return await api.delete(`/instructor/questions/${questionId}`);
  },
  // Student Management
  getStudents: async () => {
    return await api.get('/instructor/students');
  },

  // Bulk operations
  bulkUpdateExams: async (examIds, action, data = {}) => {
    return await api.put('/instructor/exams/bulk', { examIds, action, data });
  },

  bulkUpdateQuestions: async (questionIds, action, data = {}) => {
    return await api.put('/instructor/questions/bulk', { questionIds, action, data });
  },

  // Export functionality
  exportExamResults: async (examId, format = 'csv') => {
    return await api.get(`/instructor/exams/${examId}/export`, {
      params: { format },
      responseType: 'blob'
    });
  },

  exportQuestions: async (params = {}) => {
    return await api.get('/instructor/questions/export', {
      params,
      responseType: 'blob'
    });
  },

  // Analytics
  getExamAnalytics: async (examId, period = '30d') => {
    return await api.get(`/instructor/exams/${examId}/analytics`, {
      params: { period }
    });
  },

  getStudentPerformance: async (studentId, examIds = []) => {
    return await api.get(`/instructor/students/${studentId}/performance`, {
      params: { examIds: examIds.join(',') }
    });
  },

  // Notifications and Communication
  sendNotification: async (recipients, message, type = 'info') => {
    return await api.post('/instructor/notifications', {
      recipients,
      message,
      type
    });
  },

  getNotifications: async () => {
    return await api.get('/instructor/notifications');
  },

  // Instructor grading endpoints
  getGradingQueue: async (params = {}) => {
    return await api.get('/instructor/grading/queue', { params });
  },

  getGradingStats: async () => {
    return await api.get('/instructor/grading/stats');
  },

  gradeResult: async (resultId, payload) => {
    return await api.post(`/instructor/grading/${resultId}`, payload);
  },

  updateGrading: async (resultId, payload) => {
    return await api.put(`/instructor/grading/${resultId}`, payload);
  },

  getGradingHistory: async (params = {}) => {
    return await api.get('/instructor/grading/history', { params });
  },

  bulkGradeResults: async (grades) => {
    return await api.post('/instructor/grading/bulk', { grades });
  },

  // Available subjects for instructor exam creation
  getAvailableSubjects: async () => {
    return await api.get('/instructor/exams/available-subjects');
  }
};

export default instructorService;