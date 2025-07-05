import { useState } from "react";
import { FaLock, FaTree, FaUser } from "react-icons/fa";
import { VscEye, VscEyeClosed } from "react-icons/vsc";
import { useLocation, useNavigate } from "react-router-dom";
import logo from "../../assets/Logo/icon.png";
import { useAuth } from "../../context/AuthContext";
import styles from "./Login.module.css";

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
    <div className={styles.loginContainer}>
      <div className={styles.forestBackground}></div>
      <div className={styles.loginBox}>
        <div className={styles.logoContainer}>
          <FaTree className={styles.logo} />
        </div>

        <div className={styles.titleContainer}>
          <h1 className={styles.title}>Hệ thống quản lý rừng</h1>
          <h2 className={styles.subtitle}>Đăng nhập quản trị</h2>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <div className={styles.inputWrapper}>
              <FaUser className={styles.inputIcon} aria-hidden="true" />
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className={errors.username ? styles.errorInput : ""}
                placeholder="Nhập tên đăng nhập"
                autoComplete="username"
                disabled={isSubmitting}
              />
            </div>
            {errors.username && (
              <span className={styles.errorMessage}>{errors.username}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <div className={styles.inputWrapper}>
              <FaLock className={styles.inputIcon} aria-hidden="true" />
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={errors.password ? styles.errorInput : ""}
                placeholder="Nhập mật khẩu"
                autoComplete="current-password"
                disabled={isSubmitting}
              />
              <button
                type="button"
                className={styles.showPasswordButton}
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                disabled={isSubmitting}
              >
                {showPassword ? <VscEyeClosed /> : <VscEye />}
              </button>
            </div>
            {errors.password && (
              <span className={styles.errorMessage}>{errors.password}</span>
            )}
          </div>

          {authError && <div className={styles.authError}>{authError}</div>}

          <button
            type="submit"
            className={`${styles.loginButton} ${
              isSubmitting ? styles.loading : ""
            }`}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>
      </div>
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <img src={logo} alt="Logo Kiểm lâm" className={styles.footerLogo} />
          <p className={styles.footerText}>
            @2025 - Chi cục Kiểm lâm Hải Phòng
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Login;
