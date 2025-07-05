import { useTour } from "@reactour/tour";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import { forestIndicesSteps } from "../../config/tourSteps";
import styles from "./ForestIndices.module.css";

const ForestIndices = () => {
  const [indices, setIndices] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    value: "",
    unit: "",
    year: new Date().getFullYear(),
    category: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { setSteps, setIsOpen } = useTour();

  useEffect(() => {
    fetchIndices();
  }, []);

  useEffect(() => {
    // Start tour when data is loaded
    if (indices.length > 0) {
      setSteps(forestIndicesSteps);
      setIsOpen(true);
    }
  }, [indices, setSteps, setIsOpen]);

  const fetchIndices = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_SERVER_URL}/api/forest/indices`
      );
      setIndices(response.data);
    } catch (err) {
      setError("Không thể tải dữ liệu chỉ số rừng");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "value" ? parseFloat(value) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/forest/indices`,
        formData
      );
      setSuccess("Thêm chỉ số rừng thành công");
      setFormData({
        name: "",
        value: "",
        unit: "",
        year: new Date().getFullYear(),
        category: "",
      });
      fetchIndices();
    } catch (err) {
      setError("Không thể thêm chỉ số rừng");
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data
  const chartData = {
    labels: indices.map((i) => i.year),
    datasets: Array.from(new Set(indices.map((i) => i.category))).map(
      (category) => ({
        label: category,
        data: indices
          .filter((i) => i.category === category)
          .map((i) => i.value),
        borderColor: `hsl(${Math.random() * 360}, 70%, 50%)`,
        tension: 0.1,
      })
    ),
  };

  return (
    <div className={styles.forestIndices}>
      <h1 className={styles.title}>Quản lý chỉ số rừng</h1>

      <div className={`${styles.formSection} formSection`}>
        <h2>Thêm chỉ số mới</h2>

        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.success}>{success}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="name">Tên chỉ số</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={styles.input}
              placeholder="Nhập tên chỉ số"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="value">Giá trị</label>
            <input
              type="number"
              id="value"
              name="value"
              value={formData.value}
              onChange={handleInputChange}
              className={styles.input}
              step="any"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="unit">Đơn vị</label>
            <input
              type="text"
              id="unit"
              name="unit"
              value={formData.unit}
              onChange={handleInputChange}
              className={styles.input}
              placeholder="Nhập đơn vị"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="year">Năm</label>
            <input
              type="number"
              id="year"
              name="year"
              value={formData.year}
              onChange={handleInputChange}
              className={styles.input}
              min="1900"
              max="2100"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="category">Danh mục</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className={styles.input}
              required
            >
              <option value="">Chọn danh mục</option>
              <option value="Độ che phủ">Độ che phủ</option>
              <option value="Chất lượng">Chất lượng</option>
              <option value="Đa dạng sinh học">Đa dạng sinh học</option>
              <option value="Bảo tồn">Bảo tồn</option>
            </select>
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

      <div className={`${styles.chartSection} chartSection`}>
        <h2>Biểu đồ chỉ số theo thời gian</h2>
        <div className={styles.chart}>
          <Line
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
                },
              },
            }}
          />
        </div>
      </div>

      <div className={`${styles.indicesList} indicesList`}>
        <h2>Danh sách chỉ số</h2>

        {indices.length === 0 ? (
          <p className={styles.noData}>Chưa có dữ liệu chỉ số</p>
        ) : (
          <div className={styles.indicesGrid}>
            {indices.map((index, i) => (
              <div key={i} className={styles.indexCard}>
                <h3>{index.name}</h3>
                <p className={styles.value}>
                  {index.value} {index.unit}
                </p>
                <p>Danh mục: {index.category}</p>
                <p>Năm: {index.year}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ForestIndices;
