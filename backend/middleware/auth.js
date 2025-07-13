import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";

const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new Error();
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key"
    );
    const admin = await Admin.findOne({ _id: decoded.id });

    if (!admin) {
      throw new Error();
    }

    // Update last login time
    admin.lastLogin = new Date();
    await admin.save();

    req.token = token;
    req.admin = admin;
    next();
  } catch (error) {
    res.status(401).json({ message: "Không có quyền truy cập" });
  }
};

export default auth;
