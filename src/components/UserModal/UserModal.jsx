import axios from "axios";
import { useEffect, useState } from "react";
import { CiEdit } from "react-icons/ci";
import {
  FaEnvelope,
  FaMoon,
  FaSignOutAlt,
  FaSun,
  FaTimes,
  FaUser,
  FaUserShield,
} from "react-icons/fa";
import { VscEye, VscEyeClosed } from "react-icons/vsc";
import { userModalSteps } from "../../config/tourSteps";
import useCustomTour from "../../hooks/useTour";
import "./UserModal.css";

const UserModal = ({
  isOpen,
  onClose,
  admin,
  onLogout,
  isDarkMode,
  onToggleTheme,
}) => {
  const [activeTab, setActiveTab] = useState("info");
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [username, setUsername] = useState(admin?.username || "");
  const [email, setEmail] = useState(admin?.email || "");
  const [showPasswords, setShowPasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const { startTour } = useCustomTour(userModalSteps);

  useEffect(() => {
    if (isOpen) {
      startTour();
    }
  }, [isOpen, startTour]);

  if (!isOpen) return null;

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswords((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
    setSuccess("");
  };

  const handleFieldChange = (e, field) => {
    if (field === "username") {
      setUsername(e.target.value);
    } else if (field === "email") {
      setEmail(e.target.value);
    }
    setError("");
    setSuccess("");
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleUpdateField = async (field) => {
    if (!field) return;

    const value = field === "username" ? username : email;
    if (!value.trim()) {
      setError(
        `${
          field === "username" ? "Tên đăng nhập" : "Email"
        } không được để trống`
      );
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      await axios.patch(
        `${import.meta.env.VITE_SERVER_URL}/api/auth/profile`,
        {
          [field]: value,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setSuccess(
        `Cập nhật ${
          field === "username" ? "tên đăng nhập" : "email"
        } thành công!`
      );
      if (field === "username") {
        // Auto logout after 2 seconds for username change
        setTimeout(() => {
          onLogout();
        }, 2000);
      }
      setEditingField(null);
    } catch (err) {
      setError(err.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (passwords.newPassword !== passwords.confirmPassword) {
      setError("Mật khẩu mới không khớp");
      return;
    }

    if (passwords.newPassword.length < 6) {
      setError("Mật khẩu mới phải có ít nhất 6 ký tự");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/auth/reset-password`,
        {
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setSuccess("Đổi mật khẩu thành công! Vui lòng đăng nhập lại.");
      setPasswords({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      // Auto logout after 2 seconds
      setTimeout(() => {
        onLogout();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setIsLoading(false);
    }
  };

  const renderEditableField = (field, value, label, icon) => {
    const isEditing = editingField === field;

    return (
      <div className="user-modal-info-item">
        <div className="user-modal-info-label">
          {icon}
          <label>{label}</label>
        </div>
        <div className="user-modal-info-value">
          {isEditing ? (
            <div className="user-modal-edit-form">
              <input
                type="text"
                value={value}
                onChange={(e) => handleFieldChange(e, field)}
                className="user-modal-edit-input"
                placeholder={`Nhập ${label.toLowerCase()}`}
              />
              <div className="user-modal-edit-actions">
                <button
                  onClick={() => handleUpdateField(field)}
                  className="user-modal-save-button"
                  disabled={isLoading}
                >
                  {isLoading ? "Đang lưu..." : "Lưu"}
                </button>
                <button
                  onClick={() => setEditingField(null)}
                  className="user-modal-cancel-button"
                >
                  Hủy
                </button>
              </div>
            </div>
          ) : (
            <div className="user-modal-value-with-edit">
              <span>{value}</span>
              <button
                onClick={() => setEditingField(field)}
                className="user-modal-edit-button"
              >
                <CiEdit />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="user-modal-overlay">
      <div className="user-modal-content">
        <button onClick={onClose} className="user-modal-close-button">
          <FaTimes />
        </button>

        <div className="user-modal-header">
          <h2>Thông tin tài khoản</h2>
          <div className="user-modal-header-actions">
            <label className="user-modal-theme-switch">
              <input
                type="checkbox"
                checked={isDarkMode}
                onChange={onToggleTheme}
                className="user-modal-theme-switch-input"
              />
              <span className="user-modal-theme-switch-slider">
                <FaSun className="user-modal-sun-icon" />
                <FaMoon className="user-modal-moon-icon" />
              </span>
            </label>
          </div>
        </div>

        <div className="user-modal-tabs">
          <button
            className={`user-modal-tab ${activeTab === "info" ? "active" : ""}`}
            onClick={() => setActiveTab("info")}
          >
            Thông tin
          </button>
          <button
            className={`user-modal-tab ${
              activeTab === "password" ? "active" : ""
            }`}
            onClick={() => setActiveTab("password")}
          >
            Đổi mật khẩu
          </button>
        </div>

        <div className="user-modal-tab-content">
          {activeTab === "info" ? (
            <div className="user-modal-info">
              {renderEditableField(
                "username",
                username,
                "Tên đăng nhập",
                <FaUser />
              )}
              {renderEditableField("email", email, "Email", <FaEnvelope />)}
              <div className="user-modal-info-item">
                <div className="user-modal-info-label">
                  <FaUserShield />
                  <label>Vai trò</label>
                </div>
                <div className="user-modal-info-value">
                  <span>Quản trị viên</span>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="user-modal-password-form">
              <div className="user-modal-form-group">
                <label>Mật khẩu hiện tại</label>
                <div className="user-modal-password-input">
                  <input
                    type={showPasswords.currentPassword ? "text" : "password"}
                    name="currentPassword"
                    value={passwords.currentPassword}
                    onChange={handlePasswordChange}
                    placeholder="Nhập mật khẩu hiện tại"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility("currentPassword")}
                    className="user-modal-toggle-password"
                  >
                    {showPasswords.currentPassword ? (
                      <VscEyeClosed />
                    ) : (
                      <VscEye />
                    )}
                  </button>
                </div>
              </div>

              <div className="user-modal-form-group">
                <label>Mật khẩu mới</label>
                <div className="user-modal-password-input">
                  <input
                    type={showPasswords.newPassword ? "text" : "password"}
                    name="newPassword"
                    value={passwords.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="Nhập mật khẩu mới"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility("newPassword")}
                    className="user-modal-toggle-password"
                  >
                    {showPasswords.newPassword ? <VscEyeClosed /> : <VscEye />}
                  </button>
                </div>
              </div>

              <div className="user-modal-form-group">
                <label>Xác nhận mật khẩu mới</label>
                <div className="user-modal-password-input">
                  <input
                    type={showPasswords.confirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={passwords.confirmPassword}
                    onChange={handlePasswordChange}
                    placeholder="Nhập lại mật khẩu mới"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility("confirmPassword")}
                    className="user-modal-toggle-password"
                  >
                    {showPasswords.confirmPassword ? (
                      <VscEyeClosed />
                    ) : (
                      <VscEye />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="user-modal-submit-button"
                disabled={isLoading}
              >
                {isLoading ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
              </button>
            </form>
          )}

          {error && <div className="user-modal-error">{error}</div>}
          {success && <div className="user-modal-success">{success}</div>}
        </div>

        <button onClick={onLogout} className="user-modal-logout-button">
          <FaSignOutAlt />
          Đăng xuất
        </button>
      </div>
    </div>
  );
};

export default UserModal;
