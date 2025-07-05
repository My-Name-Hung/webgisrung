import React from "react";
import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { TourProvider } from "./context/TourContext";

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
import "./App.module.css";

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
        <TourProvider>
          <AppRoutes />
        </TourProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
