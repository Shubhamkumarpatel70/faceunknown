import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../config/api';
import { FaSyncAlt, FaSearch, FaFilter, FaTrash, FaUsers, FaUserShield, FaCircle } from 'react-icons/fa';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [genderFilter, setGenderFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [users, searchTerm, roleFilter, statusFilter, genderFilter, sortBy, sortOrder]);

  const fetchUsers = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const response = await axios.get(`${API_BASE_URL}/api/users`);
      setUsers(response.data);
      setError('');
    } catch (error) {
      setError('Failed to fetch users');
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/users/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleRefresh = async () => {
    await fetchUsers(true);
    await fetchStats();
  };

  const applyFilters = () => {
    let filtered = [...users];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(user =>
        user.name?.toLowerCase().includes(term) ||
        user.username.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term)
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user =>
        statusFilter === 'online' ? user.isOnline : !user.isOnline
      );
    }

    // Gender filter
    if (genderFilter !== 'all') {
      filtered = filtered.filter(user => user.gender === genderFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === 'createdAt') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      } else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredUsers(filtered);
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await axios.patch(`${API_BASE_URL}/api/users/${userId}/role`, { role: newRole });
      await fetchUsers();
      await fetchStats();
    } catch (error) {
      alert('Failed to update user role');
      console.error('Error updating role:', error);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      await axios.delete(`${API_BASE_URL}/api/users/${userId}`);
      await fetchUsers();
      await fetchStats();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete user');
      console.error('Error deleting user:', error);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setRoleFilter('all');
    setStatusFilter('all');
    setGenderFilter('all');
    setSortBy('createdAt');
    setSortOrder('desc');
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
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

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary/30 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-accent1/20 border-t-accent1 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text font-semibold">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30 p-4 sm:p-6 md:p-8">
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-primary rounded-xl p-4 sm:p-6 border-2 border-text/20 shadow-lg">
            <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-accent1 mb-2">{stats.totalUsers}</div>
            <div className="text-text/70 text-sm sm:text-base font-semibold flex items-center gap-2">
              <FaUsers className="text-accent1" /> Total Users
            </div>
          </div>
          <div className="bg-primary rounded-xl p-4 sm:p-6 border-2 border-text/20 shadow-lg">
            <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-accent2 mb-2">{stats.onlineUsers}</div>
            <div className="text-text/70 text-sm sm:text-base font-semibold flex items-center gap-2">
              <FaCircle className="text-accent2 text-xs" /> Online
            </div>
          </div>
          <div className="bg-primary rounded-xl p-4 sm:p-6 border-2 border-text/20 shadow-lg">
            <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-text/60 mb-2">{stats.offlineUsers}</div>
            <div className="text-text/70 text-sm sm:text-base font-semibold flex items-center gap-2">
              <FaCircle className="text-text/40 text-xs" /> Offline
            </div>
          </div>
          <div className="bg-primary rounded-xl p-4 sm:p-6 border-2 border-text/20 shadow-lg">
            <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-accent1 mb-2">{stats.adminUsers + stats.coAdminUsers}</div>
            <div className="text-text/70 text-sm sm:text-base font-semibold flex items-center gap-2">
              <FaUserShield className="text-accent1" /> Admins
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-primary rounded-xl p-4 sm:p-6 mb-6 border-2 border-text/20 shadow-lg">
        <div className="flex flex-col lg:flex-row gap-4 mb-4">
          <div className="flex-1">
            <label className="block text-text font-semibold mb-2 text-sm sm:text-base">
              <FaSearch className="inline mr-2" /> Search
            </label>
            <input
              type="text"
              placeholder="Search by name, username, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border-2 border-text/30 rounded-lg bg-secondary/50 text-text focus:outline-none focus:border-accent1 focus:ring-2 focus:ring-accent1/20 transition-all"
            />
          </div>

          <div className="flex-1">
            <label className="block text-text font-semibold mb-2 text-sm sm:text-base">
              <FaFilter className="inline mr-2" /> Role
            </label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-4 py-2 border-2 border-text/30 rounded-lg bg-secondary/50 text-text focus:outline-none focus:border-accent1 focus:ring-2 focus:ring-accent1/20 transition-all"
            >
              <option value="all">All Roles</option>
              <option value="user">User</option>
              <option value="co-admin">Co-Admin</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-text font-semibold mb-2 text-sm sm:text-base">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border-2 border-text/30 rounded-lg bg-secondary/50 text-text focus:outline-none focus:border-accent1 focus:ring-2 focus:ring-accent1/20 transition-all"
            >
              <option value="all">All Status</option>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-text font-semibold mb-2 text-sm sm:text-base">Gender</label>
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="w-full px-4 py-2 border-2 border-text/30 rounded-lg bg-secondary/50 text-text focus:outline-none focus:border-accent1 focus:ring-2 focus:ring-accent1/20 transition-all"
            >
              <option value="all">All Genders</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer-not-to-say">Prefer not to say</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
          <div className="flex-1 sm:flex-initial">
            <label className="block text-text font-semibold mb-2 text-sm sm:text-base">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full sm:w-auto px-4 py-2 border-2 border-text/30 rounded-lg bg-secondary/50 text-text focus:outline-none focus:border-accent1 focus:ring-2 focus:ring-accent1/20 transition-all"
            >
              <option value="createdAt">Created Date</option>
              <option value="username">Username</option>
              <option value="email">Email</option>
              <option value="name">Name</option>
              <option value="role">Role</option>
            </select>
          </div>

          <div className="flex-1 sm:flex-initial">
            <label className="block text-text font-semibold mb-2 text-sm sm:text-base">Order</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full sm:w-auto px-4 py-2 border-2 border-text/30 rounded-lg bg-secondary/50 text-text focus:outline-none focus:border-accent1 focus:ring-2 focus:ring-accent1/20 transition-all"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>

          <button 
            onClick={clearFilters} 
            className="px-4 py-2 bg-secondary/70 hover:bg-secondary/90 text-text rounded-lg font-semibold transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 flex items-center gap-2"
          >
            <FaFilter /> Clear Filters
          </button>

          <div className="flex-1 text-right">
            <p className="text-text/70 text-sm sm:text-base font-semibold">
              Showing {filteredUsers.length} of {users.length} users
            </p>
          </div>
        </div>
      </div>

      <div className="bg-primary rounded-xl border-2 border-text/20 shadow-lg overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-text/20 flex justify-between items-center">
          <h2 className="text-xl sm:text-2xl font-bold text-text">Users Management</h2>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 shadow-md hover:shadow-lg hover:-translate-y-0.5 ${
              refreshing
                ? 'bg-secondary/70 text-text/50 cursor-not-allowed'
                : 'bg-accent1 hover:bg-accent1/90 text-primary'
            }`}
            title="Refresh users list"
          >
            <FaSyncAlt className={`${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary/50">
              <tr>
                <th className="px-4 py-3 text-left text-text font-semibold text-sm sm:text-base">Name</th>
                <th className="px-4 py-3 text-left text-text font-semibold text-sm sm:text-base">Username</th>
                <th className="px-4 py-3 text-left text-text font-semibold text-sm sm:text-base">Email</th>
                <th className="px-4 py-3 text-left text-text font-semibold text-sm sm:text-base">Gender</th>
                <th className="px-4 py-3 text-left text-text font-semibold text-sm sm:text-base">Role</th>
                <th className="px-4 py-3 text-left text-text font-semibold text-sm sm:text-base">Status</th>
                <th className="px-4 py-3 text-left text-text font-semibold text-sm sm:text-base">Created</th>
                <th className="px-4 py-3 text-left text-text font-semibold text-sm sm:text-base">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-text/10">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-text/70">
                    No users found matching your filters
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3 text-text text-sm sm:text-base">{user.name || 'N/A'}</td>
                    <td className="px-4 py-3 text-text text-sm sm:text-base">{user.username}</td>
                    <td className="px-4 py-3 text-text text-sm sm:text-base">{user.email}</td>
                    <td className="px-4 py-3 text-text text-sm sm:text-base">{getGenderDisplay(user.gender)}</td>
                    <td className="px-4 py-3">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user._id, e.target.value)}
                        className="px-3 py-1.5 border-2 border-text/30 rounded-lg bg-secondary/50 text-text text-sm sm:text-base focus:outline-none focus:border-accent1 focus:ring-2 focus:ring-accent1/20 transition-all"
                      >
                        <option value="user">User</option>
                        <option value="co-admin">Co-Admin</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs sm:text-sm font-semibold ${
                        user.isOnline 
                          ? 'bg-accent2/20 text-accent2 border border-accent2/30' 
                          : 'bg-text/20 text-text/70 border border-text/30'
                      }`}>
                        <FaCircle className={`text-xs ${user.isOnline ? 'text-accent2' : 'text-text/40'}`} />
                        {user.isOnline ? 'Online' : 'Offline'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text/70 text-sm sm:text-base">{formatDate(user.createdAt)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDeleteUser(user._id)}
                        className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-primary rounded-lg text-sm sm:text-base font-semibold transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 flex items-center gap-1.5"
                      >
                        <FaTrash /> Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManageUsers;
