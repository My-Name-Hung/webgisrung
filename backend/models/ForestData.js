import mongoose from "mongoose";

// Add schema for forest types
const forestTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Tên loại rừng không được để trống"],
    trim: true,
    unique: true,
  },
  description: {
    type: String,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Update forestStatusSchema to use dynamic types
const forestStatusSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
  },
  area: {
    type: Number,
    required: true,
    min: 0,
  },
  quality: {
    type: String,
    required: true,
    enum: ["Tốt", "Trung bình", "Kém"],
  },
  lastSurvey: {
    type: Date,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  geojson: {
    type: mongoose.Schema.Types.Mixed,
  },
});

// Add new schemas for forest indices categories and units
const forestCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Tên danh mục không được để trống"],
    trim: true,
    unique: true,
  },
  description: {
    type: String,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const forestUnitSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Tên đơn vị không được để trống"],
    trim: true,
    unique: true,
  },
  description: {
    type: String,
    trim: true,
  },
  symbol: {
    type: String,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Update forestIndicesSchema to use dynamic categories
const forestIndicesSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Tên chỉ số không được để trống"],
    trim: true,
  },
  value: {
    type: Number,
    required: [true, "Giá trị không được để trống"],
  },
  unit: {
    type: String,
    required: [true, "Đơn vị không được để trống"],
    trim: true,
  },
  year: {
    type: Number,
    required: [true, "Năm không được để trống"],
    min: [1900, "Năm không hợp lệ"],
    max: [2100, "Năm không hợp lệ"],
  },
  category: {
    type: String,
    required: [true, "Danh mục không được để trống"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
  },
});

// Middleware to update the updatedAt field on save
forestIndicesSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Add schema for planning types
const planningTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Tên loại quy hoạch không được để trống"],
    trim: true,
    unique: true,
  },
  description: {
    type: String,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Update forestPlanningSchema to use dynamic types
const forestPlanningSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  area: {
    type: Number,
    required: true,
    min: 0,
  },
  type: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    required: true,
    enum: ["planned", "in-progress", "completed", "cancelled"],
    default: "planned",
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  geojson: {
    type: mongoose.Schema.Types.Mixed,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create model for planning types
const PlanningType = mongoose.model("PlanningType", planningTypeSchema);

// Add new schemas for custom types
const mapTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Tên loại bản đồ không được để trống"],
    trim: true,
    unique: true,
  },
  description: {
    type: String,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const monitoringTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Tên loại điểm không được để trống"],
    trim: true,
    unique: true,
  },
  description: {
    type: String,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const monitoringStatusSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Tên trạng thái không được để trống"],
    trim: true,
    unique: true,
  },
  description: {
    type: String,
    trim: true,
  },
  color: {
    type: String,
    default: "#2d5a27",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Update existing schemas to use dynamic types
const geoJSONMapSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Tên bản đồ không được để trống"],
    trim: true,
  },
  type: {
    type: String,
    required: [true, "Loại bản đồ không được để trống"],
  },
  data: {
    type: {
      type: String,
      required: true,
      enum: ["FeatureCollection"],
    },
    features: [
      {
        type: {
          type: String,
          required: true,
          enum: ["Feature"],
        },
        geometry: {
          type: {
            type: String,
            required: true,
            enum: ["Point", "LineString", "Polygon", "MultiPolygon"],
          },
          coordinates: {
            type: Array,
            required: true,
          },
        },
        properties: {
          type: Map,
          of: mongoose.Schema.Types.Mixed,
          default: new Map(),
        },
      },
    ],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
  },
});

const monitoringPointSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Tên điểm không được để trống"],
    trim: true,
  },
  type: {
    type: String,
    required: [true, "Loại điểm không được để trống"],
  },
  status: {
    type: String,
    required: [true, "Trạng thái không được để trống"],
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
  },
});

// Add middleware for updatedAt
geoJSONMapSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

monitoringPointSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Create models
const ForestStatus = mongoose.model("ForestStatus", forestStatusSchema);
const ForestIndices = mongoose.model("ForestIndices", forestIndicesSchema);
const ForestPlanning = mongoose.model("ForestPlanning", forestPlanningSchema);
const MapType = mongoose.model("MapType", mapTypeSchema);
const MonitoringType = mongoose.model("MonitoringType", monitoringTypeSchema);
const MonitoringStatus = mongoose.model(
  "MonitoringStatus",
  monitoringStatusSchema
);
const GeoJSONMap = mongoose.model("GeoJSONMap", geoJSONMapSchema);
const MonitoringPoint = mongoose.model(
  "MonitoringPoint",
  monitoringPointSchema
);
const ForestCategory = mongoose.model("ForestCategory", forestCategorySchema);
const ForestUnit = mongoose.model("ForestUnit", forestUnitSchema);
const ForestType = mongoose.model("ForestType", forestTypeSchema);
const PlanningType = mongoose.model("PlanningType", planningTypeSchema);

export {
  ForestCategory,
  ForestIndices,
  ForestPlanning,
  ForestStatus,
  ForestType,
  ForestUnit,
  GeoJSONMap,
  MapType,
  MonitoringPoint,
  MonitoringStatus,
  MonitoringType,
  PlanningType,
};
