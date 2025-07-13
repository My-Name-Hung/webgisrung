import { useTour } from "@reactour/tour";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import { FaChartBar } from "react-icons/fa";
import { forestIndicesSteps } from "../../config/tourSteps";
import "./ForestIndices.css";

const ForestIndices = () => {
  const [formData, setFormData] = useState({
    name: "",
    value: "",
    unit: "",
    year: new Date().getFullYear(),
    category: "",
  });
  const [previewData, setPreviewData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { setSteps, setIsOpen } = useTour();

  useEffect(() => {
    // Start tour when preview data is loaded
    if (previewData) {
      setSteps(forestIndicesSteps);
      setIsOpen(true);
    }
  }, [previewData, setSteps, setIsOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const newFormData = {
      ...formData,
      [name]: name === "value" ? parseFloat(value) : value,
    };
    setFormData(newFormData);

    // Update preview data
    if (Object.values(newFormData).every((v) => v !== "")) {
      setPreviewData(newFormData);
    }
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
      await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/forest/indices`,
        previewData
      );
      setSuccess("Thêm chỉ số rừng thành công");
      setFormData({
        name: "",
        value: "",
        unit: "",
        year: new Date().getFullYear(),
        category: "",
      });
      setPreviewData(null);
    } catch (err) {
      setError("Không thể thêm chỉ số rừng");
    } finally {
      setLoading(false);
    }
  };

  // Prepare preview chart data
  const chartData = previewData
    ? {
        labels: [previewData.year],
        datasets: [
          {
            label: previewData.name,
            data: [previewData.value],
            backgroundColor: "rgba(45, 90, 39, 0.8)",
            borderColor: "rgba(45, 90, 39, 1)",
            borderWidth: 1,
            borderRadius: 4,
            barThickness: 40,
            maxBarThickness: 60,
          },
        ],
      }
    : {
        labels: [],
        datasets: [
          {
            label: "Chưa có dữ liệu",
            data: [],
            backgroundColor: "rgba(45, 90, 39, 0.8)",
            borderColor: "rgba(45, 90, 39, 1)",
            borderWidth: 1,
            borderRadius: 4,
          },
        ],
      };

  return (
    <div className="forestindices-container">
      <h1 className="title-forestindices">Quản lý chỉ số rừng</h1>

      <div className="form-section-forestindices">
        <h2>Thêm chỉ số mới</h2>

        {error && <div className="error-forestindices">{error}</div>}
        {success && <div className="success-forestindices">{success}</div>}

        <form onSubmit={handleSubmit} className="form-forestindices">
          <div className="form-group-forestindices">
            <label htmlFor="name">Tên chỉ số</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="input-forestindices"
              placeholder="Nhập tên chỉ số"
              required
            />
          </div>

          <div className="form-group-forestindices">
            <label htmlFor="value">Giá trị</label>
            <input
              type="number"
              id="value"
              name="value"
              value={formData.value}
              onChange={handleInputChange}
              className="input-forestindices"
              step="any"
              required
            />
          </div>

          <div className="form-group-forestindices">
            <label htmlFor="unit">Đơn vị</label>
            <input
              type="text"
              id="unit"
              name="unit"
              value={formData.unit}
              onChange={handleInputChange}
              className="input-forestindices"
              placeholder="Nhập đơn vị"
              required
            />
          </div>

          <div className="form-group-forestindices">
            <label htmlFor="year">Năm</label>
            <input
              type="number"
              id="year"
              name="year"
              value={formData.year}
              onChange={handleInputChange}
              className="input-forestindices"
              min="1900"
              max="2100"
              required
            />
          </div>

          <div className="form-group-forestindices">
            <label htmlFor="category">Danh mục</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="input-forestindices"
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
            className="submit-button-forestindices"
            disabled={loading || !previewData}
          >
            {loading ? "Đang lưu..." : "Thêm mới"}
          </button>
        </form>
      </div>

      <div className="preview-section-forestindices">
        <h2>Xem trước dữ liệu</h2>

        {previewData ? (
          <>
            <div className="preview-chart-forestindices">
              <Bar
                data={chartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: "bottom",
                      labels: {
                        font: {
                          size: 12,
                          family: "system-ui",
                        },
                        padding: 20,
                        usePointStyle: true,
                        boxWidth: 8,
                        boxHeight: 8,
                      },
                    },
                    title: {
                      display: true,
                      text: "Biểu đồ chỉ số theo thời gian",
                      font: {
                        size: 16,
                        family: "system-ui",
                        weight: "500",
                      },
                      padding: {
                        top: 10,
                        bottom: 30,
                      },
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      grid: {
                        color: "rgba(45, 90, 39, 0.1)",
                        drawBorder: false,
                      },
                      ticks: {
                        font: {
                          size: 12,
                        },
                        callback: function (value) {
                          return value + " " + (previewData?.unit || "");
                        },
                      },
                      title: {
                        display: true,
                        text: "Giá trị (" + (previewData?.unit || "") + ")",
                        font: {
                          size: 12,
                          weight: "500",
                        },
                        padding: { top: 10, bottom: 10 },
                      },
                    },
                    x: {
                      grid: {
                        display: false,
                      },
                      ticks: {
                        font: {
                          size: 12,
                        },
                      },
                      title: {
                        display: true,
                        text: "Năm",
                        font: {
                          size: 12,
                          weight: "500",
                        },
                        padding: { top: 10, bottom: 0 },
                      },
                    },
                  },
                }}
              />
            </div>

            <table className="preview-table-forestindices">
              <thead>
                <tr>
                  <th>Thuộc tính</th>
                  <th>Giá trị</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Tên chỉ số</td>
                  <td>{previewData.name}</td>
                </tr>
                <tr>
                  <td>Giá trị</td>
                  <td>
                    {previewData.value} {previewData.unit}
                  </td>
                </tr>
                <tr>
                  <td>Năm</td>
                  <td>{previewData.year}</td>
                </tr>
                <tr>
                  <td>Danh mục</td>
                  <td>{previewData.category}</td>
                </tr>
              </tbody>
            </table>
          </>
        ) : (
          <div className="no-data-forestindices">
            <FaChartBar />
            <p>Nhập thông tin để xem trước dữ liệu</p>
            <p>Dữ liệu sẽ được hiển thị dưới dạng biểu đồ cột và bảng</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForestIndices;
