import React from "react";
import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Components
import Dashboard from "./components/Dashboard/Dashboard";
import ForestIndices from "./components/ForestIndices/ForestIndices";
import ForestMap from "./components/ForestMap/ForestMap";
import ForestPlanning from "./components/ForestPlanning/ForestPlanning";
import ForestStatus from "./components/ForestStatus/ForestStatus";
import Layout from "./components/Layout/Layout";
import Login from "./components/Login/Login";
import MonitoringPoints from "./components/MonitoringPoints/MonitoringPoints";

// Styles
import "./App.module.css";

const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

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
        <Route path="map" element={<ForestMap />} />
        <Route path="monitoring" element={<MonitoringPoints />} />
        <Route path="indices" element={<ForestIndices />} />
        <Route path="status" element={<ForestStatus />} />
        <Route path="planning" element={<ForestPlanning />} />
      </Route>
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
