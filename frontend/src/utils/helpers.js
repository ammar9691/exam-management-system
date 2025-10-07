// Format date
export const formatDate = (date) => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Format time
export const formatTime = (date) => {
  const d = new Date(date);
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Calculate percentage
export const calculatePercentage = (obtained, total) => {
  if (!total) return 0;
  return Math.round((obtained / total) * 100);
};

// Get user from local storage
export const getStoredUser = () => {
  const user = localStorage.getItem('exam_user');
  return user ? JSON.parse(user) : null;
};

// Get token from local storage
export const getStoredToken = () => {
  return localStorage.getItem('exam_token');
};

// Clear local storage
export const clearStorage = () => {
  localStorage.removeItem('exam_token');
  localStorage.removeItem('exam_user');
};

// Format duration (minutes to readable format)
export const formatDuration = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins} minutes`;
};

// Get initials from name
export const getInitials = (name) => {
  if (!name) return '';
  const parts = name.split(' ');
  return parts.map(part => part[0]).join('').toUpperCase();
};
