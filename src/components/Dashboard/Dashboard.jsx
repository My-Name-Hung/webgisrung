import { useTour } from "@reactour/tour";
import axios from "axios";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import React, { useEffect, useState } from "react";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import { dashboardSteps } from "../../config/tourSteps";
import styles from "./Dashboard.module.css";

// Đăng ký các thành phần ChartJS
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { setSteps, setIsOpen } = useTour();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    // Start tour when data is loaded
    if (dashboardData && !loading) {
      setSteps(dashboardSteps);
      setIsOpen(true);
    }
  }, [dashboardData, loading, setSteps, setIsOpen]);

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
    return <div className={styles.loading}>Đang tải dữ liệu...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
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

  return (
    <div className={styles.dashboard}>
      <h1 className={styles.title}>Tổng quan</h1>

      <div className={`${styles.statsGrid} statsGrid`} data-tour="statsGrid">
        <div className={styles.statCard}>
          <h3>Tổng diện tích rừng</h3>
          <p className={styles.statValue}>
            {dashboardData?.status
              ?.reduce((sum, s) => sum + s.area, 0)
              .toLocaleString()}{" "}
            ha
          </p>
        </div>

        <div className={styles.statCard}>
          <h3>Số điểm quan trắc</h3>
          <p className={styles.statValue}>
            {dashboardData?.monitoring?.length || 0}
          </p>
        </div>

        <div className={styles.statCard}>
          <h3>Kế hoạch quy hoạch</h3>
          <p className={styles.statValue}>
            {dashboardData?.planning?.length || 0}
          </p>
        </div>
      </div>

      <div className={`${styles.chartsGrid} chartsGrid`} data-tour="chartsGrid">
        <div className={styles.chartCard}>
          <h3>Diện tích theo loại rừng</h3>
          <Bar
            data={forestAreaData}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: "bottom",
                },
              },
            }}
          />
        </div>

        <div className={styles.chartCard}>
          <h3>Chất lượng rừng</h3>
          <Doughnut
            data={forestQualityData}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: "bottom",
                },
              },
            }}
          />
        </div>

        <div className={styles.chartCard}>
          <h3>Chỉ số phát triển rừng theo năm</h3>
          <Line
            data={forestIndicesData}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: "bottom",
                },
              },
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
