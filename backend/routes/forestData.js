import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { ForestStatus } from "../models/ForestData.js";

const router = express.Router();

// Add forest status
router.post("/", verifyToken, async (req, res) => {
  try {
    const forestStatus = new ForestStatus(req.body);
    await forestStatus.save();
    res.status(201).json(forestStatus);
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Không thể thêm hiện trạng rừng",
        error: error.message,
      });
  }
});

// Get all forest statuses
router.get("/", async (req, res) => {
  try {
    const forestStatuses = await ForestStatus.find().sort("-createdAt");
    res.json(forestStatuses);
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Không thể lấy danh sách hiện trạng rừng",
        error: error.message,
      });
  }
});

export default router;
