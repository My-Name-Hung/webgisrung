const mongoose = require("mongoose");

const forestStatusSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
  },
  area: {
    type: Number,
    required: true,
  },
  quality: {
    type: String,
    enum: ["Tốt", "Trung bình", "Kém"],
    required: true,
  },
  lastSurvey: {
    type: Date,
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

forestStatusSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("ForestStatus", forestStatusSchema);
