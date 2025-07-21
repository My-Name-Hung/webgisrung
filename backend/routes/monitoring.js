import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { MonitoringPoint } from "../models/ForestData.js";

const router = express.Router();

// Add monitoring point
router.post("/", verifyToken, async (req, res) => {
  try {
    const monitoringPoint = new MonitoringPoint(req.body);
    await monitoringPoint.save();
    res.status(201).json(monitoringPoint);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Không thể thêm điểm quan trắc", error: error.message });
  }
});

// Get all monitoring points
router.get("/", async (req, res) => {
  try {
    const monitoringPoints = await MonitoringPoint.find().sort("-createdAt");
    res.json(monitoringPoints);
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Không thể lấy danh sách điểm quan trắc",
        error: error.message,
      });
  }
});

export default router;
