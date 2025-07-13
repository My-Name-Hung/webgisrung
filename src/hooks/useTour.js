import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useTourContext } from "../context/TourContext";

const useCustomTour = (steps) => {
  const location = useLocation();
  const {
    hasVisitedPage,
    markPageAsVisited,
    startTour,
    closeTour,
    isTourOpen,
  } = useTourContext();

  useEffect(() => {
    // Auto-start tour only for first-time visitors
    if (!hasVisitedPage(location.pathname)) {
      const timer = setTimeout(() => {
        startTour(steps);
      }, 500);

      return () => {
        clearTimeout(timer);
        markPageAsVisited(location.pathname);
      };
    }
  }, [location.pathname, hasVisitedPage, markPageAsVisited, startTour, steps]);

  const handleStartTour = () => {
    startTour(steps);
  };

  const handleCloseTour = () => {
    closeTour();
  };

  return {
    isOpen: isTourOpen,
    startTour: handleStartTour,
    closeTour: handleCloseTour,
  };
};

export default useCustomTour;
