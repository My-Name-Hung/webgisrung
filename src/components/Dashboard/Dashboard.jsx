import axios from "axios";
import React, { useEffect, useState } from "react";
import { Bar, Doughnut, Line, Pie } from "react-chartjs-2";
import {
  FaChartBar,
  FaChartLine,
  FaChartPie,
  FaForest,
  FaMapMarkedAlt,
  FaTasks,
} from "react-icons/fa";
import { dashboardSteps } from "../../config/tourSteps";
import useCustomTour from "../../hooks/useTour";
import "./Dashboard.css";

const EmptyChart = ({ icon: Icon, message }) => (
  <div className="empty-chart-dashboard">
    <Icon />
    <p>{message}</p>
  </div>
);

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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

  if (loading) {
    return (
      <div className="loading-dashboard">
        <div className="loading-spinner-dashboard" />
        <p>Đang tải dữ liệu...</p>
      </div>
    );
  }

  if (error) {
    return <div className="error-dashboard">{error}</div>;
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
          <FaForest className="stat-icon-dashboard" />
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
    </div>
  );
};

export default Dashboard;
