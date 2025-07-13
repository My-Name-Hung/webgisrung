const mongoose = require("mongoose");

const forestPlanningSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  area: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  status: {
    type: String,
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
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

forestPlanningSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("ForestPlanning", forestPlanningSchema);
