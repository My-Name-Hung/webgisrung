import { Delete, Edit } from "@mui/icons-material";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Paper,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
} from "@mui/material";
import MuiAlert from "@mui/material/Alert";
import axios from "axios";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from "chart.js";
import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import { FaChartBar } from "react-icons/fa";
import { forestIndicesSteps } from "../../config/tourSteps";
import useCustomTour from "../../hooks/useTour";
import "./ForestIndices.css";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const formatNumber = (value) => {
  if (value >= 1000000) {
    return (
      (value / 1000000).toLocaleString("vi-VN", { maximumFractionDigits: 2 }) +
      " triệu"
    );
  } else if (value >= 1000) {
    return value.toLocaleString("vi-VN");
  }
  return value.toString();
};

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
  const [indices, setIndices] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [editMode, setEditMode] = useState(false);
  const { startTour } = useCustomTour(forestIndicesSteps);

  // Fetch all indices on component mount
  useEffect(() => {
    fetchIndices();
  }, []);

  useEffect(() => {
    if (previewData) {
      startTour();
    }
  }, [previewData, startTour]);

  const fetchIndices = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_SERVER_URL}/api/forest/indices`
      );
      setIndices(response.data);
    } catch (err) {
      console.error("Error fetching indices:", err);
      showSnackbar("Không thể tải danh sách chỉ số", "error");
    }
  };

  const validateFormData = () => {
    const errors = [];
    if (!formData.name.trim()) errors.push("Tên chỉ số không được để trống");
    if (!formData.value || isNaN(formData.value))
      errors.push("Giá trị phải là số");
    if (!formData.unit.trim()) errors.push("Đơn vị không được để trống");
    if (!formData.category) errors.push("Vui lòng chọn danh mục");
    if (formData.year < 1900 || formData.year > 2100)
      errors.push("Năm không hợp lệ");

    return errors;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;

    if (name === "value") {
      newValue = value.replace(/[^0-9.]/g, "");
      const parts = newValue.split(".");
      if (parts.length > 2) {
        newValue = parts[0] + "." + parts.slice(1).join("");
      }
    }

    const newFormData = {
      ...formData,
      [name]: name === "value" ? parseFloat(newValue) || "" : newValue,
    };
    setFormData(newFormData);

    if (Object.values(newFormData).every((v) => v !== "")) {
      setPreviewData(newFormData);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateFormData();
    if (validationErrors.length > 0) {
      setError(validationErrors.join(", "));
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const data = {
        ...formData,
        value: parseFloat(formData.value),
        year: parseInt(formData.year),
        createdAt: new Date().toISOString(),
      };

      if (editMode && selectedIndex) {
        await axios.put(
          `${import.meta.env.VITE_SERVER_URL}/api/forest/indices/${
            selectedIndex._id
          }`,
          data
        );
        showSnackbar("Cập nhật chỉ số thành công");
      } else {
        await axios.post(
          `${import.meta.env.VITE_SERVER_URL}/api/forest/indices`,
          data
        );
        showSnackbar("Thêm chỉ số thành công");
      }

      setSuccess(
        editMode ? "Cập nhật chỉ số thành công" : "Thêm chỉ số thành công"
      );
      resetForm();
      fetchIndices();
    } catch (err) {
      setError(err.response?.data?.message || "Không thể lưu chỉ số rừng");
      showSnackbar("Không thể lưu chỉ số rừng", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (index) => {
    setFormData({
      name: index.name,
      value: index.value.toString(),
      unit: index.unit,
      year: index.year,
      category: index.category,
    });
    setPreviewData({
      name: index.name,
      value: index.value,
      unit: index.unit,
      year: index.year,
      category: index.category,
    });
    setSelectedIndex(index);
    setEditMode(true);
  };

  const handleDelete = (index) => {
    setSelectedIndex(index);
    setOpenDialog(true);
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_SERVER_URL}/api/forest/indices/${
          selectedIndex._id
        }`
      );
      showSnackbar("Xóa chỉ số thành công");
      fetchIndices();
    } catch (err) {
      showSnackbar("Không thể xóa chỉ số", "error");
    }
    setOpenDialog(false);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      value: "",
      unit: "",
      year: new Date().getFullYear(),
      category: "",
    });
    setPreviewData(null);
    setSelectedIndex(null);
    setEditMode(false);
  };

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
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

  // Prepare recent indices chart data
  const recentChartData = {
    labels: indices.map((index) => index.year),
    datasets: [
      {
        label: "Chỉ số gần đây",
        data: indices.map((index) => index.value),
        backgroundColor: indices.map(() => "rgba(45, 90, 39, 0.8)"),
        borderColor: indices.map(() => "rgba(45, 90, 39, 1)"),
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  return (
    <div className="forestindices-container">
      <h1 className="title-forestindices">Quản lý chỉ số rừng</h1>

      <div className="form-section-forestindices">
        <h2>{editMode ? "Cập nhật chỉ số" : "Thêm chỉ số mới"}</h2>

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
              type="text"
              id="value"
              name="value"
              value={formData.value}
              onChange={handleInputChange}
              className="input-forestindices"
              placeholder="Nhập giá trị"
              required
            />
            {formData.value && (
              <div className="formatted-value">
                {formatNumber(formData.value)} {formData.unit}
              </div>
            )}
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

          <div className="form-actions">
            <button
              type="submit"
              className="submit-button-forestindices"
              disabled={loading || !previewData}
            >
              {loading ? "Đang lưu..." : editMode ? "Cập nhật" : "Thêm mới"}
            </button>
            {editMode && (
              <button
                type="button"
                className="cancel-button-forestindices"
                onClick={resetForm}
              >
                Hủy
              </button>
            )}
          </div>
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
                          return (
                            formatNumber(value) +
                            " " +
                            (previewData?.unit || "")
                          );
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
                    {formatNumber(previewData.value)} {previewData.unit}
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

        {indices.length > 0 && (
          <div className="recent-indices-section">
            <h3>Chỉ số gần đây</h3>
            <div className="preview-chart-forestindices">
              <Bar
                data={recentChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false,
                    },
                    title: {
                      display: true,
                      text: "Biểu đồ chỉ số gần đây",
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
                    },
                  },
                }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="indices-list-section">
        <h2>Danh sách chỉ số</h2>
        <TableContainer component={Paper} className="indices-table">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Tên chỉ số</TableCell>
                <TableCell align="right">Giá trị</TableCell>
                <TableCell>Đơn vị</TableCell>
                <TableCell align="right">Năm</TableCell>
                <TableCell>Danh mục</TableCell>
                <TableCell align="center">Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {indices
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((index) => (
                  <TableRow key={index._id}>
                    <TableCell>{index.name}</TableCell>
                    <TableCell align="right">
                      {formatNumber(index.value)}
                    </TableCell>
                    <TableCell>{index.unit}</TableCell>
                    <TableCell align="right">{index.year}</TableCell>
                    <TableCell>{index.category}</TableCell>
                    <TableCell align="center">
                      <IconButton
                        color="primary"
                        onClick={() => handleEdit(index)}
                        title="Sửa"
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleDelete(index)}
                        title="Xóa"
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={indices.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Số dòng mỗi trang"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} của ${count}`
            }
          />
        </TableContainer>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Xác nhận xóa</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Bạn có chắc chắn muốn xóa chỉ số "{selectedIndex?.name}" không?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} color="primary">
            Hủy
          </Button>
          <Button onClick={confirmDelete} color="error">
            Xóa
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <MuiAlert
          elevation={6}
          variant="filled"
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </MuiAlert>
      </Snackbar>
    </div>
  );
};

export default ForestIndices;
