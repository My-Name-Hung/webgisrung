import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { ForestIndices } from "../models/ForestData.js";

const router = express.Router();

// GET /api/forest/indices - Lấy danh sách chỉ số
router.get("/indices", async (req, res) => {
  try {
    const indices = await ForestIndices.find().sort({ createdAt: -1 });
    res.json(indices);
  } catch (error) {
    res
      .status(500)
      .json({
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

export default router;
