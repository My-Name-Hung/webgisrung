const express = require('express');
const auth = require('../middleware/auth');
const { ForestIndex, ForestStatus, ForestPlanning } = require('../models/ForestData');

const router = express.Router();

// All routes require authentication
router.use(auth);

// Forest Indices
router.get('/indices', async (req, res) => {
  try {
    const indices = await ForestIndex.find();
    res.json(indices);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching forest indices' });
  }
});

router.post('/indices', async (req, res) => {
  try {
    const newIndex = new ForestIndex(req.body);
    await newIndex.save();
    res.status(201).json(newIndex);
  } catch (error) {
    res.status(400).json({ message: 'Error creating forest index' });
  }
});

// Forest Status
router.get('/status', async (req, res) => {
  try {
    const status = await ForestStatus.find();
    res.json(status);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching forest status' });
  }
});

router.post('/status', async (req, res) => {
  try {
    const newStatus = new ForestStatus(req.body);
    await newStatus.save();
    res.status(201).json(newStatus);
  } catch (error) {
    res.status(400).json({ message: 'Error creating forest status' });
  }
});

// Forest Planning
router.get('/planning', async (req, res) => {
  try {
    const planning = await ForestPlanning.find();
    res.json(planning);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching forest planning' });
  }
});

router.post('/planning', async (req, res) => {
  try {
    const newPlanning = new ForestPlanning(req.body);
    await newPlanning.save();
    res.status(201).json(newPlanning);
  } catch (error) {
    res.status(400).json({ message: 'Error creating forest planning' });
  }
});

// Dashboard data
router.get('/dashboard', async (req, res) => {
  try {
    const [indices, status, planning] = await Promise.all([
      ForestIndex.find(),
      ForestStatus.find(),
      ForestPlanning.find()
    ]);

    res.json({
      indices,
      status,
      planning
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching dashboard data' });
  }
});

module.exports = router; 