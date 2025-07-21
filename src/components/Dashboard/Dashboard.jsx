import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import axios from "axios";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import React, { useCallback, useEffect, useState } from "react";
import { Bar, Doughnut, Line, Pie } from "react-chartjs-2";
import {
  FaChartBar,
  FaChartLine,
  FaChartPie,
  FaEye,
  FaMapMarkedAlt,
  FaTasks,
} from "react-icons/fa";
import { MdForest } from "react-icons/md";
import { GeoJSON, MapContainer, TileLayer, useMap } from "react-leaflet";
import { dashboardSteps } from "../../config/tourSteps";
import useCustomTour from "../../hooks/useTour";
import "./Dashboard.css";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const EmptyChart = ({ icon: Icon, message }) => (
  <div className="empty-chart-dashboard">
    {Icon && <Icon className="empty-chart-icon" />}
    <p>{message}</p>
  </div>
);

// Component to fit map bounds to GeoJSON
const MapBoundsFitter = ({ geojson }) => {
  const map = useMap();

  useEffect(() => {
    if (geojson) {
      try {
        const layer = L.geoJSON(geojson);
        const bounds = layer.getBounds();
        map.fitBounds(bounds);
      } catch (error) {
        console.error("Error fitting bounds:", error);
      }
    }
  }, [geojson, map]);

  return null;
};

