import axios from "axios";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import React, { useEffect, useRef, useState } from "react";
import { monitoringSteps } from "../../config/tourSteps";
import useCustomTour from "../../hooks/useTour";
import "./MonitoringPoints.css";

const MonitoringPoints = () => {
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    status: "",
    coordinates: {
      type: "Point",
      coordinates: [0, 0],
    },
  });
  const [previewData, setPreviewData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const markerRef = useRef(null);
  const popupRef = useRef(null);
  const { startTour } = useCustomTour(monitoringSteps);

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

      // Add click handler to update coordinates
      leafletMap.current.on("click", handleMapClick);
    }

    return () => {
      if (leafletMap.current) {
        leafletMap.current.off("click", handleMapClick);
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

  const handleMapClick = (e) => {
    const { lat, lng } = e.latlng;

    // Update marker
    if (markerRef.current) {
      markerRef.current.remove();
    }

    // Create marker with popup
    markerRef.current = L.marker([lat, lng]).addTo(leafletMap.current);

    // Create popup content
    const popupContent = document.createElement("div");
    popupContent.className = "map-marker-popup";
    popupContent.innerHTML = `
      <div>Vĩ độ: ${lat.toFixed(6)}</div>
      <div>Kinh độ: ${lng.toFixed(6)}</div>
      <button>Sử dụng tọa độ này</button>
    `;

    // Add click handler to popup button
    const button = popupContent.querySelector("button");
    button.onclick = () => {
      handleCoordinateChange("longitude", lng);
      handleCoordinateChange("latitude", lat);
      if (popupRef.current) {
        popupRef.current.close();
      }
    };

    // Show popup
    if (popupRef.current) {
      popupRef.current.remove();
    }
    popupRef.current = L.popup()
      .setLatLng([lat, lng])
      .setContent(popupContent)
      .openOn(leafletMap.current);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const newFormData = {
      ...formData,
      [name]: value,
    };
    setFormData(newFormData);

    // Update preview data if all required fields are filled
    if (
      Object.values(newFormData).every((v) => v !== "") &&
      newFormData.coordinates.coordinates.every((c) => c !== 0)
    ) {
      setPreviewData(newFormData);
    }
  };

  const handleCoordinateChange = (type, value) => {
    const index = type === "longitude" ? 0 : 1;
    const newCoordinates = [...formData.coordinates.coordinates];
    newCoordinates[index] = parseFloat(value);

    const newFormData = {
      ...formData,
      coordinates: {
        ...formData.coordinates,
        coordinates: newCoordinates,
      },
    };
    setFormData(newFormData);

    // Update marker on map
    if (leafletMap.current) {
      if (markerRef.current) {
        markerRef.current.remove();
      }
      markerRef.current = L.marker([
        newCoordinates[1],
        newCoordinates[0],
      ]).addTo(leafletMap.current);
      leafletMap.current.setView(
        [newCoordinates[1], newCoordinates[0]],
        leafletMap.current.getZoom()
      );
    }

    // Update preview data if all required fields are filled
    if (
      Object.values(newFormData).every((v) => v !== "") &&
      newFormData.coordinates.coordinates.every((c) => c !== 0)
    ) {
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
      await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/monitoring`,
        previewData
      );
      setSuccess("Thêm điểm quan trắc thành công");
      setFormData({
        name: "",
        type: "",
        status: "",
        coordinates: {
          type: "Point",
          coordinates: [0, 0],
        },
      });
      setPreviewData(null);

      // Clear marker
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
    } catch (err) {
      setError("Không thể thêm điểm quan trắc");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="monitoringpoints-container">
      <h1 className="title-monitoringpoints">Quản lý điểm quan trắc</h1>

      <div className="form-section-monitoringpoints">
        <h2>Thêm điểm quan trắc mới</h2>

        {error && <div className="error-monitoringpoints">{error}</div>}
        {success && <div className="success-monitoringpoints">{success}</div>}

        <form onSubmit={handleSubmit} className="form-monitoringpoints">
          <div className="form-group-monitoringpoints">
            <label htmlFor="name">Tên điểm</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="input-monitoringpoints"
              placeholder="Nhập tên điểm quan trắc"
              required
            />
          </div>

          <div className="form-group-monitoringpoints">
            <label htmlFor="type">Loại điểm</label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className="input-monitoringpoints"
              required
            >
              <option value="">Chọn loại điểm</option>
              <option value="Thường xuyên">Thường xuyên</option>
              <option value="Định kỳ">Định kỳ</option>
              <option value="Đột xuất">Đột xuất</option>
            </select>
          </div>

          <div className="form-group-monitoringpoints">
            <label htmlFor="status">Trạng thái</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="input-monitoringpoints"
              required
            >
              <option value="">Chọn trạng thái</option>
              <option value="Hoạt động">Hoạt động</option>
              <option value="Tạm dừng">Tạm dừng</option>
              <option value="Ngưng hoạt động">Ngưng hoạt động</option>
            </select>
          </div>

          <div className="coordinates-monitoringpoints">
            <div className="coordinates-hint">
              Click vào bản đồ để chọn tọa độ hoặc nhập trực tiếp
            </div>
            <div className="form-group-monitoringpoints">
              <label htmlFor="longitude">Kinh độ</label>
              <input
                type="number"
                id="longitude"
                name="longitude"
                value={formData.coordinates.coordinates[0]}
                onChange={(e) =>
                  handleCoordinateChange("longitude", e.target.value)
                }
                className="input-monitoringpoints"
                step="any"
                required
              />
            </div>

            <div className="form-group-monitoringpoints">
              <label htmlFor="latitude">Vĩ độ</label>
              <input
                type="number"
                id="latitude"
                name="latitude"
                value={formData.coordinates.coordinates[1]}
                onChange={(e) =>
                  handleCoordinateChange("latitude", e.target.value)
                }
                className="input-monitoringpoints"
                step="any"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="submit-button-monitoringpoints"
            disabled={loading || !previewData}
          >
            {loading ? "Đang lưu..." : "Thêm mới"}
          </button>
        </form>
      </div>

      <div className="preview-section-monitoringpoints">
        <h2>Xem trước điểm quan trắc</h2>

        <div className="preview-map-monitoringpoints" ref={mapRef}></div>

        {previewData && (
          <div className="preview-card-monitoringpoints">
            <h3>{previewData.name}</h3>

            <div className="preview-details-monitoringpoints">
              <div className="preview-detail-item-monitoringpoints">
                <span className="preview-detail-label-monitoringpoints">
                  Loại điểm
                </span>
                <span className="preview-detail-value-monitoringpoints">
                  {previewData.type}
                </span>
              </div>

              <div className="preview-detail-item-monitoringpoints">
                <span className="preview-detail-label-monitoringpoints">
                  Trạng thái
                </span>
                <span className="preview-detail-value-monitoringpoints">
                  {previewData.status}
                </span>
              </div>
            </div>

            <div className="preview-coordinates-monitoringpoints">
              [{previewData.coordinates.coordinates[0].toFixed(6)},{" "}
              {previewData.coordinates.coordinates[1].toFixed(6)}]
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MonitoringPoints;
