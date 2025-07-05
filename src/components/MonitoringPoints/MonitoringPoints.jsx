import { useTour } from "@reactour/tour";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { monitoringSteps } from "../../config/tourSteps";
import styles from "./MonitoringPoints.module.css";

const MonitoringPoints = () => {
  const [points, setPoints] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    status: "",
    coordinates: {
      type: "Point",
      coordinates: [0, 0],
    },
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { setSteps, setIsOpen } = useTour();

  useEffect(() => {
    fetchPoints();
  }, []);

  useEffect(() => {
    // Start tour when data is loaded
    if (points.length > 0) {
      setSteps(monitoringSteps);
      setIsOpen(true);
    }
  }, [points, setSteps, setIsOpen]);

  const fetchPoints = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_SERVER_URL}/api/monitoring`
      );
      setPoints(response.data);
    } catch (err) {
      setError("Không thể tải danh sách điểm quan trắc");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "longitude" || name === "latitude") {
      setFormData((prev) => ({
        ...prev,
        coordinates: {
          ...prev.coordinates,
          coordinates:
            name === "longitude"
              ? [parseFloat(value), prev.coordinates.coordinates[1]]
              : [prev.coordinates.coordinates[0], parseFloat(value)],
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (editingId) {
        await axios.put(
          `${import.meta.env.VITE_SERVER_URL}/api/monitoring/${editingId}`,
          formData
        );
        setSuccess("Cập nhật điểm quan trắc thành công");
      } else {
        await axios.post(
          `${import.meta.env.VITE_SERVER_URL}/api/monitoring`,
          formData
        );
        setSuccess("Thêm điểm quan trắc thành công");
      }

      setFormData({
        name: "",
        type: "",
        status: "",
        coordinates: {
          type: "Point",
          coordinates: [0, 0],
        },
      });
      setEditingId(null);
      fetchPoints();
    } catch (err) {
      setError("Không thể lưu điểm quan trắc");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (point) => {
    setFormData({
      name: point.name,
      type: point.type,
      status: point.status,
      coordinates: point.coordinates,
    });
    setEditingId(point._id);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_SERVER_URL}/api/monitoring/${id}`
      );
      setSuccess("Xóa điểm quan trắc thành công");
      fetchPoints();
    } catch (err) {
      setError("Không thể xóa điểm quan trắc");
    }
  };

  return (
    <div className={styles.monitoringPoints}>
      <h1 className={styles.title}>Quản lý điểm quan trắc</h1>

      <div className={`${styles.formSection} formSection`}>
        <h2>
          {editingId ? "Cập nhật điểm quan trắc" : "Thêm điểm quan trắc mới"}
        </h2>

        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.success}>{success}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="name">Tên điểm</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={styles.input}
              placeholder="Nhập tên điểm quan trắc"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="type">Loại điểm</label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className={styles.input}
              required
            >
              <option value="">Chọn loại điểm</option>
              <option value="Thường xuyên">Thường xuyên</option>
              <option value="Định kỳ">Định kỳ</option>
              <option value="Đột xuất">Đột xuất</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="status">Trạng thái</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className={styles.input}
              required
            >
              <option value="">Chọn trạng thái</option>
              <option value="Hoạt động">Hoạt động</option>
              <option value="Tạm dừng">Tạm dừng</option>
              <option value="Ngưng hoạt động">Ngưng hoạt động</option>
            </select>
          </div>

          <div className={styles.coordinates}>
            <div className={styles.formGroup}>
              <label htmlFor="longitude">Kinh độ</label>
              <input
                type="number"
                id="longitude"
                name="longitude"
                value={formData.coordinates.coordinates[0]}
                onChange={handleInputChange}
                className={styles.input}
                step="any"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="latitude">Vĩ độ</label>
              <input
                type="number"
                id="latitude"
                name="latitude"
                value={formData.coordinates.coordinates[1]}
                onChange={handleInputChange}
                className={styles.input}
                step="any"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? "Đang lưu..." : editingId ? "Cập nhật" : "Thêm mới"}
          </button>

          {editingId && (
            <button
              type="button"
              className={styles.cancelButton}
              onClick={() => {
                setEditingId(null);
                setFormData({
                  name: "",
                  type: "",
                  status: "",
                  coordinates: {
                    type: "Point",
                    coordinates: [0, 0],
                  },
                });
              }}
            >
              Hủy
            </button>
          )}
        </form>
      </div>

      <div className={`${styles.pointsList} pointsList`}>
        <h2>Danh sách điểm quan trắc</h2>

        {points.length === 0 ? (
          <p className={styles.noData}>Chưa có điểm quan trắc nào</p>
        ) : (
          <div className={styles.pointsGrid}>
            {points.map((point) => (
              <div key={point._id} className={styles.pointCard}>
                <div className={styles.pointInfo}>
                  <h3>{point.name}</h3>
                  <p>Loại: {point.type}</p>
                  <p>Trạng thái: {point.status}</p>
                  <p>Tọa độ: {point.coordinates.coordinates.join(", ")}</p>
                </div>
                <div className={styles.pointActions}>
                  <button
                    onClick={() => handleEdit(point)}
                    className={styles.editButton}
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => handleDelete(point._id)}
                    className={styles.deleteButton}
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MonitoringPoints;
