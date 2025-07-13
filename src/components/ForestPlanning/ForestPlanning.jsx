import axios from "axios";
import React, { useEffect, useState } from "react";
import { forestPlanningSteps } from "../../config/tourSteps";
import useCustomTour from "../../hooks/useTour";
import "./ForestPlanning.css";

const ForestPlanning = () => {
  const [formData, setFormData] = useState({
    name: "",
    area: "",
    type: "",
    status: "planned",
    startDate: "",
    endDate: "",
    description: "",
  });
  const [previewData, setPreviewData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { startTour } = useCustomTour(forestPlanningSteps);

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
      await axios.post("/api/forest-data/planning", previewData);
      setSuccess("Thêm quy hoạch thành công");
      setFormData({
        name: "",
        area: "",
        type: "",
        status: "planned",
        startDate: "",
        endDate: "",
        description: "",
      });
      setPreviewData(null);
    } catch (err) {
      setError("Không thể thêm quy hoạch");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forestplanning-container">
      <h1 className="title-forestplanning">Quản lý quy hoạch rừng</h1>

      <div className="form-section-forestplanning">
        <h2>Thêm quy hoạch mới</h2>

        {error && <div className="error-forestplanning">{error}</div>}
        {success && <div className="success-forestplanning">{success}</div>}

        <form onSubmit={handleSubmit} className="form-forestplanning">
          <div className="form-group-forestplanning">
            <label htmlFor="name">Tên quy hoạch</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="input-forestplanning"
              placeholder="Nhập tên quy hoạch"
              required
            />
          </div>

          <div className="form-group-forestplanning">
            <label htmlFor="area">Diện tích (ha)</label>
            <input
              type="number"
              id="area"
              name="area"
              value={formData.area}
              onChange={handleInputChange}
              className="input-forestplanning"
              step="0.01"
              min="0"
              required
            />
          </div>

          <div className="form-group-forestplanning">
            <label htmlFor="type">Loại quy hoạch</label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className="input-forestplanning"
              required
            >
              <option value="">Chọn loại quy hoạch</option>
              <option value="Trồng rừng">Trồng rừng</option>
              <option value="Bảo tồn">Bảo tồn</option>
              <option value="Phát triển">Phát triển</option>
              <option value="Phục hồi">Phục hồi</option>
            </select>
          </div>

          <div className="form-group-forestplanning">
            <label htmlFor="startDate">Ngày bắt đầu</label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={formData.startDate}
              onChange={handleInputChange}
              className="input-forestplanning"
              required
            />
          </div>

          <div className="form-group-forestplanning">
            <label htmlFor="endDate">Ngày kết thúc</label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={formData.endDate}
              onChange={handleInputChange}
              className="input-forestplanning"
              required
            />
          </div>

          <div className="form-group-forestplanning">
            <label htmlFor="description">Mô tả</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="textarea-forestplanning"
              rows="4"
              placeholder="Nhập mô tả quy hoạch"
              required
            />
          </div>

          <button
            type="submit"
            className="submit-button-forestplanning"
            disabled={loading || !previewData}
          >
            {loading ? "Đang lưu..." : "Thêm mới"}
          </button>
        </form>
      </div>

      <div className="preview-section-forestplanning">
        <h2>Xem trước quy hoạch</h2>

        {previewData ? (
          <div className="preview-card-forestplanning">
            <h3>{previewData.name}</h3>
            <p className="preview-area-forestplanning">
              {previewData.area.toLocaleString()} ha
            </p>

            <div className="preview-details-forestplanning">
              <div className="preview-detail-item-forestplanning">
                <span className="preview-detail-label-forestplanning">
                  Loại quy hoạch
                </span>
                <span className="preview-detail-value-forestplanning">
                  {previewData.type}
                </span>
              </div>

              <div className="preview-detail-item-forestplanning">
                <span className="preview-detail-label-forestplanning">
                  Trạng thái
                </span>
                <span className="preview-detail-value-forestplanning">
                  {previewData.status === "planned"
                    ? "Đã lên kế hoạch"
                    : previewData.status === "in-progress"
                    ? "Đang thực hiện"
                    : previewData.status === "completed"
                    ? "Hoàn thành"
                    : "Đã hủy"}
                </span>
              </div>

              <div className="preview-detail-item-forestplanning">
                <span className="preview-detail-label-forestplanning">
                  Ngày bắt đầu
                </span>
                <span className="preview-detail-value-forestplanning">
                  {new Date(previewData.startDate).toLocaleDateString()}
                </span>
              </div>

              <div className="preview-detail-item-forestplanning">
                <span className="preview-detail-label-forestplanning">
                  Ngày kết thúc
                </span>
                <span className="preview-detail-value-forestplanning">
                  {new Date(previewData.endDate).toLocaleDateString()}
                </span>
              </div>
            </div>

            <p className="preview-description-forestplanning">
              {previewData.description}
            </p>
          </div>
        ) : (
          <div className="no-data-forestplanning">
            Nhập thông tin để xem trước quy hoạch
          </div>
        )}
      </div>
    </div>
  );
};

export default ForestPlanning;
