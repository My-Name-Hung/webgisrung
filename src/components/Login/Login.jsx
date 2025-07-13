import { useState } from "react";
import { FaLock, FaTree, FaUser } from "react-icons/fa";
import { VscEye, VscEyeClosed } from "react-icons/vsc";
import { useLocation, useNavigate } from "react-router-dom";
import logo from "../../assets/Logo/icon.png";
import { useAuth } from "../../context/AuthContext";
import "./Login.css";

const Login = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, error: authError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = "Vui lòng nhập tên đăng nhập";
    }

    if (!formData.password) {
      newErrors.password = "Vui lòng nhập mật khẩu";
    } else if (formData.password.length < 6) {
      newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear errors when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm() || isSubmitting) {
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await login(formData.username, formData.password);

      if (result.success) {
        // Redirect to the page user tried to access or dashboard
        const redirectTo = location.state?.from?.pathname || "/dashboard";
        navigate(redirectTo, { replace: true });
      }
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-forest-background"></div>
      <div className="login-box">
        <div className="login-logo-container">
          <FaTree className="login-logo" />
        </div>

        <div className="login-title-container">
          <h1 className="login-title">Hệ thống quản lý rừng</h1>
          <h2 className="login-subtitle">Đăng nhập quản trị</h2>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-form-group">
            <div className="login-input-wrapper">
              <FaUser className="login-input-icon" aria-hidden="true" />
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className={`login-input ${
                  errors.username ? "login-error-input" : ""
                }`}
                placeholder="Nhập tên đăng nhập"
                autoComplete="username"
                disabled={isSubmitting}
              />
            </div>
            {errors.username && (
              <span className="login-error-message">{errors.username}</span>
            )}
          </div>

          <div className="login-form-group">
            <div className="login-input-wrapper">
              <FaLock className="login-input-icon" aria-hidden="true" />
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`login-input ${
                  errors.password ? "login-error-input" : ""
                }`}
                placeholder="Nhập mật khẩu"
                autoComplete="current-password"
                disabled={isSubmitting}
              />
              <button
                type="button"
                className="login-show-password-button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                disabled={isSubmitting}
              >
                {showPassword ? <VscEyeClosed /> : <VscEye />}
              </button>
            </div>
            {errors.password && (
              <span className="login-error-message">{errors.password}</span>
            )}
          </div>

          {authError && <div className="login-auth-error">{authError}</div>}

          <button
            type="submit"
            className={`login-button ${isSubmitting ? "loading" : ""}`}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>
      </div>
      <footer className="footer-login">
        <div className="footer-loginContent">
          <img src={logo} alt="Logo Kiểm lâm" className="footer-loginLogo" />
          <p className="footer-loginText">@2025 - Chi cục Kiểm lâm Hải Phòng</p>
        </div>
      </footer>
    </div>
  );
};

export default Login;
