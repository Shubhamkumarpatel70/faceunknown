const express = require('express');
const RestrictedWord = require('../models/RestrictedWord');
const auth = require('../middleware/auth');
const router = express.Router();

// Get all restricted words (admin only)
router.get('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'co-admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const words = await RestrictedWord.find().sort({ createdAt: -1 });
    res.json(words);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add restricted word (admin only)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'co-admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { word } = req.body;
    if (!word || word.trim() === '') {
      return res.status(400).json({ message: 'Word is required' });
    }

    const restrictedWord = new RestrictedWord({
      word: word.trim().toLowerCase()
    });

    await restrictedWord.save();
    res.status(201).json(restrictedWord);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Word already exists' });
    }
    res.status(500).json({ message: error.message });
  }
});

// Delete restricted word (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'co-admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const word = await RestrictedWord.findByIdAndDelete(req.params.id);
    if (!word) {
      return res.status(404).json({ message: 'Word not found' });
    }

    res.json({ message: 'Word deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

