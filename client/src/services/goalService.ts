import { api } from "@/lib/api";
import type { Goal } from "@shared/schema";

/**
 * Get goals for a user
 */
export async function getGoals(userId?: number | string): Promise<Goal[]> {
  if (!userId) {
    throw new Error("User ID is required");
  }

  try {
    return await api.get<Goal[]>(`/goals?userId=${userId}`);
  } catch (error: any) {
    console.error("Error fetching goals:", error);
    throw new Error(
      error.message || "Failed to fetch goals. Please try again later."
    );
  }
}

/**
 * Get a single goal by ID
 */
export async function getGoal(goalId: string): Promise<Goal> {
  try {
    return await api.get<Goal>(`/goals/${goalId}`);
  } catch (error: any) {
    console.error("Error fetching goal:", error);
    throw new Error(
      error.message || "Failed to fetch goal details. Please try again later."
    );
  }
}

/**
 * Create a new goal
 */
export async function createGoal(goalData: Partial<Goal>): Promise<Goal> {
  try {
    return await api.post<Goal>("/goals", goalData);
  } catch (error: any) {
    console.error("Error creating goal:", error);
    throw new Error(
      error.message || "Failed to create goal. Please try again later."
    );
  }
}

/**
 * Update an existing goal
 */
export async function updateGoal(
  goalId: string,
  goalData: Partial<Goal>
): Promise<Goal> {
  try {
    return await api.put<Goal>(`/goals/${goalId}`, goalData);
  } catch (error: any) {
    console.error("Error updating goal:", error);
    throw new Error(
      error.message || "Failed to update goal. Please try again later."
    );
  }
}

/**
 * Delete a goal
 */
export async function deleteGoal(goalId: string): Promise<void> {
  try {
    await api.delete(`/goals/${goalId}`);
  } catch (error: any) {
    console.error("Error deleting goal:", error);
    throw new Error(
      error.message || "Failed to delete goal. Please try again later."
    );
  }
}

export default {
  getGoals,
  getGoal,
  createGoal,
  updateGoal,
  deleteGoal,
};
