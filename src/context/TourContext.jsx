import React, { createContext, useContext, useEffect, useState } from "react";

const TourContext = createContext();

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
      const saved = localStorage.getItem("tourVisitedPages");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [isTourOpen, setIsTourOpen] = useState(false);
  const [currentTourSteps, setCurrentTourSteps] = useState([]);

  useEffect(() => {
    localStorage.setItem("tourVisitedPages", JSON.stringify(visitedPages));
  }, [visitedPages]);

  const markPageAsVisited = (pagePath) => {
    setVisitedPages((prev) => ({
      ...prev,
      [pagePath]: true,
    }));
  };

  const hasVisitedPage = (pagePath) => {
    return visitedPages[pagePath] || false;
  };

  const resetTourHistory = () => {
    setVisitedPages({});
    localStorage.removeItem("tourVisitedPages");
  };

  const startTour = (steps) => {
    setCurrentTourSteps(steps);
    setIsTourOpen(true);
  };

  const closeTour = () => {
    setIsTourOpen(false);
  };

  const value = {
    visitedPages,
    markPageAsVisited,
    hasVisitedPage,
    resetTourHistory,
    isTourOpen,
    startTour,
    closeTour,
    currentTourSteps,
  };

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
};
