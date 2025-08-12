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
import ReactDOMServer from "react-dom/server";
import {
  FaFileUpload,
  FaMapMarkedAlt,
  FaMapMarkerAlt,
  FaSatellite,
  FaTrash,
} from "react-icons/fa";
import shp from "shpjs";
import { forestMapSteps } from "../../config/tourSteps";
import useCustomTour from "../../hooks/useTour";
import { applyStyle, parseSLD } from "../../utils/sldParser";
import "../shared/sld-styles.css";
import "./ForestMap.css";

const CustomMarkerIcon = () => (
  <div className="custom-marker-container">
    <FaMapMarkerAlt className="custom-marker-icon" />
  </div>
);

const DEFAULT_MAP_TYPES = [
  "Hiện trạng",
  "Quy hoạch",
  "Điểm quan trắc",
  "Đa dạng sinh học",
];

const ForestMap = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [mapName, setMapName] = useState("");
  const [mapType, setMapType] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [previewData, setPreviewData] = useState(null);
  const [isSatelliteView, setIsSatelliteView] = useState(false);
  const [maps, setMaps] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedMap, setSelectedMap] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    type: "",
  });
  const [allMapTypes, setAllMapTypes] = useState([]);
  const [openTypeDialog, setOpenTypeDialog] = useState(false);
  const [typeFormData, setTypeFormData] = useState({
    name: "",
    description: "",
  });
  const [sldFile, setSldFile] = useState(null);
  const [mapStyle, setMapStyle] = useState(null);
  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const previewLayer = useRef(null);
  const tileLayer = useRef(null);
  const { startTour } = useCustomTour(forestMapSteps);

  useEffect(() => {
    fetchMaps();
    fetchMapTypes();
  }, []);

  const fetchMaps = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_SERVER_URL}/api/geojson`
      );
      setMaps(response.data);
    } catch (err) {
      setError("Không thể tải danh sách bản đồ");
    }
  };

  const fetchMapTypes = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_SERVER_URL}/api/types/map`
      );
      // Combine default types with custom types
      setAllMapTypes([
        ...DEFAULT_MAP_TYPES,
        ...response.data.map((type) => type.name),
      ]);
    } catch (err) {
      setError("Không thể tải danh sách loại bản đồ");
      // Fallback to default types if API fails
      setAllMapTypes(DEFAULT_MAP_TYPES);
    }
  };

  const handleAddType = async (e) => {
    e.preventDefault();
    if (!typeFormData.name) {
      setError("Vui lòng nhập tên loại bản đồ");
      return;
    }

    try {
      await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/types/map`,
        typeFormData
      );
      setSuccess("Thêm loại bản đồ thành công");
      setOpenTypeDialog(false);
      setTypeFormData({ name: "", description: "" });
      fetchMapTypes();
    } catch (err) {
      setError(err.response?.data?.message || "Không thể thêm loại bản đồ");
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
        pointToLayer: (feature, latlng) => {
          if (mapStyle) {
            const style = applyStyle(feature, mapStyle);
            // Create circle marker with SLD style
            return L.circleMarker(latlng, {
              fillColor: style.fillColor,
              color: style.color,
              weight: style.weight,
              opacity: style.opacity,
              fillOpacity: style.fillOpacity,
              radius: style.radius || 8,
            });
          }
          // Default style for points
          return L.circleMarker(latlng, {
            radius: 8,
            fillColor: "#ff7800",
            color: "#000",
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8,
          });
        },
        style: (feature) => {
          if (mapStyle) {
            return applyStyle(feature, mapStyle);
          }
          // Default style for polygons/lines
          return {
            fillColor: "#2d5a27",
            weight: 2,
            opacity: 1,
            color: "#2d5a27",
            fillOpacity: 0.7,
          };
        },
        onEachFeature: (feature, layer) => {
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
        },
      }).addTo(leafletMap.current);

      leafletMap.current.fitBounds(previewLayer.current.getBounds());

      setPreviewData(geoJsonData);
    } catch (err) {
      setError("Không thể đọc file. Vui lòng kiểm tra định dạng file.");
      setSelectedFile(null);
      setPreviewData(null);
    }
  };

  const handleSldFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith(".sld")) {
      setError("Vui lòng chọn file SLD hợp lệ");
      return;
    }

    try {
      const text = await file.text();
      const styleRules = await parseSLD(text);
      setMapStyle(styleRules);
      setSldFile(file);

      // Re-render map with new style if data exists
      if (previewLayer.current && previewData) {
        leafletMap.current.removeLayer(previewLayer.current);
        previewLayer.current = L.geoJSON(previewData, {
          pointToLayer: (feature, latlng) => {
            const style = applyStyle(feature, styleRules);
            return L.circleMarker(latlng, {
              fillColor: style.fillColor,
              color: style.color,
              weight: style.weight,
              opacity: style.opacity,
              fillOpacity: style.fillOpacity,
              radius: style.radius || 8,
            });
          },
          style: (feature) => {
            return applyStyle(feature, styleRules);
          },
          onEachFeature: (feature, layer) => {
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
          },
        }).addTo(leafletMap.current);

        leafletMap.current.fitBounds(previewLayer.current.getBounds());
      }

      setSuccess("Áp dụng style thành công");
    } catch (err) {
      console.error("Error parsing SLD:", err);
      setError("Không thể đọc file SLD. Vui lòng kiểm tra định dạng file.");
      setSldFile(null);
      setMapStyle(null);
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

  const filteredMaps = maps.filter((map) => {
    const matchSearch = map.name
      .toLowerCase()
      .includes(filters.search.toLowerCase());
    const matchType = !filters.type || map.type === filters.type;
    return matchSearch && matchType;
  });

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleView = async (map) => {
    try {
      if (previewLayer.current) {
        leafletMap.current.removeLayer(previewLayer.current);
      }

      // Load SLD styles if available
      let stylesToApply = null;
      if (map.sldData && map.sldData.styles) {
        stylesToApply = map.sldData.styles;
        setMapStyle(stylesToApply);
        console.log("Loaded SLD styles from saved map:", stylesToApply);
      }

      previewLayer.current = L.geoJSON(map.data, {
        pointToLayer: (feature, latlng) => {
          if (stylesToApply) {
            const style = applyStyle(feature, stylesToApply);
            return L.circleMarker(latlng, {
              fillColor: style.fillColor,
              color: style.color,
              weight: style.weight,
              opacity: style.opacity,
              fillOpacity: style.fillOpacity,
              radius: style.radius || 8,
            });
          }
          return createCustomMarker(feature, latlng);
        },
        style: (feature) => {
          if (stylesToApply) {
            return applyStyle(feature, stylesToApply);
          }
          return {
            fillColor: "#2d5a27",
            weight: 2,
            opacity: 1,
            color: "#2d5a27",
            fillOpacity: 0.7,
          };
        },
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
    } catch (err) {
      setError("Không thể hiển thị bản đồ");
    }
  };

  const handleEdit = (map) => {
    setSelectedMap(map);
    setMapName(map.name);
    setMapType(map.type);
    setPreviewData(map.data);
    setEditMode(true);

    // Load SLD data if available
    if (map.sldData) {
      if (map.sldData.styles) {
        setMapStyle(map.sldData.styles);
      }
      // Note: We can't restore the actual file object, but we have the content
      // The user would need to re-upload if they want to modify the SLD
    }

    // Hiển thị dữ liệu trên bản đồ
    handleView(map);
  };

  const handleDelete = (map) => {
    setSelectedMap(map);
    setOpenDialog(true);
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_SERVER_URL}/api/geojson/${selectedMap._id}`
      );
      setSuccess("Xóa bản đồ thành công");
      fetchMaps();

      if (previewLayer.current) {
        leafletMap.current.removeLayer(previewLayer.current);
        previewLayer.current = null;
      }
    } catch (err) {
      setError("Không thể xóa bản đồ");
    }
    setOpenDialog(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!mapName || !mapType || (!selectedFile && !editMode) || !previewData) {
      setError("Vui lòng điền đầy đủ thông tin và chọn file hợp lệ");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const data = {
        name: mapName,
        type: mapType,
        data: previewData,
      };

      // Include SLD data if available
      if (mapStyle && sldFile) {
        data.sldData = {
          content: await sldFile.text(), // Save the raw SLD content
          styles: mapStyle, // Save the parsed styles
        };
      }

      if (editMode && selectedMap) {
        await axios.put(
          `${import.meta.env.VITE_SERVER_URL}/api/geojson/${selectedMap._id}`,
          data
        );
        setSuccess("Cập nhật bản đồ thành công");
      } else {
        await axios.post(
          `${import.meta.env.VITE_SERVER_URL}/api/geojson`,
          data
        );
        setSuccess("Tải lên bản đồ thành công");
      }

      resetForm();
      fetchMaps();
    } catch (err) {
      setError(
        editMode ? "Không thể cập nhật bản đồ" : "Không thể tải lên bản đồ"
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setMapName("");
    setMapType("");
    setSelectedFile(null);
    setPreviewData(null);
    setSelectedMap(null);
    setEditMode(false);
    setSldFile(null);
    setMapStyle(null);

    if (previewLayer.current) {
      leafletMap.current.removeLayer(previewLayer.current);
      previewLayer.current = null;
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

  return (
    <div className="forestmap-container">
      <h1 className="title-forestmap">Quản lý bản đồ</h1>

      <div className="upload-section-forestmap">
        <h2>{editMode ? "Cập nhật bản đồ" : "Tải lên bản đồ mới"}</h2>

        {error && <div className="error-forestmap">{error}</div>}
        {success && <div className="success-forestmap">{success}</div>}

        <form onSubmit={handleSubmit} className="upload-form-forestmap">
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
            <div className="type-select-container">
              <label htmlFor="mapType">Loại bản đồ</label>
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
              id="mapType"
              value={mapType}
              onChange={(e) => setMapType(e.target.value)}
              className="input-forestmap"
            >
              <option value="">Chọn loại bản đồ</option>
              {allMapTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
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

          <div className="form-group-forestmap">
            <label>File style (SLD)</label>
            <div className="file-input-forestmap">
              <input
                type="file"
                accept=".sld"
                onChange={handleSldFileChange}
                style={{ display: "none" }}
                id="sldInput"
              />
              <label
                htmlFor="sldInput"
                style={{ cursor: "pointer", display: "block" }}
              >
                <FaFileUpload
                  style={{ fontSize: "2rem", marginBottom: "0.5rem" }}
                />
                <div>Kéo thả file hoặc click để chọn</div>
                <div style={{ fontSize: "0.8rem", color: "#666" }}>
                  (Hỗ trợ: SLD - Styled Layer Descriptor)
                </div>
              </label>
            </div>
            {sldFile && (
              <div className="file-preview-forestmap">
                <div>File style đã chọn: {sldFile.name}</div>
                <div>Kích thước: {(sldFile.size / 1024).toFixed(2)} KB</div>
              </div>
            )}
          </div>

          <div className="form-actions-forestmap">
            <button
              type="submit"
              className="upload-button-forestmap"
              disabled={loading || (!selectedFile && !editMode) || !previewData}
            >
              {loading ? "Đang xử lý..." : editMode ? "Cập nhật" : "Tải lên"}
            </button>
            {editMode && (
              <button
                type="button"
                className="cancel-button-forestmap"
                onClick={resetForm}
              >
                Hủy
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="preview-section-forestmap">
        <h2>Xem trước bản đồ</h2>

        <div className="map-controls-forestmap">
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
                setPreviewData(null);
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

        <div className="preview-map-forestmap" ref={mapRef}></div>
      </div>

      <div className="maps-list-section">
        <h2>Danh sách bản đồ</h2>

        <div className="maps-filters">
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
            <option value="Hiện trạng">Hiện trạng</option>
            <option value="Quy hoạch">Quy hoạch</option>
            <option value="Điểm quan trắc">Điểm quan trắc</option>
            <option value="Đa dạng sinh học">Đa dạng sinh học</option>
          </TextField>
        </div>

        <TableContainer component={Paper} className="maps-table">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Tên bản đồ</TableCell>
                <TableCell>Loại</TableCell>
                <TableCell>Ngày tạo</TableCell>
                <TableCell align="center">Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredMaps
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((map) => (
                  <TableRow key={map._id}>
                    <TableCell>{map.name}</TableCell>
                    <TableCell>{map.type}</TableCell>
                    <TableCell>
                      {new Date(map.createdAt).toLocaleDateString("vi-VN")}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        color="primary"
                        onClick={() => handleView(map)}
                        title="Xem"
                      >
                        <Visibility />
                      </IconButton>
                      <IconButton
                        color="primary"
                        onClick={() => handleEdit(map)}
                        title="Sửa"
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleDelete(map)}
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
            count={filteredMaps.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
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
            Bạn có chắc chắn muốn xóa bản đồ "{selectedMap?.name}" không?
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
        <DialogTitle>Thêm loại bản đồ mới</DialogTitle>
        <form onSubmit={handleAddType}>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Tên loại bản đồ"
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

export default ForestMap;
