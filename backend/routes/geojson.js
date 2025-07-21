import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { GeoJSONMap } from "../models/ForestData.js";

const router = express.Router();

// Get all GeoJSON maps
router.get("/", async (req, res) => {
  try {
    const geoJSONMaps = await GeoJSONMap.find().sort("-createdAt");
    res.json(geoJSONMaps);
  } catch (error) {
    res.status(500).json({
      message: "Không thể lấy danh sách bản đồ GeoJSON",
      error: error.message,
    });
  }
});

// Add new GeoJSON map
router.post("/", verifyToken, async (req, res) => {
  try {
    const { name, type, data } = req.body;

    // Validate required fields
    if (!name || !type || !data) {
      return res
        .status(400)
        .json({ message: "Vui lòng cung cấp đầy đủ thông tin" });
    }

    // Validate GeoJSON structure
    if (!data.type || !data.features) {
      return res.status(400).json({ message: "Dữ liệu GeoJSON không hợp lệ" });
    }

    const geoJSONMap = new GeoJSONMap({
      name,
      type,
      data,
      createdAt: new Date(),
    });

    await geoJSONMap.save();
    res.status(201).json(geoJSONMap);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Không thể thêm bản đồ GeoJSON", error: error.message });
  }
});

// Update GeoJSON map
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, data } = req.body;

    // Validate required fields
    if (!name || !type || !data) {
      return res
        .status(400)
        .json({ message: "Vui lòng cung cấp đầy đủ thông tin" });
    }

    // Validate GeoJSON structure
    if (!data.type || !data.features) {
      return res.status(400).json({ message: "Dữ liệu GeoJSON không hợp lệ" });
    }

    const updatedMap = await GeoJSONMap.findByIdAndUpdate(
      id,
      {
        name,
        type,
        data,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!updatedMap) {
      return res.status(404).json({ message: "Không tìm thấy bản đồ" });
    }

    res.json(updatedMap);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Không thể cập nhật bản đồ", error: error.message });
  }
});

// Delete GeoJSON map
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const deletedMap = await GeoJSONMap.findByIdAndDelete(id);

    if (!deletedMap) {
      return res.status(404).json({ message: "Không tìm thấy bản đồ" });
    }

    res.json({ message: "Xóa bản đồ thành công" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Không thể xóa bản đồ", error: error.message });
  }
});

export default router;
