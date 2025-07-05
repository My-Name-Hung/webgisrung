import axios from "axios";
import React, { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("token");
      const expiry = localStorage.getItem("tokenExpiry");

      if (token) {
        // Check if token has expired
        if (expiry && new Date(expiry) < new Date()) {
          handleLogout();
        } else {
          await checkAuth(token);
        }
      } else {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const checkAuth = async (token) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_SERVER_URL}/api/auth/profile`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setAdmin(response.data.admin);
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      } else {
        handleLogout();
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      handleLogout();
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 2000);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("tokenExpiry");
    delete axios.defaults.headers.common["Authorization"];
    setAdmin(null);
    setError(null);
  };

  const login = async (username, password, rememberMe = false) => {
    try {
      setError(null);
      setLoading(true);

      const response = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/auth/login`,
        {
          username,
          password,
        }
      );

      if (response.data.success) {
        const { token, admin } = response.data;

        // Set token expiry if remember me is checked
        if (rememberMe) {
          const expiry = new Date();
          expiry.setDate(expiry.getDate() + 30); // 30 days from now
          localStorage.setItem("tokenExpiry", expiry.toISOString());
        }

        localStorage.setItem("token", token);
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        setAdmin(admin);
        return { success: true };
      }
    } catch (error) {
      let errorMessage = "Đăng nhập thất bại";

      if (error.response) {
        switch (error.response.status) {
          case 401:
            errorMessage = "Tên đăng nhập hoặc mật khẩu không chính xác";
            break;
          case 429:
            errorMessage = "Quá nhiều lần thử đăng nhập. Vui lòng thử lại sau";
            break;
          case 500:
            errorMessage = "Lỗi hệ thống. Vui lòng thử lại sau";
            break;
          default:
            errorMessage = error.response.data?.message || errorMessage;
        }
      }

      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 2000);
    }
  };

  const updateProfile = async (updates) => {
    try {
      setError(null);
      setLoading(true);
      const response = await axios.patch(
        `${import.meta.env.VITE_SERVER_URL}/api/auth/profile`,
        updates
      );

      if (response.data.success) {
        setAdmin(response.data.admin);
        return { success: true };
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Cập nhật thông tin thất bại";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    admin,
    loading,
    error,
    isAuthenticated: !!admin,
    login,
    logout: handleLogout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
