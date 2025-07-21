import { Delete, Edit, Visibility } from "@mui/icons-material";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
} from "@mui/material";
import * as turf from "@turf/turf";
import axios from "axios";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import React, { useEffect, useRef, useState } from "react";
import { Bar } from "react-chartjs-2";
import ReactDOMServer from "react-dom/server";
import {
  FaFileUpload,
  FaMapMarkedAlt,
  FaMapMarkerAlt,
  FaSatellite,
  FaTrash,
} from "react-icons/fa";
import shp from "shpjs";
import { forestStatusSteps } from "../../config/tourSteps";
import useCustomTour from "../../hooks/useTour";
import "./ForestStatus.css";

const CustomMarkerIcon = () => (
  <div className="custom-marker-container">
    <FaMapMarkerAlt className="custom-marker-icon" />
  </div>
);

// Add default forest types
const DEFAULT_FOREST_TYPES = [
  "Rừng tự nhiên",
  "Rừng trồng",
  "Rừng phòng hộ",
  "Rừng đặc dụng",
];

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
  const [isSatelliteView, setIsSatelliteView] = useState(false);
  const { startTour } = useCustomTour(forestStatusSteps);
  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const previewLayer = useRef(null);
  const tileLayer = useRef(null);
  const [allTypes, setAllTypes] = useState([]);
  const [openTypeDialog, setOpenTypeDialog] = useState(false);
  const [typeFormData, setTypeFormData] = useState({
    name: "",
    description: "",
  });
  const [statuses, setStatuses] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    type: "",
    quality: "",
  });

  useEffect(() => {
    fetchStatuses();
    fetchForestTypes();
  }, []);

  const fetchStatuses = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_SERVER_URL}/api/forest/status`
      );
      setStatuses(response.data);
    } catch (err) {
      setError("Không thể tải danh sách hiện trạng rừng");
    }
  };

  const fetchForestTypes = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_SERVER_URL}/api/forest/types`
      );
      // Combine default types with custom types
      setAllTypes([
        ...DEFAULT_FOREST_TYPES,
        ...response.data.map((type) => type.name),
      ]);
    } catch (err) {
      setError("Không thể tải danh sách loại rừng");
      // Fallback to default types if API fails
      setAllTypes(DEFAULT_FOREST_TYPES);
    }
  };

  const handleAddType = async (e) => {
    e.preventDefault();
    if (!typeFormData.name) {
      setError("Vui lòng nhập tên loại rừng");
      return;
    }

    try {
      await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/forest/types`,
        typeFormData
      );
      setSuccess("Thêm loại rừng thành công");
      setOpenTypeDialog(false);
      setTypeFormData({ name: "", description: "" });
      fetchForestTypes();
    } catch (err) {
      setError(err.response?.data?.message || "Không thể thêm loại rừng");
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
    setPage(0);
  };

  const filteredStatuses = statuses.filter((status) => {
    const matchSearch = status.type
      .toLowerCase()
      .includes(filters.search.toLowerCase());
    const matchType = !filters.type || status.type === filters.type;
    const matchQuality = !filters.quality || status.quality === filters.quality;
    return matchSearch && matchType && matchQuality;
  });

  const handleEdit = (status) => {
    setSelectedStatus(status);
    setFormData({
      type: status.type,
      area: status.area,
      quality: status.quality,
      lastSurvey: new Date(status.lastSurvey).toISOString().split("T")[0],
      geojson: status.geojson,
    });
    setPreviewData({
      type: status.type,
      area: status.area,
      quality: status.quality,
      lastSurvey: status.lastSurvey,
      geojson: status.geojson,
    });
    setEditMode(true);

    // Show data on map if available
    if (status.geojson) {
      if (previewLayer.current) {
        leafletMap.current.removeLayer(previewLayer.current);
      }

      previewLayer.current = L.geoJSON(status.geojson, {
        pointToLayer: createCustomMarker,
        onEachFeature: (feature, layer) => {
          if (feature.geometry.type !== "Point") {
            if (feature.properties) {
              const popupContent = document.createElement("div");
              popupContent.className = "map-marker-popup";

              let contentHTML = '<div class="popup-content">';
              Object.entries(feature.properties).forEach(([key, value]) => {
                contentHTML += `
                  <div class="popup-row">
                    <span class="popup-key">${key}:</span>
                    <span class="popup-value">${value}</span>
                  </div>
                `;
              });
              contentHTML += "</div>";

              popupContent.innerHTML = contentHTML;
              layer.bindPopup(popupContent);
            }
          }
        },
      }).addTo(leafletMap.current);

      leafletMap.current.fitBounds(previewLayer.current.getBounds());
    }
  };

  const handleDelete = (status) => {
    setSelectedStatus(status);
    setOpenDialog(true);
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_SERVER_URL}/api/forest/status/${
          selectedStatus._id
        }`
      );
      setSuccess("Xóa hiện trạng rừng thành công");
      fetchStatuses();

      if (previewLayer.current) {
        leafletMap.current.removeLayer(previewLayer.current);
        previewLayer.current = null;
      }
    } catch (err) {
      setError("Không thể xóa hiện trạng rừng");
    }
    setOpenDialog(false);
  };

  // Update handleSubmit to handle edit mode
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
      const data = {
        ...previewData,
        area: parseFloat(previewData.area.toString().replace(/,/g, "")),
      };

      if (editMode && selectedStatus) {
        await axios.put(
          `${import.meta.env.VITE_SERVER_URL}/api/forest/status/${
            selectedStatus._id
          }`,
          data
        );
        setSuccess("Cập nhật hiện trạng rừng thành công");
      } else {
        await axios.post(
          `${import.meta.env.VITE_SERVER_URL}/api/forest/status`,
          data
        );
        setSuccess("Thêm hiện trạng rừng thành công");
      }

      resetForm();
      fetchStatuses();
    } catch (err) {
      setError(
        editMode
          ? "Không thể cập nhật hiện trạng rừng"
          : "Không thể thêm hiện trạng rừng"
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      type: "",
      area: "",
      quality: "",
      lastSurvey: new Date().toISOString().split("T")[0],
      geojson: null,
    });
    setPreviewData(null);
    setSelectedStatus(null);
    setEditMode(false);
    setSelectedFile(null);

    if (previewLayer.current) {
      leafletMap.current.removeLayer(previewLayer.current);
      previewLayer.current = null;
    }
  };

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

  const createCustomMarker = (feature, latlng) => {
    const icon = L.divIcon({
      className: "custom-div-icon",
      html: ReactDOMServer.renderToString(<CustomMarkerIcon />),
      iconSize: [30, 30],
      iconAnchor: [15, 30],
    });

    const marker = L.marker(latlng, { icon });

    // Create popup content from feature properties
    if (feature.properties) {
      const popupContent = document.createElement("div");
      popupContent.className = "map-marker-popup";

      let contentHTML = '<div class="popup-content">';
      Object.entries(feature.properties).forEach(([key, value]) => {
        contentHTML += `
          <div class="popup-row">
            <span class="popup-key">${key}:</span>
            <span class="popup-value">${value}</span>
          </div>
        `;
      });
      contentHTML += "</div>";

      popupContent.innerHTML = contentHTML;
      marker.bindPopup(popupContent);
    }

    return marker;
  };

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

      previewLayer.current = L.geoJSON(geoJsonData, {
        pointToLayer: createCustomMarker,
        onEachFeature: (feature, layer) => {
          if (feature.geometry.type !== "Point") {
            // For non-point features (polygons, lines), bind popup to show properties
            if (feature.properties) {
              const popupContent = document.createElement("div");
              popupContent.className = "map-marker-popup";

              let contentHTML = '<div class="popup-content">';
              Object.entries(feature.properties).forEach(([key, value]) => {
                contentHTML += `
                  <div class="popup-row">
                    <span class="popup-key">${key}:</span>
                    <span class="popup-value">${value}</span>
                  </div>
                `;
              });
              contentHTML += "</div>";

              popupContent.innerHTML = contentHTML;
              layer.bindPopup(popupContent);
            }
          }
        },
      }).addTo(leafletMap.current);

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

  const handleView = (status) => {
    if (status.geojson) {
      if (previewLayer.current) {
        leafletMap.current.removeLayer(previewLayer.current);
      }

      previewLayer.current = L.geoJSON(status.geojson, {
        pointToLayer: createCustomMarker,
        onEachFeature: (feature, layer) => {
          if (feature.geometry.type !== "Point") {
            if (feature.properties) {
              const popupContent = document.createElement("div");
              popupContent.className = "map-marker-popup";

              let contentHTML = '<div class="popup-content">';
              Object.entries(feature.properties).forEach(([key, value]) => {
                contentHTML += `
                  <div class="popup-row">
                    <span class="popup-key">${key}:</span>
                    <span class="popup-value">${value}</span>
                  </div>
                `;
              });
              contentHTML += "</div>";

              popupContent.innerHTML = contentHTML;
              layer.bindPopup(popupContent);
            }
          }
        },
      }).addTo(leafletMap.current);

      leafletMap.current.fitBounds(previewLayer.current.getBounds());
    }
  };

  return (
    <div className="foreststatus-container">
      <h1 className="title-foreststatus">Quản lý hiện trạng rừng</h1>

      <div className="form-section-foreststatus">
        <h2>{editMode ? "Cập nhật hiện trạng" : "Thêm hiện trạng mới"}</h2>

        {error && <div className="error-foreststatus">{error}</div>}
        {success && <div className="success-foreststatus">{success}</div>}

        <form onSubmit={handleSubmit} className="form-foreststatus">
          <div className="form-group-foreststatus">
            <div className="type-select-container">
              <label htmlFor="type">Loại rừng</label>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setOpenTypeDialog(true)}
                className="add-type-button"
              >
                + Thêm loại mới
              </Button>
            </div>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className="input-foreststatus"
              required
            >
              <option value="">Chọn loại rừng</option>
              {allTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
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

          <div className="form-actions">
            <button
              type="submit"
              className="submit-button-foreststatus"
              disabled={loading || !previewData}
            >
              {loading ? "Đang xử lý..." : editMode ? "Cập nhật" : "Thêm mới"}
            </button>
            {editMode && (
              <button
                type="button"
                className="cancel-button-foreststatus"
                onClick={resetForm}
              >
                Hủy
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="preview-section-foreststatus">
        <h2>Xem trước hiện trạng</h2>

        <div className="map-controls-foreststatus">
          <button
            className="map-control-button"
            onClick={() => {
              if (previewLayer.current) {
                leafletMap.current.fitBounds(previewLayer.current.getBounds());
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

        <div className="preview-map-foreststatus" ref={mapRef}></div>

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

      <div className="status-list-section">
        <h2>Danh sách hiện trạng</h2>

        <div className="status-filters">
          <TextField
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
            placeholder="Tìm kiếm theo loại rừng..."
            variant="outlined"
            size="small"
            className="filter-input"
          />

          <TextField
            select
            name="type"
            value={filters.type}
            onChange={handleFilterChange}
            variant="outlined"
            size="small"
            className="filter-input"
            SelectProps={{
              native: true,
            }}
          >
            <option value="">Tất cả loại</option>
            {allTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </TextField>

          <TextField
            select
            name="quality"
            value={filters.quality}
            onChange={handleFilterChange}
            variant="outlined"
            size="small"
            className="filter-input"
            SelectProps={{
              native: true,
            }}
          >
            <option value="">Tất cả chất lượng</option>
            <option value="Tốt">Tốt</option>
            <option value="Trung bình">Trung bình</option>
            <option value="Kém">Kém</option>
          </TextField>
        </div>

        <TableContainer component={Paper} className="status-table">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Loại rừng</TableCell>
                <TableCell align="right">Diện tích (ha)</TableCell>
                <TableCell>Chất lượng</TableCell>
                <TableCell>Ngày khảo sát</TableCell>
                <TableCell align="center">Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredStatuses
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((status) => (
                  <TableRow key={status._id}>
                    <TableCell>{status.type}</TableCell>
                    <TableCell align="right">
                      {formatNumber(status.area)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`status-quality ${status.quality
                          .toLowerCase()
                          .replace(/\s+/g, "-")}`}
                      >
                        {status.quality}
                      </span>
                    </TableCell>
                    <TableCell>
                      {new Date(status.lastSurvey).toLocaleDateString("vi-VN")}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        color="primary"
                        onClick={() => handleView(status)}
                        title="Xem bản đồ"
                      >
                        <Visibility />
                      </IconButton>
                      <IconButton
                        color="primary"
                        onClick={() => handleEdit(status)}
                        title="Sửa"
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleDelete(status)}
                        title="Xóa"
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={filteredStatuses.length}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            labelRowsPerPage="Số dòng mỗi trang"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} của ${count}`
            }
          />
        </TableContainer>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Xác nhận xóa</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Bạn có chắc chắn muốn xóa hiện trạng rừng "{selectedStatus?.type}"
            không?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} color="primary">
            Hủy
          </Button>
          <Button onClick={confirmDelete} color="error">
            Xóa
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Type Dialog */}
      <Dialog open={openTypeDialog} onClose={() => setOpenTypeDialog(false)}>
        <DialogTitle>Thêm loại rừng mới</DialogTitle>
        <form onSubmit={handleAddType}>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Tên loại rừng"
              type="text"
              fullWidth
              variant="outlined"
              value={typeFormData.name}
              onChange={(e) =>
                setTypeFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              required
            />
            <TextField
              margin="dense"
              label="Mô tả"
              type="text"
              fullWidth
              variant="outlined"
              value={typeFormData.description}
              onChange={(e) =>
                setTypeFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              multiline
              rows={2}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenTypeDialog(false)}>Hủy</Button>
            <Button type="submit" variant="contained">
              Thêm mới
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </div>
  );
};

export default ForestStatus;
