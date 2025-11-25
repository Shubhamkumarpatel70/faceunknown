import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ReportsRemovalRequest.css';

const ReportsRemovalRequest = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/reports/removal-requests');
      setRequests(response.data);
    } catch (error) {
      console.error('Error fetching removal requests:', error);
      setError('Failed to load removal requests');
    } finally {
      setLoading(false);
    }
  };

  const handleRequest = async (requestId, status) => {
    if (!window.confirm(`Are you sure you want to ${status} this request?`)) {
      return;
    }

    try {
      const response = await axios.patch(`http://localhost:5000/api/reports/removal-requests/${requestId}`, {
        status
      });
      setSuccess(`Request ${status} successfully`);
      setError('');
      fetchRequests();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.message || `Failed to ${status} request`);
      setSuccess('');
      setTimeout(() => setError(''), 3000);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div className="removal-requests-container">Loading...</div>;
  }

  return (
    <div className="removal-requests-container">
      <div className="removal-requests-header">
        <h2>📋 Reports Removal Requests</h2>
        <p className="removal-requests-description">
          Users with 5 or more reports can request removal of their reports. Review and approve or reject these requests.
        </p>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {requests.length === 0 ? (
        <div className="no-requests">
          <div className="no-requests-icon">✅</div>
          <p>No pending removal requests.</p>
        </div>
      ) : (
        <div className="requests-list">
          {requests.map((request) => (
            <div key={request._id} className="request-card">
              <div className="request-header">
                <div className="request-user-info">
                  <h3>{request.userId?.username || 'Unknown User'}</h3>
                  <p className="request-user-email">{request.userId?.email || 'N/A'}</p>
                </div>
                <div className="request-report-count">
                  <span className="count-number">{request.reportCount}</span>
                  <span className="count-label">Reports</span>
                </div>
              </div>

              <div className="request-details">
                <div className="detail-row">
                  <span className="detail-label">Name:</span>
                  <span className="detail-value">{request.userId?.name || 'Not set'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Request Message:</span>
                  <span className="detail-value">{request.requestMessage || 'No message provided'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Requested On:</span>
                  <span className="detail-value">{formatDate(request.createdAt)}</span>
                </div>
              </div>

              <div className="request-actions">
                <button
                  onClick={() => handleRequest(request._id, 'approved')}
                  className="btn btn-primary btn-approve"
                >
                  ✅ Approve
                </button>
                <button
                  onClick={() => handleRequest(request._id, 'rejected')}
                  className="btn btn-danger btn-reject"
                >
                  ❌ Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReportsRemovalRequest;

