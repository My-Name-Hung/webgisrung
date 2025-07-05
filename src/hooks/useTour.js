import { useTour } from "@reactour/tour";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useTourContext } from "../context/TourContext";

const useCustomTour = (steps) => {
  const location = useLocation();
  const { hasVisitedPage, markPageAsVisited } = useTourContext();
  const { setIsOpen, setSteps } = useTour();

  useEffect(() => {
    // Set steps when component mounts
    setSteps(steps);
  }, [steps, setSteps]);

  useEffect(() => {
    // Auto-start tour for first-time visitors with a small delay
    if (!hasVisitedPage(location.pathname)) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 500);

      return () => {
        clearTimeout(timer);
        markPageAsVisited(location.pathname);
      };
    }
  }, [location.pathname, hasVisitedPage, markPageAsVisited, setIsOpen]);

  const startTour = () => {
    setSteps(steps);
    setIsOpen(true);
  };

  const forceTour = () => {
    setSteps(steps);
    setIsOpen(true);
  };

  return { startTour, forceTour };
};

export default useCustomTour;
