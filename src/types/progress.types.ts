// src/types/progress.types.ts
export interface UserProgress {
  user_id: string; // This will be the UUID from auth.users
  current_level: number;
  level_xp: number;
  total_xp: number;
  streak_days: number;
  lessons_completed_today: number;
  last_activity_at: string; // Supabase returns timestamps as ISO strings
  activity_embedding?: number[] | null; // Vector of numbers, can be null if no embedding yet
  created_at: string;
  updated_at: string;
}

export interface CreateUserProgressPayload {
  userId: string;
}

export interface UpdateUserProgressPayload {
  current_level?: number;
  level_xp?: number;
  total_xp?: number;
  // streak_days is calculated and managed by the server.
  lessons_completed_today?: number;
  // last_activity_at will be updated automatically by the server
  // userId is part of the URL, not the payload for update
}

/**
 * Represents a single entry in the leaderboard.
 */
export interface LeaderboardEntry {
  user_id: string;
  current_level: number;
  total_xp: number;
}