import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";

const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new Error("Authentication required");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.id);

    if (!admin) {
      throw new Error("Authentication failed");
    }

    // Update last login time
    admin.lastLogin = new Date();
    await admin.save();

    req.token = token;
    req.admin = admin;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Not authorized to access this route",
      error: error.message,
    });
  }
};

export default auth;
