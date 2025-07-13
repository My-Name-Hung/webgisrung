import { useEffect, useState } from "react";
import { FaTree } from "react-icons/fa";
import logo from "../../assets/Logo/icon.png";
import "./LoadingScreen.css";

const LoadingScreen = () => {
  const [showPattern, setShowPattern] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowPattern(true);
    }, 1500); // Sau 1.5s sẽ chuyển sang pattern

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="loading-screen">
      <div className="loading-content">
        <div className="image-container">
          {!showPattern ? (
            <img src={logo} alt="Logo" className="logo" />
          ) : (
            <FaTree className="pattern" />
          )}
        </div>
        <h1 className="title">Chi cục Kiểm lâm Hải Phòng</h1>
      </div>
    </div>
  );
};

export default LoadingScreen;
