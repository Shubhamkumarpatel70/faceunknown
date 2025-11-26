import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import API_BASE_URL from '../config/api';
import { FaUser, FaVenusMars, FaCalendarAlt, FaCheckCircle, FaSave, FaGlobe } from 'react-icons/fa';

const ProfileCompletion = () => {
  const { user, logout, updateUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    gender: 'prefer-not-to-say',
    dateOfBirth: '',
    country: ''
  });

  useEffect(() => {
    fetchUserDetails();
  }, []);

  useEffect(() => {
    if (userDetails) {
      setFormData({
        name: userDetails.name || '',
        gender: userDetails.gender || 'prefer-not-to-say',
        dateOfBirth: userDetails.dateOfBirth ? new Date(userDetails.dateOfBirth).toISOString().split('T')[0] : '',
        country: userDetails.country || ''
      });
      calculateCompletion(userDetails);
    }
  }, [userDetails]);

  useEffect(() => {
    // Calculate completion based on current formData (real-time updates)
    calculateCompletion(formData);
  }, [formData]);

  const fetchUserDetails = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/auth/me`);
      setUserDetails(response.data.user);
    } catch (error) {
      console.error('Error fetching user details:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateCompletion = (data) => {
    const dataToCheck = data || formData;
    if (!dataToCheck) return;
    
    let completed = 0;
    const total = 4; // name, gender, dateOfBirth, country

    if (dataToCheck.name && dataToCheck.name.trim() !== '') completed++;
    if (dataToCheck.gender && dataToCheck.gender !== 'prefer-not-to-say') completed++;
    if (dataToCheck.dateOfBirth) completed++;
    if (dataToCheck.country && dataToCheck.country.trim() !== '') completed++;

    const percentage = Math.round((completed / total) * 100);
    setCompletionPercentage(percentage);
  };

  const handleChange = (e) => {
    const newFormData = { ...formData, [e.target.name]: e.target.value };
    setFormData(newFormData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const response = await axios.patch(`${API_BASE_URL}/api/auth/profile`, formData);
      
      // Get updated user data from response
      const updatedUserData = response.data.user;
      
      // Update AuthContext with new user data
      if (updateUser) {
        updateUser({
          ...user,
          name: updatedUserData.name,
          gender: updatedUserData.gender,
          dateOfBirth: updatedUserData.dateOfBirth,
          country: updatedUserData.country,
          profileComplete: updatedUserData.profileComplete
        });
      }
      
      // Update local user details
      setUserDetails(updatedUserData);
      
      // Update completion percentage based on backend response
      if (updatedUserData.profileComplete) {
        setCompletionPercentage(100);
      }
      
      // Navigate to dashboard with a flag to skip profile check
      navigate('/dashboard', { 
        replace: true,
        state: { skipProfileCheck: true }
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      setSaving(false);
      const errorMessage = error.response?.data?.message || 'Failed to update profile. Please try again.';
      alert(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary/30 flex items-center justify-center">
        <div className="text-text text-xl">Loading...</div>
      </div>
    );
  }

  const isComplete = completionPercentage === 100;

  return (
    <div className="min-h-screen bg-secondary/30 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-2xl bg-primary rounded-2xl shadow-2xl p-8 md:p-10 border border-text/10">
        <h1 className="text-4xl font-bold text-text text-center mb-8">Complete Your Profile</h1>
        
        <div className="mb-8">
          <div className="w-full bg-secondary/50 rounded-full h-4 mb-2">
            <div 
              className={`h-4 rounded-full transition-all duration-500 ${
                completionPercentage === 100 ? 'bg-accent2' : 'bg-accent1'
              }`}
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
          <p className="text-center text-text font-semibold">{completionPercentage}% Complete</p>
        </div>

        {isComplete ? (
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-accent2 rounded-full flex items-center justify-center">
                <FaCheckCircle className="text-5xl text-primary" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-text mb-4">Profile Complete!</h2>
            <p className="text-text/70 mb-8 text-lg">Your profile is fully completed. You can now access all features.</p>
            <button 
              onClick={() => navigate('/dashboard', { 
                replace: true,
                state: { skipProfileCheck: true }
              })} 
              className="px-8 py-4 bg-accent1 hover:bg-accent1/90 text-primary rounded-lg text-lg font-semibold transition-all duration-300 uppercase tracking-wide shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              Go to Dashboard
            </button>
          </div>
        ) : (
          <>
            <p className="text-text/70 text-center mb-8 text-lg">
              Please complete your profile to access all features. Fill in the information below.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-text font-semibold mb-2 flex items-center gap-2">
                  <FaUser /> Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  autoComplete="name"
                  className="w-full px-4 py-3 border-2 border-text/30 rounded-lg bg-secondary/50 text-text focus:outline-none focus:border-accent1 focus:ring-2 focus:ring-accent1/20 transition-all"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-text font-semibold mb-2 flex items-center gap-2">
                  <FaVenusMars /> Gender *
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
                <label className="block text-text font-semibold mb-2 flex items-center gap-2">
                  <FaCalendarAlt /> Date of Birth *
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

              <div>
                <label className="block text-text font-semibold mb-2 flex items-center gap-2">
                  <FaGlobe /> Country *
                </label>
                <select
                  name="country"
                  autoComplete="country"
                  className="w-full px-4 py-3 border-2 border-text/30 rounded-lg bg-secondary/50 text-text focus:outline-none focus:border-accent1 focus:ring-2 focus:ring-accent1/20 transition-all"
                  value={formData.country}
                  onChange={handleChange}
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
              </div>

              <div className="flex justify-center">
                <button 
                  type="submit" 
                  disabled={saving}
                  className="w-full sm:w-auto px-8 py-4 bg-accent1 hover:bg-accent1/90 text-primary rounded-lg text-lg font-semibold transition-all duration-300 uppercase tracking-wide shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <FaSave /> Save & Continue
                    </>
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ProfileCompletion;
