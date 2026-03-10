/**
 * Module Exam Service
 * API calls for module-driven exams and student attempts
 */

import api from './api.js';

const BASE_URL = '/module-exams';

const moduleExamService = {
  // ============ EXAM MANAGEMENT (Instructor/Admin) ============

  /**
   * Get available modules for exam creation
   */
  getModules: async () => {
    const response = await api.get(`${BASE_URL}/modules`);
    return response.data;
  },

  /**
   * Check QDB sufficiency for a module and exam type
   */
  checkSufficiency: async (moduleId, examType) => {
    const response = await api.post(`${BASE_URL}/check-sufficiency`, { moduleId, examType });
    return response.data;
  },

  /**
   * Create a new module-driven exam
   */
  createExam: async (examData) => {
    const response = await api.post(BASE_URL, examData);
    return response.data;
  },

  /**
   * Get all module-driven exams
   */
  getExams: async (params = {}) => {
    const response = await api.get(BASE_URL, { params });
    return response.data;
  },

  /**
   * Get module exam by ID
   */
  getExamById: async (examId) => {
    const response = await api.get(`${BASE_URL}/${examId}`);
    return response.data;
  },

  /**
   * Assign candidates to an exam
   */
  assignCandidates: async (examId, candidateIds) => {
    const response = await api.post(`${BASE_URL}/${examId}/assign`, { candidateIds });
    return response.data;
  },

  /**
   * Get consolidated results for an exam
   */
  getConsolidatedResult: async (examId) => {
    const response = await api.get(`${BASE_URL}/${examId}/consolidated-result`);
    return response.data;
  },

  /**
   * Download consolidated results PDF
   */
  downloadConsolidatedPDF: async (examId) => {
    const response = await api.get(`${BASE_URL}/${examId}/consolidated-result.pdf`, {
      responseType: 'blob'
    });
    return response.data;
  },

  /**
   * End an exam
   */
  endExam: async (examId) => {
    const response = await api.post(`${BASE_URL}/${examId}/end`);
    return response.data;
  },

  /**
   * Get exam statistics
   */
  getExamStats: async (examId) => {
    const response = await api.get(`${BASE_URL}/${examId}/stats`);
    return response.data;
  },

  // ============ STUDENT ATTEMPT FUNCTIONS ============

  /**
   * Get assigned exams for current student
   */
  getMyExams: async () => {
    const response = await api.get(`${BASE_URL}/student/my-exams`);
    return response.data;
  },

  /**
   * Start an exam attempt
   */
  startAttempt: async (examId) => {
    const response = await api.post(`${BASE_URL}/attempt/${examId}/start`);
    return response.data;
  },

  /**
   * Save an answer
   */
  saveAnswer: async (attemptId, questionId, selectedOptionIndex, currentQuestionIndex) => {
    const response = await api.post(`${BASE_URL}/attempt/${attemptId}/answer`, {
      questionId,
      selectedOptionIndex,
      currentQuestionIndex
    });
    return response.data;
  },

  /**
   * Toggle flag for a question
   */
  toggleFlag: async (attemptId, questionId) => {
    const response = await api.post(`${BASE_URL}/attempt/${attemptId}/flag`, { questionId });
    return response.data;
  },

  /**
   * Send heartbeat ping
   */
  heartbeat: async (attemptId) => {
    const response = await api.post(`${BASE_URL}/attempt/${attemptId}/heartbeat`);
    return response.data;
  },

  /**
   * Get review data before submission
   */
  getReviewData: async (attemptId) => {
    const response = await api.get(`${BASE_URL}/attempt/${attemptId}/review`);
    return response.data;
  },

  /**
   * Submit exam
   */
  submitExam: async (attemptId) => {
    const response = await api.post(`${BASE_URL}/attempt/${attemptId}/submit`);
    return response.data;
  },

  /**
   * Get current attempt state
   */
  getAttemptState: async (attemptId) => {
    const response = await api.get(`${BASE_URL}/attempt/${attemptId}/state`);
    return response.data;
  },

  /**
   * Quit exam voluntarily
   */
  quitExam: async (attemptId) => {
    const response = await api.post(`${BASE_URL}/attempt/${attemptId}/quit`);
    return response.data;
  },

  // ============ RESULT FUNCTIONS ============

  /**
   * Get attempt result
   */
  getResult: async (attemptId) => {
    const response = await api.get(`${BASE_URL}/result/${attemptId}`);
    return response.data;
  },

  /**
   * Download result PDF
   */
  downloadResultPDF: async (attemptId) => {
    const response = await api.get(`${BASE_URL}/result/${attemptId}/pdf`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // ============ QPA (Question Paper Analysis) ============

  /**
   * Get Question Paper Analysis for an exam
   */
  getQPA: async (examId) => {
    const response = await api.get(`${BASE_URL}/${examId}/qpa`);
    return response.data;
  },

  /**
   * Download QPA PDF
   */
  downloadQPAPDF: async (examId) => {
    const response = await api.get(`${BASE_URL}/${examId}/qpa.pdf`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // ============ HELPER FUNCTIONS ============

  /**
   * Open PDF in new window
   */
  openPDF: (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  /**
   * Print PDF
   */
  printPDF: (blob) => {
    const url = window.URL.createObjectURL(blob);
    const printWindow = window.open(url, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  }
};

export default moduleExamService;
