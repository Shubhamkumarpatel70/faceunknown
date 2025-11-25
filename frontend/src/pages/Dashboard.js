import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import ManageUsers from '../components/ManageUsers';
import Statistics from '../components/Statistics';
import RestrictedWords from '../components/RestrictedWords';
import ReportedUsers from '../components/ReportedUsers';
import ReportsRemovalRequest from '../components/ReportsRemovalRequest';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [onlineCount, setOnlineCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [userDetails, setUserDetails] = useState(null);
  const [isRestricted, setIsRestricted] = useState(false);
  const [restrictionTime, setRestrictionTime] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({ name: '', gender: 'prefer-not-to-say', dateOfBirth: '' });
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');
  const isAdmin = user?.role === 'admin' || user?.role === 'co-admin';

  useEffect(() => {
    checkProfileCompletion();
    fetchOnlineCount();
    fetchUserDetails();
    const interval = setInterval(fetchOnlineCount, 5000);
    return () => clearInterval(interval);
  }, []);

  const checkProfileCompletion = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/auth/me');
      const userData = response.data.user;
      
      let completed = 0;
      const total = 3; // name, gender, dateOfBirth

      if (userData.name && userData.name.trim() !== '') completed++;
      if (userData.gender && userData.gender !== 'prefer-not-to-say') completed++;
      if (userData.dateOfBirth) completed++;

      const percentage = Math.round((completed / total) * 100);
      
      if (percentage < 100) {
        navigate('/profile-completion');
      }
    } catch (error) {
      console.error('Error checking profile completion:', error);
    }
  };

  const fetchOnlineCount = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/users/online');
      setOnlineCount(response.data.count);
    } catch (error) {
      console.error('Error fetching online count:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetails = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/auth/me');
      setUserDetails(response.data.user);
      setEditFormData({
        name: response.data.user.name || '',
        gender: response.data.user.gender || 'prefer-not-to-say',
        dateOfBirth: response.data.user.dateOfBirth ? new Date(response.data.user.dateOfBirth).toISOString().split('T')[0] : ''
      });
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditError('');
    setEditSuccess('');
  };

  const handleEditChange = (e) => {
    setEditFormData({
      ...editFormData,
      [e.target.name]: e.target.value
    });
  };

  const handleSave = async () => {
    setEditError('');
    setEditSuccess('');
    try {
      const response = await axios.patch('http://localhost:5000/api/auth/profile', editFormData);
      setUserDetails(response.data.user);
      setIsEditing(false);
      setEditSuccess('Profile updated successfully!');
      setTimeout(() => setEditSuccess(''), 3000);
    } catch (error) {
      setEditError(error.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleReset = () => {
    setEditFormData({
      name: userDetails?.name || '',
      gender: userDetails?.gender || 'prefer-not-to-say',
      dateOfBirth: userDetails?.dateOfBirth ? new Date(userDetails.dateOfBirth).toISOString().split('T')[0] : ''
    });
    setIsEditing(false);
    setEditError('');
    setEditSuccess('');
  };

  const handleStartChat = () => {
    if (isRestricted && restrictionTime > 0) {
      alert(`You are restricted from starting a chat for ${restrictionTime} more seconds.`);
      return;
    }
    navigate('/chat');
  };

  // Check restriction status on mount
  useEffect(() => {
    const checkRestriction = () => {
      const restrictionData = localStorage.getItem('userRestriction');
      if (restrictionData) {
        const { restrictedUntil } = JSON.parse(restrictionData);
        const now = Date.now();
        if (restrictedUntil > now) {
          const remaining = Math.ceil((restrictedUntil - now) / 1000);
          setIsRestricted(true);
          setRestrictionTime(remaining);
          
          // Update countdown
          const interval = setInterval(() => {
            const newRemaining = Math.ceil((restrictedUntil - Date.now()) / 1000);
            if (newRemaining > 0) {
              setRestrictionTime(newRemaining);
            } else {
              setIsRestricted(false);
              setRestrictionTime(0);
              localStorage.removeItem('userRestriction');
              clearInterval(interval);
            }
          }, 1000);
          
          return () => clearInterval(interval);
        } else {
          localStorage.removeItem('userRestriction');
        }
      }
    };
    
    checkRestriction();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };


  const getGenderDisplay = (gender) => {
    const genderMap = {
      'male': 'Male',
      'female': 'Female',
      'other': 'Other',
      'prefer-not-to-say': 'Prefer not to say'
    };
    return genderMap[gender] || gender;
  };

  const formatDate = (date) => {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-main">
        <div className="dashboard-header">
          <div className="dashboard-info">
            <div className="header-brand-section">
              <h1 className="logo">FaceUnknown</h1>
              <h2>Welcome, {user?.username}!</h2>
            </div>
            <p className="user-role">Role: <span className={`role-badge role-${user?.role}`}>{user?.role}</span></p>
          </div>
          <button onClick={handleLogout} className="btn btn-danger">
            Logout
          </button>
        </div>

        <div className="dashboard-tabs">
          <button
            className={`dashboard-tab ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => setActiveTab('home')}
          >
            🏠 Home
          </button>
          {!isAdmin && (
            <button
              className={`dashboard-tab ${activeTab === 'account' ? 'active' : ''}`}
              onClick={() => setActiveTab('account')}
            >
              👤 My Account
            </button>
          )}
          {isAdmin && (
            <>
              <button
                className={`dashboard-tab ${activeTab === 'manage-users' ? 'active' : ''}`}
                onClick={() => setActiveTab('manage-users')}
              >
                👥 Manage Users
              </button>
              <button
                className={`dashboard-tab ${activeTab === 'statistics' ? 'active' : ''}`}
                onClick={() => setActiveTab('statistics')}
              >
                📊 Statistics
              </button>
              <button
                className={`dashboard-tab ${activeTab === 'restricted-words' ? 'active' : ''}`}
                onClick={() => setActiveTab('restricted-words')}
              >
                🚫 Restricted Words
              </button>
              <button
                className={`dashboard-tab ${activeTab === 'reported-users' ? 'active' : ''}`}
                onClick={() => setActiveTab('reported-users')}
              >
                ⚠️ Reported Users
              </button>
              <button
                className={`dashboard-tab ${activeTab === 'removal-requests' ? 'active' : ''}`}
                onClick={() => setActiveTab('removal-requests')}
              >
                📋 Removal Requests
              </button>
            </>
          )}
        </div>

        <div className="dashboard-content">
          {activeTab === 'home' && (
            <>
              <div className="stats-card">
                <div className="stat-item">
                  <div className="stat-value">{loading ? '...' : onlineCount}</div>
                  <div className="stat-label">Users Online</div>
                </div>
              </div>

              <div className="main-card">
                <h2>Start Video Chat</h2>
                <p className="card-description">
                  Connect with random users from around the world. Click the button below to start your video chat experience.
                </p>
                
                <div className="features-list">
                  <div className="feature-item">
                    <span className="feature-icon">🎥</span>
                    <span>HD Video Chat</span>
                  </div>
                  <div className="feature-item">
                    <span className="feature-icon">⏭️</span>
                    <span>Skip Anytime</span>
                  </div>
                  <div className="feature-item">
                    <span className="feature-icon">🔒</span>
                    <span>Secure & Private</span>
                  </div>
                </div>

                <button 
                  onClick={handleStartChat} 
                  className="btn btn-action btn-large"
                  disabled={isRestricted && restrictionTime > 0}
                >
                  {isRestricted && restrictionTime > 0 
                    ? `Restricted (${restrictionTime}s)` 
                    : 'Start Chatting'}
                </button>
                {isRestricted && restrictionTime > 0 && (
                  <p style={{ marginTop: '10px', color: '#ef4444', fontSize: '14px' }}>
                    You are restricted from starting a chat for {restrictionTime} more seconds.
                  </p>
                )}
              </div>
            </>
          )}

          {activeTab === 'account' && (
            <div className="account-card">
              <div className="account-header">
                <h2>My Account</h2>
                {!isEditing ? (
                  <button onClick={handleEdit} className="btn btn-primary btn-edit">
                    ✏️ Edit
                  </button>
                ) : (
                  <div className="edit-actions">
                    <button onClick={handleSave} className="btn btn-primary btn-save">
                      💾 Save
                    </button>
                    <button onClick={handleReset} className="btn btn-secondary btn-reset">
                      ↺ Reset
                    </button>
                  </div>
                )}
              </div>
              {editError && <div className="error-message">{editError}</div>}
              {editSuccess && <div className="success-message">{editSuccess}</div>}
              <div className="account-details">
                <div className="detail-item">
                  <label>Username</label>
                  <div className="detail-value">{userDetails?.username || user?.username || 'N/A'}</div>
                </div>
                
                <div className="detail-item">
                  <label>Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="name"
                      value={editFormData.name}
                      onChange={handleEditChange}
                      className="input edit-input"
                      placeholder="Enter your name"
                    />
                  ) : (
                    <div className="detail-value">{userDetails?.name || user?.name || 'Not set'}</div>
                  )}
                </div>
                
                <div className="detail-item">
                  <label>Email</label>
                  <div className="detail-value">{userDetails?.email || user?.email || 'N/A'}</div>
                </div>
                
                <div className="detail-item">
                  <label>Gender</label>
                  {isEditing ? (
                    <select
                      name="gender"
                      value={editFormData.gender}
                      onChange={handleEditChange}
                      className="input edit-input"
                    >
                      <option value="prefer-not-to-say">Prefer not to say</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  ) : (
                    <div className="detail-value">
                      {userDetails?.gender ? getGenderDisplay(userDetails.gender) : (user?.gender ? getGenderDisplay(user.gender) : 'Not set')}
                    </div>
                  )}
                </div>

                <div className="detail-item">
                  <label>Date of Birth</label>
                  {isEditing ? (
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={editFormData.dateOfBirth}
                      onChange={handleEditChange}
                      className="input edit-input"
                      max={new Date().toISOString().split('T')[0]}
                    />
                  ) : (
                    <div className="detail-value">
                      {userDetails?.dateOfBirth ? formatDate(userDetails.dateOfBirth) : (user?.dateOfBirth ? formatDate(user.dateOfBirth) : 'Not set')}
                    </div>
                  )}
                </div>

                <div className="detail-item">
                  <label>Account Created</label>
                  <div className="detail-value">
                    {userDetails?.createdAt ? formatDate(userDetails.createdAt) : (user?.createdAt ? formatDate(user.createdAt) : 'N/A')}
                  </div>
                </div>
                
                <div className="detail-item">
                  <label>Password</label>
                  <div className="detail-value password-masked">••••••••</div>
                </div>
                
                <div className="detail-item">
                  <label>Role</label>
                  <div className="detail-value">
                    <span className={`role-badge role-${userDetails?.role || user?.role}`}>
                      {userDetails?.role || user?.role || 'user'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'manage-users' && isAdmin && (
            <ManageUsers />
          )}

          {activeTab === 'statistics' && isAdmin && (
            <Statistics />
          )}

          {activeTab === 'restricted-words' && isAdmin && (
            <RestrictedWords />
          )}

          {activeTab === 'reported-users' && isAdmin && (
            <ReportedUsers />
          )}

          {activeTab === 'removal-requests' && isAdmin && (
            <ReportsRemovalRequest />
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
