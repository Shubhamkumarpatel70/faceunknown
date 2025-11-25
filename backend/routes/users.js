const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();

// Check username availability (public endpoint for registration)
router.post('/check-username', async (req, res) => {
  try {
    const { username } = req.body;
    
    if (!username || username.trim().length < 3) {
      return res.status(400).json({ 
        available: false, 
        message: 'Username must be at least 3 characters' 
      });
    }

    const user = await User.findOne({ username: username.trim() });
    res.json({ 
      available: !user,
      message: user ? 'Username is already taken' : 'Username is available'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get online users count
router.get('/online', auth, async (req, res) => {
  try {
    const onlineCount = await User.countDocuments({ isOnline: true, _id: { $ne: req.user._id } });
    res.json({ count: onlineCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all users (admin only)
router.get('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'co-admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update user role (admin only)
router.patch('/:id/role', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'co-admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const { role } = req.body;
    if (!['user', 'admin', 'co-admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete user (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'co-admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Prevent deleting yourself
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user statistics (admin only)
router.get('/stats', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'co-admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const totalUsers = await User.countDocuments();
    const onlineUsers = await User.countDocuments({ isOnline: true });
    const adminUsers = await User.countDocuments({ role: 'admin' });
    const coAdminUsers = await User.countDocuments({ role: 'co-admin' });
    const regularUsers = await User.countDocuments({ role: 'user' });

    res.json({
      totalUsers,
      onlineUsers,
      offlineUsers: totalUsers - onlineUsers,
      adminUsers,
      coAdminUsers,
      regularUsers
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
