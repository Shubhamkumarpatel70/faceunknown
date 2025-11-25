const express = require('express');
const Report = require('../models/Report');
const ReportRemovalRequest = require('../models/ReportRemovalRequest');
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();

// Report a user
router.post('/', auth, async (req, res) => {
  try {
    const { reportedUserId, reason } = req.body;

    console.log('Report request:', { reportedUserId, reason, reporterId: req.user._id });

    if (!reportedUserId) {
      return res.status(400).json({ message: 'Reported user ID is required' });
    }

    // Validate that reported user exists
    const reportedUser = await User.findById(reportedUserId);
    if (!reportedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (reportedUserId.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot report yourself' });
    }

    // Check if already reported
    const existingReport = await Report.findOne({
      reportedUserId: reportedUserId,
      reportedByUserId: req.user._id
    });

    if (existingReport) {
      return res.status(400).json({ message: 'You have already reported this user' });
    }

    const report = new Report({
      reportedUserId: reportedUserId,
      reportedByUserId: req.user._id,
      reason: reason || 'Inappropriate behavior'
    });

    await report.save();
    console.log('Report saved:', report._id);

    // Check if user has 5 or more reports
    const reportCount = await Report.countDocuments({ reportedUserId: reportedUserId });
    console.log('Report count for user:', reportCount);
    
    if (reportCount >= 5) {
      // Check if removal request already exists
      let existingRequest = await ReportRemovalRequest.findOne({ userId: reportedUserId });
      if (!existingRequest) {
        const removalRequest = new ReportRemovalRequest({
          userId: reportedUserId,
          reportCount
        });
        await removalRequest.save();
        console.log('Removal request created for user with 5+ reports');
      } else if (existingRequest.status === 'pending') {
        // Update report count if request is still pending
        existingRequest.reportCount = reportCount;
        await existingRequest.save();
        console.log('Removal request updated with new report count');
      } else {
        // If request was approved/rejected, create a new one if user still has 5+ reports
        existingRequest.status = 'pending';
        existingRequest.reportCount = reportCount;
        existingRequest.reviewedBy = null;
        existingRequest.reviewedAt = null;
        existingRequest.createdAt = new Date();
        await existingRequest.save();
        console.log('New removal request created after previous was reviewed');
      }
    }

    res.status(201).json({ 
      message: 'User reported successfully', 
      reportCount,
      reportId: report._id
    });
  } catch (error) {
    console.error('Report error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'You have already reported this user' });
    }
    res.status(500).json({ message: error.message || 'Failed to report user' });
  }
});

// Get all reported users (admin only)
router.get('/reported-users', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'co-admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const reports = await Report.aggregate([
      {
        $group: {
          _id: '$reportedUserId',
          reportCount: { $sum: 1 },
          reports: { $push: '$$ROOT' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          userId: '$_id',
          username: '$user.username',
          email: '$user.email',
          name: '$user.name',
          reportCount: 1,
          createdAt: '$user.createdAt',
          isOnline: '$user.isOnline'
        }
      },
      {
        $sort: { reportCount: -1 }
      }
    ]);

    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get report removal requests (admin only)
router.get('/removal-requests', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'co-admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const requests = await ReportRemovalRequest.find({ status: 'pending' })
      .populate('userId', 'username email name')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create removal request (user can request if they have 5+ reports)
router.post('/removal-request', auth, async (req, res) => {
  try {
    const reportCount = await Report.countDocuments({ reportedUserId: req.user._id });
    
    if (reportCount < 5) {
      return res.status(400).json({ message: 'You need at least 5 reports to request removal' });
    }

    // Check if request already exists
    let request = await ReportRemovalRequest.findOne({ userId: req.user._id });
    
    if (request && request.status === 'pending') {
      return res.status(400).json({ message: 'You already have a pending removal request' });
    }

    if (request && request.status === 'approved') {
      // User can create a new request if previous was approved
      request = await ReportRemovalRequest.findOneAndUpdate(
        { userId: req.user._id },
        {
          requestMessage: req.body.message || '',
          reportCount,
          status: 'pending',
          reviewedBy: null,
          reviewedAt: null,
          createdAt: new Date()
        },
        { new: true, upsert: true }
      );
    } else if (request && request.status === 'rejected') {
      // Update existing rejected request
      request.requestMessage = req.body.message || '';
      request.reportCount = reportCount;
      request.status = 'pending';
      request.reviewedBy = null;
      request.reviewedAt = null;
      request.createdAt = new Date();
      await request.save();
    } else {
      // Create new request
      request = new ReportRemovalRequest({
        userId: req.user._id,
        requestMessage: req.body.message || '',
        reportCount
      });
      await request.save();
    }

    res.json({ message: 'Removal request submitted successfully', request });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Handle removal request (approve/reject)
router.patch('/removal-requests/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'co-admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const request = await ReportRemovalRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (status === 'approved') {
      // Delete all reports for this user
      await Report.deleteMany({ reportedUserId: request.userId });
      request.status = 'approved';
    } else {
      request.status = 'rejected';
    }

    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    await request.save();

    res.json({ message: `Request ${status} successfully`, request });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

