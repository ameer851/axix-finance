import {
  endVisitorSession,
  initializeVisitorSession,
  trackPageView,
  updateVisitorActivity,
} from "@/services/visitorService";
import { useEffect, useRef } from "react";
import { useLocation } from "wouter";

/**
 * Hook to track visitor activity and page views
 */
export const useVisitorTracking = () => {
  // Silenced: disable all network tracking in production if env flag set
  const disabled = import.meta.env.VITE_DISABLE_VISITOR_TRACKING === "true";
  if (disabled) {
    return; // no-ops
  }
  const [location] = useLocation();
  const sessionInitialized = useRef(false);
  const activityInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Initialize session on first load
    if (!sessionInitialized.current) {
      initializeVisitorSession();
      sessionInitialized.current = true;
    }

    // Track page view whenever location changes
    trackPageView(location);

    // Update activity every 30 seconds
    if (activityInterval.current) {
      clearInterval(activityInterval.current);
    }

    activityInterval.current = setInterval(() => {
      updateVisitorActivity();
    }, 30000);

    return () => {
      if (activityInterval.current) {
        clearInterval(activityInterval.current);
      }
    };
  }, [location]);

  useEffect(() => {
    // End session when component unmounts (page unload)
    const handleBeforeUnload = () => {
      endVisitorSession();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (activityInterval.current) {
        clearInterval(activityInterval.current);
      }
      endVisitorSession();
    };
  }, []);

  // Track mouse movement and keyboard activity
  useEffect(() => {
    let lastActivity = Date.now();

    const updateActivity = () => {
      const now = Date.now();
      if (now - lastActivity > 30000) {
        // Only update if 30 seconds have passed
        updateVisitorActivity();
        lastActivity = now;
      }
    };

    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];
    events.forEach((event) => {
      document.addEventListener(event, updateActivity, true);
    });

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, updateActivity, true);
      });
    };
  }, []);
};
