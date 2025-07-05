import axios from "axios";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// Configure axios defaults
axios.defaults.baseURL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";
axios.defaults.headers.common["Content-Type"] = "application/json";

// Get token from localStorage
const token = localStorage.getItem("token");
if (token) {
  axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
