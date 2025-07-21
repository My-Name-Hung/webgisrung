import { Delete, Edit } from "@mui/icons-material";
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
import ReactDOMServer from "react-dom/server";
import {
  FaFileUpload,
  FaMapMarkedAlt,
  FaMapMarkerAlt,
  FaSatellite,
  FaTrash,
} from "react-icons/fa";
import shp from "shpjs";
import { forestPlanningSteps } from "../../config/tourSteps";
import useCustomTour from "../../hooks/useTour";
import "./ForestPlanning.css";

// Add default planning types
const DEFAULT_PLANNING_TYPES = [
  "Trồng rừng",
  "Bảo tồn",
  "Phát triển",
  "Phục hồi",
];

const CustomMarkerIcon = () => (
  <div className="custom-marker-container">
    <FaMapMarkerAlt className="custom-marker-icon" />
  </div>
);

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
  const [isSatelliteView, setIsSatelliteView] = useState(false);
  const { startTour } = useCustomTour(forestPlanningSteps);
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
  const [plannings, setPlannings] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedPlanning, setSelectedPlanning] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    type: "",
    status: "",
  });

  useEffect(() => {
    fetchPlannings();
    fetchPlanningTypes();
  }, []);

  const fetchPlannings = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_SERVER_URL}/api/forest/planning`
      );
      setPlannings(response.data);
    } catch (err) {
      setError("Không thể tải danh sách quy hoạch");
    }
  };

  const fetchPlanningTypes = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_SERVER_URL}/api/forest/planning-types`
      );
      // Combine default types with custom types
      setAllTypes([
        ...DEFAULT_PLANNING_TYPES,
        ...response.data.map((type) => type.name),
      ]);
    } catch (err) {
      setError("Không thể tải danh sách loại quy hoạch");
      // Fallback to default types if API fails
      setAllTypes(DEFAULT_PLANNING_TYPES);
    }
  };

  const handleAddType = async (e) => {
    e.preventDefault();
    if (!typeFormData.name) {
      setError("Vui lòng nhập tên loại quy hoạch");
      return;
    }

    try {
      await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/forest/planning-types`,
        typeFormData
      );
      setSuccess("Thêm loại quy hoạch thành công");
      setOpenTypeDialog(false);
      setTypeFormData({ name: "", description: "" });
      fetchPlanningTypes();
    } catch (err) {
      setError(err.response?.data?.message || "Không thể thêm loại quy hoạch");
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

  const filteredPlannings = plannings.filter((planning) => {
    const matchSearch = planning.name
      .toLowerCase()
      .includes(filters.search.toLowerCase());
    const matchType = !filters.type || planning.type === filters.type;
    const matchStatus = !filters.status || planning.status === filters.status;
    return matchSearch && matchType && matchStatus;
  });

  const handleEdit = (planning) => {
    setSelectedPlanning(planning);
    setFormData({
      name: planning.name,
      area: planning.area,
      type: planning.type,
      status: planning.status,
      startDate: new Date(planning.startDate).toISOString().split("T")[0],
      endDate: new Date(planning.endDate).toISOString().split("T")[0],
      description: planning.description,
      geojson: planning.geojson,
    });
    setPreviewData({
      name: planning.name,
      area: planning.area,
      type: planning.type,
      status: planning.status,
      startDate: planning.startDate,
      endDate: planning.endDate,
      description: planning.description,
      geojson: planning.geojson,
    });
    setEditMode(true);

    // Show data on map if available
    if (planning.geojson) {
      if (previewLayer.current) {
        leafletMap.current.removeLayer(previewLayer.current);
      }

      previewLayer.current = L.geoJSON(planning.geojson, {
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

  const handleDelete = (planning) => {
    setSelectedPlanning(planning);
    setOpenDialog(true);
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_SERVER_URL}/api/forest/planning/${
          selectedPlanning._id
        }`
      );
      setSuccess("Xóa quy hoạch thành công");
      fetchPlannings();

      if (previewLayer.current) {
        leafletMap.current.removeLayer(previewLayer.current);
        previewLayer.current = null;
      }
    } catch (err) {
      setError("Không thể xóa quy hoạch");
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

      if (editMode && selectedPlanning) {
        await axios.put(
          `${import.meta.env.VITE_SERVER_URL}/api/forest/planning/${
            selectedPlanning._id
          }`,
          data
        );
        setSuccess("Cập nhật quy hoạch thành công");
      } else {
        await axios.post(
          `${import.meta.env.VITE_SERVER_URL}/api/forest/planning`,
          data
        );
        setSuccess("Thêm quy hoạch thành công");
      }

      resetForm();
      fetchPlannings();
    } catch (err) {
      setError(
        editMode ? "Không thể cập nhật quy hoạch" : "Không thể thêm quy hoạch"
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
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
    setSelectedPlanning(null);
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

  return (
    <div className="forestplanning-container">
      <h1 className="title-forestplanning">Quản lý quy hoạch rừng</h1>

      <div className="form-section-forestplanning">
        <h2>{editMode ? "Cập nhật quy hoạch" : "Thêm quy hoạch mới"}</h2>

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
            <div className="type-select-container">
              <label htmlFor="type">Loại quy hoạch</label>
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
              className="input-forestplanning"
              required
            >
              <option value="">Chọn loại quy hoạch</option>
              {allTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
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

          <div className="form-actions">
            <button
              type="submit"
              className="submit-button-forestplanning"
              disabled={loading || !previewData}
            >
              {loading ? "Đang xử lý..." : editMode ? "Cập nhật" : "Thêm mới"}
            </button>
            {editMode && (
              <button
                type="button"
                className="cancel-button-forestplanning"
                onClick={resetForm}
              >
                Hủy
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="preview-section-forestplanning">
        <h2>Xem trước quy hoạch</h2>

        <div className="map-controls-forestplanning">
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

        <div className="preview-map-forestplanning" ref={mapRef}></div>

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

      <div className="planning-list-section">
        <h2>Danh sách quy hoạch</h2>

        <div className="planning-filters">
          <TextField
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
            placeholder="Tìm kiếm theo tên..."
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
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            variant="outlined"
            size="small"
            className="filter-input"
            SelectProps={{
              native: true,
            }}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="planned">Đã lên kế hoạch</option>
            <option value="in-progress">Đang thực hiện</option>
            <option value="completed">Hoàn thành</option>
            <option value="cancelled">Đã hủy</option>
          </TextField>
        </div>

        <TableContainer component={Paper} className="planning-table">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Tên quy hoạch</TableCell>
                <TableCell align="right">Diện tích (ha)</TableCell>
                <TableCell>Loại</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell>Thời gian</TableCell>
                <TableCell align="center">Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPlannings
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((planning) => (
                  <TableRow key={planning._id}>
                    <TableCell>{planning.name}</TableCell>
                    <TableCell align="right">
                      {formatNumber(planning.area)}
                    </TableCell>
                    <TableCell>{planning.type}</TableCell>
                    <TableCell>
                      <span className={`planning-status ${planning.status}`}>
                        {planning.status === "planned"
                          ? "Đã lên kế hoạch"
                          : planning.status === "in-progress"
                          ? "Đang thực hiện"
                          : planning.status === "completed"
                          ? "Hoàn thành"
                          : "Đã hủy"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {new Date(planning.startDate).toLocaleDateString("vi-VN")}{" "}
                      - {new Date(planning.endDate).toLocaleDateString("vi-VN")}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        color="primary"
                        onClick={() => handleEdit(planning)}
                        title="Sửa"
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleDelete(planning)}
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
            count={filteredPlannings.length}
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
            Bạn có chắc chắn muốn xóa quy hoạch "{selectedPlanning?.name}"
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
        <DialogTitle>Thêm loại quy hoạch mới</DialogTitle>
        <form onSubmit={handleAddType}>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Tên loại quy hoạch"
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

export default ForestPlanning;
