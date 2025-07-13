import { TourProvider } from "@reactour/tour";
import React from "react";
import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { TourProvider as CustomTourProvider } from "./context/TourContext";

// Components
import Dashboard from "./components/Dashboard/Dashboard";
import ForestIndices from "./components/ForestIndices/ForestIndices";
import ForestMap from "./components/ForestMap/ForestMap";
import ForestPlanning from "./components/ForestPlanning/ForestPlanning";
import ForestStatus from "./components/ForestStatus/ForestStatus";
import Layout from "./components/Layout/Layout";
import LoadingScreen from "./components/LoadingScreen/LoadingScreen";
import Login from "./components/Login/Login";
import MonitoringPoints from "./components/MonitoringPoints/MonitoringPoints";

// Styles
import "./App.css";

const tourConfig = {
  styles: {
    popover: (base) => ({
      ...base,
      "--reactour-accent": "#2C7A7B",
      borderRadius: 8,
      padding: "1rem",
      maxWidth: "350px",
    }),
    maskArea: (base) => ({
      ...base,
      rx: 8,
      backgroundColor: "rgba(0, 0, 0, 0.4)",
    }),
    badge: (base) => ({
      ...base,
      left: "auto",
      right: "-0.8rem",
      top: "-0.8rem",
    }),
    arrow: (base) => ({
      ...base,
      color: "#2C7A7B",
    }),
    dot: (base, { current }) => ({
      ...base,
      backgroundColor: current ? "#2C7A7B" : "#ccc",
    }),
    close: (base) => ({
      ...base,
      top: "5px",
    }),
  },
  showNavigation: true,
  showBadge: true,
  showDots: true,
  padding: { mask: 16 },
  nextButton: "Tiếp theo →",
  prevButton: "← Quay lại",
  disableInteraction: true,
  disableKeyboardNavigation: false,
  className: "reactour",
  onClickMask: ({ setCurrentStep, currentStep, steps }) => {
    setCurrentStep((s) => (s === steps.length - 1 ? s : s + 1));
  },
  scrollSmooth: true,
  scrollOffset: 50,
};

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

const AppRoutes = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />}
      />

      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="forest-map" element={<ForestMap />} />
        <Route path="monitoring-points" element={<MonitoringPoints />} />
        <Route path="indices" element={<ForestIndices />} />
        <Route path="forest-status" element={<ForestStatus />} />
        <Route path="planning" element={<ForestPlanning />} />
      </Route>
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <CustomTourProvider>
          <TourProvider {...tourConfig}>
            <AppRoutes />
          </TourProvider>
        </CustomTourProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