const MapDialog = ({ open, onClose, data }) => {
  const [parsedGeoJSON, setParsedGeoJSON] = useState(null);

  useEffect(() => {
    if (data?.geojson) {
      try {
        // Parse GeoJSON if it's a string
        const geoJSONData =
          typeof data.geojson === "string"
            ? JSON.parse(data.geojson)
            : data.geojson;
        setParsedGeoJSON(geoJSONData);
      } catch (error) {
        console.error("Error parsing GeoJSON:", error);
        setParsedGeoJSON(null);
      }
    }
  }, [data]);

  const onEachFeature = useCallback((feature, layer) => {
    if (feature.properties) {
      const popupContent = Object.entries(feature.properties)
        .map(([key, value]) => `<strong>${key}:</strong> ${value}`)
        .join("<br>");
      layer.bindPopup(popupContent);
    }
  }, []);

  const style = useCallback(() => {
    return {
      fillColor: "#2d5a27",
      weight: 2,
      opacity: 1,
      color: "#2d5a27",
      fillOpacity: 0.3,
    };
  }, []);

  if (!parsedGeoJSON) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        style: {
          maxHeight: "90vh",
        },
      }}
    >
      <DialogTitle>{data?.type || data?.name || "Bản đồ chi tiết"}</DialogTitle>
      <DialogContent style={{ height: "70vh", padding: 0 }}>
        <MapContainer
          center={[16.0376435, 108.187897]}
          zoom={11}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {parsedGeoJSON && (
            <GeoJSON
              data={parsedGeoJSON}
              style={style}
              onEachFeature={onEachFeature}
            />
          )}
          <MapBoundsFitter geojson={parsedGeoJSON} />
        </MapContainer>
      </DialogContent>
    </Dialog>
  );
};

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedData, setSelectedData] = useState(null);
  const [mapDialogOpen, setMapDialogOpen] = useState(false);
  const { startTour } = useCustomTour(dashboardSteps);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (dashboardData && !loading) {
      startTour();
    }
  }, [dashboardData, loading, startTour]);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_SERVER_URL}/api/forest/dashboard`
      );
      setDashboardData(response.data);
      setLoading(false);
    } catch (err) {
      setError("Không thể tải dữ liệu tổng quan");
      setLoading(false);
    }
  };

  const handleViewMap = (data) => {
    setSelectedData(data);
    setMapDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="loading-dashboard">
        <div className="loading-spinner-dashboard" />
        <p>Đang tải dữ liệu...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-dashboard">
        <p>{error}</p>
        <Button
          variant="contained"
          color="primary"
          onClick={fetchDashboardData}
          style={{ marginTop: "1rem" }}
        >
          Thử lại
        </Button>
      </div>
    );
  }

  // Format number with commas
  const formatNumber = (num) => {
    if (!num) return "0";
    return new Intl.NumberFormat("vi-VN").format(num);
  };

  // Prepare chart data
  const forestAreaData = {
    labels: Object.keys(dashboardData?.status?.byType || {}),
    datasets: [
      {
        label: "Diện tích (ha)",
        data: Object.values(dashboardData?.status?.byType || {}),
        backgroundColor: [
          "rgba(44, 122, 123, 0.8)",
          "rgba(56, 178, 172, 0.8)",
          "rgba(49, 151, 149, 0.8)",
          "rgba(44, 122, 123, 0.6)",
        ],
      },
    ],
  };

  const forestQualityData = {
    labels: ["Tốt", "Trung bình", "Kém"],
    datasets: [
      {
        data: [
          dashboardData?.status?.quality?.good || 0,
          dashboardData?.status?.quality?.average || 0,
          dashboardData?.status?.quality?.poor || 0,
        ],
        backgroundColor: [
          "rgba(72, 187, 120, 0.8)",
          "rgba(246, 173, 85, 0.8)",
          "rgba(245, 101, 101, 0.8)",
        ],
      },
    ],
  };

  const forestIndicesData = {
    labels: dashboardData?.indices?.trends?.map((i) => i.year) || [],
    datasets: [
      {
        label: "Chỉ số phát triển",
        data: dashboardData?.indices?.trends?.map((i) => i.value) || [],
        borderColor: "rgb(44, 122, 123)",
        tension: 0.1,
        fill: false,
      },
    ],
  };

  const monitoringData = {
    labels: Object.keys(dashboardData?.monitoring?.byType || {}),
    datasets: [
      {
        label: "Số điểm quan trắc",
        data: Object.values(dashboardData?.monitoring?.byType || {}),
        backgroundColor: [
          "rgba(49, 130, 206, 0.8)",
          "rgba(72, 187, 120, 0.8)",
          "rgba(246, 173, 85, 0.8)",
        ],
      },
    ],
  };

  const planningData = {
    labels: ["Đã lên kế hoạch", "Đang thực hiện", "Hoàn thành", "Đã hủy"],
    datasets: [
      {
        data: [
          dashboardData?.planning?.byStatus?.planned || 0,
          dashboardData?.planning?.byStatus?.inProgress || 0,
          dashboardData?.planning?.byStatus?.completed || 0,
          dashboardData?.planning?.byStatus?.cancelled || 0,
        ],
        backgroundColor: [
          "rgba(246, 173, 85, 0.8)",
          "rgba(72, 187, 120, 0.8)",
          "rgba(49, 130, 206, 0.8)",
          "rgba(245, 101, 101, 0.8)",
        ],
      },
    ],
  };

  const hasAreaData = forestAreaData.labels.length > 0;
  const hasQualityData = forestQualityData.datasets[0].data.some((d) => d > 0);
  const hasIndicesData = forestIndicesData.labels.length > 0;
  const hasMonitoringData = monitoringData.labels.length > 0;
  const hasPlanningData = planningData.datasets[0].data.some((d) => d > 0);

  return (
    <div className="dashboard-container">
      <h1 className="title-dashboard">Tổng quan</h1>

      <div className="stats-grid-dashboard">
        <div className="stat-card-dashboard">
          <MdForest className="stat-icon-dashboard" />
          <h3>Tổng diện tích rừng</h3>
          <p className="stat-value-dashboard">
            {formatNumber(dashboardData?.status?.total)} ha
          </p>
        </div>

        <div className="stat-card-dashboard">
          <FaMapMarkedAlt className="stat-icon-dashboard" />
          <h3>Số điểm quan trắc</h3>
          <p className="stat-value-dashboard">
            {formatNumber(dashboardData?.monitoring?.total)}
          </p>
        </div>

        <div className="stat-card-dashboard">
          <FaTasks className="stat-icon-dashboard" />
          <h3>Kế hoạch quy hoạch</h3>
          <p className="stat-value-dashboard">
            {formatNumber(dashboardData?.planning?.total)}
          </p>
        </div>
      </div>

      <div className="charts-grid-dashboard">
        <div className="chart-card-dashboard">
          <h3>Diện tích theo loại rừng</h3>
          <div className="chart-container-dashboard">
            {hasAreaData ? (
              <Bar
                data={forestAreaData}
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
            ) : (
              <EmptyChart
                icon={FaChartBar}
                message="Chưa có dữ liệu diện tích rừng"
              />
            )}
          </div>
        </div>

        <div className="chart-card-dashboard">
          <h3>Chất lượng rừng</h3>
          <div className="chart-container-dashboard">
            {hasQualityData ? (
              <Doughnut
                data={forestQualityData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: "bottom",
                    },
                  },
                }}
              />
            ) : (
              <EmptyChart
                icon={FaChartPie}
                message="Chưa có dữ liệu chất lượng rừng"
              />
            )}
          </div>
        </div>

        <div className="chart-card-dashboard">
          <h3>Chỉ số phát triển rừng theo năm</h3>
          <div className="chart-container-dashboard">
            {hasIndicesData ? (
              <Line
                data={forestIndicesData}
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
                        text: "Giá trị",
                      },
                    },
                  },
                }}
              />
            ) : (
              <EmptyChart
                icon={FaChartLine}
                message="Chưa có dữ liệu chỉ số phát triển"
              />
            )}
          </div>
        </div>

        <div className="chart-card-dashboard">
          <h3>Phân bố điểm quan trắc</h3>
          <div className="chart-container-dashboard">
            {hasMonitoringData ? (
              <Bar
                data={monitoringData}
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
                        text: "Số điểm",
                      },
                    },
                  },
                }}
              />
            ) : (
              <EmptyChart
                icon={FaMapMarkedAlt}
                message="Chưa có dữ liệu điểm quan trắc"
              />
            )}
          </div>
        </div>

        <div className="chart-card-dashboard">
          <h3>Trạng thái quy hoạch</h3>
          <div className="chart-container-dashboard">
            {hasPlanningData ? (
              <Pie
                data={planningData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: "bottom",
                    },
                  },
                }}
              />
            ) : (
              <EmptyChart icon={FaTasks} message="Chưa có dữ liệu quy hoạch" />
            )}
          </div>
        </div>
      </div>

      <div className="summary-table-section">
        <h2>Bảng tổng hợp dữ liệu</h2>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Loại dữ liệu</TableCell>
                <TableCell>Tên</TableCell>
                <TableCell>Diện tích (ha)</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell>Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {dashboardData?.status?.data?.map((item) => (
                <TableRow key={item._id}>
                  <TableCell>Hiện trạng rừng</TableCell>
                  <TableCell>{item.type}</TableCell>
                  <TableCell>{formatNumber(item.area)}</TableCell>
                  <TableCell>{item.quality}</TableCell>
                  <TableCell>
                    <IconButton
                      color="primary"
                      onClick={() => handleViewMap(item)}
                      disabled={!item.geojson}
                    >
                      <FaEye />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {dashboardData?.planning?.data?.map((item) => (
                <TableRow key={item._id}>
                  <TableCell>Quy hoạch</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{formatNumber(item.area)}</TableCell>
                  <TableCell>{item.status}</TableCell>
                  <TableCell>
                    <IconButton
                      color="primary"
                      onClick={() => handleViewMap(item)}
                      disabled={!item.geojson}
                    >
                      <FaEye />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </div>

      <MapDialog
        open={mapDialogOpen}
        onClose={() => setMapDialogOpen(false)}
        data={selectedData}
      />
    </div>
  );
};

export default Dashboard;
