import { Add, Delete, Edit } from "@mui/icons-material";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
} from "@mui/material";
import axios from "axios";
import React, { useEffect, useState } from "react";
import "./TypesManager.css";

const TypesManager = () => {
  const [mapTypes, setMapTypes] = useState([]);
  const [monitoringTypes, setMonitoringTypes] = useState([]);
  const [monitoringStatuses, setMonitoringStatuses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState("map"); // map, monitoring, status
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#2d5a27", // for status only
  });

  useEffect(() => {
    fetchTypes();
  }, []);

  const fetchTypes = async () => {
    try {
      const [mapRes, monitoringRes, statusRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_SERVER_URL}/api/types/map`),
        axios.get(`${import.meta.env.VITE_SERVER_URL}/api/types/monitoring`),
        axios.get(`${import.meta.env.VITE_SERVER_URL}/api/types/status`),
      ]);

      setMapTypes(mapRes.data);
      setMonitoringTypes(monitoringRes.data);
      setMonitoringStatuses(statusRes.data);
    } catch (err) {
      setError("Không thể tải danh sách loại");
    }
  };

  const handleOpenDialog = (type) => {
    setDialogType(type);
    setFormData({
      name: "",
      description: "",
      color: "#2d5a27",
    });
    setOpenDialog(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      setError("Vui lòng nhập tên");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/types/${dialogType}`,
        formData
      );

      setSuccess(
        dialogType === "status"
          ? "Thêm trạng thái thành công"
          : dialogType === "monitoring"
          ? "Thêm loại điểm quan trắc thành công"
          : "Thêm loại bản đồ thành công"
      );

      fetchTypes();
      setOpenDialog(false);
    } catch (err) {
      setError(err.response?.data?.message || "Không thể thêm loại mới");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="types-manager-container">
      <h1 className="title-types-manager">Quản lý loại dữ liệu</h1>

      {error && <div className="error-types-manager">{error}</div>}
      {success && <div className="success-types-manager">{success}</div>}

      <div className="types-section">
        <div className="types-header">
          <h2>Loại bản đồ</h2>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Add />}
            onClick={() => handleOpenDialog("map")}
          >
            Thêm loại bản đồ
          </Button>
        </div>

        <TableContainer component={Paper} className="types-table">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Tên loại</TableCell>
                <TableCell>Mô tả</TableCell>
                <TableCell align="center">Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {mapTypes.map((type) => (
                <TableRow key={type._id}>
                  <TableCell>{type.name}</TableCell>
                  <TableCell>{type.description}</TableCell>
                  <TableCell align="center">
                    <IconButton color="primary" title="Sửa">
                      <Edit />
                    </IconButton>
                    <IconButton color="error" title="Xóa">
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </div>

      <div className="types-section">
        <div className="types-header">
          <h2>Loại điểm quan trắc</h2>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Add />}
            onClick={() => handleOpenDialog("monitoring")}
          >
            Thêm loại điểm
          </Button>
        </div>

        <TableContainer component={Paper} className="types-table">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Tên loại</TableCell>
                <TableCell>Mô tả</TableCell>
                <TableCell align="center">Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {monitoringTypes.map((type) => (
                <TableRow key={type._id}>
                  <TableCell>{type.name}</TableCell>
                  <TableCell>{type.description}</TableCell>
                  <TableCell align="center">
                    <IconButton color="primary" title="Sửa">
                      <Edit />
                    </IconButton>
                    <IconButton color="error" title="Xóa">
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </div>

      <div className="types-section">
        <div className="types-header">
          <h2>Trạng thái điểm quan trắc</h2>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Add />}
            onClick={() => handleOpenDialog("status")}
          >
            Thêm trạng thái
          </Button>
        </div>

        <TableContainer component={Paper} className="types-table">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Tên trạng thái</TableCell>
                <TableCell>Mô tả</TableCell>
                <TableCell>Màu sắc</TableCell>
                <TableCell align="center">Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {monitoringStatuses.map((status) => (
                <TableRow key={status._id}>
                  <TableCell>{status.name}</TableCell>
                  <TableCell>{status.description}</TableCell>
                  <TableCell>
                    <div
                      className="color-preview"
                      style={{ backgroundColor: status.color }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton color="primary" title="Sửa">
                      <Edit />
                    </IconButton>
                    <IconButton color="error" title="Xóa">
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </div>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>
          {dialogType === "status"
            ? "Thêm trạng thái mới"
            : dialogType === "monitoring"
            ? "Thêm loại điểm quan trắc"
            : "Thêm loại bản đồ"}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Tên"
              type="text"
              fullWidth
              variant="outlined"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              required
            />
            <TextField
              margin="dense"
              label="Mô tả"
              type="text"
              fullWidth
              variant="outlined"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              multiline
              rows={2}
            />
            {dialogType === "status" && (
              <TextField
                margin="dense"
                label="Màu sắc"
                type="color"
                fullWidth
                variant="outlined"
                value={formData.color}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, color: e.target.value }))
                }
              />
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Hủy</Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? "Đang xử lý..." : "Thêm mới"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </div>
  );
};

export default TypesManager;
