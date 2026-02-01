import api from './api';

const examManagerService = {
  getDashboard: () => api.get('/exam-manager/dashboard'),
};

export default examManagerService;
