import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../config/api';
import './ReportedUsers.css';

const ReportedUsers = () => {
  const [reportedUsers, setReportedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReportedUsers();
    const interval = setInterval(fetchReportedUsers, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchReportedUsers = async () => {
    try {
      const response = await axios.get('API_BASE_URL/api/reports/reported-users');
      setReportedUsers(response.data);
    } catch (error) {
      console.error('Error fetching reported users:', error);
      setError('Failed to load reported users');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return <div className="reported-users-container">Loading...</div>;
  }

  return (
    <div className="reported-users-container">
      <div className="reported-users-header">
        <h2>⚠️ Reported Users</h2>
        <p className="reported-users-description">
          Users who have been reported by other users. Users with 5 or more reports can request removal.
        </p>
      </div>

      {error && <div className="error-message">{error}</div>}

      {reportedUsers.length === 0 ? (
        <div className="no-reported-users">
          <div className="no-reported-icon">✅</div>
          <p>No reported users found.</p>
        </div>
      ) : (
        <div className="reported-users-grid">
          {reportedUsers.map((reportedUser) => (
            <div key={reportedUser.userId} className="reported-user-card">
              <div className="reported-user-header">
                <div className="reported-user-info">
                  <h3>{reportedUser.username}</h3>
                  <p className="reported-user-email">{reportedUser.email}</p>
                </div>
                <div className={`report-count-badge ${reportedUser.reportCount >= 5 ? 'high' : 'medium'}`}>
                  {reportedUser.reportCount} {reportedUser.reportCount === 1 ? 'Report' : 'Reports'}
                </div>
              </div>
              
              <div className="reported-user-details">
                <div className="detail-row">
                  <span className="detail-label">Name:</span>
                  <span className="detail-value">{reportedUser.name || 'Not set'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Account Created:</span>
                  <span className="detail-value">{formatDate(reportedUser.createdAt)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Status:</span>
                  <span className={`status-badge ${reportedUser.isOnline ? 'online' : 'offline'}`}>
                    {reportedUser.isOnline ? '🟢 Online' : '⚫ Offline'}
                  </span>
                </div>
              </div>

              {reportedUser.reportCount >= 5 && (
                <div className="removal-request-notice">
                  ⚠️ This user has 5+ reports and can request removal
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReportedUsers;

