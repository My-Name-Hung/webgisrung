import React, { createContext, useContext, useEffect, useState } from "react";

const TourContext = createContext(null);

export const useTourContext = () => {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error("useTourContext must be used within a TourProvider");
  }
  return context;
};

export const TourProvider = ({ children }) => {
  const [visitedPages, setVisitedPages] = useState(() => {
    try {
      const saved = localStorage.getItem("visitedPages");
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.error("Error loading visited pages:", error);
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("visitedPages", JSON.stringify(visitedPages));
    } catch (error) {
      console.error("Error saving visited pages:", error);
    }
  }, [visitedPages]);

  const markPageAsVisited = (pagePath) => {
    if (!visitedPages[pagePath]) {
      setVisitedPages((prev) => ({
        ...prev,
        [pagePath]: true,
      }));
    }
  };

  const hasVisitedPage = (pagePath) => {
    return !!visitedPages[pagePath];
  };

  const resetTourHistory = () => {
    setVisitedPages({});
    try {
      localStorage.removeItem("visitedPages");
    } catch (error) {
      console.error("Error resetting tour history:", error);
    }
  };

  const value = {
    visitedPages,
    markPageAsVisited,
    hasVisitedPage,
    resetTourHistory,
  };

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
};
