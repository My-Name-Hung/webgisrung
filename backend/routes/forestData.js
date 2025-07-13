import express from "express";
import auth from "../middleware/auth.js";

const router = express.Router();

// Get all forest data
router.get("/", auth, async (req, res) => {
  try {
    const query = {};

    // Filter by forest type
    if (req.query.forestType) {
      query.type = req.query.forestType;
    }

    // Filter by status
    if (req.query.status) {
      query.status = req.query.status;
    }

    const forestData = await GeoJSONMap.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(req.query.limit) || 10)
      .skip(parseInt(req.query.skip) || 0);

    const total = await GeoJSONMap.countDocuments(query);

    res.json({
      success: true,
      data: forestData,
      total,
      page:
        Math.floor(
          (parseInt(req.query.skip) || 0) / (parseInt(req.query.limit) || 10)
        ) + 1,
      pages: Math.ceil(total / (parseInt(req.query.limit) || 10)),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching forest data",
      error: error.message,
    });
  }
});

// Get forest data by ID
router.get("/:id", auth, async (req, res) => {
  try {
    const forestData = await GeoJSONMap.findById(req.params.id);

    if (!forestData) {
      return res.status(404).json({
        success: false,
        message: "Forest data not found",
      });
    }

    res.json({
      success: true,
      data: forestData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching forest data",
      error: error.message,
    });
  }
});

// Create new forest data
router.post("/", auth, async (req, res) => {
  try {
    const forestData = new GeoJSONMap(req.body);
    await forestData.save();

    res.status(201).json({
      success: true,
      message: "Forest data created successfully",
      data: forestData,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error creating forest data",
      error: error.message,
    });
  }
});

// Update forest data
router.patch("/:id", auth, async (req, res) => {
  try {
    const updates = Object.keys(req.body);
    const allowedUpdates = ["name", "type", "data"];

    const isValidOperation = updates.every((update) =>
      allowedUpdates.includes(update)
    );

    if (!isValidOperation) {
      return res.status(400).json({
        success: false,
        message: "Invalid updates",
      });
    }

    const forestData = await GeoJSONMap.findById(req.params.id);

    if (!forestData) {
      return res.status(404).json({
        success: false,
        message: "Forest data not found",
      });
    }

    updates.forEach((update) => {
      forestData[update] = req.body[update];
    });

    await forestData.save();

    res.json({
      success: true,
      message: "Forest data updated successfully",
      data: forestData,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error updating forest data",
      error: error.message,
    });
  }
});

// Delete forest data
router.delete("/:id", auth, async (req, res) => {
  try {
    const forestData = await GeoJSONMap.findByIdAndDelete(req.params.id);

    if (!forestData) {
      return res.status(404).json({
        success: false,
        message: "Forest data not found",
      });
    }

    res.json({
      success: true,
      message: "Forest data deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting forest data",
      error: error.message,
    });
  }
});

// Get forest data within a geographic area
router.post("/within", auth, async (req, res) => {
  try {
    const { polygon } = req.body;

    const forestData = await GeoJSONMap.find({
      "data.geometry": {
        $geoWithin: {
          $geometry: {
            type: "Polygon",
            coordinates: polygon,
          },
        },
      },
    });

    res.json({
      success: true,
      data: forestData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching forest data within area",
      error: error.message,
    });
  }
});

export default router;
