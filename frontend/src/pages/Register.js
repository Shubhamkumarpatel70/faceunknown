import React, { useState, useContext, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import API_BASE_URL from '../config/api';
import { FaUserPlus, FaUser, FaEnvelope, FaLock, FaVenusMars, FaCalendarAlt, FaCheckCircle, FaTimesCircle, FaSpinner } from 'react-icons/fa';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    email: '',
    gender: 'prefer-not-to-say',
    dateOfBirth: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const usernameCheckTimeoutRef = useRef(null);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (usernameCheckTimeoutRef.current) {
        clearTimeout(usernameCheckTimeoutRef.current);
      }
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Check username availability in real-time
    if (name === 'username' && value.length >= 3) {
      // Clear previous timeout
      if (usernameCheckTimeoutRef.current) {
        clearTimeout(usernameCheckTimeoutRef.current);
      }
      
      // Set loading state
      setCheckingUsername(true);
      setUsernameError('');
      setUsernameAvailable(null);
      
      // Debounce: wait 500ms after user stops typing
      usernameCheckTimeoutRef.current = setTimeout(async () => {
        try {
          const url = API_BASE_URL ? `${API_BASE_URL}/api/users/check-username` : '/api/users/check-username';
          const response = await axios.post(url, { username: value }, {
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          if (response.data.available) {
            setUsernameAvailable(true);
            setUsernameError('');
          } else {
            setUsernameAvailable(false);
            setUsernameError('Username is already taken');
          }
        } catch (err) {
          // If error, assume username might be available (don't block user)
          console.error('Username check error:', err);
          setUsernameAvailable(null);
        } finally {
          setCheckingUsername(false);
        }
      }, 500);
    } else if (name === 'username' && value.length > 0 && value.length < 3) {
      setUsernameError('Username must be at least 3 characters');
      setUsernameAvailable(false);
    } else if (name === 'username' && value.length === 0) {
      setUsernameError('');
      setUsernameAvailable(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      const { confirmPassword, ...registerData } = formData;
      const url = API_BASE_URL ? `${API_BASE_URL}/api/auth/register` : '/api/auth/register';
      const response = await axios.post(url, registerData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log('Registration successful:', response.data);
      // Redirect to login after successful registration
      navigate('/login', { state: { message: 'Registration successful! Please login.' } });
    } catch (err) {
      console.error('Registration error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Registration failed';
      setError(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-secondary/30 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-2xl bg-primary rounded-2xl shadow-2xl p-8 md:p-10 border border-text/10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-accent1 mb-2">FaceUnknown</h1>
          <h2 className="text-3xl font-bold text-text mt-6 mb-2">Create Account</h2>
          <p className="text-text/70">Join the community</p>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-text font-semibold mb-2">
                <FaUser className="inline mr-2" />Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="username"
                  autoComplete="username"
                  className={`w-full px-4 py-3 border-2 rounded-lg bg-secondary/50 text-text focus:outline-none focus:ring-2 transition-all ${
                    usernameAvailable === false 
                      ? 'border-red-400 focus:border-red-500 focus:ring-red-200' 
                      : usernameAvailable === true 
                      ? 'border-accent2 focus:border-accent2 focus:ring-accent2/20' 
                      : 'border-text/30 focus:border-accent1 focus:ring-accent1/20'
                  }`}
                  value={formData.username}
                  onChange={handleChange}
                  required
                  minLength={3}
                  maxLength={20}
                  placeholder="Choose a username"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {checkingUsername && (
                    <FaSpinner className="animate-spin text-accent1" />
                  )}
                  {usernameAvailable === true && !checkingUsername && (
                    <FaCheckCircle className="text-accent2" />
                  )}
                  {usernameAvailable === false && !checkingUsername && (
                    <FaTimesCircle className="text-red-500" />
                  )}
                </div>
              </div>
              {usernameError && (
                <div className="mt-1 text-sm text-red-600">{usernameError}</div>
              )}
            </div>
            
            <div>
              <label className="block text-text font-semibold mb-2">
                <FaUser className="inline mr-2" />Name
              </label>
              <input
                type="text"
                name="name"
                autoComplete="name"
                className="w-full px-4 py-3 border-2 border-text/30 rounded-lg bg-secondary/50 text-text focus:outline-none focus:border-accent1 focus:ring-2 focus:ring-accent1/20 transition-all"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name (optional)"
              />
            </div>
          </div>
          
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-text font-semibold mb-2">
                <FaVenusMars className="inline mr-2" />Gender
              </label>
              <select
                name="gender"
                autoComplete="sex"
                className="w-full px-4 py-3 border-2 border-text/30 rounded-lg bg-secondary/50 text-text focus:outline-none focus:border-accent1 focus:ring-2 focus:ring-accent1/20 transition-all"
                value={formData.gender}
                onChange={handleChange}
              >
                <option value="prefer-not-to-say">Prefer not to say</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div>
              <label className="block text-text font-semibold mb-2">
                <FaCalendarAlt className="inline mr-2" />Date of Birth
              </label>
              <input
                type="date"
                name="dateOfBirth"
                autoComplete="bday"
                className="w-full px-4 py-3 border-2 border-text/30 rounded-lg bg-secondary/50 text-text focus:outline-none focus:border-accent1 focus:ring-2 focus:ring-accent1/20 transition-all"
                value={formData.dateOfBirth}
                onChange={handleChange}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-text font-semibold mb-2">
                <FaLock className="inline mr-2" />Password
              </label>
              <input
                type="password"
                name="password"
                autoComplete="new-password"
                className="w-full px-4 py-3 border-2 border-text/30 rounded-lg bg-secondary/50 text-text focus:outline-none focus:border-accent1 focus:ring-2 focus:ring-accent1/20 transition-all"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                placeholder="Create a password"
              />
            </div>
            
            <div>
              <label className="block text-text font-semibold mb-2">
                <FaLock className="inline mr-2" />Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                autoComplete="new-password"
                className="w-full px-4 py-3 border-2 border-text/30 rounded-lg bg-secondary/50 text-text focus:outline-none focus:border-accent1 focus:ring-2 focus:ring-accent1/20 transition-all"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="Confirm your password"
              />
            </div>
          </div>
          
          <button 
            type="submit" 
            className="w-full px-6 py-4 bg-accent1 hover:bg-accent1/90 text-primary rounded-lg text-lg font-semibold transition-all duration-300 uppercase tracking-wide shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2"
          >
            <FaUserPlus /> Register
          </button>
        </form>
        
        <p className="mt-6 text-center text-text/70">
          Already have an account? <Link to="/login" className="text-accent1 hover:text-accent1/80 font-semibold">Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
