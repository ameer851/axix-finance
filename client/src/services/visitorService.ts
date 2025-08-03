import { apiRequest } from "@/lib/queryClient";

export interface VisitorData {
  id: string;
  ipAddress: string;
  userAgent: string;
  country: string;
  city: string;
  region: string;
  deviceType: "desktop" | "mobile" | "tablet";
  browser: string;
  os: string;
  currentPage: string;
  entryPage: string;
  sessionDuration: number;
  pageViews: number;
  isActive: boolean;
  lastActivity: Date | string;
  joinedAt: Date | string;
}

export interface VisitorStats {
  totalVisitors: number;
  activeVisitors: number;
  todayVisitors: number;
  avgSessionDuration: number;
  topCountries: { country: string; count: number }[];
  topPages: { page: string; views: number }[];
  deviceBreakdown: { device: string; count: number }[];
}

/**
 * Get all active visitors
 */
export async function getActiveVisitors(): Promise<VisitorData[]> {
  try {
    const response = await apiRequest(
      "GET",
      "/api/admin/visitors/active-simple"
    );
    const result = await response.json();

    return result.visitors || [];
  } catch (error: any) {
    console.error("Error fetching active visitors:", error);
    throw new Error(error.message || "Failed to fetch active visitors");
  }
}

/**
 * Get visitor statistics
 */
export async function getVisitorStats(): Promise<VisitorStats> {
  try {
    const response = await apiRequest(
      "GET",
      "/api/admin/visitors/stats-simple"
    );
    return await response.json();
  } catch (error: any) {
    console.error("Error fetching visitor stats:", error);
    throw new Error(error.message || "Failed to fetch visitor statistics");
  }
}

/**
 * Track a visitor page view
 */
export async function trackPageView(page: string): Promise<void> {
  try {
    await apiRequest("POST", "/api/visitors/track", {
      page,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    // Silently fail for tracking to not disrupt user experience
    console.warn("Failed to track page view:", error);
  }
}

/**
 * Update visitor activity status
 */
export async function updateVisitorActivity(): Promise<void> {
  try {
    await apiRequest("PUT", "/api/visitors/activity", {
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    // Silently fail for activity tracking
    console.warn("Failed to update visitor activity:", error);
  }
}

/**
 * Initialize visitor session
 */
export async function initializeVisitorSession(): Promise<void> {
  try {
    // Get visitor info from browser
    const visitorInfo = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screen: {
        width: screen.width,
        height: screen.height,
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
    };

    await apiRequest("POST", "/api/visitors/session", visitorInfo);
  } catch (error: any) {
    console.warn("Failed to initialize visitor session:", error);
  }
}

/**
 * End visitor session
 */
export async function endVisitorSession(): Promise<void> {
  try {
    await apiRequest("DELETE", "/api/visitors/session");
  } catch (error: any) {
    console.warn("Failed to end visitor session:", error);
  }
}
