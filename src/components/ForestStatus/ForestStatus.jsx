import * as turf from "@turf/turf";
import axios from "axios";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import React, { useEffect, useRef, useState } from "react";
import { Bar } from "react-chartjs-2";
import { FaFileUpload, FaMapMarkedAlt, FaTrash } from "react-icons/fa";
import shp from "shpjs";
import { forestStatusSteps } from "../../config/tourSteps";
import useCustomTour from "../../hooks/useTour";
import "./ForestStatus.css";

const ForestStatus = () => {
  const [formData, setFormData] = useState({
    type: "",
    area: "",
    quality: "",
    lastSurvey: new Date().toISOString().split("T")[0],
    geojson: null,
  });
  const [previewData, setPreviewData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const { startTour } = useCustomTour(forestStatusSteps);
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
      await axios.post(`${import.meta.env.VITE_SERVER_URL}/api/forest/status`, {
        ...previewData,
        area: parseFloat(previewData.area.toString().replace(/,/g, "")),
      });
      setSuccess("Thêm hiện trạng rừng thành công");
      setFormData({
        type: "",
        area: "",
        quality: "",
        lastSurvey: new Date().toISOString().split("T")[0],
        geojson: null,
      });
      setPreviewData(null);
      setSelectedFile(null);

      if (previewLayer.current) {
        leafletMap.current.removeLayer(previewLayer.current);
        previewLayer.current = null;
      }
    } catch (err) {
      setError("Không thể thêm hiện trạng rừng");
    } finally {
      setLoading(false);
    }
  };

  // Format number with commas
  const formatNumber = (num) => {
    if (!num) return "";
    return new Intl.NumberFormat("vi-VN").format(num);
  };

  // Prepare preview chart data
  const chartData = previewData
    ? {
        labels: [previewData.type],
        datasets: [
          {
            label: "Diện tích (ha)",
            data: [parseFloat(previewData.area.toString().replace(/,/g, ""))],
            backgroundColor: ["rgba(44, 122, 123, 0.8)"],
          },
        ],
      }
    : {
        labels: [],
        datasets: [
          {
            label: "Diện tích (ha)",
            data: [],
            backgroundColor: [],
          },
        ],
      };

  return (
    <div className="foreststatus-container">
      <h1 className="title-foreststatus">Quản lý hiện trạng rừng</h1>

      <div className="form-section-foreststatus">
        <h2>Thêm hiện trạng mới</h2>

        {error && <div className="error-foreststatus">{error}</div>}
        {success && <div className="success-foreststatus">{success}</div>}

        <form onSubmit={handleSubmit} className="form-foreststatus">
          <div className="form-group-foreststatus">
            <label htmlFor="type">Loại rừng</label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className="input-foreststatus"
              required
            >
              <option value="">Chọn loại rừng</option>
              <option value="Rừng tự nhiên">Rừng tự nhiên</option>
              <option value="Rừng trồng">Rừng trồng</option>
              <option value="Rừng phòng hộ">Rừng phòng hộ</option>
              <option value="Rừng đặc dụng">Rừng đặc dụng</option>
            </select>
          </div>

          <div className="form-group-foreststatus">
            <label htmlFor="area">Diện tích (ha)</label>
            <input
              type="text"
              id="area"
              name="area"
              value={formatNumber(formData.area)}
              onChange={handleInputChange}
              className="input-foreststatus"
              placeholder="Nhập diện tích"
              required
            />
          </div>

          <div className="form-group-foreststatus">
            <label htmlFor="quality">Chất lượng</label>
            <select
              id="quality"
              name="quality"
              value={formData.quality}
              onChange={handleInputChange}
              className="input-foreststatus"
              required
            >
              <option value="">Chọn chất lượng</option>
              <option value="Tốt">Tốt</option>
              <option value="Trung bình">Trung bình</option>
              <option value="Kém">Kém</option>
            </select>
          </div>

          <div className="form-group-foreststatus">
            <label htmlFor="lastSurvey">Ngày khảo sát</label>
            <input
              type="date"
              id="lastSurvey"
              name="lastSurvey"
              value={formData.lastSurvey}
              onChange={handleInputChange}
              className="input-foreststatus"
              required
            />
          </div>

          <div className="form-group-foreststatus">
            <label>File bản đồ</label>
            <div className="file-input-foreststatus">
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
              <div className="file-preview-foreststatus">
                <div>File đã chọn: {selectedFile.name}</div>
                <div>
                  Kích thước: {(selectedFile.size / 1024).toFixed(2)} KB
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="submit-button-foreststatus"
            disabled={loading || !previewData}
          >
            {loading ? "Đang lưu..." : "Thêm mới"}
          </button>
        </form>
      </div>

      <div className="preview-section-foreststatus">
        <h2>Xem trước hiện trạng</h2>

        <div className="preview-map-foreststatus" ref={mapRef}>
          <div className="map-controls-foreststatus">
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
          <>
            <div className="preview-card-foreststatus">
              <h3>{previewData.type}</h3>
              <p className="preview-area-foreststatus">
                {formatNumber(previewData.area)} ha
              </p>

              <div className="preview-details-foreststatus">
                <div className="preview-detail-item-foreststatus">
                  <span className="preview-detail-label-foreststatus">
                    Chất lượng
                  </span>
                  <span
                    className={`preview-quality-foreststatus ${previewData.quality.toLowerCase()}`}
                  >
                    {previewData.quality}
                  </span>
                </div>

                <div className="preview-detail-item-foreststatus">
                  <span className="preview-detail-label-foreststatus">
                    Ngày khảo sát
                  </span>
                  <span className="preview-detail-value-foreststatus">
                    {new Date(previewData.lastSurvey).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="preview-chart-foreststatus">
              <Bar
                data={chartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: "Diện tích (ha)",
                      },
                    },
                  },
                }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ForestStatus;
