import axios from "axios";
import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import { forestStatusSteps } from "../../config/tourSteps";
import useCustomTour from "../../hooks/useTour";
import "./ForestStatus.css";

const ForestStatus = () => {
  const [formData, setFormData] = useState({
    type: "",
    area: "",
    quality: "",
    lastSurvey: new Date().toISOString().split("T")[0],
  });
  const [previewData, setPreviewData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { startTour } = useCustomTour(forestStatusSteps);

  useEffect(() => {
    // Start tour when preview data is loaded
    if (previewData) {
      startTour();
    }
  }, [previewData, startTour]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const newFormData = {
      ...formData,
      [name]: name === "area" ? parseFloat(value) : value,
    };
    setFormData(newFormData);

    // Update preview data if all required fields are filled
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
        `${import.meta.env.VITE_SERVER_URL}/api/forest/status`,
        previewData
      );
      setSuccess("Thêm hiện trạng rừng thành công");
      setFormData({
        type: "",
        area: "",
        quality: "",
        lastSurvey: new Date().toISOString().split("T")[0],
      });
      setPreviewData(null);
    } catch (err) {
      setError("Không thể thêm hiện trạng rừng");
    } finally {
      setLoading(false);
    }
  };

  // Prepare preview chart data
  const chartData = previewData
    ? {
        labels: [previewData.type],
        datasets: [
          {
            label: "Diện tích (ha)",
            data: [previewData.area],
            backgroundColor: ["rgba(44, 122, 123, 0.8)"],
          },
        ],
      }
    : {
        labels: [],
        datasets: [
          {
            label: "Diện tích (ha)",
            data: [],
            backgroundColor: [],
          },
        ],
      };

  return (
    <div className="foreststatus-container">
      <h1 className="title-foreststatus">Quản lý hiện trạng rừng</h1>

      <div className="form-section-foreststatus">
        <h2>Thêm hiện trạng mới</h2>

        {error && <div className="error-foreststatus">{error}</div>}
        {success && <div className="success-foreststatus">{success}</div>}

        <form onSubmit={handleSubmit} className="form-foreststatus">
          <div className="form-group-foreststatus">
            <label htmlFor="type">Loại rừng</label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className="input-foreststatus"
              required
            >
              <option value="">Chọn loại rừng</option>
              <option value="Rừng tự nhiên">Rừng tự nhiên</option>
              <option value="Rừng trồng">Rừng trồng</option>
              <option value="Rừng phòng hộ">Rừng phòng hộ</option>
              <option value="Rừng đặc dụng">Rừng đặc dụng</option>
            </select>
          </div>

          <div className="form-group-foreststatus">
            <label htmlFor="area">Diện tích (ha)</label>
            <input
              type="number"
              id="area"
              name="area"
              value={formData.area}
              onChange={handleInputChange}
              className="input-foreststatus"
              step="0.01"
              min="0"
              required
            />
          </div>

          <div className="form-group-foreststatus">
            <label htmlFor="quality">Chất lượng</label>
            <select
              id="quality"
              name="quality"
              value={formData.quality}
              onChange={handleInputChange}
              className="input-foreststatus"
              required
            >
              <option value="">Chọn chất lượng</option>
              <option value="Tốt">Tốt</option>
              <option value="Trung bình">Trung bình</option>
              <option value="Kém">Kém</option>
            </select>
          </div>

          <div className="form-group-foreststatus">
            <label htmlFor="lastSurvey">Ngày khảo sát</label>
            <input
              type="date"
              id="lastSurvey"
              name="lastSurvey"
              value={formData.lastSurvey}
              onChange={handleInputChange}
              className="input-foreststatus"
              required
            />
          </div>

          <button
            type="submit"
            className="submit-button-foreststatus"
            disabled={loading || !previewData}
          >
            {loading ? "Đang lưu..." : "Thêm mới"}
          </button>
        </form>
      </div>

      <div className="preview-section-foreststatus">
        <h2>Xem trước hiện trạng</h2>

        {previewData ? (
          <>
            <div className="preview-card-foreststatus">
              <h3>{previewData.type}</h3>
              <p className="preview-area-foreststatus">
                {previewData.area.toLocaleString()} ha
              </p>

              <div className="preview-details-foreststatus">
                <div className="preview-detail-item-foreststatus">
                  <span className="preview-detail-label-foreststatus">
                    Chất lượng
                  </span>
                  <span
                    className={`preview-quality-foreststatus ${previewData.quality.toLowerCase()}`}
                  >
                    {previewData.quality}
                  </span>
                </div>

                <div className="preview-detail-item-foreststatus">
                  <span className="preview-detail-label-foreststatus">
                    Ngày khảo sát
                  </span>
                  <span className="preview-detail-value-foreststatus">
                    {new Date(previewData.lastSurvey).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="preview-chart-foreststatus">
              <Bar
                data={chartData}
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
            </div>
          </>
        ) : (
          <div className="no-data-foreststatus">
            Nhập thông tin để xem trước hiện trạng
          </div>
        )}
      </div>
    </div>
  );
};

export default ForestStatus;
