import { useEffect, useState } from "react";
import {
  FaBars,
  FaChartLine,
  FaClipboardList,
  FaMapMarkedAlt,
  FaMoon,
  FaSignOutAlt,
  FaSun,
  FaTree,
} from "react-icons/fa";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import styles from "./Layout.module.css";

const Layout = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Check system preference
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    const savedTheme = localStorage.getItem("theme");
    setIsDarkMode(savedTheme === "dark" || (!savedTheme && prefersDark));
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      isDarkMode ? "dark" : "light"
    );
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const navItems = [
    {
      to: "/dashboard",
      icon: <FaChartLine />,
      label: "Tổng quan",
    },
    {
      to: "/forest-map",
      icon: <FaMapMarkedAlt />,
      label: "Bản đồ rừng",
    },
    {
      to: "/monitoring-points",
      icon: <FaTree />,
      label: "Điểm quan trắc",
    },
    {
      to: "/forest-status",
      icon: <FaClipboardList />,
      label: "Hiện trạng rừng",
    },
  ];

  return (
    <div className={styles.layout}>
      <aside
        className={`${styles.sidebar} ${
          !isSidebarOpen ? styles.collapsed : ""
        }`}
      >
        <div className={styles.sidebarHeader}>
          <h1>Quản lý rừng</h1>
          <button
            className={styles.menuToggle}
            onClick={toggleSidebar}
            aria-label="Chuyển đổi menu"
          >
            <FaBars />
          </button>
        </div>

        <nav className={styles.navigation}>
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={styles.navItem}
              title={!isSidebarOpen ? item.label : undefined}
            >
              <span className={styles.icon}>{item.icon}</span>
              <span className={styles.label}>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <button
            className={styles.themeToggle}
            onClick={() => setIsDarkMode(!isDarkMode)}
            aria-label="Chuyển đổi giao diện"
          >
            {isDarkMode ? <FaSun /> : <FaMoon />}
            <span className={styles.label}>
              {isDarkMode ? "Giao diện sáng" : "Giao diện tối"}
            </span>
          </button>

          <button
            className={styles.logoutButton}
            onClick={handleLogout}
            aria-label="Đăng xuất"
          >
            <FaSignOutAlt />
            <span className={styles.label}>Đăng xuất</span>
          </button>

          <div className={styles.userInfo}>
            <span className={styles.username}>{admin?.username}</span>
            <span className={styles.email}>{admin?.email}</span>
          </div>
        </div>
      </aside>

      <main className={styles.main}>
        <div className={styles.mainHeader}>
          <button
            className={styles.mobileMenuToggle}
            onClick={toggleSidebar}
            aria-label="Chuyển đổi menu di động"
          >
            <FaBars />
          </button>
        </div>

        <div className={styles.content}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
