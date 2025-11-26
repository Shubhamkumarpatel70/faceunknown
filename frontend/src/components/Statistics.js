import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../config/api';
import './Statistics.css';

const Statistics = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('all');
  const [userActivity, setUserActivity] = useState([]);

  useEffect(() => {
    fetchStats();
    fetchUserActivity();
    const interval = setInterval(() => {
      fetchStats();
      fetchUserActivity();
    }, 30000);
    return () => clearInterval(interval);
  }, [timeRange]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/users/stats`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Set loading to false even on error
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserActivity = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/users`);
      const users = response.data;
      
      // Calculate activity metrics
      const now = new Date();
      const today = new Date(now.setHours(0, 0, 0, 0));
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      let activityData = {
        today: 0,
        thisWeek: 0,
        thisMonth: 0,
        total: users.length
      };

      users.forEach(user => {
        const createdAt = new Date(user.createdAt);
        if (createdAt >= today) activityData.today++;
        if (createdAt >= weekAgo) activityData.thisWeek++;
        if (createdAt >= monthAgo) activityData.thisMonth++;
      });

      setUserActivity(activityData);
    } catch (error) {
      console.error('Error fetching user activity:', error);
    }
  };

  const calculatePercentage = (value, total) => {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  };

  const exportStats = () => {
    if (!stats) return;
    
    const data = {
      timestamp: new Date().toISOString(),
      totalUsers: stats.totalUsers,
      onlineUsers: stats.onlineUsers,
      offlineUsers: stats.offlineUsers,
      adminUsers: stats.adminUsers,
      coAdminUsers: stats.coAdminUsers,
      regularUsers: stats.regularUsers,
      onlineRate: calculatePercentage(stats.onlineUsers, stats.totalUsers),
      activity: userActivity
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `statistics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const refreshStats = () => {
    setLoading(true);
    fetchStats();
    fetchUserActivity();
  };

  if (loading) {
    return <div className="loading">Loading statistics...</div>;
  }

  if (!stats) {
    return <div className="error-message">Failed to load statistics</div>;
  }

  return (
    <div className="statistics-container">
      <div className="statistics-header">
        <h2>Platform Statistics</h2>
        <div className="header-actions">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="time-range-select"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
          <button onClick={refreshStats} className="btn btn-secondary btn-small">
            🔄 Refresh
          </button>
          <button onClick={exportStats} className="btn btn-primary btn-small">
            📥 Export
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <div className="stat-number">{stats.totalUsers}</div>
            <div className="stat-label">Total Users</div>
            <div className="stat-trend">All registered users</div>
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-icon">🟢</div>
          <div className="stat-content">
            <div className="stat-number">{stats.onlineUsers}</div>
            <div className="stat-label">Online Users</div>
            <div className="stat-trend">
              {calculatePercentage(stats.onlineUsers, stats.totalUsers)}% of total
            </div>
          </div>
        </div>

        <div className="stat-card warning">
          <div className="stat-icon">⚫</div>
          <div className="stat-content">
            <div className="stat-number">{stats.offlineUsers}</div>
            <div className="stat-label">Offline Users</div>
            <div className="stat-trend">
              {calculatePercentage(stats.offlineUsers, stats.totalUsers)}% of total
            </div>
          </div>
        </div>

        <div className="stat-card danger">
          <div className="stat-icon">👑</div>
          <div className="stat-content">
            <div className="stat-number">{stats.adminUsers + stats.coAdminUsers}</div>
            <div className="stat-label">Administrators</div>
            <div className="stat-trend">
              {stats.adminUsers} Admin{stats.adminUsers !== 1 ? 's' : ''}, {stats.coAdminUsers} Co-Admin{stats.coAdminUsers !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        <div className="stat-card secondary">
          <div className="stat-icon">👤</div>
          <div className="stat-content">
            <div className="stat-number">{stats.regularUsers}</div>
            <div className="stat-label">Regular Users</div>
            <div className="stat-trend">
              {calculatePercentage(stats.regularUsers, stats.totalUsers)}% of total
            </div>
          </div>
        </div>

        <div className="stat-card accent">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <div className="stat-number">
              {stats.totalUsers > 0 ? calculatePercentage(stats.onlineUsers, stats.totalUsers) : 0}%
            </div>
            <div className="stat-label">Online Rate</div>
            <div className="stat-trend">Active users percentage</div>
          </div>
        </div>
      </div>

      <div className="activity-section">
        <h3>User Activity</h3>
        <div className="activity-grid">
          <div className="activity-card">
            <div className="activity-number">{userActivity.today || 0}</div>
            <div className="activity-label">New Users Today</div>
          </div>
          <div className="activity-card">
            <div className="activity-number">{userActivity.thisWeek || 0}</div>
            <div className="activity-label">New This Week</div>
          </div>
          <div className="activity-card">
            <div className="activity-number">{userActivity.thisMonth || 0}</div>
            <div className="activity-label">New This Month</div>
          </div>
        </div>
      </div>

      <div className="stats-chart-container">
        <div className="chart-card">
          <h3>User Distribution</h3>
          <div className="distribution-chart">
            <div className="chart-item">
              <div className="chart-label">Regular Users</div>
              <div className="chart-bar-container">
                <div
                  className="chart-bar secondary"
                  style={{ width: `${calculatePercentage(stats.regularUsers, stats.totalUsers)}%` }}
                ></div>
                <span className="chart-value">{stats.regularUsers}</span>
              </div>
            </div>
            <div className="chart-item">
              <div className="chart-label">Administrators</div>
              <div className="chart-bar-container">
                <div
                  className="chart-bar danger"
                  style={{ width: `${calculatePercentage(stats.adminUsers + stats.coAdminUsers, stats.totalUsers)}%` }}
                ></div>
                <span className="chart-value">{stats.adminUsers + stats.coAdminUsers}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="chart-card">
          <h3>User Status</h3>
          <div className="status-chart">
            <div className="status-item">
              <div className="status-indicator online"></div>
              <div className="status-info">
                <div className="status-label">Online</div>
                <div className="status-count">{stats.onlineUsers} users</div>
              </div>
            </div>
            <div className="status-item">
              <div className="status-indicator offline"></div>
              <div className="status-info">
                <div className="status-label">Offline</div>
                <div className="status-count">{stats.offlineUsers} users</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Statistics;
