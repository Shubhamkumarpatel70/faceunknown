import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import API_BASE_URL from '../config/api';
import './Auth.css';

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
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">
          <h1 className="logo">FaceUnknown</h1>
        </div>
        <h2 className="auth-title">Create Account</h2>
        <p className="auth-subtitle">Join the community</p>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Username</label>
            <div className="username-input-wrapper">
              <input
                type="text"
                name="username"
                className={`input ${usernameAvailable === false ? 'input-error' : usernameAvailable === true ? 'input-success' : ''}`}
                value={formData.username}
                onChange={handleChange}
                required
                minLength={3}
                maxLength={20}
                placeholder="Choose a username"
              />
              {checkingUsername && (
                <span className="username-checking">Checking...</span>
              )}
              {usernameAvailable === true && !checkingUsername && (
                <span className="username-available">✓ Available</span>
              )}
              {usernameAvailable === false && !checkingUsername && (
                <span className="username-taken">✗ Taken</span>
              )}
            </div>
            {usernameError && (
              <div className="field-error">{usernameError}</div>
            )}
          </div>
          
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              name="name"
              className="input"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name (optional)"
            />
          </div>
          
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              className="input"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
            />
          </div>
          
          <div className="form-group">
            <label>Gender</label>
            <select
              name="gender"
              className="input"
              value={formData.gender}
              onChange={handleChange}
            >
              <option value="prefer-not-to-say">Prefer not to say</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Date of Birth</label>
            <input
              type="date"
              name="dateOfBirth"
              className="input"
              value={formData.dateOfBirth}
              onChange={handleChange}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
          
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              className="input"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
              placeholder="Create a password"
            />
          </div>
          
          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              className="input"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="Confirm your password"
            />
          </div>
          
          <button type="submit" className="btn btn-primary btn-block">
            Register
          </button>
        </form>
        
        <p className="auth-footer">
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;

