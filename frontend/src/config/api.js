// API Configuration
// In production, use same domain (backend serves frontend)
// In development, use localhost
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '' // Same domain - backend serves frontend
  : (process.env.REACT_APP_API_URL || 'http://localhost:5000');

export default API_BASE_URL;

