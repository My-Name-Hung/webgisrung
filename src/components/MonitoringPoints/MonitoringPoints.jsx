import axios from "axios";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import React, { useEffect, useRef, useState } from "react";
import ReactDOMServer from "react-dom/server";
import {
  FaMapMarkedAlt,
  FaMapMarkerAlt,
  FaSatellite,
  FaTrash,
} from "react-icons/fa";
import { monitoringSteps } from "../../config/tourSteps";
import useCustomTour from "../../hooks/useTour";
import "./MonitoringPoints.css";

const CustomMarkerIcon = () => (
  <div className="custom-marker-container">
    <FaMapMarkerAlt className="custom-marker-icon" />
  </div>
);

const MonitoringPoints = () => {
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    status: "",
    coordinates: {
      type: "Point",
      coordinates: [0, 0], // [longitude, latitude]
    },
  });
  const [previewData, setPreviewData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSatelliteView, setIsSatelliteView] = useState(false);
  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const markerRef = useRef(null);
  const popupRef = useRef(null);
  const tileLayer = useRef(null);
  const { startTour } = useCustomTour(monitoringSteps);

  useEffect(() => {
    // Initialize Leaflet map
    if (!leafletMap.current && mapRef.current) {
      leafletMap.current = L.map(mapRef.current).setView(
        [20.865139, 106.68383],
        11
      );
      tileLayer.current = L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution: "© OpenStreetMap",
        }
      ).addTo(leafletMap.current);

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

  const toggleMapType = () => {
    if (!leafletMap.current || !tileLayer.current) return;

    const newIsSatellite = !isSatelliteView;
    setIsSatelliteView(newIsSatellite);

    // Remove current tile layer
    leafletMap.current.removeLayer(tileLayer.current);

    // Add new tile layer based on selection
    if (newIsSatellite) {
      tileLayer.current = L.tileLayer(
        "http://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}",
        {
          subdomains: ["mt0", "mt1", "mt2", "mt3"],
        }
      ).addTo(leafletMap.current);
    } else {
      tileLayer.current = L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution: "© OpenStreetMap",
        }
      ).addTo(leafletMap.current);
    }
  };

  const createCustomMarker = (latlng) => {
    const icon = L.divIcon({
      className: "custom-div-icon",
      html: ReactDOMServer.renderToString(<CustomMarkerIcon />),
      iconSize: [30, 30],
      iconAnchor: [15, 30],
    });

    return L.marker(latlng, { icon });
  };

  const handleMapClick = (e) => {
    const { lat, lng } = e.latlng;

    // Update marker
    if (markerRef.current) {
      markerRef.current.remove();
    }

    // Create marker with popup
    markerRef.current = createCustomMarker([lat, lng]).addTo(
      leafletMap.current
    );

    // Create popup content
    const popupContent = document.createElement("div");
    popupContent.className = "map-marker-popup";
    popupContent.innerHTML = `
      <div class="popup-coordinates">
        <div class="popup-coordinate">
          <span class="popup-label">Vĩ độ:</span>
          <span class="popup-value">${lat.toFixed(6)}</span>
        </div>
        <div class="popup-coordinate">
          <span class="popup-label">Kinh độ:</span>
          <span class="popup-value">${lng.toFixed(6)}</span>
        </div>
      </div>
      <button class="popup-button">Sử dụng tọa độ này</button>
    `;

    // Add click handler to popup button
    const button = popupContent.querySelector("button");
    button.onclick = () => {
      setFormData((prev) => ({
        ...prev,
        coordinates: {
          type: "Point",
          coordinates: [lng, lat], // [longitude, latitude]
        },
      }));
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

    if (name === "longitude" || name === "latitude") {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        const newCoordinates = [...formData.coordinates.coordinates];
        if (name === "longitude") {
          newCoordinates[0] = numValue;
        } else {
          newCoordinates[1] = numValue;
        }

        setFormData((prev) => ({
          ...prev,
          coordinates: {
            ...prev.coordinates,
            coordinates: newCoordinates,
          },
        }));

        // Update marker on map
        if (leafletMap.current) {
          if (markerRef.current) {
            markerRef.current.remove();
          }
          markerRef.current = createCustomMarker([
            newCoordinates[1],
            newCoordinates[0],
          ]).addTo(leafletMap.current);
          leafletMap.current.setView(
            [newCoordinates[1], newCoordinates[0]],
            leafletMap.current.getZoom()
          );
        }
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    // Update preview data if all required fields are filled
    const newFormData = { ...formData, [name]: value };
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

          <div className="coordinates-section-monitoringpoints">
            <div className="coordinates-hint">
              Click vào bản đồ để chọn tọa độ hoặc nhập trực tiếp
            </div>
            <div className="coordinates-inputs">
              <div className="form-group-monitoringpoints">
                <label htmlFor="longitude">Kinh độ</label>
                <input
                  type="number"
                  id="longitude"
                  name="longitude"
                  value={formData.coordinates.coordinates[0] || ""}
                  onChange={handleInputChange}
                  className="input-monitoringpoints"
                  step="0.000001"
                  min="-180"
                  max="180"
                  placeholder="Ví dụ: 106.68383"
                  required
                />
              </div>

              <div className="form-group-monitoringpoints">
                <label htmlFor="latitude">Vĩ độ</label>
                <input
                  type="number"
                  id="latitude"
                  name="latitude"
                  value={formData.coordinates.coordinates[1] || ""}
                  onChange={handleInputChange}
                  className="input-monitoringpoints"
                  step="0.000001"
                  min="-90"
                  max="90"
                  placeholder="Ví dụ: 20.865139"
                  required
                />
              </div>
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

        <div className="map-controls-monitoringpoints">
          <button
            className="map-control-button"
            onClick={(e) => {
              e.preventDefault();
              if (markerRef.current) {
                const bounds = L.latLngBounds([markerRef.current.getLatLng()]);
                leafletMap.current.fitBounds(bounds, { padding: [50, 50] });
              }
            }}
            title="Căn chỉnh"
          >
            <FaMapMarkedAlt />
          </button>
          <button
            className="map-control-button"
            onClick={(e) => {
              e.preventDefault();
              if (markerRef.current) {
                markerRef.current.remove();
                markerRef.current = null;
                setFormData((prev) => ({
                  ...prev,
                  coordinates: {
                    type: "Point",
                    coordinates: [0, 0],
                  },
                }));
              }
            }}
            title="Xóa điểm"
          >
            <FaTrash />
          </button>
          <button
            className="map-control-button"
            onClick={toggleMapType}
            title={
              isSatelliteView ? "Chuyển bản đồ thường" : "Chuyển bản đồ vệ tinh"
            }
          >
            {isSatelliteView ? <FaMapMarkedAlt /> : <FaSatellite />}
          </button>
        </div>

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
                <span
                  className={`preview-status-monitoringpoints ${previewData.status
                    .toLowerCase()
                    .replace(/\s+/g, "-")}`}
                >
                  {previewData.status}
                </span>
              </div>
            </div>

            <div className="preview-coordinates-monitoringpoints">
              <div className="preview-coordinate">
                <span className="preview-coordinate-label">Kinh độ:</span>
                <span className="preview-coordinate-value">
                  {previewData.coordinates.coordinates[0].toFixed(6)}
                </span>
              </div>
              <div className="preview-coordinate">
                <span className="preview-coordinate-label">Vĩ độ:</span>
                <span className="preview-coordinate-value">
                  {previewData.coordinates.coordinates[1].toFixed(6)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MonitoringPoints;
