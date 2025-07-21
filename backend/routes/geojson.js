const express = require("express");
const auth = require("../middleware/auth");
const { GeoJSON } = require("../models/ForestData");

const router = express.Router();

// All routes require authentication
router.use(auth);

// Get all GeoJSON data
router.get("/", async (req, res) => {
  try {
    const geojsonData = await GeoJSON.find();
    res.json(geojsonData);
  } catch (error) {
    res.status(500).json({ message: "Error fetching GeoJSON data" });
  }
});

// Get specific GeoJSON by name
router.get("/:name", async (req, res) => {
  try {
    const geojson = await GeoJSON.findOne({ name: req.params.name });
    if (!geojson) {
      return res.status(404).json({ message: "GeoJSON not found" });
    }
    res.json(geojson);
  } catch (error) {
    res.status(500).json({ message: "Error fetching GeoJSON data" });
  }
});

// Upload new GeoJSON
router.post("/", async (req, res) => {
  try {
    const { name, type, data } = req.body;

    // Validate GeoJSON structure
    if (!data.type || !data.features) {
      return res.status(400).json({ message: "Invalid GeoJSON format" });
    }

    const newGeoJSON = new GeoJSON({
      name,
      type,
      data,
    });

    await newGeoJSON.save();
    res.status(201).json(newGeoJSON);
  } catch (error) {
    res.status(400).json({ message: "Error uploading GeoJSON" });
  }
});

// Update GeoJSON
router.put("/:name", async (req, res) => {
  try {
    const { data } = req.body;

    // Validate GeoJSON structure
    if (!data.type || !data.features) {
      return res.status(400).json({ message: "Invalid GeoJSON format" });
    }

    const geojson = await GeoJSON.findOneAndUpdate(
      { name: req.params.name },
      { data, uploadDate: Date.now() },
      { new: true }
    );

    if (!geojson) {
      return res.status(404).json({ message: "GeoJSON not found" });
    }

    res.json(geojson);
  } catch (error) {
    res.status(400).json({ message: "Error updating GeoJSON" });
  }
});

// Delete GeoJSON
router.delete("/:name", async (req, res) => {
  try {
    const geojson = await GeoJSON.findOneAndDelete({ name: req.params.name });
    if (!geojson) {
      return res.status(404).json({ message: "GeoJSON not found" });
    }
    res.json({ message: "GeoJSON deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting GeoJSON" });
  }
});

module.exports = router;
