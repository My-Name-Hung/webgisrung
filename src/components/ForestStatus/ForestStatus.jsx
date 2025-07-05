import axios from "axios";
import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import styles from "./ForestStatus.module.css";

const ForestStatus = () => {
  const [statusList, setStatusList] = useState([]);
  const [formData, setFormData] = useState({
    type: "",
    area: "",
    quality: "",
    lastSurvey: new Date().toISOString().split("T")[0],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_SERVER_URL}/api/forest/status`
      );
      setStatusList(response.data);
    } catch (err) {
      setError("Không thể tải dữ liệu hiện trạng rừng");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "area" ? parseFloat(value) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/forest/status`,
        formData
      );
      setSuccess("Thêm hiện trạng rừng thành công");
      setFormData({
        type: "",
        area: "",
        quality: "",
        lastSurvey: new Date().toISOString().split("T")[0],
      });
      fetchStatus();
    } catch (err) {
      setError("Không thể thêm hiện trạng rừng");
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data
  const chartData = {
    labels: statusList.map((s) => s.type),
    datasets: [
      {
        label: "Diện tích (ha)",
        data: statusList.map((s) => s.area),
        backgroundColor: [
          "rgba(44, 122, 123, 0.8)",
          "rgba(56, 178, 172, 0.8)",
          "rgba(49, 151, 149, 0.8)",
          "rgba(72, 187, 120, 0.8)",
        ],
      },
    ],
  };

  return (
    <div className={styles.forestStatus}>
      <h1 className={styles.title}>Quản lý hiện trạng rừng</h1>

      <div className={styles.formSection}>
        <h2>Thêm hiện trạng mới</h2>

        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.success}>{success}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="type">Loại rừng</label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className={styles.input}
              required
            >
              <option value="">Chọn loại rừng</option>
              <option value="Rừng tự nhiên">Rừng tự nhiên</option>
              <option value="Rừng trồng">Rừng trồng</option>
              <option value="Rừng phòng hộ">Rừng phòng hộ</option>
              <option value="Rừng đặc dụng">Rừng đặc dụng</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="area">Diện tích (ha)</label>
            <input
              type="number"
              id="area"
              name="area"
              value={formData.area}
              onChange={handleInputChange}
              className={styles.input}
              step="0.01"
              min="0"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="quality">Chất lượng</label>
            <select
              id="quality"
              name="quality"
              value={formData.quality}
              onChange={handleInputChange}
              className={styles.input}
              required
            >
              <option value="">Chọn chất lượng</option>
              <option value="Tốt">Tốt</option>
              <option value="Trung bình">Trung bình</option>
              <option value="Kém">Kém</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="lastSurvey">Ngày khảo sát</label>
            <input
              type="date"
              id="lastSurvey"
              name="lastSurvey"
              value={formData.lastSurvey}
              onChange={handleInputChange}
              className={styles.input}
              required
            />
          </div>

          <button
            type="submit"
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? "Đang lưu..." : "Thêm mới"}
          </button>
        </form>
      </div>

      <div className={styles.chartSection}>
        <h2>Biểu đồ diện tích theo loại rừng</h2>
        <div className={styles.chart}>
          <Bar
            data={chartData}
            options={{
              responsive: true,
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
                    text: "Diện tích (ha)",
                  },
                },
              },
            }}
          />
        </div>
      </div>

      <div className={styles.statusList}>
        <h2>Danh sách hiện trạng</h2>

        {statusList.length === 0 ? (
          <p className={styles.noData}>Chưa có dữ liệu hiện trạng</p>
        ) : (
          <div className={styles.statusGrid}>
            {statusList.map((status, i) => (
              <div key={i} className={styles.statusCard}>
                <h3>{status.type}</h3>
                <p className={styles.area}>{status.area.toLocaleString()} ha</p>
                <p className={styles.quality}>
                  Chất lượng:{" "}
                  <span className={styles[status.quality.toLowerCase()]}>
                    {status.quality}
                  </span>
                </p>
                <p>
                  Khảo sát: {new Date(status.lastSurvey).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ForestStatus;
