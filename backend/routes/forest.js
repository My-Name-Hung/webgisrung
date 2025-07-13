import express from "express";
import auth from "../middleware/auth.js";
import {
  ForestIndices,
  ForestPlanning,
  ForestStatus,
  MonitoringPoint,
} from "../models/ForestData.js";

const router = express.Router();

// Forest Status Routes
router.post("/status", auth, async (req, res) => {
  try {
    const forestStatus = new ForestStatus(req.body);
    await forestStatus.save();
    res.status(201).json(forestStatus);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get("/status", async (req, res) => {
  try {
    const forestStatus = await ForestStatus.find().sort("-createdAt");
    res.json(forestStatus);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Forest Indices Routes
router.post("/indices", auth, async (req, res) => {
  try {
    const forestIndices = new ForestIndices(req.body);
    await forestIndices.save();
    res.status(201).json(forestIndices);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get("/indices", async (req, res) => {
  try {
    const forestIndices = await ForestIndices.find().sort("-year");
    res.json(forestIndices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Forest Planning Routes
router.post("/planning", auth, async (req, res) => {
  try {
    const forestPlanning = new ForestPlanning(req.body);
    await forestPlanning.save();
    res.status(201).json(forestPlanning);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get("/planning", async (req, res) => {
  try {
    const forestPlanning = await ForestPlanning.find().sort("-createdAt");
    res.json(forestPlanning);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Monitoring Points Routes
router.post("/monitoring", auth, async (req, res) => {
  try {
    const monitoringPoint = new MonitoringPoint(req.body);
    await monitoringPoint.save();
    res.status(201).json(monitoringPoint);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get("/monitoring", async (req, res) => {
  try {
    const monitoringPoints = await MonitoringPoint.find().sort("-createdAt");
    res.json(monitoringPoints);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Dashboard Data Route
router.get("/dashboard", async (req, res) => {
  try {
    const [status, indices, monitoring, planning] = await Promise.all([
      ForestStatus.find().sort("-createdAt"),
      ForestIndices.find().sort("-year"),
      MonitoringPoint.find().sort("-createdAt"),
      ForestPlanning.find().sort("-createdAt"),
    ]);

    res.json({
      status,
      indices,
      monitoring,
      planning,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
