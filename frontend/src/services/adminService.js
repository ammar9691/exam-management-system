import api from './api.js';

const adminService = {
  // Dashboard and Statistics
  getDashboardStats: async () => {
    try {
      // Use the new admin dashboard overview endpoint
      const response = await api.get('/admin/dashboard/overview');
      return response;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Fallback to individual endpoints
      try {
        const [usersStatsResponse, questionsStatsResponse, examsStatsResponse, resultsStatsResponse] = await Promise.allSettled([
          api.get('/admin/users/stats'),
          api.get('/admin/questions/stats'),
          api.get('/admin/exams/stats'),
          api.get('/admin/results/stats')
        ]);

        const userStats = usersStatsResponse.status === 'fulfilled' 
          ? usersStatsResponse.value.data.stats 
          : { totalUsers: 0, activeUsers: 0, students: 0, instructors: 0, admins: 0 };

        const questionStats = questionsStatsResponse.status === 'fulfilled'
          ? questionsStatsResponse.value.data.stats
          : { totalQuestions: 0 };

        const examStats = examsStatsResponse.status === 'fulfilled'
          ? examsStatsResponse.value.data.stats
          : { totalExams: 0 };

        const resultStats = resultsStatsResponse.status === 'fulfilled'
          ? resultsStatsResponse.value.data.stats
          : { totalResults: 0 };

        return {
          data: {
            data: {
              stats: {
                ...userStats,
                totalQuestions: questionStats.totalQuestions || 0,
                totalExams: examStats.totalExams || 0,
                totalResults: resultStats.totalResults || 0
              }
            }
          }
        };
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        return {
          data: {
            data: {
              stats: {
                totalUsers: 0,
                totalQuestions: 0,
                totalExams: 0,
                totalResults: 0,
                activeUsers: 0,
                students: 0,
                instructors: 0,
                admins: 0
              }
            }
          }
        };
      }
    }
  },

  // Get detailed statistics
  getUserStats: async () => {
    return await api.get('/admin/users/stats');
  },

  getQuestionStats: async () => {
    return await api.get('/admin/questions/stats');
  },

  getExamStats: async () => {
    return await api.get('/admin/exams/stats');
  },

  getResultStats: async () => {
    return await api.get('/admin/results/stats');
  },

  getPerformanceAnalytics: async (params = {}) => {
    return await api.get('/admin/results/analytics/performance', { params });
  },

  // User Management (Enhanced)
  getUsers: async (params = {}) => {
    return await api.get('/admin/users', { params });
  },

  createUser: async (userData) => {
    return await api.post('/admin/users', userData);
  },

  updateUser: async (userId, userData) => {
    return await api.put(`/admin/users/${userId}`, userData);
  },

  deleteUser: async (userId) => {
    return await api.delete(`/admin/users/${userId}`);
  },

  bulkUpdateUsers: async (userIds, action, data = {}) => {
    return await api.put('/admin/users/bulk', { userIds, action, data });
  },

  resetUserPassword: async (userId, newPassword) => {
    return await api.post(`/admin/users/${userId}/reset-password`, { newPassword });
  },

  getUserActivity: async (userId) => {
    return await api.get(`/admin/users/${userId}/activity`);
  },

  exportUsers: async (params = {}) => {
    return await api.get('/admin/users/export', { 
      params,
      responseType: 'blob'
    });
  },

  // Question Management (Enhanced)
  getQuestions: async (params = {}) => {
    return await api.get('/admin/questions', { params });
  },

  createQuestion: async (questionData) => {
    return await api.post('/admin/questions', questionData);
  },

  updateQuestion: async (questionId, questionData) => {
    return await api.put(`/admin/questions/${questionId}`, questionData);
  },

  deleteQuestion: async (questionId) => {
    return await api.delete(`/admin/questions/${questionId}`);
  },

  bulkUpdateQuestions: async (questionIds, action, data = {}) => {
    return await api.put('/admin/questions/bulk', { questionIds, action, data });
  },

  duplicateQuestion: async (questionId) => {
    return await api.post(`/admin/questions/${questionId}/duplicate`);
  },

  getQuestionAnalytics: async (questionId) => {
    return await api.get(`/admin/questions/${questionId}/analytics`);
  },

  importQuestions: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return await api.post('/admin/questions/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },

  exportQuestions: async (params = {}) => {
    return await api.get('/admin/questions/export', {
      params,
      responseType: 'blob'
    });
  },

  // Exam Management (Enhanced)
  getExams: async (params = {}) => {
    return await api.get('/admin/exams', { params });
  },

  createExam: async (examData) => {
    return await api.post('/admin/exams', examData);
  },

  updateExam: async (examId, examData) => {
    return await api.put(`/admin/exams/${examId}`, examData);
  },

  deleteExam: async (examId) => {
    return await api.delete(`/admin/exams/${examId}`);
  },

  publishExam: async (examId) => {
    return await api.post(`/admin/exams/${examId}/publish`);
  },

  bulkUpdateExams: async (examIds, action, data = {}) => {
    return await api.put('/admin/exams/bulk', { examIds, action, data });
  },

  duplicateExam: async (examId) => {
    return await api.post(`/admin/exams/${examId}/duplicate`);
  },

  getExamAnalytics: async (examId) => {
    return await api.get(`/admin/exams/${examId}/analytics`);
  },

  exportExamResults: async (examId, params = {}) => {
    return await api.get(`/admin/exams/${examId}/export-results`, {
      params,
      responseType: 'blob'
    });
  },

  // Result Management (Enhanced)
  getResults: async (params = {}) => {
    return await api.get('/admin/results', { params });
  },

  getResult: async (resultId) => {
    return await api.get(`/admin/results/${resultId}`);
  },

  gradeResult: async (resultId, gradeData) => {
    return await api.post(`/admin/results/${resultId}/grade`, gradeData);
  },

  bulkUpdateResults: async (resultIds, action, data = {}) => {
    return await api.put('/admin/results/bulk', { resultIds, action, data });
  },

  deleteResult: async (resultId) => {
    return await api.delete(`/admin/results/${resultId}`);
  },

  exportResults: async (params = {}) => {
    return await api.get('/admin/results/export', {
      params,
      responseType: 'blob'
    });
  },

  getSubjects: async (params = {}) => {
    return await api.get('/subjects', { params });
  },

  createSubject: async (subjectData) => {
    return await api.post('/subjects', subjectData);
  },

  updateSubject: async (subjectId, subjectData) => {
    return await api.put(`/subjects/${subjectId}`, subjectData);
  },

  deleteSubject: async (subjectId) => {
    return await api.delete(`/subjects/${subjectId}`);
  },

  // Legacy method - keeping for backward compatibility
  exportExamResultsLegacy: async (examId) => {
    return await api.get(`/results/export/${examId}`, {
      responseType: 'blob'
    });
  }
};

export default adminService;
