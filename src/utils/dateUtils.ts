// src/utils/dateUtils.ts

/**
 * Checks if two Date objects fall on the same calendar day (ignores time).
 * @param date1 - The first date.
 * @param date2 - The second date.
 * @returns True if both dates are on the same day, false otherwise.
 */
export const isSameDay = (date1: Date, date2: Date): boolean => {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
};

/**
 * Checks if date1 is the calendar day immediately following date2.
 * @param date1 - The potentially later date.
 * @param date2 - The potentially earlier date.
 * @returns True if date1 is exactly one day after date2, false otherwise.
 */
export const datesAreConsecutiveDays = (date1: Date, date2: Date): boolean => {
  const d2PlusOneDay = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate() + 1);
  return isSameDay(date1, d2PlusOneDay);
};