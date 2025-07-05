"use strict";

// ES module imports
import compression from "compression";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import mongoose from "mongoose";
import morgan from "morgan";
import { dirname } from "path";
import { fileURLToPath } from "url";

// Import routes and models
import Admin from "./models/Admin.js";
import authRoutes from "./routes/auth.js";
import forestDataRoutes from "./routes/forestData.js";

// Configure environment variables
dotenv.config();

// Get directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Declare process as global
/* global process */

// Create Express app
const app = express();

// Function to create default admin if not exists
const createDefaultAdmin = async () => {
  try {
    const adminExists = await Admin.findOne({ username: "admin" });
    if (!adminExists) {
      const defaultAdmin = new Admin({
        username: "admin",
        password: "admin123",
        email: "admin@forest.gov.vn",
      });
      await defaultAdmin.save();
      console.log("Default admin user created successfully");
    }
  } catch (error) {
    console.error("Error creating default admin:", error);
  }
};

// Function to find an available port
const findAvailablePort = async (startPort) => {
  const net = await import("net");

  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();

    server.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        server.close(() => resolve(findAvailablePort(startPort + 1)));
      } else {
        reject(err);
      }
    });

    server.listen(startPort, () => {
      server.close(() => resolve(startPort));
    });
  });
};

// Function to start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGODB_URI ||
        "mongodb+srv://thanhhung11112002:Hung20021@webgistung.ozdcohi.mongodb.net/?retryWrites=true&w=majority&appName=webgistung"
    );
    console.log("Connected to MongoDB");
    await createDefaultAdmin();

    // Middleware
    app.use(
      cors({
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        credentials: true,
      })
    );
    app.use(helmet());
    app.use(compression());
    app.use(morgan("dev"));
    app.use(express.json({ limit: "50mb" }));
    app.use(express.urlencoded({ extended: true, limit: "50mb" }));

    // Routes
    app.use("/api/auth", authRoutes);
    app.use("/api/forest-data", forestDataRoutes);

    // Error handling middleware
    app.use((err, req, res, next) => {
      console.error(err.stack);
      res.status(500).json({
        success: false,
        message: "Something went wrong!",
        error:
          process.env.NODE_ENV === "development"
            ? err.message
            : "Internal server error",
      });
      next();
    });

    // Start server with port finding
    const desiredPort = process.env.PORT || 5000;
    const availablePort = await findAvailablePort(desiredPort);

    app.listen(availablePort, () => {
      console.log(`Server running on port ${availablePort}`);
      if (availablePort !== desiredPort) {
        console.log(
          `Note: Original port ${desiredPort} was in use, using ${availablePort} instead`
        );
      }
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

// Start the server
startServer();
