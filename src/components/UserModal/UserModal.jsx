import axios from "axios";
import { useState } from "react";
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
import styles from "./UserModal.module.css";

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
  const [showPasswords, setShowPasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswords((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
    setSuccess("");
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
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
      const response = await axios.post(
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

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button
          className={styles.closeButton}
          onClick={onClose}
          title="Đóng"
          aria-label="Đóng modal"
        >
          <FaTimes />
        </button>
        <div className={styles.modalHeader}>
          <h2>Thông tin người dùng</h2>
          <label
            className={styles.themeSwitch}
            title={
              isDarkMode
                ? "Chuyển sang giao diện sáng"
                : "Chuyển sang giao diện tối"
            }
          >
            <input
              type="checkbox"
              checked={isDarkMode}
              onChange={onToggleTheme}
              className={styles.themeSwitchInput}
            />
            <span className={styles.themeSwitchSlider}>
              <FaSun className={styles.sunIcon} />
              <FaMoon className={styles.moonIcon} />
            </span>
          </label>
        </div>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${
              activeTab === "info" ? styles.active : ""
            }`}
            onClick={() => setActiveTab("info")}
          >
            Thông tin
          </button>
          <button
            className={`${styles.tab} ${
              activeTab === "password" ? styles.active : ""
            }`}
            onClick={() => setActiveTab("password")}
          >
            Đổi mật khẩu
          </button>
        </div>

        <div className={styles.tabContent}>
          {activeTab === "info" ? (
            <div className={styles.userInfo}>
              <div className={styles.infoItem}>
                <div className={styles.infoLabel}>
                  <FaUser className={styles.infoIcon} />
                  <label>Tên đăng nhập</label>
                </div>
                <span>{admin?.username}</span>
              </div>
              <div className={styles.infoItem}>
                <div className={styles.infoLabel}>
                  <FaEnvelope className={styles.infoIcon} />
                  <label>Email</label>
                </div>
                <span>{admin?.email}</span>
              </div>
              <div className={styles.infoItem}>
                <div className={styles.infoLabel}>
                  <FaUserShield className={styles.infoIcon} />
                  <label>Vai trò</label>
                </div>
                <span>{admin?.role || "Quản trị viên"}</span>
              </div>
              <button
                className={styles.logoutButton}
                onClick={onLogout}
                title="Đăng xuất khỏi hệ thống"
              >
                <FaSignOutAlt />
                <span>Đăng xuất</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className={styles.passwordForm}>
              {error && <div className={styles.error}>{error}</div>}
              {success && <div className={styles.success}>{success}</div>}

              <div className={styles.formGroup}>
                <label htmlFor="currentPassword">Mật khẩu hiện tại</label>
                <div className={styles.passwordInput}>
                  <input
                    type={showPasswords.currentPassword ? "text" : "password"}
                    id="currentPassword"
                    name="currentPassword"
                    value={passwords.currentPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                  <button
                    type="button"
                    className={styles.togglePassword}
                    onClick={() => togglePasswordVisibility("currentPassword")}
                    title={
                      showPasswords.currentPassword
                        ? "Ẩn mật khẩu"
                        : "Hiện mật khẩu"
                    }
                  >
                    {showPasswords.currentPassword ? <VscEyeClosed /> : <VscEye />}
                  </button>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="newPassword">Mật khẩu mới</label>
                <div className={styles.passwordInput}>
                  <input
                    type={showPasswords.newPassword ? "text" : "password"}
                    id="newPassword"
                    name="newPassword"
                    value={passwords.newPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                  <button
                    type="button"
                    className={styles.togglePassword}
                    onClick={() => togglePasswordVisibility("newPassword")}
                    title={
                      showPasswords.newPassword
                        ? "Ẩn mật khẩu"
                        : "Hiện mật khẩu"
                    }
                  >
                    {showPasswords.newPassword ? <VscEyeClosed /> : <VscEye />}
                  </button>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="confirmPassword">Xác nhận mật khẩu mới</label>
                <div className={styles.passwordInput}>
                  <input
                    type={showPasswords.confirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={passwords.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                  <button
                    type="button"
                    className={styles.togglePassword}
                    onClick={() => togglePasswordVisibility("confirmPassword")}
                    title={
                      showPasswords.confirmPassword
                        ? "Ẩn mật khẩu"
                        : "Hiện mật khẩu"
                    }
                  >
                    {showPasswords.confirmPassword ? <VscEyeClosed /> : <VscEye />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className={styles.submitButton}
                disabled={isLoading}
              >
                {isLoading ? "Đang xử lý..." : "Cập nhật mật khẩu"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserModal;
