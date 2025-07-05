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
      console.log("Login failed: Admin not found -", username);
      return res.status(401).json({
        success: false,
        message: "Tên đăng nhập hoặc mật khẩu không đúng",
      });
    }

    // Check password
    const isMatch = await admin.comparePassword(password);
    console.log("Password match result:", isMatch, "for user:", username);

    if (!isMatch) {
      console.log("Login failed: Invalid password for user -", username);
      return res.status(401).json({
        success: false,
        message: "Tên đăng nhập hoặc mật khẩu không đúng",
      });
    }

    // Generate JWT token
    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
      expiresIn: "2d",
    });

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    console.log("Login successful for user:", username);
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
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi trong quá trình đăng nhập",
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
    const allowedUpdates = ["email", "password", "username"];
    const isValidOperation = updates.every((update) =>
      allowedUpdates.includes(update)
    );

    if (!isValidOperation) {
      return res.status(400).json({
        success: false,
        message: "Invalid updates",
      });
    }

    // Check if username is being updated and if it already exists
    if (req.body.username) {
      const existingAdmin = await Admin.findOne({
        username: req.body.username,
        _id: { $ne: req.admin._id }, // Exclude current admin
      });

      if (existingAdmin) {
        return res.status(400).json({
          success: false,
          message: "Tên đăng nhập đã tồn tại",
        });
      }
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
      console.log("Reset password failed: Admin not found -", req.admin.id);
      return res
        .status(404)
        .json({ message: "Không tìm thấy tài khoản admin" });
    }

    // Verify current password using model method
    const isMatch = await admin.comparePassword(currentPassword);
    console.log(
      "Current password match result:",
      isMatch,
      "for user:",
      admin.username
    );

    if (!isMatch) {
      console.log(
        "Reset password failed: Invalid current password for user -",
        admin.username
      );
      return res.status(400).json({ message: "Mật khẩu hiện tại không đúng" });
    }

    // Set new password - will be hashed by pre('save') middleware
    admin.password = newPassword;

    // Save updated password
    await admin.save();
    console.log("Password reset successful for user:", admin.username);

    res.json({ message: "Đổi mật khẩu thành công" });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

export default router;
