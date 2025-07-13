const mongoose = require("mongoose");

const forestPlanningSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
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
      trim: true,
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

// Validate that endDate is after startDate
forestPlanningSchema.pre("save", function (next) {
  if (this.endDate <= this.startDate) {
    next(new Error("Ngày kết thúc phải sau ngày bắt đầu"));
  }
  next();
});

const ForestPlanning = mongoose.model("ForestPlanning", forestPlanningSchema);

module.exports = ForestPlanning;
