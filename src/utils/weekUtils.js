import { getISOWeek, getISOWeekYear } from "date-fns";

/**
 * Generates a week identifier in the format "YYYY-Www" (e.g., "2025-W44")
 * Uses ISO week date system where week starts on Monday
 *
 * @param {Date} date - The date to get the week ID for
 * @returns {string} Week identifier (e.g., "2025-W44")
 */
export function getWeekId(date) {
  const year = getISOWeekYear(date);
  const week = getISOWeek(date);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

/**
 * Gets the current week ID
 * @returns {string} Current week identifier (e.g., "2025-W44")
 */
export function getCurrentWeekId() {
  return getWeekId(new Date());
}

/**
 * Generates a Firestore document path for a user's meal plan
 * @param {string} userId - The user's ID
 * @param {Date|string} date - Date or week ID
 * @returns {string} Firestore document path
 */
export function getMealPlanPath(userId, date) {
  const weekId = typeof date === "string" ? date : getWeekId(date);
  return `users/${userId}/mealPlans/${weekId}`;
}

// Example usage:
// const weekId = getWeekId(new Date()); // "2025-W44"
// const path = getMealPlanPath(userId, new Date()); // "users/abc123/mealPlans/2025-W44"
