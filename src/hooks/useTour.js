import introJs from "intro.js";
import "intro.js/minified/introjs.min.css";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useTourContext } from "../context/TourContext";

const useTour = (steps, options = {}) => {
  const location = useLocation();
  const { hasVisitedPage, markPageAsVisited } = useTourContext();

  useEffect(() => {
    const tour = introJs();

    // Default options
    const defaultOptions = {
      nextLabel: "Tiếp theo",
      prevLabel: "Quay lại",
      doneLabel: "Hoàn thành",
      skipLabel: "Bỏ qua",
      hidePrev: true,
      hideNext: true,
      exitOnOverlayClick: false,
      showStepNumbers: true,
      showBullets: true,
      showProgress: true,
      scrollToElement: true,
      disableInteraction: false,
      ...options,
    };

    if (steps && steps.length > 0) {
      tour.setOptions({
        steps,
        ...defaultOptions,
      });

      // Mark page as visited when tour completes
      tour.oncomplete(() => {
        markPageAsVisited(location.pathname);
      });

      // Mark page as visited when tour is skipped
      tour.onexit(() => {
        markPageAsVisited(location.pathname);
      });
    }

    // Cleanup
    return () => {
      tour.exit();
    };
  }, [steps, options, location.pathname, markPageAsVisited]);

  const startTour = () => {
    // Only start tour if page hasn't been visited
    if (!hasVisitedPage(location.pathname)) {
      const tour = introJs();
      tour.start();
    }
  };

  const forceTour = () => {
    // Start tour regardless of visit status
    const tour = introJs();
    tour.start();
  };

  return { startTour, forceTour };
};

export default useTour;
