import { useTour } from "@reactour/tour";
import * as turf from "@turf/turf";
import axios from "axios";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import React, { useEffect, useRef, useState } from "react";
import { FaFileUpload, FaMapMarkedAlt, FaTrash } from "react-icons/fa";
import shp from "shpjs";
import { forestMapSteps } from "../../config/tourSteps";
import "./ForestMap.css";

const ForestMap = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [mapName, setMapName] = useState("");
  const [mapType, setMapType] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [previewData, setPreviewData] = useState(null);
  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const previewLayer = useRef(null);
  const { setSteps, setIsOpen } = useTour();

  useEffect(() => {
    // Initialize Leaflet map
    if (!leafletMap.current && mapRef.current) {
      leafletMap.current = L.map(mapRef.current).setView(
        [20.865139, 106.68383],
        11
      );
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(leafletMap.current);
    }

    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
      }
    };
  }, []);

  useEffect(() => {
    // Start tour when preview data is loaded
    if (previewData) {
      setSteps(forestMapSteps);
      setIsOpen(true);
    }
  }, [previewData, setSteps, setIsOpen]);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    setError("");

    try {
      let geoJsonData;

      if (file.name.endsWith(".geojson")) {
        const text = await file.text();
        geoJsonData = JSON.parse(text);
      } else if (file.name.endsWith(".csv")) {
        const text = await file.text();
        const rows = text.split("\\n").map((row) => row.split(","));
        const headers = rows[0];
        const features = rows
          .slice(1)
          .map((row) => {
            const lat = parseFloat(row[headers.indexOf("latitude")]);
            const lng = parseFloat(row[headers.indexOf("longitude")]);
            if (isNaN(lat) || isNaN(lng)) return null;

            return turf.point([lng, lat]);
          })
          .filter((f) => f !== null);

        geoJsonData = turf.featureCollection(features);
      } else if (file.name.endsWith(".zip")) {
        const arrayBuffer = await file.arrayBuffer();
        geoJsonData = await shp(arrayBuffer);
      } else {
        throw new Error("Unsupported file format");
      }

      // Update preview on map
      if (previewLayer.current) {
        leafletMap.current.removeLayer(previewLayer.current);
      }
      previewLayer.current = L.geoJSON(geoJsonData).addTo(leafletMap.current);
      leafletMap.current.fitBounds(previewLayer.current.getBounds());

      setPreviewData(geoJsonData);
    } catch (err) {
      setError("Không thể đọc file. Vui lòng kiểm tra định dạng file.");
      setSelectedFile(null);
      setPreviewData(null);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile || !mapName || !mapType || !previewData) {
      setError("Vui lòng điền đầy đủ thông tin và chọn file hợp lệ");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await axios.post(`${import.meta.env.VITE_SERVER_URL}/api/geojson`, {
        name: mapName,
        type: mapType,
        data: previewData,
      });

      setSuccess("Tải lên bản đồ thành công");
      setMapName("");
      setMapType("");
      setSelectedFile(null);
      setPreviewData(null);

      if (previewLayer.current) {
        leafletMap.current.removeLayer(previewLayer.current);
        previewLayer.current = null;
      }
    } catch (err) {
      setError("Không thể tải lên bản đồ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forestmap-container">
      <h1 className="title-forestmap">Quản lý bản đồ</h1>

      <div className="upload-section-forestmap">
        <h2>Tải lên bản đồ mới</h2>

        {error && <div className="error-forestmap">{error}</div>}
        {success && <div className="success-forestmap">{success}</div>}

        <form onSubmit={handleUpload} className="upload-form-forestmap">
          <div className="form-group-forestmap">
            <label htmlFor="mapName">Tên bản đồ</label>
            <input
              type="text"
              id="mapName"
              value={mapName}
              onChange={(e) => setMapName(e.target.value)}
              className="input-forestmap"
              placeholder="Nhập tên bản đồ"
            />
          </div>

          <div className="form-group-forestmap">
            <label htmlFor="mapType">Loại bản đồ</label>
            <select
              id="mapType"
              value={mapType}
              onChange={(e) => setMapType(e.target.value)}
              className="input-forestmap"
            >
              <option value="">Chọn loại bản đồ</option>
              <option value="Hiện trạng">Hiện trạng</option>
              <option value="Quy hoạch">Quy hoạch</option>
              <option value="Điểm quan trắc">Điểm quan trắc</option>
            </select>
          </div>

          <div className="form-group-forestmap">
            <label>File dữ liệu</label>
            <div className="file-input-forestmap">
              <input
                type="file"
                accept=".geojson,.csv,.zip"
                onChange={handleFileChange}
                style={{ display: "none" }}
                id="fileInput"
              />
              <label
                htmlFor="fileInput"
                style={{ cursor: "pointer", display: "block" }}
              >
                <FaFileUpload
                  style={{ fontSize: "2rem", marginBottom: "0.5rem" }}
                />
                <div>Kéo thả file hoặc click để chọn</div>
                <div style={{ fontSize: "0.8rem", color: "#666" }}>
                  (Hỗ trợ: GeoJSON, CSV, Shapefile)
                </div>
              </label>
            </div>
            {selectedFile && (
              <div className="file-preview-forestmap">
                <div>File đã chọn: {selectedFile.name}</div>
                <div>
                  Kích thước: {(selectedFile.size / 1024).toFixed(2)} KB
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="upload-button-forestmap"
            disabled={loading || !selectedFile || !previewData}
          >
            {loading ? "Đang tải lên..." : "Tải lên"}
          </button>
        </form>
      </div>

      <div className="preview-section-forestmap">
        <h2>Xem trước bản đồ</h2>
        <div className="map-container-forestmap" ref={mapRef}>
          <div className="map-controls-forestmap">
            <button
              className="map-control-button"
              onClick={() => {
                if (previewLayer.current) {
                  leafletMap.current.fitBounds(
                    previewLayer.current.getBounds()
                  );
                }
              }}
              title="Căn chỉnh"
            >
              <FaMapMarkedAlt />
            </button>
            <button
              className="map-control-button"
              onClick={() => {
                if (previewLayer.current) {
                  leafletMap.current.removeLayer(previewLayer.current);
                  previewLayer.current = null;
                  setSelectedFile(null);
                  setPreviewData(null);
                }
              }}
              title="Xóa dữ liệu"
            >
              <FaTrash />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForestMap;
