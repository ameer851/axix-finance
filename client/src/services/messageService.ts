import { api } from "@/lib/api";
import { InsertMessage, Message, MessageStatus } from "@shared/schema";

export type MessageFilters = {
  userId?: number;
  status?: MessageStatus;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: "asc" | "desc";
};

/**
 * Create a new support message
 */
export async function createMessage(
  messageData: InsertMessage
): Promise<Message> {
  try {
    return await api.post<Message>("/messages", messageData);
  } catch (error: any) {
    console.error("Error creating message:", error);

    if (error.status === 400) {
      throw new Error(
        error.message || "Invalid message data. Please check your inputs."
      );
    } else if (error.status === 401) {
      throw new Error("You must be logged in to send messages.");
    } else if (error.isOffline || error.isNetworkError) {
      throw new Error(
        "Cannot connect to server. Please check your internet connection and try again."
      );
    }

    throw new Error(
      error.message || "Failed to send message. Please try again later."
    );
  }
}

/**
 * Get a single message by ID
 */
export async function getMessage(messageId: number): Promise<Message> {
  try {
    return await api.get<Message>(`/messages/${messageId}`);
  } catch (error: any) {
    console.error("Error fetching message:", error);

    if (error.status === 404) {
      throw new Error(
        "Message not found. It may have been deleted or you may not have access to it."
      );
    } else if (error.status === 403) {
      throw new Error("You do not have permission to view this message.");
    } else if (error.isOffline || error.isNetworkError) {
      throw new Error(
        "Cannot connect to server. Please check your internet connection and try again."
      );
    }

    throw new Error(
      error.message ||
        "Failed to fetch message details. Please try again later."
    );
  }
}

/**
 * Get all messages with optional filtering and pagination
 */
export async function getMessages(filters: MessageFilters = {}): Promise<{
  messages: Message[];
  total: number;
  page: number;
  totalPages: number;
}> {
  try {
    // Convert filters to query parameters
    const queryParams = new URLSearchParams();

    if (filters.userId) queryParams.append("userId", String(filters.userId));
    if (filters.status) queryParams.append("status", filters.status);
    if (filters.startDate) queryParams.append("startDate", filters.startDate);
    if (filters.endDate) queryParams.append("endDate", filters.endDate);
    if (filters.search) queryParams.append("search", filters.search);
    if (filters.page) queryParams.append("page", String(filters.page));
    if (filters.limit) queryParams.append("limit", String(filters.limit));
    if (filters.sortBy) queryParams.append("sortBy", filters.sortBy);
    if (filters.order) queryParams.append("order", filters.order);

    const url = `/messages${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;

    return await api.get(url);
  } catch (error: any) {
    console.error("Error fetching messages:", error);

    if (error.status === 403) {
      throw new Error("You do not have permission to view these messages.");
    } else if (error.isOffline || error.isNetworkError) {
      throw new Error(
        "Cannot connect to server. Please check your internet connection and try again."
      );
    }

    throw new Error(
      error.message || "Failed to fetch messages. Please try again later."
    );
  }
}

/**
 * Get unread messages count (for notifications)
 */
export async function getUnreadMessagesCount(): Promise<number> {
  try {
    const data = await api.get<{ count: number }>("/messages/unread/count");
    return data.count;
  } catch (error: any) {
    console.error("Error fetching unread messages count:", error);

    if (error.isOffline || error.isNetworkError) {
      // Return 0 for offline scenarios instead of throwing
      return 0;
    }

    // For other errors, also return 0 but log the error
    console.error("Returning 0 unread messages due to error:", error);
    return 0;
  }
}

/**
 * Mark message as read
 */
export async function markMessageAsRead(messageId: number): Promise<Message> {
  try {
    return await api.patch<Message>(`/messages/${messageId}/status`, {
      status: "read",
    });
  } catch (error: any) {
    console.error("Error marking message as read:", error);

    if (error.status === 403) {
      throw new Error("You do not have permission to update this message.");
    } else if (error.status === 404) {
      throw new Error("Message not found. It may have been deleted.");
    } else if (error.isOffline || error.isNetworkError) {
      throw new Error(
        "Cannot connect to server. Please check your internet connection and try again."
      );
    }

    throw new Error(
      error.message || "Failed to mark message as read. Please try again later."
    );
  }
}

/**
 * Delete a message (user who created it)
 */
export async function deleteMessage(messageId: number): Promise<boolean> {
  try {
    await api.delete(`/messages/${messageId}`);
    return true;
  } catch (error: any) {
    console.error("Error deleting message:", error);

    if (error.status === 403) {
      throw new Error("You do not have permission to delete this message.");
    } else if (error.status === 404) {
      throw new Error("Message not found. It may have been deleted.");
    } else if (error.isOffline || error.isNetworkError) {
      throw new Error(
        "Cannot connect to server. Please check your internet connection and try again."
      );
    }

    throw new Error(
      error.message || "Failed to delete message. Please try again later."
    );
  }
}

/**
 * Get message status label
 */
export function getMessageStatusLabel(status: MessageStatus): string {
  const labels: Record<MessageStatus, string> = {
    unread: "Unread",
    read: "Read",
    replied: "Replied",
  };
  return labels[status] || status.charAt(0).toUpperCase() + status.slice(1);
}
