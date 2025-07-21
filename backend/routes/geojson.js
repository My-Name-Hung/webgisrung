import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { GeoJSONMap } from "../models/ForestData.js";

const router = express.Router();

// Validate GeoJSON data
const validateGeoJSON = (data) => {
  if (!data || typeof data !== "object") {
    return "Dữ liệu GeoJSON không hợp lệ";
  }

  if (data.type !== "FeatureCollection") {
    return "GeoJSON phải là kiểu FeatureCollection";
  }

  if (!Array.isArray(data.features)) {
    return "GeoJSON phải có mảng features";
  }

  for (const feature of data.features) {
    if (!feature || typeof feature !== "object") {
      return "Feature không hợp lệ";
    }

    if (feature.type !== "Feature") {
      return "Feature phải có type là 'Feature'";
    }

    if (!feature.geometry || typeof feature.geometry !== "object") {
      return "Feature phải có geometry hợp lệ";
    }

    if (
      !["Point", "LineString", "Polygon", "MultiPolygon"].includes(
        feature.geometry.type
      )
    ) {
      return "Geometry type không được hỗ trợ";
    }

    if (!Array.isArray(feature.geometry.coordinates)) {
      return "Geometry coordinates phải là mảng";
    }
  }

  return null;
};

// Get all GeoJSON maps
router.get("/", async (req, res) => {
  try {
    const geoJSONMaps = await GeoJSONMap.find().sort("-createdAt");
    res.json(geoJSONMaps);
  } catch (error) {
    console.error("Error fetching GeoJSON maps:", error);
    res.status(500).json({
      success: false,
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
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp đầy đủ thông tin",
      });
    }

    // Validate GeoJSON structure
    const validationError = validateGeoJSON(data);
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const geoJSONMap = new GeoJSONMap({
      name,
      type,
      data,
      createdAt: new Date(),
    });

    await geoJSONMap.save();
    res.status(201).json({
      success: true,
      message: "Tải lên bản đồ thành công",
      data: geoJSONMap,
    });
  } catch (error) {
    console.error("Error creating GeoJSON map:", error);
    res.status(500).json({
      success: false,
      message: "Không thể thêm bản đồ GeoJSON",
      error: error.message,
    });
  }
});

// Update GeoJSON map
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, data } = req.body;

    // Validate required fields
    if (!name || !type || !data) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp đầy đủ thông tin",
      });
    }

    // Validate GeoJSON structure
    const validationError = validateGeoJSON(data);
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
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
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy bản đồ",
      });
    }

    res.json({
      success: true,
      message: "Cập nhật bản đồ thành công",
      data: updatedMap,
    });
  } catch (error) {
    console.error("Error updating GeoJSON map:", error);
    res.status(500).json({
      success: false,
      message: "Không thể cập nhật bản đồ",
      error: error.message,
    });
  }
});

// Delete GeoJSON map
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const deletedMap = await GeoJSONMap.findByIdAndDelete(id);

    if (!deletedMap) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy bản đồ",
      });
    }

    res.json({
      success: true,
      message: "Xóa bản đồ thành công",
      data: deletedMap,
    });
  } catch (error) {
    console.error("Error deleting GeoJSON map:", error);
    res.status(500).json({
      success: false,
      message: "Không thể xóa bản đồ",
      error: error.message,
    });
  }
});

export default router;
