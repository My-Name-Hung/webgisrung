const express = require("express");
const auth = require("../middleware/auth");
const { MonitoringPoint } = require("../models/ForestData");

const router = express.Router();

// All routes require authentication
router.use(auth);

// Get all monitoring points
router.get("/", async (req, res) => {
  try {
    const points = await MonitoringPoint.find();
    res.json(points);
  } catch (error) {
    res.status(500).json({ message: "Error fetching monitoring points" });
  }
});

// Add new monitoring point
router.post("/", async (req, res) => {
  try {
    const newPoint = new MonitoringPoint(req.body);
    await newPoint.save();
    res.status(201).json(newPoint);
  } catch (error) {
    res.status(400).json({ message: "Error creating monitoring point" });
  }
});

// Update monitoring point
router.put("/:id", async (req, res) => {
  try {
    const point = await MonitoringPoint.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!point) {
      return res.status(404).json({ message: "Monitoring point not found" });
    }
    res.json(point);
  } catch (error) {
    res.status(400).json({ message: "Error updating monitoring point" });
  }
});

// Delete monitoring point
router.delete("/:id", async (req, res) => {
  try {
    const point = await MonitoringPoint.findByIdAndDelete(req.params.id);
    if (!point) {
      return res.status(404).json({ message: "Monitoring point not found" });
    }
    res.json({ message: "Monitoring point deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting monitoring point" });
  }
});

module.exports = router;
