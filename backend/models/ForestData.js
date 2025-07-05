import mongoose from "mongoose";

const monitoringPointSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  coordinates: {
    type: {
      type: String,
      enum: ["Point"],
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  },
  description: String,
  status: {
    type: String,
    enum: ["active", "inactive", "maintenance"],
    default: "active",
  },
});

const forestIndicesSchema = new mongoose.Schema({
  canopyCover: {
    type: Number,
    min: 0,
    max: 100,
  },
  biodiversityIndex: {
    type: Number,
    min: 0,
    max: 10,
  },
  healthStatus: {
    type: String,
    enum: ["excellent", "good", "fair", "poor"],
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
});

const forestDataSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: {
        type: String,
        enum: ["Polygon"],
        required: true,
      },
      coordinates: {
        type: [[[Number]]],
        required: true,
      },
    },
    area: {
      type: Number,
      required: true,
      min: 0,
    },
    forestType: {
      type: String,
      required: true,
      enum: ["natural", "plantation", "protected", "production"],
    },
    monitoringPoints: [monitoringPointSchema],
    indices: [forestIndicesSchema],
    status: {
      type: String,
      enum: ["healthy", "threatened", "degraded", "recovering"],
      required: true,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    planningStatus: {
      type: String,
      enum: ["planned", "in-progress", "completed", "cancelled"],
      default: "planned",
    },
    notes: String,
    attachments: [
      {
        name: String,
        url: String,
        type: String,
        uploadDate: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index for geospatial queries
forestDataSchema.index({ location: "2dsphere" });
monitoringPointSchema.index({ coordinates: "2dsphere" });

const ForestData = mongoose.model("ForestData", forestDataSchema);

export default ForestData;
