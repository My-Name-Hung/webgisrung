import express from "express";
import jwt from "jsonwebtoken";
import { verifyToken } from "../middleware/auth.js";
import Admin from "../models/Admin.js";

const router = express.Router();

// Register admin
router.post("/register", verifyToken, async (req, res) => {
  try {
    const { username, password, email } = req.body;

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ username });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: "Tên đăng nhập đã được sử dụng",
      });
    }

    // Create new admin
    const admin = new Admin({
      username,
      password,
      email,
    });

    await admin.save();
    res.status(201).json({
      success: true,
      message: "Tạo tài khoản thành công",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Không thể tạo tài khoản",
      error: error.message,
    });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find admin by username
    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Tên đăng nhập hoặc mật khẩu không đúng",
      });
    }

    // Check password
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Tên đăng nhập hoặc mật khẩu không đúng",
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: admin._id },
      process.env.JWT_SECRET || "your-secret-key",
      {
        expiresIn: "24h",
      }
    );

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Return response with token and admin info directly
    res.json({
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        lastLogin: admin.lastLogin,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi đăng nhập",
      error: error.message,
    });
  }
});

// Get current admin
router.get("/me", verifyToken, async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin._id).select("-password");
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy admin",
      });
    }
    res.json({
      success: true,
      data: admin,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Không thể lấy thông tin admin",
      error: error.message,
    });
  }
});

// Update admin profile
router.put("/profile", verifyToken, async (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body;
    const admin = await Admin.findById(req.admin._id);

    if (email) {
      admin.email = email;
    }

    if (currentPassword && newPassword) {
      const isMatch = await admin.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: "Mật khẩu hiện tại không đúng",
        });
      }
      admin.password = newPassword;
    }

    await admin.save();
    res.json({
      success: true,
      message: "Cập nhật thông tin thành công",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Không thể cập nhật thông tin",
      error: error.message,
    });
  }
});

export default router;
