import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { GeoJSONMap } from "../models/ForestData.js";

const router = express.Router();

// Add GeoJSON map
router.post("/", verifyToken, async (req, res) => {
  try {
    const geoJSONMap = new GeoJSONMap(req.body);
    await geoJSONMap.save();
    res.status(201).json(geoJSONMap);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Không thể thêm bản đồ GeoJSON", error: error.message });
  }
});

// Get all GeoJSON maps
router.get("/", async (req, res) => {
  try {
    const geoJSONMaps = await GeoJSONMap.find().sort("-createdAt");
    res.json(geoJSONMaps);
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Không thể lấy danh sách bản đồ GeoJSON",
        error: error.message,
      });
  }
});

export default router;
