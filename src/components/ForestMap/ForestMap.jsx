import { useTour } from "@reactour/tour";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { forestMapSteps } from "../../config/tourSteps";
import styles from "./ForestMap.module.css";

const ForestMap = () => {
  const [geojsonList, setGeojsonList] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [mapName, setMapName] = useState("");
  const [mapType, setMapType] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { setSteps, setIsOpen } = useTour();

  useEffect(() => {
    fetchGeoJSONList();
  }, []);

  useEffect(() => {
    // Start tour when data is loaded
    if (geojsonList.length > 0) {
      setSteps(forestMapSteps);
      setIsOpen(true);
    }
  }, [geojsonList, setSteps, setIsOpen]);

  const fetchGeoJSONList = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_SERVER_URL}/api/geojson`
      );
      setGeojsonList(response.data);
    } catch (err) {
      setError("Không thể tải danh sách bản đồ");
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile || !mapName || !mapType) {
      setError("Vui lòng điền đầy đủ thông tin");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const geojsonData = JSON.parse(e.target.result);

          await axios.post(`${import.meta.env.VITE_SERVER_URL}/api/geojson`, {
            name: mapName,
            type: mapType,
            data: geojsonData,
          });

          setSuccess("Tải lên bản đồ thành công");
          setMapName("");
          setMapType("");
          setSelectedFile(null);
          fetchGeoJSONList();
        } catch (err) {
          setError("File GeoJSON không hợp lệ");
        }
      };
      reader.readAsText(selectedFile);
    } catch (err) {
      setError("Không thể tải lên bản đồ");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (name) => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_SERVER_URL}/api/geojson/${name}`
      );
      setSuccess("Xóa bản đồ thành công");
      fetchGeoJSONList();
    } catch (err) {
      setError("Không thể xóa bản đồ");
    }
  };

  return (
    <div className={styles.forestMap}>
      <h1 className={styles.title}>Quản lý bản đồ</h1>

      <div className={`${styles.uploadSection} uploadSection`}>
        <h2>Tải lên bản đồ mới</h2>

        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.success}>{success}</div>}

        <form onSubmit={handleUpload} className={styles.uploadForm}>
          <div className={styles.formGroup}>
            <label htmlFor="mapName">Tên bản đồ</label>
            <input
              type="text"
              id="mapName"
              value={mapName}
              onChange={(e) => setMapName(e.target.value)}
              className={styles.input}
              placeholder="Nhập tên bản đồ"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="mapType">Loại bản đồ</label>
            <select
              id="mapType"
              value={mapType}
              onChange={(e) => setMapType(e.target.value)}
              className={styles.input}
            >
              <option value="">Chọn loại bản đồ</option>
              <option value="Hiện trạng">Hiện trạng</option>
              <option value="Quy hoạch">Quy hoạch</option>
              <option value="Điểm quan trắc">Điểm quan trắc</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="file">File GeoJSON</label>
            <input
              type="file"
              id="file"
              accept=".geojson,application/json"
              onChange={handleFileChange}
              className={styles.fileInput}
            />
          </div>

          <button
            type="submit"
            className={styles.uploadButton}
            disabled={loading}
          >
            {loading ? "Đang tải lên..." : "Tải lên"}
          </button>
        </form>
      </div>

      <div className={`${styles.mapList} mapList`}>
        <h2>Danh sách bản đồ</h2>

        {geojsonList.length === 0 ? (
          <p className={styles.noData}>Chưa có bản đồ nào</p>
        ) : (
          <div className={styles.mapGrid}>
            {geojsonList.map((map) => (
              <div key={map.name} className={styles.mapCard}>
                <div className={styles.mapInfo}>
                  <h3>{map.name}</h3>
                  <p>Loại: {map.type}</p>
                  <p>
                    Ngày tải lên:{" "}
                    {new Date(map.uploadDate).toLocaleDateString()}
                  </p>
                </div>
                <div className={styles.mapActions}>
                  <button
                    onClick={() => handleDelete(map.name)}
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

export default ForestMap;
