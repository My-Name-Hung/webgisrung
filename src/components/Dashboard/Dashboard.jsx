import axios from "axios";
import React, { useEffect, useState } from "react";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import { FaChartBar, FaChartLine, FaChartPie } from "react-icons/fa";
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
    // Start tour when data is loaded
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

  const forestAreaData = {
    labels: dashboardData?.status?.map((s) => s.type) || [],
    datasets: [
      {
        label: "Diện tích (ha)",
        data: dashboardData?.status?.map((s) => s.area) || [],
        backgroundColor: [
          "rgba(44, 122, 123, 0.8)",
          "rgba(56, 178, 172, 0.8)",
          "rgba(49, 151, 149, 0.8)",
        ],
      },
    ],
  };

  const forestQualityData = {
    labels: ["Tốt", "Trung bình", "Kém"],
    datasets: [
      {
        data: [
          dashboardData?.status?.filter((s) => s.quality === "Tốt").length || 0,
          dashboardData?.status?.filter((s) => s.quality === "Trung bình")
            .length || 0,
          dashboardData?.status?.filter((s) => s.quality === "Kém").length || 0,
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
    labels: dashboardData?.indices?.map((i) => i.year) || [],
    datasets: [
      {
        label: "Chỉ số phát triển",
        data: dashboardData?.indices?.map((i) => i.value) || [],
        borderColor: "rgb(44, 122, 123)",
        tension: 0.1,
      },
    ],
  };

  const hasAreaData = forestAreaData.labels.length > 0;
  const hasQualityData = forestQualityData.datasets[0].data.some((d) => d > 0);
  const hasIndicesData = forestIndicesData.labels.length > 0;

  return (
    <div className="dashboard-container">
      <h1 className="title-dashboard">Tổng quan</h1>

      <div className="stats-grid-dashboard">
        <div className="stat-card-dashboard">
          <h3>Tổng diện tích rừng</h3>
          <p className="stat-value-dashboard">
            {dashboardData?.status
              ?.reduce((sum, s) => sum + s.area, 0)
              .toLocaleString() || "0"}{" "}
            ha
          </p>
        </div>

        <div className="stat-card-dashboard">
          <h3>Số điểm quan trắc</h3>
          <p className="stat-value-dashboard">
            {dashboardData?.monitoring?.length || 0}
          </p>
        </div>

        <div className="stat-card-dashboard">
          <h3>Kế hoạch quy hoạch</h3>
          <p className="stat-value-dashboard">
            {dashboardData?.planning?.length || 0}
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
                      position: "bottom",
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
                      position: "bottom",
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
      </div>
    </div>
  );
};

export default Dashboard;
