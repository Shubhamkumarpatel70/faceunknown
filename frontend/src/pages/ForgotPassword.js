import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../config/api';
import { FaEnvelope, FaLock, FaUser, FaArrowLeft, FaCheckCircle, FaSpinner } from 'react-icons/fa';

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: Enter email, 2: Show username and reset password
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/forgot-password`, { email });
      setUsername(response.data.username);
      setStep(2);
      setSuccess('');
    } catch (err) {
      setError(err.response?.data?.message || 'Email not found. Please check your email address.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await axios.post(`${API_BASE_URL}/api/auth/reset-password`, {
        email,
        username,
        password: formData.password
      });
      setSuccess('Password reset successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login', { state: { message: 'Password reset successfully! Please login with your new password.' } });
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary/30 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md bg-primary rounded-2xl shadow-2xl p-8 md:p-10 border border-text/10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-accent1 mb-2">FaceUnknown</h1>
          <h2 className="text-3xl font-bold text-text mt-6 mb-2">
            {step === 1 ? 'Forgot Password' : 'Reset Password'}
          </h2>
          <p className="text-text/70">
            {step === 1 
              ? 'Enter your email to recover your account' 
              : 'Enter your new password'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-accent2/20 border border-accent2 text-accent2 rounded-lg">
            {success}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleEmailSubmit} className="space-y-6">
            <div>
              <label className="block text-text font-semibold mb-2">
                <FaEnvelope className="inline mr-2" />Email
              </label>
              <input
                type="email"
                name="email"
                autoComplete="email"
                className="w-full px-4 py-3 border-2 border-text/30 rounded-lg bg-secondary/50 text-text focus:outline-none focus:border-accent1 focus:ring-2 focus:ring-accent1/20 transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full px-6 py-4 bg-accent1 hover:bg-accent1/90 text-primary rounded-lg text-lg font-semibold transition-all duration-300 uppercase tracking-wide shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin" /> Searching...
                </>
              ) : (
                <>
                  <FaEnvelope /> Continue
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handlePasswordReset} className="space-y-6">
            <div className="bg-secondary/50 p-4 rounded-lg border border-accent2/30">
              <label className="block text-text/70 text-sm font-semibold mb-2 uppercase tracking-wide flex items-center gap-2">
                <FaUser className="text-accent1" /> Username
              </label>
              <div className="p-3 bg-primary rounded-lg text-text font-medium flex items-center gap-2">
                <FaCheckCircle className="text-accent2" />
                {username}
              </div>
            </div>

            <div>
              <label className="block text-text font-semibold mb-2">
                <FaLock className="inline mr-2" />New Password
              </label>
              <input
                type="password"
                name="password"
                autoComplete="new-password"
                className="w-full px-4 py-3 border-2 border-text/30 rounded-lg bg-secondary/50 text-text focus:outline-none focus:border-accent1 focus:ring-2 focus:ring-accent1/20 transition-all"
                value={formData.password}
                onChange={handlePasswordChange}
                required
                minLength={6}
                placeholder="Enter new password (min 6 characters)"
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
                onChange={handlePasswordChange}
                required
                minLength={6}
                placeholder="Confirm new password"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full px-6 py-4 bg-accent2 hover:bg-accent2/90 text-primary rounded-lg text-lg font-semibold transition-all duration-300 uppercase tracking-wide shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin" /> Resetting...
                </>
              ) : (
                <>
                  <FaLock /> Reset Password
                </>
              )}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link 
            to="/login" 
            className="text-text/70 hover:text-accent1 font-semibold flex items-center justify-center gap-2"
          >
            <FaArrowLeft /> Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

