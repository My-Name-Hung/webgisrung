import axios from "axios";
import React, { useEffect, useState } from "react";
import styles from "./ForestPlanning.module.css";

const ForestPlanning = () => {
  const [planningList, setPlanningList] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    area: "",
    type: "",
    status: "planned",
    startDate: "",
    endDate: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchPlanningData();
  }, []);

  const fetchPlanningData = async () => {
    try {
      const response = await axios.get("/api/forest-data/planning");
      setPlanningList(response.data);
    } catch (err) {
      setError("Không thể tải dữ liệu quy hoạch");
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
      await axios.post("/api/forest-data/planning", formData);
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
      fetchPlanningData();
    } catch (err) {
      setError("Không thể thêm quy hoạch");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.forestPlanning}>
      <h1 className={styles.title}>Quản lý quy hoạch rừng</h1>

      <div className={styles.formSection}>
        <h2>Thêm quy hoạch mới</h2>

        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.success}>{success}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="name">Tên quy hoạch</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={styles.input}
              placeholder="Nhập tên quy hoạch"
              required
            />
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
            <label htmlFor="type">Loại quy hoạch</label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className={styles.input}
              required
            >
              <option value="">Chọn loại quy hoạch</option>
              <option value="Trồng rừng">Trồng rừng</option>
              <option value="Bảo tồn">Bảo tồn</option>
              <option value="Phát triển">Phát triển</option>
              <option value="Phục hồi">Phục hồi</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="startDate">Ngày bắt đầu</label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={formData.startDate}
              onChange={handleInputChange}
              className={styles.input}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="endDate">Ngày kết thúc</label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={formData.endDate}
              onChange={handleInputChange}
              className={styles.input}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="description">Mô tả</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className={styles.textarea}
              rows="4"
              placeholder="Nhập mô tả quy hoạch"
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

      <div className={styles.planningList}>
        <h2>Danh sách quy hoạch</h2>

        {planningList.length === 0 ? (
          <p className={styles.noData}>Chưa có dữ liệu quy hoạch</p>
        ) : (
          <div className={styles.planningGrid}>
            {planningList.map((plan, index) => (
              <div key={index} className={styles.planningCard}>
                <h3>{plan.name}</h3>
                <p className={styles.area}>{plan.area.toLocaleString()} ha</p>
                <p>Loại: {plan.type}</p>
                <p>
                  Thời gian: {new Date(plan.startDate).toLocaleDateString()} -{" "}
                  {new Date(plan.endDate).toLocaleDateString()}
                </p>
                <p className={styles.description}>{plan.description}</p>
                <div className={styles.status}>
                  <span className={styles[plan.status.toLowerCase()]}>
                    {plan.status === "planned"
                      ? "Đã lên kế hoạch"
                      : plan.status === "in-progress"
                      ? "Đang thực hiện"
                      : plan.status === "completed"
                      ? "Hoàn thành"
                      : plan.status === "cancelled"
                      ? "Đã hủy"
                      : plan.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ForestPlanning;
