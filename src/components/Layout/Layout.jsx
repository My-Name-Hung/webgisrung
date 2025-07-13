import { useTour } from "@reactour/tour";
import { useEffect, useState } from "react";
import {
  FaBars,
  FaChartLine,
  FaClipboardList,
  FaLeaf,
  FaMapMarkedAlt,
  FaProjectDiagram,
  FaQuestionCircle,
  FaRedo,
  FaTree,
  FaUser,
} from "react-icons/fa";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  dashboardSteps,
  forestIndicesSteps,
  forestMapSteps,
  forestPlanningSteps,
  forestStatusSteps,
  layoutSteps,
  monitoringSteps,
  userModalSteps,
} from "../../config/tourSteps";
import { useAuth } from "../../context/AuthContext";
import { useTourContext } from "../../context/TourContext";
import UserModal from "../UserModal/UserModal";
import "./Layout.css";

const Layout = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    return savedTheme === "dark" ? true : false;
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { resetTourHistory } = useTourContext();
  const { setSteps, setIsOpen } = useTour();

  // Function to get tour steps based on current route
  const getTourSteps = () => {
    const path = location.pathname;
    switch (path) {
      case "/dashboard":
        return [...layoutSteps, ...dashboardSteps];
      case "/forest-map":
        return [...layoutSteps, ...forestMapSteps];
      case "/monitoring-points":
        return [...layoutSteps, ...monitoringSteps];
      case "/indices":
        return [...layoutSteps, ...forestIndicesSteps];
      case "/forest-status":
        return [...layoutSteps, ...forestStatusSteps];
      case "/planning":
        return [...layoutSteps, ...forestPlanningSteps];
      default:
        return layoutSteps;
    }
  };

  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      isDarkMode ? "dark" : "light"
    );
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  useEffect(() => {
    // Update tour steps when route changes
    if (!isUserModalOpen) {
      setSteps(getTourSteps());
    }
  }, [location.pathname, isUserModalOpen, setSteps]);

  useEffect(() => {
    // Start user modal tour when modal is opened
    if (isUserModalOpen) {
      setSteps(userModalSteps);
      setIsOpen(true);
    }
  }, [isUserModalOpen, setSteps, setIsOpen]);

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

  const handleStartTour = () => {
    setSteps(getTourSteps());
    setIsOpen(true);
  };

  const handleResetTour = () => {
    resetTourHistory();
    setSteps(getTourSteps());
    setIsOpen(true);
  };

  const handleOpenUserModal = () => {
    setIsUserModalOpen(true);
  };

  const handleCloseUserModal = () => {
    setIsUserModalOpen(false);
    setSteps(getTourSteps()); // Reset to current route's steps
    setIsOpen(false);
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
    <div className="layout" data-tour="layout">
      <aside
        className={`sidebar ${!isSidebarOpen ? "collapsed" : ""}`}
        data-tour="sidebar"
      >
        <div className="sidebar-header">
          <h1>QUẢN LÝ RỪNG</h1>
          <button
            className="menu-toggle"
            onClick={toggleSidebar}
            aria-label="Chuyển đổi menu"
          >
            <FaBars />
          </button>
        </div>

        <nav className="navigation">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="nav-item"
              title={!isSidebarOpen ? item.label : undefined}
            >
              <span className="icon">{item.icon}</span>
              <span className="label">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="tour-buttons">
            <button
              className="tour-button"
              onClick={handleStartTour}
              title="Xem hướng dẫn"
            >
              <FaQuestionCircle />
              {isSidebarOpen && <span>Hướng dẫn</span>}
            </button>
            <button
              className="tour-button"
              onClick={handleResetTour}
              title="Đặt lại hướng dẫn"
            >
              <FaRedo />
              {isSidebarOpen && <span>Đặt lại hướng dẫn</span>}
            </button>
          </div>

          <div
            className="user-info"
            onClick={handleOpenUserModal}
            style={{ cursor: "pointer" }}
            data-tour="userInfo"
          >
            <FaUser className="user-icon" />
            <div className="user-details">
              <span className="username">{admin?.username}</span>
              <span className="email">{admin?.email}</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="main">
        <div className="main-header">
          <button
            className="mobile-menu-toggle"
            onClick={toggleSidebar}
            aria-label="Chuyển đổi menu di động"
          >
            <FaBars />
          </button>
        </div>

        <div className="content">
          <Outlet />
        </div>
      </main>

      <UserModal
        isOpen={isUserModalOpen}
        onClose={handleCloseUserModal}
        admin={admin}
        onLogout={handleLogout}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
      />
    </div>
  );
};

export default Layout;
