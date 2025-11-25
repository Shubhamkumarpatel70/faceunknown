import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import API_BASE_URL from '../config/api';
import './ProfileCompletion.css';

const ProfileCompletion = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    gender: 'prefer-not-to-say',
    dateOfBirth: ''
  });

  useEffect(() => {
    fetchUserDetails();
  }, []);

  useEffect(() => {
    if (userDetails) {
      calculateCompletion();
      setFormData({
        name: userDetails.name || '',
        gender: userDetails.gender || 'prefer-not-to-say',
        dateOfBirth: userDetails.dateOfBirth ? new Date(userDetails.dateOfBirth).toISOString().split('T')[0] : ''
      });
    }
  }, [userDetails]);

  const fetchUserDetails = async () => {
    try {
      const response = await axios.get('API_BASE_URL/api/auth/me');
      setUserDetails(response.data.user);
    } catch (error) {
      console.error('Error fetching user details:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateCompletion = () => {
    if (!userDetails) return;
    
    let completed = 0;
    const total = 3; // name, gender, dateOfBirth

    if (userDetails.name && userDetails.name.trim() !== '') completed++;
    if (userDetails.gender && userDetails.gender !== 'prefer-not-to-say') completed++;
    if (userDetails.dateOfBirth) completed++;

    const percentage = Math.round((completed / total) * 100);
    setCompletionPercentage(percentage);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.patch('API_BASE_URL/api/auth/profile', formData);
      await fetchUserDetails();
      
      // Recalculate completion
      const userData = response.data.user;
      let completed = 0;
      const total = 3;
      if (userData.name && userData.name.trim() !== '') completed++;
      if (userData.gender && userData.gender !== 'prefer-not-to-say') completed++;
      if (userData.dateOfBirth) completed++;
      const newPercentage = Math.round((completed / total) * 100);
      setCompletionPercentage(newPercentage);
      
      if (newPercentage === 100) {
        // Small delay to show success message
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    }
  };

  const handleSkip = () => {
    if (completionPercentage >= 50) {
      navigate('/dashboard');
    } else {
      alert('Please complete at least 50% of your profile to continue.');
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  const isComplete = completionPercentage === 100;

  return (
    <div className="profile-completion-container">
      <div className="profile-completion-card">
        <h1 className="completion-title">Complete Your Profile</h1>
        
        <div className="completion-progress">
          <div className="progress-bar-container">
            <div 
              className="progress-bar" 
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
          <p className="completion-percentage">{completionPercentage}% Complete</p>
        </div>

        {isComplete ? (
          <div className="completion-success">
            <div className="success-icon">✓</div>
            <h2>Profile Complete!</h2>
            <p>Your profile is fully completed. You can now access all features.</p>
            <button onClick={() => navigate('/dashboard')} className="btn btn-primary btn-large">
              Go to Dashboard
            </button>
          </div>
        ) : (
          <>
            <p className="completion-description">
              Please complete your profile to access all features. Fill in the information below.
            </p>

            <form onSubmit={handleSubmit} className="completion-form">
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  name="name"
                  className="input"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                />
              </div>

              <div className="form-group">
                <label>Gender *</label>
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
                <label>Date of Birth *</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  className="input"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary btn-large">
                  Save & Continue
                </button>
                {completionPercentage >= 50 && (
                  <button type="button" onClick={handleSkip} className="btn btn-secondary">
                    Skip for Now
                  </button>
                )}
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ProfileCompletion;

