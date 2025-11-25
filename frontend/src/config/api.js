// API Configuration
// In production, use same domain (backend serves frontend)
// In development, use localhost
const getApiBaseUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    // In production, use same domain (backend serves frontend)
    return '';
  }
  // In development, use environment variable or localhost
  return process.env.REACT_APP_API_URL || 'http://localhost:5000';
};

const API_BASE_URL = getApiBaseUrl();

export default API_BASE_URL;

