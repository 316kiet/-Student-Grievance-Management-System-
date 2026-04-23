// server/routes/grievanceRoutes.js
const express = require('express');
const router = express.Router();
const Grievance = require('../models/Grievance');
const { protect } = require('../middleware/authMiddleware');

// Get all grievances of the logged in user
// @route   GET /api/grievances
router.get('/', protect, async (req, res) => {
  try {
    // If the instruction means viewing all complains of the matching student
    const grievances = await Grievance.find({ studentId: req.user }).sort({ date: -1 });
    res.json(grievances);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Search grievances by title for the logged in user
// Note: order is important, /search must be before /:id so it's not treated as an ID
// @route   GET /api/grievances/search?title=xyz
router.get('/search', protect, async (req, res) => {
  try {
    const { title } = req.query;
    if (!title) {
      return res.status(400).json({ message: 'Search title is required' });
    }
    
    // Case-insensitive regex search
    const grievances = await Grievance.find({
      studentId: req.user,
      title: { $regex: title, $options: 'i' }
    });
    
    res.json(grievances);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a specific grievance by ID
// @route   GET /api/grievances/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const grievance = await Grievance.findById(req.params.id);

    if (!grievance) {
      return res.status(404).json({ message: 'Grievance not found' });
    }

    // Check for user ownership
    if (grievance.studentId.toString() !== req.user) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    res.json(grievance);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Submit a new grievance
// @route   POST /api/grievances
router.post('/', protect, async (req, res) => {
  try {
    const { title, description, category } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const grievance = await Grievance.create({
      title,
      description,
      category,
      studentId: req.user,
    });

    res.status(201).json(grievance);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a grievance
// @route   PUT /api/grievances/:id
router.put('/:id', protect, async (req, res) => {
  try {
    const grievance = await Grievance.findById(req.params.id);

    if (!grievance) {
      return res.status(404).json({ message: 'Grievance not found' });
    }

    // Check for user ownership
    if (grievance.studentId.toString() !== req.user) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    const updatedGrievance = await Grievance.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true } // Create if doesn't exist? No, just return new. Note: restrict what can be updated if needed.
    );

    res.json(updatedGrievance);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a grievance
// @route   DELETE /api/grievances/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const grievance = await Grievance.findById(req.params.id);

    if (!grievance) {
      return res.status(404).json({ message: 'Grievance not found' });
    }

    // Check for user ownership
    if (grievance.studentId.toString() !== req.user) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    await grievance.deleteOne(); // Use deleteOne instead of remove due to mongoose updates

    res.json({ id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
