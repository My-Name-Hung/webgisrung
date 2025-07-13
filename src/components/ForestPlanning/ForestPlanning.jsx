import * as turf from "@turf/turf";
import axios from "axios";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import React, { useEffect, useRef, useState } from "react";
import { FaFileUpload, FaMapMarkedAlt, FaTrash } from "react-icons/fa";
import shp from "shpjs";
import { forestPlanningSteps } from "../../config/tourSteps";
import useCustomTour from "../../hooks/useTour";
import "./ForestPlanning.css";

const ForestPlanning = () => {
  const [formData, setFormData] = useState({
    name: "",
    area: "",
    type: "",
    status: "planned",
    startDate: "",
    endDate: "",
    description: "",
    geojson: null,
  });
  const [previewData, setPreviewData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const { startTour } = useCustomTour(forestPlanningSteps);
  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const previewLayer = useRef(null);

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
      startTour();
    }
  }, [previewData, startTour]);

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
        const rows = text.split("\n").map((row) => row.split(","));
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

      setFormData((prev) => ({
        ...prev,
        geojson: geoJsonData,
      }));
    } catch (err) {
      setError("Không thể đọc file. Vui lòng kiểm tra định dạng file.");
      setSelectedFile(null);
      setFormData((prev) => ({
        ...prev,
        geojson: null,
      }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;

    // Handle area input with number formatting
    if (name === "area") {
      // Remove existing commas and convert to number
      const numValue = parseFloat(value.replace(/,/g, ""));
      if (!isNaN(numValue)) {
        newValue = numValue;
      }
    }

    const newFormData = {
      ...formData,
      [name]: newValue,
    };
    setFormData(newFormData);

    // Update preview data if all required fields are filled
    if (Object.values(newFormData).every((v) => v !== "")) {
      setPreviewData(newFormData);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!previewData) {
      setError("Vui lòng điền đầy đủ thông tin");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await axios.post("/api/forest-data/planning", {
        ...previewData,
        area: parseFloat(previewData.area.toString().replace(/,/g, "")),
      });
      setSuccess("Thêm quy hoạch thành công");
      setFormData({
        name: "",
        area: "",
        type: "",
        status: "planned",
        startDate: "",
        endDate: "",
        description: "",
        geojson: null,
      });
      setPreviewData(null);
      setSelectedFile(null);

      if (previewLayer.current) {
        leafletMap.current.removeLayer(previewLayer.current);
        previewLayer.current = null;
      }
    } catch (err) {
      setError("Không thể thêm quy hoạch");
    } finally {
      setLoading(false);
    }
  };

  // Format number with commas
  const formatNumber = (num) => {
    if (!num) return "";
    return new Intl.NumberFormat("vi-VN").format(num);
  };

  return (
    <div className="forestplanning-container">
      <h1 className="title-forestplanning">Quản lý quy hoạch rừng</h1>

      <div className="form-section-forestplanning">
        <h2>Thêm quy hoạch mới</h2>

        {error && <div className="error-forestplanning">{error}</div>}
        {success && <div className="success-forestplanning">{success}</div>}

        <form onSubmit={handleSubmit} className="form-forestplanning">
          <div className="form-group-forestplanning">
            <label htmlFor="name">Tên quy hoạch</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="input-forestplanning"
              placeholder="Nhập tên quy hoạch"
              required
            />
          </div>

          <div className="form-group-forestplanning">
            <label htmlFor="area">Diện tích (ha)</label>
            <input
              type="text"
              id="area"
              name="area"
              value={formatNumber(formData.area)}
              onChange={handleInputChange}
              className="input-forestplanning"
              placeholder="Nhập diện tích"
              required
            />
          </div>

          <div className="form-group-forestplanning">
            <label htmlFor="type">Loại quy hoạch</label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className="input-forestplanning"
              required
            >
              <option value="">Chọn loại quy hoạch</option>
              <option value="Trồng rừng">Trồng rừng</option>
              <option value="Bảo tồn">Bảo tồn</option>
              <option value="Phát triển">Phát triển</option>
              <option value="Phục hồi">Phục hồi</option>
            </select>
          </div>

          <div className="form-group-forestplanning">
            <label htmlFor="startDate">Ngày bắt đầu</label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={formData.startDate}
              onChange={handleInputChange}
              className="input-forestplanning"
              required
            />
          </div>

          <div className="form-group-forestplanning">
            <label htmlFor="endDate">Ngày kết thúc</label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={formData.endDate}
              onChange={handleInputChange}
              className="input-forestplanning"
              required
            />
          </div>

          <div className="form-group-forestplanning">
            <label htmlFor="description">Mô tả</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="textarea-forestplanning"
              rows="4"
              placeholder="Nhập mô tả quy hoạch"
              required
            />
          </div>

          <div className="form-group-forestplanning">
            <label>File bản đồ</label>
            <div className="file-input-forestplanning">
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
              <div className="file-preview-forestplanning">
                <div>File đã chọn: {selectedFile.name}</div>
                <div>
                  Kích thước: {(selectedFile.size / 1024).toFixed(2)} KB
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="submit-button-forestplanning"
            disabled={loading || !previewData}
          >
            {loading ? "Đang lưu..." : "Thêm mới"}
          </button>
        </form>
      </div>

      <div className="preview-section-forestplanning">
        <h2>Xem trước quy hoạch</h2>

        <div className="preview-map-forestplanning" ref={mapRef}>
          <div className="map-controls-forestplanning">
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
                  setFormData((prev) => ({
                    ...prev,
                    geojson: null,
                  }));
                }
              }}
              title="Xóa dữ liệu"
            >
              <FaTrash />
            </button>
          </div>
        </div>

        {previewData && (
          <div className="preview-card-forestplanning">
            <h3>{previewData.name}</h3>
            <p className="preview-area-forestplanning">
              {formatNumber(previewData.area)} ha
            </p>

            <div className="preview-details-forestplanning">
              <div className="preview-detail-item-forestplanning">
                <span className="preview-detail-label-forestplanning">
                  Loại quy hoạch
                </span>
                <span className="preview-detail-value-forestplanning">
                  {previewData.type}
                </span>
              </div>

              <div className="preview-detail-item-forestplanning">
                <span className="preview-detail-label-forestplanning">
                  Trạng thái
                </span>
                <span className="preview-detail-value-forestplanning">
                  {previewData.status === "planned"
                    ? "Đã lên kế hoạch"
                    : previewData.status === "in-progress"
                    ? "Đang thực hiện"
                    : previewData.status === "completed"
                    ? "Hoàn thành"
                    : "Đã hủy"}
                </span>
              </div>

              <div className="preview-detail-item-forestplanning">
                <span className="preview-detail-label-forestplanning">
                  Ngày bắt đầu
                </span>
                <span className="preview-detail-value-forestplanning">
                  {new Date(previewData.startDate).toLocaleDateString()}
                </span>
              </div>

              <div className="preview-detail-item-forestplanning">
                <span className="preview-detail-label-forestplanning">
                  Ngày kết thúc
                </span>
                <span className="preview-detail-value-forestplanning">
                  {new Date(previewData.endDate).toLocaleDateString()}
                </span>
              </div>
            </div>

            <p className="preview-description-forestplanning">
              {previewData.description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForestPlanning;
