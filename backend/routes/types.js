import express from "express";
import { verifyToken } from "../middleware/auth.js";
import {
  MapType,
  MonitoringStatus,
  MonitoringType,
} from "../models/ForestData.js";

const router = express.Router();

// Map Types
router.get("/map", async (req, res) => {
  try {
    const types = await MapType.find().sort("name");
    res.json(types);
  } catch (error) {
    console.error("Error fetching map types:", error);
    res.status(500).json({
      success: false,
      message: "Không thể lấy danh sách loại bản đồ",
      error: error.message,
    });
  }
});

router.post("/map", verifyToken, async (req, res) => {
  try {
    const { name, description } = req.body;

    // Check if type already exists
    const existingType = await MapType.findOne({ name });
    if (existingType) {
      return res.status(400).json({
        success: false,
        message: "Loại bản đồ này đã tồn tại",
      });
    }

    const type = new MapType({ name, description });
    await type.save();

    res.status(201).json({
      success: true,
      message: "Thêm loại bản đồ thành công",
      data: type,
    });
  } catch (error) {
    console.error("Error creating map type:", error);
    res.status(500).json({
      success: false,
      message: "Không thể thêm loại bản đồ",
      error: error.message,
    });
  }
});

// Monitoring Types
router.get("/monitoring", async (req, res) => {
  try {
    const types = await MonitoringType.find().sort("name");
    res.json(types);
  } catch (error) {
    console.error("Error fetching monitoring types:", error);
    res.status(500).json({
      success: false,
      message: "Không thể lấy danh sách loại điểm quan trắc",
      error: error.message,
    });
  }
});

router.post("/monitoring", verifyToken, async (req, res) => {
  try {
    const { name, description } = req.body;

    // Check if type already exists
    const existingType = await MonitoringType.findOne({ name });
    if (existingType) {
      return res.status(400).json({
        success: false,
        message: "Loại điểm quan trắc này đã tồn tại",
      });
    }

    const type = new MonitoringType({ name, description });
    await type.save();

    res.status(201).json({
      success: true,
      message: "Thêm loại điểm quan trắc thành công",
      data: type,
    });
  } catch (error) {
    console.error("Error creating monitoring type:", error);
    res.status(500).json({
      success: false,
      message: "Không thể thêm loại điểm quan trắc",
      error: error.message,
    });
  }
});

// Monitoring Statuses
router.get("/status", async (req, res) => {
  try {
    const statuses = await MonitoringStatus.find().sort("name");
    res.json(statuses);
  } catch (error) {
    console.error("Error fetching monitoring statuses:", error);
    res.status(500).json({
      success: false,
      message: "Không thể lấy danh sách trạng thái",
      error: error.message,
    });
  }
});

router.post("/status", verifyToken, async (req, res) => {
  try {
    const { name, description, color } = req.body;

    // Check if status already exists
    const existingStatus = await MonitoringStatus.findOne({ name });
    if (existingStatus) {
      return res.status(400).json({
        success: false,
        message: "Trạng thái này đã tồn tại",
      });
    }

    const status = new MonitoringStatus({ name, description, color });
    await status.save();

    res.status(201).json({
      success: true,
      message: "Thêm trạng thái thành công",
      data: status,
    });
  } catch (error) {
    console.error("Error creating monitoring status:", error);
    res.status(500).json({
      success: false,
      message: "Không thể thêm trạng thái",
      error: error.message,
    });
  }
});

export default router;
