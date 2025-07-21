import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { MonitoringPoint } from "../models/ForestData.js";

const router = express.Router();

// Validate monitoring point data
const validatePoint = (data) => {
  if (!data.name || !data.type || !data.status) {
    return "Vui lòng cung cấp đầy đủ thông tin";
  }

  if (!["Thường xuyên", "Định kỳ", "Đột xuất"].includes(data.type)) {
    return "Loại điểm không hợp lệ";
  }

  if (!["Hoạt động", "Tạm dừng", "Ngưng hoạt động"].includes(data.status)) {
    return "Trạng thái không hợp lệ";
  }

  if (
    !data.coordinates ||
    !data.coordinates.type ||
    data.coordinates.type !== "Point"
  ) {
    return "Tọa độ không hợp lệ";
  }

  if (
    !Array.isArray(data.coordinates.coordinates) ||
    data.coordinates.coordinates.length !== 2
  ) {
    return "Tọa độ phải có đúng 2 giá trị [longitude, latitude]";
  }

  const [lng, lat] = data.coordinates.coordinates;
  if (
    isNaN(lng) ||
    isNaN(lat) ||
    lng < -180 ||
    lng > 180 ||
    lat < -90 ||
    lat > 90
  ) {
    return "Giá trị tọa độ không hợp lệ";
  }

  return null;
};

// Get all monitoring points
router.get("/", async (req, res) => {
  try {
    const points = await MonitoringPoint.find().sort("-createdAt");
    res.json(points);
  } catch (error) {
    console.error("Error fetching monitoring points:", error);
    res.status(500).json({
      success: false,
      message: "Không thể lấy danh sách điểm quan trắc",
      error: error.message,
    });
  }
});

// Add new monitoring point
router.post("/", verifyToken, async (req, res) => {
  try {
    // Validate data
    const validationError = validatePoint(req.body);
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const point = new MonitoringPoint({
      ...req.body,
      createdAt: new Date(),
    });

    await point.save();
    res.status(201).json({
      success: true,
      message: "Thêm điểm quan trắc thành công",
      data: point,
    });
  } catch (error) {
    console.error("Error creating monitoring point:", error);
    res.status(500).json({
      success: false,
      message: "Không thể thêm điểm quan trắc",
      error: error.message,
    });
  }
});

// Update monitoring point
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate data
    const validationError = validatePoint(req.body);
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const updatedPoint = await MonitoringPoint.findByIdAndUpdate(
      id,
      {
        ...req.body,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!updatedPoint) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy điểm quan trắc",
      });
    }

    res.json({
      success: true,
      message: "Cập nhật điểm quan trắc thành công",
      data: updatedPoint,
    });
  } catch (error) {
    console.error("Error updating monitoring point:", error);
    res.status(500).json({
      success: false,
      message: "Không thể cập nhật điểm quan trắc",
      error: error.message,
    });
  }
});

// Delete monitoring point
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const deletedPoint = await MonitoringPoint.findByIdAndDelete(id);

    if (!deletedPoint) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy điểm quan trắc",
      });
    }

    res.json({
      success: true,
      message: "Xóa điểm quan trắc thành công",
      data: deletedPoint,
    });
  } catch (error) {
    console.error("Error deleting monitoring point:", error);
    res.status(500).json({
      success: false,
      message: "Không thể xóa điểm quan trắc",
      error: error.message,
    });
  }
});

export default router;
