import { useEffect, useState } from "react";
import {
  FaBars,
  FaChartLine,
  FaClipboardList,
  FaLeaf,
  FaMapMarkedAlt,
  FaProjectDiagram,
  FaTree,
  FaUser,
} from "react-icons/fa";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import UserModal from "../UserModal/UserModal";
import styles from "./Layout.module.css";

const Layout = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
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

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
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
    {
      to: "/indices",
      icon: <FaLeaf />,
      label: "Chỉ số rừng",
    },
    {
      to: "/planning",
      icon: <FaProjectDiagram />,
      label: "Quy hoạch",
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
          <h1>QUẢN LÝ RỪNG</h1>
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
          <div
            className={styles.userInfo}
            onClick={() => setIsUserModalOpen(true)}
            style={{ cursor: "pointer" }}
          >
            <FaUser className={styles.userIcon} />
            <div className={styles.userDetails}>
              <span className={styles.username}>{admin?.username}</span>
              <span className={styles.email}>{admin?.email}</span>
            </div>
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

      <UserModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        admin={admin}
        onLogout={handleLogout}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
      />
    </div>
  );
};

export default Layout;
