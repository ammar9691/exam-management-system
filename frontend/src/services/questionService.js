import api from './api.js';

const questionService = {
  getAllQuestions: async (params = {}) => {
    return await api.get('/admin/questions', { params });
  },

  getQuestion: async (id) => {
    return await api.get(`/admin/questions/${id}`);
  },

  createQuestion: async (questionData) => {
    return await api.post('/admin/questions', questionData);
  },

  updateQuestion: async (id, questionData) => {
    return await api.put(`/admin/questions/${id}`, questionData);
  },

  deleteQuestion: async (id) => {
    return await api.delete(`/admin/questions/${id}`);
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

  getQuestionsBySubject: async (subject) => {
    return await api.get(`/admin/questions/subject/${subject}`);
  },

  getSubjects: async () => {
    return await api.get('/admin/subjects');
  },

  bulkDelete: async (questionIds) => {
    return await api.post('/admin/questions/bulk-delete', { questionIds });
  },

  getQuestionStats: async () => {
    return await api.get('/admin/questions/stats');
  }
};

export default questionService;
