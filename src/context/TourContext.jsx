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
    const saved = localStorage.getItem("visitedPages");
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem("visitedPages", JSON.stringify(visitedPages));
  }, [visitedPages]);

  const markPageAsVisited = (pagePath) => {
    setVisitedPages((prev) => ({
      ...prev,
      [pagePath]: true,
    }));
  };

  const hasVisitedPage = (pagePath) => {
    return !!visitedPages[pagePath];
  };

  const resetTourHistory = () => {
    setVisitedPages({});
    localStorage.removeItem("visitedPages");
  };

  const value = {
    visitedPages,
    markPageAsVisited,
    hasVisitedPage,
    resetTourHistory,
  };

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
};
