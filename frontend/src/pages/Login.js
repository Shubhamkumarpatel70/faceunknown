import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import API_BASE_URL from '../config/api';
import { FaSignInAlt, FaEnvelope, FaLock } from 'react-icons/fa';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
    }
  }, [location]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const calculateProfileCompletion = (user) => {
    let completed = 0;
    const total = 3; // name, gender, dateOfBirth

    if (user.name && user.name.trim() !== '') completed++;
    if (user.gender && user.gender !== 'prefer-not-to-say') completed++;
    if (user.dateOfBirth) completed;

    return Math.round((completed / total) * 100);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const url = API_BASE_URL ? `${API_BASE_URL}/api/auth/login` : '/api/auth/login';
      const response = await axios.post(url, formData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log('Login successful:', response.data);
      login(response.data.token, response.data.user);
      
      // Check profile completion - only redirect if incomplete and hasn't been shown before
      const completion = calculateProfileCompletion(response.data.user);
      const profileCompletionShown = localStorage.getItem(`profileCompletionShown_${response.data.user.id}`);
      
      if (completion < 100 && !profileCompletionShown) {
        // Mark that we're showing the profile completion page
        localStorage.setItem(`profileCompletionShown_${response.data.user.id}`, 'true');
        navigate('/profile-completion');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-secondary/30 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md bg-primary rounded-2xl shadow-2xl p-8 md:p-10 border border-text/10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-accent1 mb-2">FaceUnknown</h1>
          <h2 className="text-3xl font-bold text-text mt-6 mb-2">Welcome Back</h2>
          <p className="text-text/70">Login to start chatting</p>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="mb-6 p-4 bg-accent2/20 border border-accent2 text-accent2 rounded-lg">
            {successMessage}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-text font-semibold mb-2">
              <FaEnvelope className="inline mr-2" />Email
            </label>
            <input
              type="email"
              name="email"
              autoComplete="email"
              className="w-full px-4 py-3 border-2 border-text/30 rounded-lg bg-secondary/50 text-text focus:outline-none focus:border-accent1 focus:ring-2 focus:ring-accent1/20 transition-all"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
            />
          </div>
          
          <div>
            <label className="block text-text font-semibold mb-2">
              <FaLock className="inline mr-2" />Password
            </label>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              className="w-full px-4 py-3 border-2 border-text/30 rounded-lg bg-secondary/50 text-text focus:outline-none focus:border-accent1 focus:ring-2 focus:ring-accent1/20 transition-all"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
            />
          </div>
          
          <button 
            type="submit" 
            className="w-full px-6 py-4 bg-accent2 hover:bg-accent2/90 text-primary rounded-lg text-lg font-semibold transition-all duration-300 uppercase tracking-wide shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2"
          >
            <FaSignInAlt /> Login
          </button>
        </form>
        
        <div className="mt-4 text-center">
          <Link to="/forgot-password" className="text-accent1 hover:text-accent1/80 font-semibold text-sm">
            Forgot Password?
          </Link>
        </div>
        
        <p className="mt-6 text-center text-text/70">
          Don't have an account? <Link to="/register" className="text-accent1 hover:text-accent1/80 font-semibold">Register here</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
