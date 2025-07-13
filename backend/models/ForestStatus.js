const mongoose = require("mongoose");

const forestStatusSchema = new mongoose.Schema(
  {
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
    geojson: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Validate that lastSurvey is not in the future
forestStatusSchema.pre("save", function (next) {
  if (this.lastSurvey > new Date()) {
    next(new Error("Ngày khảo sát không thể trong tương lai"));
  }
  next();
});

const ForestStatus = mongoose.model("ForestStatus", forestStatusSchema);

module.exports = ForestStatus;
