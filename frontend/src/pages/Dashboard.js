import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import API_BASE_URL from '../config/api';
import ManageUsers from '../components/ManageUsers';
import Statistics from '../components/Statistics';
import RestrictedWords from '../components/RestrictedWords';
import ReportedUsers from '../components/ReportedUsers';
import ReportsRemovalRequest from '../components/ReportsRemovalRequest';
import { 
  FaHome, FaUser, FaUsers, FaChartBar, FaBan, FaExclamationTriangle, 
  FaClipboardList, FaSignOutAlt, FaVideo, FaForward, FaLock, FaEdit, 
  FaSave, FaUndo, FaEnvelope, FaVenusMars, FaCalendarAlt, FaShieldAlt,
  FaUserCircle, FaClock, FaGlobe, FaCheckCircle, FaTimesCircle, FaShareAlt
} from 'react-icons/fa';

const Dashboard = () => {
  const { user, logout, updateUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [onlineCount, setOnlineCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [userDetails, setUserDetails] = useState(null);
  const [isRestricted, setIsRestricted] = useState(false);
  const [restrictionTime, setRestrictionTime] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({ username: '', name: '', gender: 'prefer-not-to-say', dateOfBirth: '', country: '' });
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [usernameError, setUsernameError] = useState('');
  const usernameCheckTimeoutRef = useRef(null);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');
  const [shareSuccess, setShareSuccess] = useState('');
  const isAdmin = user?.role === 'admin' || user?.role === 'co-admin';

  useEffect(() => {
    // Skip profile check if we just came from profile completion
    const skipCheck = location.state?.skipProfileCheck;
    if (!skipCheck) {
      checkProfileCompletion();
    }
    fetchOnlineCount();
    fetchUserDetails();
    const interval = setInterval(fetchOnlineCount, 5000);
    return () => {
      clearInterval(interval);
      if (usernameCheckTimeoutRef.current) {
        clearTimeout(usernameCheckTimeoutRef.current);
      }
    };
  }, []);

  const checkProfileCompletion = async () => {
    try {
      // First check user from context (might be more up-to-date)
      let userData = user;
      
      // If context user doesn't have the data, fetch from API
      if (!userData || (!userData.name && !userData.gender && !userData.dateOfBirth)) {
        const response = await axios.get(`${API_BASE_URL}/api/auth/me`);
        userData = response.data.user;
      }
      
      let completed = 0;
      const total = 4; // name, gender, dateOfBirth, country

      if (userData?.name && userData.name.trim() !== '') completed++;
      if (userData?.gender && userData.gender !== 'prefer-not-to-say') completed++;
      if (userData?.dateOfBirth) completed++;
      if (userData?.country && userData.country.trim() !== '') completed++;

      const percentage = Math.round((completed / total) * 100);
      
      // Only redirect if profile is incomplete, we didn't just come from profile completion,
      // and the user hasn't been shown the profile completion page before
      const profileCompletionShown = localStorage.getItem(`profileCompletionShown_${userData?.id}`);
      
      if (percentage < 100 && !location.state?.skipProfileCheck && !profileCompletionShown) {
        // Mark that we're showing the profile completion page
        localStorage.setItem(`profileCompletionShown_${userData?.id}`, 'true');
        navigate('/profile-completion');
      }
    } catch (error) {
      console.error('Error checking profile completion:', error);
    }
  };

  const fetchOnlineCount = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/users/online`);
      setOnlineCount(response.data.count);
    } catch (error) {
      console.error('Error fetching online count:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetails = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/auth/me`);
      setUserDetails(response.data.user);
      setEditFormData({
        username: response.data.user.username || '',
        name: response.data.user.name || '',
        gender: response.data.user.gender || 'prefer-not-to-say',
        dateOfBirth: response.data.user.dateOfBirth ? new Date(response.data.user.dateOfBirth).toISOString().split('T')[0] : '',
        country: response.data.user.country || ''
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
    const { name, value } = e.target;
    setEditFormData({
      ...editFormData,
      [name]: value
    });
    
    // Check username availability in real-time
    if (name === 'username' && value.length >= 3) {
      // Clear previous timeout
      if (usernameCheckTimeoutRef.current) {
        clearTimeout(usernameCheckTimeoutRef.current);
      }
      
      // Don't check if it's the same as current username
      if (value === (userDetails?.username || user?.username)) {
        setUsernameAvailable(null);
        setUsernameError('');
        setCheckingUsername(false);
        return;
      }
      
      // Set loading state
      setCheckingUsername(true);
      setUsernameError('');
      setUsernameAvailable(null);
      
      // Debounce: wait 500ms after user stops typing
      usernameCheckTimeoutRef.current = setTimeout(async () => {
        try {
          const response = await axios.post(`${API_BASE_URL}/api/users/check-username`, { username: value }, {
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

  const handleSave = async () => {
    setEditError('');
    setEditSuccess('');
    
    // Validate username if changed
    if (editFormData.username !== (userDetails?.username || user?.username)) {
      if (editFormData.username.length < 3) {
        setEditError('Username must be at least 3 characters');
        return;
      }
      if (usernameAvailable === false) {
        setEditError('Username is already taken. Please choose another one.');
        return;
      }
      if (checkingUsername || usernameAvailable === null) {
        setEditError('Please wait for username validation to complete.');
        return;
      }
    }
    
    try {
      const response = await axios.patch(`${API_BASE_URL}/api/auth/profile`, editFormData);
      setUserDetails(response.data.user);
      setIsEditing(false);
      setEditSuccess('Profile updated successfully!');
      setTimeout(() => setEditSuccess(''), 3000);
      // Update context if username changed
      if (response.data.user.username !== user?.username && updateUser) {
        updateUser({
          ...user,
          username: response.data.user.username
        });
      }
    } catch (error) {
      setEditError(error.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleReset = () => {
    setEditFormData({
      username: userDetails?.username || user?.username || '',
      name: userDetails?.name || '',
      gender: userDetails?.gender || 'prefer-not-to-say',
      dateOfBirth: userDetails?.dateOfBirth ? new Date(userDetails.dateOfBirth).toISOString().split('T')[0] : '',
      country: userDetails?.country || ''
    });
    setIsEditing(false);
    setEditError('');
    setEditSuccess('');
    setUsernameError('');
    setUsernameAvailable(null);
    setCheckingUsername(false);
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

  const handleShare = async () => {
    const shareUrl = window.location.origin;
    const shareText = `India's based video webapp enjoy design and develop by Shubham Kumar\n\n${shareUrl}`;
    const shareData = {
      title: 'FaceUnknown - Video Chat',
      text: `India's based video webapp enjoy design and develop by Shubham Kumar`,
      url: shareUrl
    };

    try {
      // Check if Web Share API is supported
      if (navigator.share) {
        if (navigator.canShare && navigator.canShare(shareData)) {
          await navigator.share(shareData);
          setShareSuccess('Shared successfully!');
        } else {
          // Fallback: Copy to clipboard with text and URL
          await navigator.clipboard.writeText(shareText);
          setShareSuccess('Link copied to clipboard!');
        }
      } else {
        // Fallback: Copy to clipboard with text and URL
        await navigator.clipboard.writeText(shareText);
        setShareSuccess('Link copied to clipboard!');
      }
    } catch (error) {
      // If user cancels or error occurs, try clipboard fallback
      if (error.name !== 'AbortError') {
        try {
          await navigator.clipboard.writeText(shareText);
          setShareSuccess('Link copied to clipboard!');
        } catch (clipboardError) {
          // Final fallback: show the URL
          const textArea = document.createElement('textarea');
          textArea.value = shareText;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          setShareSuccess('Link copied to clipboard!');
        }
      }
    }

    // Clear success message after 3 seconds
    setTimeout(() => {
      setShareSuccess('');
    }, 3000);
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
    <div className="min-h-screen bg-primary">
      <div className="max-w-7xl mx-auto p-5 md:p-8">
        <div className="bg-gradient-to-r from-secondary/80 to-secondary/60 backdrop-blur-xl p-6 md:p-8 rounded-2xl shadow-lg border border-text/20 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl md:text-4xl font-bold text-accent1">FaceUnknown</h1>
                {user?.role === 'admin' && (
                  <span className="px-3 py-1 bg-accent1 text-primary rounded-lg text-xs font-bold uppercase tracking-wide shadow-md">
                    Admin
                  </span>
                )}
                {user?.role === 'co-admin' && (
                  <span className="px-3 py-1 bg-accent2 text-primary rounded-lg text-xs font-bold uppercase tracking-wide shadow-md">
                    Co-Admin
                  </span>
                )}
              </div>
              <h2 className="text-xl md:text-2xl font-semibold text-text mb-2">Welcome back, {user?.username}!</h2>
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-text/70 text-sm">
                  Role: <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    user?.role === 'admin' ? 'bg-accent1 text-primary' : 
                    user?.role === 'co-admin' ? 'bg-accent2 text-primary' : 
                    'bg-secondary text-text'
                  }`}>{user?.role || 'user'}</span>
                </p>
                {userDetails?.email && (
                  <p className="text-text/60 text-sm flex items-center gap-1">
                    <FaEnvelope className="text-xs" /> {userDetails.email}
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              {shareSuccess && (
                <div className="absolute top-20 right-5 bg-accent2 text-primary px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2 animate-[slideDown_0.3s_ease]">
                  <FaCheckCircle /> {shareSuccess}
                </div>
              )}
              <button 
                onClick={handleShare} 
                className="px-6 py-3 bg-accent2 hover:bg-accent2/90 text-primary rounded-lg font-semibold transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 flex items-center gap-2 whitespace-nowrap"
                title="Share FaceUnknown"
              >
                <FaShareAlt /> Share
              </button>
              <button 
                onClick={handleLogout} 
                className="px-6 py-3 bg-red-500 hover:bg-red-600 text-primary rounded-lg font-semibold transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 flex items-center gap-2 whitespace-nowrap"
              >
                <FaSignOutAlt /> Logout
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6 border-b border-text/20 pb-4 overflow-x-auto">
          <button
            className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 ${
              activeTab === 'home' 
                ? 'bg-accent1 text-primary shadow-md' 
                : 'bg-secondary/50 text-text hover:bg-secondary/70'
            }`}
            onClick={() => setActiveTab('home')}
          >
            <FaHome /> Home
          </button>
          <button
            className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 ${
              activeTab === 'account' 
                ? 'bg-accent1 text-primary shadow-md' 
                : 'bg-secondary/50 text-text hover:bg-secondary/70'
            }`}
            onClick={() => setActiveTab('account')}
          >
            <FaUser /> My Account
          </button>
          {isAdmin && (
            <>
              <button
                className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 ${
                  activeTab === 'manage-users' 
                    ? 'bg-accent1 text-primary shadow-md' 
                    : 'bg-secondary/50 text-text hover:bg-secondary/70'
                }`}
                onClick={() => setActiveTab('manage-users')}
              >
                <FaUsers /> Manage Users
              </button>
              <button
                className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 ${
                  activeTab === 'statistics' 
                    ? 'bg-accent1 text-primary shadow-md' 
                    : 'bg-secondary/50 text-text hover:bg-secondary/70'
                }`}
                onClick={() => setActiveTab('statistics')}
              >
                <FaChartBar /> Statistics
              </button>
              <button
                className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 ${
                  activeTab === 'restricted-words' 
                    ? 'bg-accent1 text-primary shadow-md' 
                    : 'bg-secondary/50 text-text hover:bg-secondary/70'
                }`}
                onClick={() => setActiveTab('restricted-words')}
              >
                <FaBan /> Restricted Words
              </button>
              <button
                className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 ${
                  activeTab === 'reported-users' 
                    ? 'bg-accent1 text-primary shadow-md' 
                    : 'bg-secondary/50 text-text hover:bg-secondary/70'
                }`}
                onClick={() => setActiveTab('reported-users')}
              >
                <FaExclamationTriangle /> Reported Users
              </button>
              <button
                className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 ${
                  activeTab === 'removal-requests' 
                    ? 'bg-accent1 text-primary shadow-md' 
                    : 'bg-secondary/50 text-text hover:bg-secondary/70'
                }`}
                onClick={() => setActiveTab('removal-requests')}
              >
                <FaClipboardList /> Removal Requests
              </button>
            </>
          )}
        </div>

        <div>
          {activeTab === 'home' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-gradient-to-br from-accent1 to-accent1/80 text-primary p-6 rounded-2xl shadow-lg text-center transform hover:scale-105 transition-transform duration-300">
                  <div className="text-4xl md:text-5xl font-bold mb-2">{loading ? '...' : onlineCount}</div>
                  <div className="text-lg font-semibold flex items-center justify-center gap-2">
                    <FaUsers /> Users Online
                  </div>
                </div>
                <div className="bg-gradient-to-br from-accent2 to-accent2/80 text-primary p-6 rounded-2xl shadow-lg text-center transform hover:scale-105 transition-transform duration-300">
                  <div className="text-4xl md:text-5xl font-bold mb-2">
                    {userDetails?.name ? '✓' : '—'}
                  </div>
                  <div className="text-lg font-semibold flex items-center justify-center gap-2">
                    <FaUserCircle /> Profile Status
                  </div>
                </div>
                <div className="bg-gradient-to-br from-secondary to-secondary/80 text-text p-6 rounded-2xl shadow-lg text-center transform hover:scale-105 transition-transform duration-300 border border-text/20">
                  <div className="text-4xl md:text-5xl font-bold mb-2">
                    {isAdmin ? '🔧' : '👤'}
                  </div>
                  <div className="text-lg font-semibold flex items-center justify-center gap-2">
                    <FaShieldAlt /> {isAdmin ? 'Admin Panel' : 'User Dashboard'}
                  </div>
                </div>
              </div>

              <div className="bg-secondary/50 p-8 rounded-2xl shadow-lg border border-text/10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                  <div>
                    <h2 className="text-3xl font-bold text-text mb-2">Start Video Chat</h2>
                    <p className="text-text/70 text-lg">
                      Connect with random users from around the world. Experience anonymous video chat with people globally.
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <div className="flex flex-col items-center gap-3 bg-primary p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                    <div className="w-16 h-16 bg-accent1/20 rounded-full flex items-center justify-center">
                      <FaVideo className="text-3xl text-accent1" />
                    </div>
                    <span className="text-text font-semibold text-center">HD Video Chat</span>
                    <p className="text-text/60 text-sm text-center">Crystal clear video quality</p>
                  </div>
                  <div className="flex flex-col items-center gap-3 bg-primary p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                    <div className="w-16 h-16 bg-accent2/20 rounded-full flex items-center justify-center">
                      <FaForward className="text-3xl text-accent2" />
                    </div>
                    <span className="text-text font-semibold text-center">Skip Anytime</span>
                    <p className="text-text/60 text-sm text-center">Find the perfect match</p>
                  </div>
                  <div className="flex flex-col items-center gap-3 bg-primary p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                    <div className="w-16 h-16 bg-accent1/20 rounded-full flex items-center justify-center">
                      <FaLock className="text-3xl text-accent1" />
                    </div>
                    <span className="text-text font-semibold text-center">Secure & Private</span>
                    <p className="text-text/60 text-sm text-center">Your privacy protected</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  <button 
                    onClick={handleStartChat} 
                    className="w-full sm:w-auto px-8 py-4 bg-accent1 hover:bg-accent1/90 text-primary rounded-lg text-lg font-semibold transition-all duration-300 uppercase tracking-wide shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    disabled={isRestricted && restrictionTime > 0}
                  >
                    <FaVideo /> {isRestricted && restrictionTime > 0 
                      ? `Restricted (${restrictionTime}s)` 
                      : 'Start Chatting'}
                  </button>
                  <button 
                    onClick={handleShare} 
                    className="w-full sm:w-auto px-6 py-4 bg-accent2 hover:bg-accent2/90 text-primary rounded-lg text-lg font-semibold transition-all duration-300 uppercase tracking-wide shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2"
                    title="Share FaceUnknown with friends"
                  >
                    <FaShareAlt /> Share App
                  </button>
                  {isRestricted && restrictionTime > 0 && (
                    <p className="text-red-500 text-sm flex items-center gap-2">
                      <FaClock /> You are restricted from starting a chat for {restrictionTime} more seconds.
                    </p>
                  )}
                </div>
              </div>

              {isAdmin && (
                <div className="mt-6 bg-accent2/10 border-2 border-accent2/30 p-6 rounded-2xl">
                  <h3 className="text-xl font-bold text-text mb-3 flex items-center gap-2">
                    <FaShieldAlt className="text-accent2" /> Admin Quick Access
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <button
                      onClick={() => setActiveTab('manage-users')}
                      className="p-4 bg-primary rounded-lg hover:bg-secondary/50 transition-colors text-center"
                    >
                      <FaUsers className="text-2xl text-accent1 mx-auto mb-2" />
                      <span className="text-sm font-semibold text-text">Manage Users</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('statistics')}
                      className="p-4 bg-primary rounded-lg hover:bg-secondary/50 transition-colors text-center"
                    >
                      <FaChartBar className="text-2xl text-accent2 mx-auto mb-2" />
                      <span className="text-sm font-semibold text-text">Statistics</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('restricted-words')}
                      className="p-4 bg-primary rounded-lg hover:bg-secondary/50 transition-colors text-center"
                    >
                      <FaBan className="text-2xl text-red-500 mx-auto mb-2" />
                      <span className="text-sm font-semibold text-text">Restricted Words</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('reported-users')}
                      className="p-4 bg-primary rounded-lg hover:bg-secondary/50 transition-colors text-center"
                    >
                      <FaExclamationTriangle className="text-2xl text-orange-500 mx-auto mb-2" />
                      <span className="text-sm font-semibold text-text">Reported Users</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('removal-requests')}
                      className="p-4 bg-primary rounded-lg hover:bg-secondary/50 transition-colors text-center"
                    >
                      <FaClipboardList className="text-2xl text-blue-500 mx-auto mb-2" />
                      <span className="text-sm font-semibold text-text">Removal Requests</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'account' && (
            <div className="bg-secondary/50 p-8 rounded-2xl shadow-lg border border-text/10">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-text mb-2">My Account</h2>
                  <p className="text-text/60 text-sm">Manage your profile information and account settings</p>
                </div>
                {!isEditing ? (
                  <button 
                    onClick={handleEdit} 
                    className="px-6 py-3 bg-accent1 hover:bg-accent1/90 text-primary rounded-lg font-semibold transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 flex items-center gap-2"
                  >
                    <FaEdit /> Edit
                  </button>
                ) : (
                  <div className="flex gap-3">
                    <button 
                      onClick={handleSave} 
                      className="px-6 py-3 bg-accent2 hover:bg-accent2/90 text-primary rounded-lg font-semibold transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 flex items-center gap-2"
                    >
                      <FaSave /> Save
                    </button>
                    <button 
                      onClick={handleReset} 
                      className="px-6 py-3 bg-secondary hover:bg-secondary/80 text-text rounded-lg font-semibold transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 flex items-center gap-2"
                    >
                      <FaUndo /> Reset
                    </button>
                  </div>
                )}
              </div>
              {editError && (
                <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                  {editError}
                </div>
              )}
              {editSuccess && (
                <div className="mb-4 p-4 bg-accent2/20 border border-accent2 text-accent2 rounded-lg">
                  {editSuccess}
                </div>
              )}
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-primary p-5 rounded-xl border border-text/10">
                    <label className="block text-text/70 text-sm font-semibold mb-2 uppercase tracking-wide">Username</label>
                    {isEditing ? (
                      <div>
                        <div className="relative">
                          <input
                            type="text"
                            name="username"
                            autoComplete="username"
                            value={editFormData.username}
                            onChange={handleEditChange}
                            className={`w-full px-4 py-3 border-2 rounded-lg bg-secondary/50 text-text focus:outline-none focus:ring-2 transition-all ${
                              usernameAvailable === false || usernameError
                                ? 'border-red-400 focus:border-red-500 focus:ring-red-200' 
                                : usernameAvailable === true
                                ? 'border-accent2 focus:border-accent2 focus:ring-accent2/20' 
                                : 'border-text/30 focus:border-accent1 focus:ring-accent1/20'
                            }`}
                            placeholder="Enter username"
                            minLength={3}
                            maxLength={20}
                          />
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            {checkingUsername && (
                              <div className="w-5 h-5 border-2 border-accent1 border-t-transparent rounded-full animate-spin"></div>
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
                    ) : (
                      <div className="p-3 bg-secondary/30 rounded-lg text-text font-medium">{userDetails?.username || user?.username || 'N/A'}</div>
                    )}
                  </div>
                  
                  <div className="bg-primary p-5 rounded-xl border border-text/10">
                    <label className="block text-text/70 text-sm font-semibold mb-2 uppercase tracking-wide flex items-center gap-2">
                      <FaUserCircle className="text-accent1" /> Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="name"
                        autoComplete="name"
                        value={editFormData.name}
                        onChange={handleEditChange}
                        className="w-full px-4 py-3 border-2 border-text/30 rounded-lg bg-secondary/50 text-text focus:outline-none focus:border-accent1 focus:ring-2 focus:ring-accent1/20 transition-all"
                        placeholder="Enter your name"
                      />
                    ) : (
                      <div className="p-3 bg-secondary/30 rounded-lg text-text font-medium">{userDetails?.name || user?.name || 'Not set'}</div>
                    )}
                  </div>
                </div>
                
                <div className="bg-primary p-5 rounded-xl border border-text/10">
                  <label className="block text-text/70 text-sm font-semibold mb-2 uppercase tracking-wide flex items-center gap-2">
                    <FaEnvelope className="text-accent2" /> Email
                  </label>
                  <div className="p-3 bg-secondary/30 rounded-lg text-text font-medium">{userDetails?.email || user?.email || 'N/A'}</div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-primary p-5 rounded-xl border border-text/10">
                    <label className="block text-text/70 text-sm font-semibold mb-2 uppercase tracking-wide flex items-center gap-2">
                      <FaVenusMars className="text-accent1" /> Gender
                    </label>
                    {isEditing ? (
                      <select
                        name="gender"
                        autoComplete="sex"
                        value={editFormData.gender}
                        onChange={handleEditChange}
                        className="w-full px-4 py-3 border-2 border-text/30 rounded-lg bg-secondary/50 text-text focus:outline-none focus:border-accent1 focus:ring-2 focus:ring-accent1/20 transition-all"
                      >
                        <option value="prefer-not-to-say">Prefer not to say</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    ) : (
                      <div className="p-3 bg-secondary/30 rounded-lg text-text font-medium">
                        {userDetails?.gender ? getGenderDisplay(userDetails.gender) : (user?.gender ? getGenderDisplay(user.gender) : 'Not set')}
                      </div>
                    )}
                  </div>

                  <div className="bg-primary p-5 rounded-xl border border-text/10">
                    <label className="block text-text/70 text-sm font-semibold mb-2 uppercase tracking-wide flex items-center gap-2">
                      <FaCalendarAlt className="text-accent2" /> Date of Birth
                    </label>
                    {isEditing ? (
                      <input
                        type="date"
                        name="dateOfBirth"
                        autoComplete="bday"
                        value={editFormData.dateOfBirth}
                        onChange={handleEditChange}
                        className="w-full px-4 py-3 border-2 border-text/30 rounded-lg bg-secondary/50 text-text focus:outline-none focus:border-accent1 focus:ring-2 focus:ring-accent1/20 transition-all"
                        max={new Date().toISOString().split('T')[0]}
                      />
                    ) : (
                      <div className="p-3 bg-secondary/30 rounded-lg text-text font-medium">
                        {userDetails?.dateOfBirth ? formatDate(userDetails.dateOfBirth) : (user?.dateOfBirth ? formatDate(user.dateOfBirth) : 'Not set')}
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-primary p-5 rounded-xl border border-text/10">
                  <label className="block text-text/70 text-sm font-semibold mb-2 uppercase tracking-wide flex items-center gap-2">
                    <FaGlobe className="text-accent1" /> Country
                  </label>
                  {isEditing ? (
                    <select
                      name="country"
                      autoComplete="country"
                      value={editFormData.country}
                      onChange={handleEditChange}
                      className="w-full px-4 py-3 border-2 border-text/30 rounded-lg bg-secondary/50 text-text focus:outline-none focus:border-accent1 focus:ring-2 focus:ring-accent1/20 transition-all"
                    >
                      <option value="">Select your country</option>
                      <option value="Afghanistan">Afghanistan</option>
                      <option value="Albania">Albania</option>
                      <option value="Algeria">Algeria</option>
                      <option value="Argentina">Argentina</option>
                      <option value="Australia">Australia</option>
                      <option value="Austria">Austria</option>
                      <option value="Bangladesh">Bangladesh</option>
                      <option value="Belgium">Belgium</option>
                      <option value="Brazil">Brazil</option>
                      <option value="Canada">Canada</option>
                      <option value="China">China</option>
                      <option value="Colombia">Colombia</option>
                      <option value="Denmark">Denmark</option>
                      <option value="Egypt">Egypt</option>
                      <option value="Finland">Finland</option>
                      <option value="France">France</option>
                      <option value="Germany">Germany</option>
                      <option value="Greece">Greece</option>
                      <option value="India">India</option>
                      <option value="Indonesia">Indonesia</option>
                      <option value="Iran">Iran</option>
                      <option value="Iraq">Iraq</option>
                      <option value="Ireland">Ireland</option>
                      <option value="Israel">Israel</option>
                      <option value="Italy">Italy</option>
                      <option value="Japan">Japan</option>
                      <option value="Kenya">Kenya</option>
                      <option value="Malaysia">Malaysia</option>
                      <option value="Mexico">Mexico</option>
                      <option value="Netherlands">Netherlands</option>
                      <option value="New Zealand">New Zealand</option>
                      <option value="Nigeria">Nigeria</option>
                      <option value="Norway">Norway</option>
                      <option value="Pakistan">Pakistan</option>
                      <option value="Philippines">Philippines</option>
                      <option value="Poland">Poland</option>
                      <option value="Portugal">Portugal</option>
                      <option value="Russia">Russia</option>
                      <option value="Saudi Arabia">Saudi Arabia</option>
                      <option value="Singapore">Singapore</option>
                      <option value="South Africa">South Africa</option>
                      <option value="South Korea">South Korea</option>
                      <option value="Spain">Spain</option>
                      <option value="Sweden">Sweden</option>
                      <option value="Switzerland">Switzerland</option>
                      <option value="Thailand">Thailand</option>
                      <option value="Turkey">Turkey</option>
                      <option value="Ukraine">Ukraine</option>
                      <option value="United Arab Emirates">United Arab Emirates</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="United States">United States</option>
                      <option value="Vietnam">Vietnam</option>
                      <option value="Other">Other</option>
                    </select>
                  ) : (
                    <div className="p-3 bg-secondary/30 rounded-lg text-text font-medium">
                      {userDetails?.country || user?.country || 'Not set'}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-primary p-5 rounded-xl border border-text/10">
                    <label className="block text-text/70 text-sm font-semibold mb-2 uppercase tracking-wide">Account Created</label>
                    <div className="p-3 bg-secondary/30 rounded-lg text-text font-medium">
                      {userDetails?.createdAt ? formatDate(userDetails.createdAt) : (user?.createdAt ? formatDate(user.createdAt) : 'N/A')}
                    </div>
                  </div>
                  
                  <div className="bg-primary p-5 rounded-xl border border-text/10">
                    <label className="block text-text/70 text-sm font-semibold mb-2 uppercase tracking-wide">Password</label>
                    <div className="p-3 bg-secondary/30 rounded-lg text-text font-medium">••••••••</div>
                  </div>
                </div>
                
                <div className="bg-primary p-5 rounded-xl border border-text/10">
                  <label className="block text-text/70 text-sm font-semibold mb-2 uppercase tracking-wide flex items-center gap-2">
                    <FaShieldAlt className="text-accent1" /> Role
                  </label>
                  <div className="p-3 bg-secondary/30 rounded-lg">
                    <span className={`px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wide ${
                      (userDetails?.role || user?.role) === 'admin' ? 'bg-accent1 text-primary' : 
                      (userDetails?.role || user?.role) === 'co-admin' ? 'bg-accent2 text-primary' : 
                      'bg-secondary text-text'
                    }`}>
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
  