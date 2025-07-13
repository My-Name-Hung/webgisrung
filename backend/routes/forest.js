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
    const { type, area, quality, lastSurvey, geojson } = req.body;

    const status = new ForestStatus({
      type,
      area: parseFloat(area),
      quality,
      lastSurvey,
      geojson,
    });

    await status.save();
    res.status(201).json(status);
  } catch (error) {
    console.error("Error adding forest status:", error);
    res.status(500).json({ message: "Không thể thêm hiện trạng rừng" });
  }
});

router.get("/status", async (req, res) => {
  try {
    const statuses = await ForestStatus.find();
    res.json(statuses);
  } catch (error) {
    console.error("Error getting forest statuses:", error);
    res
      .status(500)
      .json({ message: "Không thể lấy danh sách hiện trạng rừng" });
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
    const {
      name,
      area,
      type,
      status,
      startDate,
      endDate,
      description,
      geojson,
    } = req.body;

    const planning = new ForestPlanning({
      name,
      area: parseFloat(area),
      type,
      status,
      startDate,
      endDate,
      description,
      geojson,
    });

    await planning.save();
    res.status(201).json(planning);
  } catch (error) {
    console.error("Error adding forest planning:", error);
    res.status(500).json({ message: "Không thể thêm quy hoạch rừng" });
  }
});

router.get("/planning", async (req, res) => {
  try {
    const plannings = await ForestPlanning.find();
    res.json(plannings);
  } catch (error) {
    console.error("Error getting forest plannings:", error);
    res.status(500).json({ message: "Không thể lấy danh sách quy hoạch rừng" });
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
