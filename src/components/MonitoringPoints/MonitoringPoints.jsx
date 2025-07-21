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

const DEFAULT_MONITORING_TYPES = ["Thường xuyên", "Định kỳ", "Đột xuất"];

const DEFAULT_MONITORING_STATUSES = [
  { name: "Hoạt động", color: "#2f855a" },
  { name: "Tạm dừng", color: "#c05621" },
  { name: "Ngưng hoạt động", color: "#c53030" },
];

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
  const [points, setPoints] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    type: "",
    status: "",
  });
  const [allTypes, setAllTypes] = useState([]);
  const [allStatuses, setAllStatuses] = useState([]);
  const [openTypeDialog, setOpenTypeDialog] = useState(false);
  const [openStatusDialog, setOpenStatusDialog] = useState(false);
  const [typeFormData, setTypeFormData] = useState({
    name: "",
    description: "",
  });
  const [statusFormData, setStatusFormData] = useState({
    name: "",
    description: "",
    color: "#2d5a27",
  });

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

  useEffect(() => {
    fetchPoints();
    fetchTypesAndStatuses();
  }, []);

  const fetchPoints = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_SERVER_URL}/api/monitoring`
      );
      setPoints(response.data);
    } catch (err) {
      setError("Không thể tải danh sách điểm quan trắc");
    }
  };

  const fetchTypesAndStatuses = async () => {
    try {
      const [typesRes, statusesRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_SERVER_URL}/api/types/monitoring`),
        axios.get(`${import.meta.env.VITE_SERVER_URL}/api/types/status`),
      ]);

      // Combine default types with custom types
      setAllTypes([
        ...DEFAULT_MONITORING_TYPES,
        ...typesRes.data.map((type) => type.name),
      ]);

      // Combine default statuses with custom statuses
      setAllStatuses([
        ...DEFAULT_MONITORING_STATUSES,
        ...statusesRes.data.map((status) => ({
          name: status.name,
          color: status.color,
        })),
      ]);
    } catch (err) {
      setError("Không thể tải danh sách loại và trạng thái");
      // Fallback to default values if API fails
      setAllTypes(DEFAULT_MONITORING_TYPES);
      setAllStatuses(DEFAULT_MONITORING_STATUSES);
    }
  };

  const handleAddType = async (e) => {
    e.preventDefault();
    if (!typeFormData.name) {
      setError("Vui lòng nhập tên loại điểm");
      return;
    }

    try {
      await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/types/monitoring`,
        typeFormData
      );
      setSuccess("Thêm loại điểm thành công");
      setOpenTypeDialog(false);
      setTypeFormData({ name: "", description: "" });
      fetchTypesAndStatuses();
    } catch (err) {
      setError(err.response?.data?.message || "Không thể thêm loại điểm");
    }
  };

  const handleAddStatus = async (e) => {
    e.preventDefault();
    if (!statusFormData.name) {
      setError("Vui lòng nhập tên trạng thái");
      return;
    }

    try {
      await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/types/status`,
        statusFormData
      );
      setSuccess("Thêm trạng thái thành công");
      setOpenStatusDialog(false);
      setStatusFormData({ name: "", description: "", color: "#2d5a27" });
      fetchTypesAndStatuses();
    } catch (err) {
      setError(err.response?.data?.message || "Không thể thêm trạng thái");
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

  const createCustomMarker = (latlng) => {
    const icon = L.divIcon({
      className: "custom-div-icon",
      html: ReactDOMServer.renderToString(<CustomMarkerIcon />),
      iconSize: [30, 30],
      iconAnchor: [15, 30],
    });

    return L.marker(latlng, { icon });
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

        const newFormData = {
          ...formData,
          coordinates: {
            type: "Point",
            coordinates: newCoordinates,
          },
        };
        setFormData(newFormData);

        // Update preview data if all required fields are filled
        if (
          Object.values(newFormData).every((v) => v !== "") &&
          newFormData.coordinates.coordinates.every((c) => c !== 0)
        ) {
          setPreviewData(newFormData);
        }

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

  const filteredPoints = points.filter((point) => {
    const matchSearch = point.name
      .toLowerCase()
      .includes(filters.search.toLowerCase());
    const matchType = !filters.type || point.type === filters.type;
    const matchStatus = !filters.status || point.status === filters.status;
    return matchSearch && matchType && matchStatus;
  });

  const handleView = (point) => {
    if (markerRef.current) {
      markerRef.current.remove();
    }

    const [lng, lat] = point.coordinates.coordinates;
    markerRef.current = createCustomMarker([lat, lng]).addTo(
      leafletMap.current
    );
    leafletMap.current.setView([lat, lng], 15);
  };

  const handleEdit = (point) => {
    setSelectedPoint(point);
    setFormData({
      name: point.name,
      type: point.type,
      status: point.status,
      coordinates: point.coordinates,
    });
    setPreviewData({
      name: point.name,
      type: point.type,
      status: point.status,
      coordinates: point.coordinates,
    });
    setEditMode(true);

    // Show point on map
    handleView(point);
  };

  const handleDelete = (point) => {
    setSelectedPoint(point);
    setOpenDialog(true);
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_SERVER_URL}/api/monitoring/${selectedPoint._id}`
      );
      setSuccess("Xóa điểm quan trắc thành công");
      fetchPoints();

      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
    } catch (err) {
      setError("Không thể xóa điểm quan trắc");
    }
    setOpenDialog(false);
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
      if (editMode && selectedPoint) {
        await axios.put(
          `${import.meta.env.VITE_SERVER_URL}/api/monitoring/${
            selectedPoint._id
          }`,
          previewData
        );
        setSuccess("Cập nhật điểm quan trắc thành công");
      } else {
      await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/monitoring`,
        previewData
      );
      setSuccess("Thêm điểm quan trắc thành công");
      }

      resetForm();
      fetchPoints();
    } catch (err) {
      setError(
        editMode
          ? "Không thể cập nhật điểm quan trắc"
          : "Không thể thêm điểm quan trắc"
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
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
    setSelectedPoint(null);
    setEditMode(false);

      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
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
      const newFormData = {
        ...formData,
        coordinates: {
          type: "Point",
          coordinates: [lng, lat], // [longitude, latitude]
        },
      };
      setFormData(newFormData);

      // Update preview data if all required fields are filled
      if (
        Object.values(newFormData).every((v) => v !== "") &&
        newFormData.coordinates.coordinates.every((c) => c !== 0)
      ) {
        setPreviewData(newFormData);
      }

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

  return (
    <div className="monitoringpoints-container">
      <h1 className="title-monitoringpoints">Quản lý điểm quan trắc</h1>

      <div className="form-section-monitoringpoints">
        <h2>
          {editMode ? "Cập nhật điểm quan trắc" : "Thêm điểm quan trắc mới"}
        </h2>

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
            <div className="type-select-container">
            <label htmlFor="type">Loại điểm</label>
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
              className="input-monitoringpoints"
              required
            >
              <option value="">Chọn loại điểm</option>
              {allTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group-monitoringpoints">
            <div className="type-select-container">
            <label htmlFor="status">Trạng thái</label>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setOpenStatusDialog(true)}
                className="add-type-button"
              >
                + Thêm trạng thái
              </Button>
            </div>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="input-monitoringpoints"
              required
            >
              <option value="">Chọn trạng thái</option>
              {allStatuses.map((status) => (
                <option key={status.name} value={status.name}>
                  {status.name}
                </option>
              ))}
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
                  value={formData.coordinates.coordinates[0]}
                  onChange={handleInputChange}
                  className="input-monitoringpoints"
                  step="any"
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
                  value={formData.coordinates.coordinates[1]}
                  onChange={handleInputChange}
                  className="input-monitoringpoints"
                  step="any"
                  min="-90"
                  max="90"
                  placeholder="Ví dụ: 20.865139"
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-actions">
          <button
            type="submit"
            className="submit-button-monitoringpoints"
            disabled={loading || !previewData}
          >
              {loading ? "Đang xử lý..." : editMode ? "Cập nhật" : "Thêm mới"}
            </button>
            {editMode && (
              <button
                type="button"
                className="cancel-button-monitoringpoints"
                onClick={resetForm}
              >
                Hủy
          </button>
            )}
          </div>
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

      <div className="points-list-section">
        <h2>Danh sách điểm quan trắc</h2>

        <div className="points-filters">
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
            <option value="Thường xuyên">Thường xuyên</option>
            <option value="Định kỳ">Định kỳ</option>
            <option value="Đột xuất">Đột xuất</option>
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
            <option value="Hoạt động">Hoạt động</option>
            <option value="Tạm dừng">Tạm dừng</option>
            <option value="Ngưng hoạt động">Ngưng hoạt động</option>
          </TextField>
        </div>

        <TableContainer component={Paper} className="points-table">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Tên điểm</TableCell>
                <TableCell>Loại</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell>Tọa độ</TableCell>
                <TableCell align="center">Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPoints
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((point) => (
                  <TableRow key={point._id}>
                    <TableCell>{point.name}</TableCell>
                    <TableCell>{point.type}</TableCell>
                    <TableCell>
                      <span
                        className={`status-badge ${point.status
                          .toLowerCase()
                          .replace(/\s+/g, "-")}`}
                        style={{
                          backgroundColor:
                            allStatuses.find((s) => s.name === point.status)
                              ?.color || "#2d5a27",
                        }}
                      >
                        {point.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      {point.coordinates.coordinates[1].toFixed(6)},{" "}
                      {point.coordinates.coordinates[0].toFixed(6)}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        color="primary"
                        onClick={() => handleView(point)}
                        title="Xem"
                      >
                        <Visibility />
                      </IconButton>
                      <IconButton
                        color="primary"
                        onClick={() => handleEdit(point)}
                        title="Sửa"
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleDelete(point)}
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
            count={filteredPoints.length}
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
            Bạn có chắc chắn muốn xóa điểm quan trắc "{selectedPoint?.name}"
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
        <DialogTitle>Thêm loại điểm quan trắc mới</DialogTitle>
        <form onSubmit={handleAddType}>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Tên loại điểm"
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

      {/* Add Status Dialog */}
      <Dialog
        open={openStatusDialog}
        onClose={() => setOpenStatusDialog(false)}
      >
        <DialogTitle>Thêm trạng thái mới</DialogTitle>
        <form onSubmit={handleAddStatus}>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Tên trạng thái"
              type="text"
              fullWidth
              variant="outlined"
              value={statusFormData.name}
              onChange={(e) =>
                setStatusFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              required
            />
            <TextField
              margin="dense"
              label="Mô tả"
              type="text"
              fullWidth
              variant="outlined"
              value={statusFormData.description}
              onChange={(e) =>
                setStatusFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              multiline
              rows={2}
            />
            <TextField
              margin="dense"
              label="Màu sắc"
              type="color"
              fullWidth
              variant="outlined"
              value={statusFormData.color}
              onChange={(e) =>
                setStatusFormData((prev) => ({
                  ...prev,
                  color: e.target.value,
                }))
              }
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenStatusDialog(false)}>Hủy</Button>
            <Button type="submit" variant="contained">
              Thêm mới
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </div>
  );
};

export default MonitoringPoints;
