import express from "express";
import { verifyToken } from "../middleware/auth.js";
import {
  ForestCategory,
  ForestIndices,
  ForestStatus,
  ForestType,
  ForestUnit,
} from "../models/ForestData.js";

const router = express.Router();

// GET /api/forest/indices - Lấy danh sách chỉ số
router.get("/indices", async (req, res) => {
  try {
    const indices = await ForestIndices.find().sort({ createdAt: -1 });
    res.json(indices);
  } catch (error) {
    res.status(500).json({
      message: "Không thể lấy danh sách chỉ số",
      error: error.message,
    });
  }
});

// GET /api/forest/indices/recent - Lấy chỉ số gần đây
router.get("/indices/recent", async (req, res) => {
  try {
    const recentIndices = await ForestIndices.find()
      .sort({ createdAt: -1 })
      .limit(5);
    res.json(recentIndices);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Không thể lấy chỉ số gần đây", error: error.message });
  }
});

// POST /api/forest/indices - Thêm chỉ số mới
router.post("/indices", verifyToken, async (req, res) => {
  try {
    const { name, value, unit, year, category } = req.body;

    // Validate required fields
    if (!name || !value || !unit || !year || !category) {
      return res
        .status(400)
        .json({ message: "Vui lòng điền đầy đủ thông tin" });
    }

    const newIndex = new ForestIndices({
      name,
      value: parseFloat(value),
      unit,
      year: parseInt(year),
      category,
      createdAt: new Date(),
    });

    await newIndex.save();
    res.status(201).json({ message: "Thêm chỉ số thành công", data: newIndex });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Không thể thêm chỉ số", error: error.message });
  }
});

// PUT /api/forest/indices/:id - Cập nhật chỉ số
router.put("/indices/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, value, unit, year, category } = req.body;

    // Validate required fields
    if (!name || !value || !unit || !year || !category) {
      return res
        .status(400)
        .json({ message: "Vui lòng điền đầy đủ thông tin" });
    }

    const updatedIndex = await ForestIndices.findByIdAndUpdate(
      id,
      {
        name,
        value: parseFloat(value),
        unit,
        year: parseInt(year),
        category,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!updatedIndex) {
      return res.status(404).json({ message: "Không tìm thấy chỉ số" });
    }

    res.json({ message: "Cập nhật chỉ số thành công", data: updatedIndex });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Không thể cập nhật chỉ số", error: error.message });
  }
});

// DELETE /api/forest/indices/:id - Xóa chỉ số
router.delete("/indices/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const deletedIndex = await ForestIndices.findByIdAndDelete(id);

    if (!deletedIndex) {
      return res.status(404).json({ message: "Không tìm thấy chỉ số" });
    }

    res.json({ message: "Xóa chỉ số thành công", data: deletedIndex });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Không thể xóa chỉ số", error: error.message });
  }
});

// Add routes for categories and units
router.get("/categories", async (req, res) => {
  try {
    const categories = await ForestCategory.find().sort("name");
    res.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({
      success: false,
      message: "Không thể lấy danh sách danh mục",
      error: error.message,
    });
  }
});

router.post("/categories", verifyToken, async (req, res) => {
  try {
    const { name, description } = req.body;

    // Check if category already exists
    const existingCategory = await ForestCategory.findOne({ name });
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: "Danh mục này đã tồn tại",
      });
    }

    const category = new ForestCategory({ name, description });
    await category.save();

    res.status(201).json({
      success: true,
      message: "Thêm danh mục thành công",
      data: category,
    });
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({
      success: false,
      message: "Không thể thêm danh mục",
      error: error.message,
    });
  }
});

router.get("/units", async (req, res) => {
  try {
    const units = await ForestUnit.find().sort("name");
    res.json(units);
  } catch (error) {
    console.error("Error fetching units:", error);
    res.status(500).json({
      success: false,
      message: "Không thể lấy danh sách đơn vị",
      error: error.message,
    });
  }
});

router.post("/units", verifyToken, async (req, res) => {
  try {
    const { name, description, symbol } = req.body;

    // Check if unit already exists
    const existingUnit = await ForestUnit.findOne({ name });
    if (existingUnit) {
      return res.status(400).json({
        success: false,
        message: "Đơn vị này đã tồn tại",
      });
    }

    const unit = new ForestUnit({ name, description, symbol });
    await unit.save();

    res.status(201).json({
      success: true,
      message: "Thêm đơn vị thành công",
      data: unit,
    });
  } catch (error) {
    console.error("Error creating unit:", error);
    res.status(500).json({
      success: false,
      message: "Không thể thêm đơn vị",
      error: error.message,
    });
  }
});

// Forest Types
router.get("/types", async (req, res) => {
  try {
    const types = await ForestType.find().sort("name");
    res.json(types);
  } catch (error) {
    console.error("Error fetching forest types:", error);
    res.status(500).json({
      success: false,
      message: "Không thể lấy danh sách loại rừng",
      error: error.message,
    });
  }
});

router.post("/types", verifyToken, async (req, res) => {
  try {
    const { name, description } = req.body;

    // Check if type already exists
    const existingType = await ForestType.findOne({ name });
    if (existingType) {
      return res.status(400).json({
        success: false,
        message: "Loại rừng này đã tồn tại",
      });
    }

    const type = new ForestType({ name, description });
    await type.save();

    res.status(201).json({
      success: true,
      message: "Thêm loại rừng thành công",
      data: type,
    });
  } catch (error) {
    console.error("Error creating forest type:", error);
    res.status(500).json({
      success: false,
      message: "Không thể thêm loại rừng",
      error: error.message,
    });
  }
});

// Forest Status
router.get("/status", async (req, res) => {
  try {
    const statuses = await ForestStatus.find().sort("-createdAt");
    res.json(statuses);
  } catch (error) {
    console.error("Error fetching forest statuses:", error);
    res.status(500).json({
      success: false,
      message: "Không thể lấy danh sách hiện trạng rừng",
      error: error.message,
    });
  }
});

router.post("/status", verifyToken, async (req, res) => {
  try {
    const { type, area, quality, lastSurvey, geojson } = req.body;

    const status = new ForestStatus({
      type,
      area,
      quality,
      lastSurvey,
      geojson,
    });
    await status.save();

    res.status(201).json({
      success: true,
      message: "Thêm hiện trạng rừng thành công",
      data: status,
    });
  } catch (error) {
    console.error("Error creating forest status:", error);
    res.status(500).json({
      success: false,
      message: "Không thể thêm hiện trạng rừng",
      error: error.message,
    });
  }
});

router.put("/status/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { type, area, quality, lastSurvey, geojson } = req.body;

    const status = await ForestStatus.findByIdAndUpdate(
      id,
      {
        type,
        area,
        quality,
        lastSurvey,
        geojson,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!status) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy hiện trạng rừng",
      });
    }

    res.json({
      success: true,
      message: "Cập nhật hiện trạng rừng thành công",
      data: status,
    });
  } catch (error) {
    console.error("Error updating forest status:", error);
    res.status(500).json({
      success: false,
      message: "Không thể cập nhật hiện trạng rừng",
      error: error.message,
    });
  }
});

router.delete("/status/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const status = await ForestStatus.findByIdAndDelete(id);

    if (!status) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy hiện trạng rừng",
      });
    }

    res.json({
      success: true,
      message: "Xóa hiện trạng rừng thành công",
      data: status,
    });
  } catch (error) {
    console.error("Error deleting forest status:", error);
    res.status(500).json({
      success: false,
      message: "Không thể xóa hiện trạng rừng",
      error: error.message,
    });
  }
});

export default router;
