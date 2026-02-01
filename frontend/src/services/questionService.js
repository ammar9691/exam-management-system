import api from './api.js';

const questionService = {
  // ============ CRUD ============

  getAllQuestions: async (params = {}) => {
    return await api.get('/questions', { params });
  },

  getQuestion: async (id) => {
    return await api.get(`/questions/${id}`);
  },

  createQuestion: async (questionData) => {
    return await api.post('/questions', questionData);
  },

  updateQuestion: async (id, questionData) => {
    return await api.put(`/questions/${id}`, questionData);
  },

  deleteQuestion: async (id) => {
    return await api.delete(`/questions/${id}`);
  },

  // ============ MODULES & CATEGORIES ============

  getModulesAndCategories: async () => {
    return await api.get('/questions/modules');
  },

  // ============ IMPORT/EXPORT ============

  downloadTemplate: async () => {
    return await api.get('/questions/template', {
      responseType: 'blob'
    });
  },

  importQuestions: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return await api.post('/questions/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },

  // ============ APPROVAL WORKFLOW ============

  getPendingQuestions: async () => {
    return await api.get('/questions/pending');
  },

  approveQuestion: async (id, comment = '') => {
    return await api.post(`/questions/${id}/approve`, { comment });
  },

  rejectQuestion: async (id, reason) => {
    return await api.post(`/questions/${id}/reject`, { reason });
  },

  bulkApprove: async (questionIds, comment = '') => {
    return await api.post('/questions/bulk-approve', { questionIds, comment });
  },

  bulkReject: async (questionIds, reason) => {
    return await api.post('/questions/bulk-reject', { questionIds, reason });
  },

  // ============ HISTORY ============

  getQuestionHistory: async (id) => {
    return await api.get(`/questions/${id}/history`);
  },

  // ============ STATISTICS ============

  getQuestionStats: async () => {
    return await api.get('/questions/stats');
  }
};

export default questionService;
