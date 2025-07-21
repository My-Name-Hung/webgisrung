import mongoose from "mongoose";

const forestStatusSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ["Rừng tự nhiên", "Rừng trồng", "Rừng phòng hộ", "Rừng đặc dụng"],
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
});

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
    enum: ["Độ che phủ", "Chất lượng", "Đa dạng sinh học", "Bảo tồn"],
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
    enum: ["Trồng rừng", "Bảo tồn", "Phát triển", "Phục hồi"],
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const monitoringPointSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: ["Thường xuyên", "Định kỳ", "Đột xuất"],
  },
  status: {
    type: String,
    required: true,
    enum: ["Hoạt động", "Tạm dừng", "Ngưng hoạt động"],
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
});

const geoJSONMapSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: ["Hiện trạng", "Quy hoạch", "Điểm quan trắc"],
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create indexes for geospatial queries
monitoringPointSchema.index({ coordinates: "2dsphere" });

// Create models
const ForestStatus = mongoose.model("ForestStatus", forestStatusSchema);
const ForestIndices = mongoose.model("ForestIndices", forestIndicesSchema);
const ForestPlanning = mongoose.model("ForestPlanning", forestPlanningSchema);
const MonitoringPoint = mongoose.model(
  "MonitoringPoint",
  monitoringPointSchema
);
const GeoJSONMap = mongoose.model("GeoJSONMap", geoJSONMapSchema);

export {
  ForestIndices,
  ForestPlanning,
  ForestStatus,
  GeoJSONMap,
  MonitoringPoint,
};
