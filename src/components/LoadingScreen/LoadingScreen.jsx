import { useEffect, useState } from "react";
import { FaTree } from "react-icons/fa";
import logo from "../../assets/Logo/icon.png";
import styles from "./LoadingScreen.module.css";

const LoadingScreen = () => {
  const [showPattern, setShowPattern] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowPattern(true);
    }, 1500); // Sau 1.5s sẽ chuyển sang pattern

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={styles.loadingScreen}>
      <div className={styles.loadingContent}>
        <div className={styles.imageContainer}>
          {!showPattern ? (
            <img src={logo} alt="Logo" className={styles.logo} />
          ) : (
            <FaTree className={styles.pattern} />
          )}
        </div>
        <h1 className={styles.title}>Chi cục Kiểm lâm Hải Phòng</h1>
      </div>
    </div>
  );
};

export default LoadingScreen;
