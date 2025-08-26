import { api } from "@/lib/api";

export type ReportType = "monthly" | "quarterly" | "annual" | "tax";

export interface Document {
  id: string;
  userId: string | number;
  type: string;
  name: string;
  period: string;
  date: string;
  fileUrl: string;
  fileSize?: string;
}

export interface DocumentFilters {
  userId: number | string;
  type?: ReportType;
  year?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

/**
 * Get user statements
 */
export async function getStatements(
  filters: DocumentFilters
): Promise<Document[]> {
  try {
    if (!filters.userId) {
      throw new Error("User ID is required");
    }

    // Build query params
    const queryParams = new URLSearchParams();
    if (filters.type) queryParams.append("type", filters.type);
    if (filters.year) queryParams.append("year", filters.year);
    if (filters.startDate) queryParams.append("startDate", filters.startDate);
    if (filters.endDate) queryParams.append("endDate", filters.endDate);
    if (filters.page) queryParams.append("page", String(filters.page));
    if (filters.limit) queryParams.append("limit", String(filters.limit));

    const url = `/users/${filters.userId}/statements${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
    return await api.get<Document[]>(url);
  } catch (error: any) {
    console.error("Error fetching statements:", error);

    if (error.isOffline || error.isNetworkError) {
      // Return empty statements for offline mode
      return [];
    }

    throw new Error(
      error.message || "Failed to fetch statements. Please try again later."
    );
  }
}

/**
 * Get user tax documents
 */
export async function getTaxDocuments(
  filters: DocumentFilters
): Promise<Document[]> {
  try {
    if (!filters.userId) {
      throw new Error("User ID is required");
    }

    // Build query params
    const queryParams = new URLSearchParams();
    if (filters.year) queryParams.append("year", filters.year);
    if (filters.startDate) queryParams.append("startDate", filters.startDate);
    if (filters.endDate) queryParams.append("endDate", filters.endDate);
    if (filters.page) queryParams.append("page", String(filters.page));
    if (filters.limit) queryParams.append("limit", String(filters.limit));

    const url = `/users/${filters.userId}/tax-documents${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
    return await api.get<Document[]>(url);
  } catch (error: any) {
    console.error("Error fetching tax documents:", error);

    if (error.isOffline || error.isNetworkError) {
      // Return empty tax documents for offline mode
      return [];
    }

    throw new Error(
      error.message || "Failed to fetch tax documents. Please try again later."
    );
  }
}

/**
 * Download a document
 */
export async function downloadDocument(documentId: string): Promise<Blob> {
  try {
    if (!documentId) {
      throw new Error("Document ID is required");
    }

    const response = await api.get<Response>(
      `/documents/${documentId}/download`
    );
    return await response.blob();
  } catch (error: any) {
    console.error("Error downloading document:", error);

    if (error.isOffline || error.isNetworkError) {
      throw new Error(
        "You are currently offline. Please try again when you have an internet connection."
      );
    }

    throw new Error(
      error.message || "Failed to download document. Please try again later."
    );
  }
}

export default {
  getStatements,
  getTaxDocuments,
  downloadDocument,
};
