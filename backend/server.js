"use strict";

// ES module imports
import compression from "compression";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import http from "http";
import https from "https";
import mongoose from "mongoose";
import morgan from "morgan";
import cron from "node-cron";
import { dirname } from "path";
import { fileURLToPath } from "url";

// Import routes and models
import Admin from "./models/Admin.js";
import authRoutes from "./routes/auth.js";
import forestRoutes from "./routes/forest.js";
import forestDataRoutes from "./routes/forestData.js";
import geojsonRoutes from "./routes/geojson.js";
import monitoringRoutes from "./routes/monitoring.js";
import typesRoutes from "./routes/types.js";

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

// Cron jobs configuration
const setupCronJobs = () => {
  // Ping server every 5 minutes to prevent sleep
  cron.schedule("*/5 * * * *", () => {
    const serverUrl = process.env.SERVER_URL || "http://localhost:5000";
    const httpModule = serverUrl.startsWith("https") ? https : http;

    httpModule
      .get(serverUrl, (res) => {
        if (res.statusCode === 200) {
          console.log("Server pinged successfully to prevent sleep.");
        } else {
          console.error(
            `Server ping failed with status code: ${res.statusCode}`
          );
        }
      })
      .on("error", (error) => {
        console.error("Error pinging server:", error);
      });
  });

  // Daily forest data backup at 00:00 (midnight)
  cron.schedule("0 0 * * *", async () => {
    try {
      console.log("Starting daily forest data backup...");
      // Backup MongoDB collections
      const collections = [
        "foreststatuses",
        "forestindices",
        "monitoringpoints",
        "forestplans",
        "geojsonmaps",
      ];
      for (const collection of collections) {
        try {
          // Add timestamp to backup name
          const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
          const backupPath = `./backups/${collection}_${timestamp}.json`;

          console.log(`Backing up ${collection}...`);
          // Add your backup logic here for each collection
          // Example: await mongoExport(collection, backupPath);
        } catch (error) {
          console.error(`Error backing up ${collection}:`, error);
        }
      }
      console.log("Daily forest data backup completed successfully");
    } catch (error) {
      console.error("Error during daily backup:", error);
    }
  });

  // Weekly forest report generation every Sunday at 23:00
  cron.schedule("0 23 * * 0", async () => {
    try {
      console.log("Starting weekly forest report generation...");

      // 1. Collect forest statistics
      const stats = {
        totalArea: 0,
        forestTypes: {},
        qualityDistribution: {},
        monitoringPointsStatus: {},
        weeklyChanges: {},
      };

      // Add your statistics collection logic here
      // Example:
      // stats.totalArea = await calculateTotalForestArea();
      // stats.forestTypes = await getForestTypeDistribution();
      // etc...

      // 2. Generate PDF report
      // Example:
      // await generatePDFReport(stats, `./reports/weekly_report_${new Date().toISOString()}.pdf`);

      console.log("Weekly forest report generated successfully");
    } catch (error) {
      console.error("Error generating weekly report:", error);
    }
  });

  // Monthly data cleanup and optimization on 1st day at 02:00
  cron.schedule("0 2 1 * *", async () => {
    try {
      console.log("Starting monthly data maintenance...");

      // 1. Clean up old/temporary data
      // Example: Remove old backup files
      // await cleanupOldBackups('./backups', 30); // Keep last 30 days

      // 2. Archive old monitoring data
      // Example: Move old monitoring points to archive
      // await archiveOldMonitoringData(6); // Archive data older than 6 months

      // 3. Optimize database
      // Example: Compact and repair MongoDB collections
      const collections = [
        "foreststatuses",
        "forestindices",
        "monitoringpoints",
      ];
      for (const collection of collections) {
        try {
          console.log(`Optimizing ${collection} collection...`);
          // await mongoose.connection.db.command({ compact: collection });
        } catch (error) {
          console.error(`Error optimizing ${collection}:`, error);
        }
      }

      console.log("Monthly data maintenance completed successfully");
    } catch (error) {
      console.error("Error during monthly maintenance:", error);
    }
  });

  // Check and update forest monitoring data every 6 hours
  cron.schedule("0 */6 * * *", async () => {
    try {
      console.log("Starting forest monitoring update...");

      // 1. Update monitoring points status
      // Example: Check and update status based on last data received
      // await updateMonitoringPointsStatus();

      // 2. Check for critical conditions
      // Example: Check for fire risks, illegal activities, etc.
      // const alerts = await checkForestAlerts();
      // if (alerts.length > 0) {
      //   await sendAlertNotifications(alerts);
      // }

      // 3. Update forest health indices
      // Example: Calculate and update forest health metrics
      // await updateForestHealthIndices();

      // 4. Generate monitoring summary
      const summary = {
        timestamp: new Date(),
        activePoints: 0,
        alerts: [],
        healthStatus: {},
      };

      // Add your monitoring summary logic here
      // Example:
      // summary.activePoints = await countActiveMonitoringPoints();
      // summary.alerts = await getRecentAlerts();
      // summary.healthStatus = await getForestHealthStatus();

      console.log("Forest monitoring update completed", summary);
    } catch (error) {
      console.error("Error during forest monitoring update:", error);
    }
  });

  // Daily data validation at 01:00
  cron.schedule("0 1 * * *", async () => {
    try {
      console.log("Starting daily data validation...");

      // 1. Validate forest area data
      // Example: Check for inconsistencies in area calculations
      // const areaValidation = await validateForestAreas();

      // 2. Validate monitoring points data
      // Example: Check for missing or invalid readings
      // const monitoringValidation = await validateMonitoringData();

      // 3. Validate GeoJSON data
      // Example: Check for invalid coordinates or properties
      // const geojsonValidation = await validateGeoJSONData();

      // 4. Generate validation report
      const validationReport = {
        timestamp: new Date(),
        errors: [],
        warnings: [],
        fixes: [],
      };

      // Add your validation logic here
      // Example:
      // if (areaValidation.errors.length > 0) validationReport.errors.push(...areaValidation.errors);
      // if (monitoringValidation.warnings.length > 0) validationReport.warnings.push(...monitoringValidation.warnings);

      console.log("Daily data validation completed", validationReport);
    } catch (error) {
      console.error("Error during data validation:", error);
    }
  });
};

// Start server with port finding
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
        origin: ["https://adminwebgis.netlify.app", "http://localhost:5173"],
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
    app.use("/api/forest", forestRoutes);
    app.use("/api/geojson", geojsonRoutes);
    app.use("/api/monitoring", monitoringRoutes);
    app.use("/api/types", typesRoutes);

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
      // Setup cron jobs after server starts
      setupCronJobs();
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

// Start the server
startServer();
