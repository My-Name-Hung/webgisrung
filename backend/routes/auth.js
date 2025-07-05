import bcrypt from "bcryptjs";
import express from "express";
import jwt from "jsonwebtoken";
import auth from "../middleware/auth.js";
import Admin from "../models/Admin.js";

const router = express.Router();

// Login route
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find admin by username
    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check password
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Generate JWT token
    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
      expiresIn: "2d",
    });

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    res.json({
      success: true,
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error during login",
      error: error.message,
    });
  }
});

// Get current admin profile
router.get("/profile", auth, async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id).select("-password");
    res.json({
      success: true,
      admin,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching profile",
      error: error.message,
    });
  }
});

// Update admin profile
router.patch("/profile", auth, async (req, res) => {
  try {
    const updates = Object.keys(req.body);
    const allowedUpdates = ["email", "password"];
    const isValidOperation = updates.every((update) =>
      allowedUpdates.includes(update)
    );

    if (!isValidOperation) {
      return res.status(400).json({
        success: false,
        message: "Invalid updates",
      });
    }

    updates.forEach((update) => {
      req.admin[update] = req.body[update];
    });
    await req.admin.save();

    res.json({
      success: true,
      message: "Profile updated successfully",
      admin: {
        id: req.admin._id,
        username: req.admin.username,
        email: req.admin.email,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error updating profile",
      error: error.message,
    });
  }
});

// Verify token route
router.get("/verify", auth, (req, res) => {
  res.json({ valid: true });
});

// Reset password route
router.post("/reset-password", auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Get admin from database
    const admin = await Admin.findById(req.admin.id);
    if (!admin) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy tài khoản admin" });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Mật khẩu hiện tại không đúng" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(newPassword, salt);

    // Save updated password
    await admin.save();

    res.json({ message: "Đổi mật khẩu thành công" });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

export default router;
