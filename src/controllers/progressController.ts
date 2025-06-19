// src/controllers/progressController.ts
import { Response } from 'express';
import { supabase } from '../supabaseClient';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { CreateUserProgressPayload, UserProgress, LeaderboardEntry, UpdateUserProgressPayload } from '../types/progress.types';
import { isSameDay, datesAreConsecutiveDays } from '../utils/dateUtils';

/**
 * Creates a new progress record for the authenticated user.
 * The userId in the request body must match the authenticated user's ID.
 * @param req - The authenticated request object, containing user ID and request body.
 * @param res - The response object.
 * @returns A JSON response with the created user progress record or an error message.
 */
export const createUserProgress = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const authenticatedUserId = req.user?.id;
  const { userId } = req.body as CreateUserProgressPayload;

  if (!userId) {
    res.status(400).json({ error: 'userId is required' });
    return;
  }

  if (authenticatedUserId !== userId) {
    res.status(403).json({ error: 'Forbidden: You can only create a progress record for yourself.' });
    return;
  }

  try {
    const { data, error } = await supabase
      .from('user_progress')
      .insert([{ user_id: userId }])
      .select()
      .single();

    if (error) {
      console.error('Supabase error creating progress:', error);
      if (error.code === '23505') {
        res.status(409).json({ error: 'Progress record for this user already exists.' });
        return;
      }
      res.status(500).json({ error: 'Failed to create user progress record', details: error.message });
      return;
    }

    res.status(201).json(data);
  } catch (err) {
    console.error('Server error creating progress:', err);
    res.status(500).json({ error: 'An unexpected error occurred.' });
  }
};

/**
 * Retrieves the progress record for the authenticated user.
 * The userId in the URL parameters must match the authenticated user's ID.
 * @param req - The authenticated request object, containing user ID and URL parameters.
 * @param res - The response object.
 * @returns A JSON response with the user progress record or an error message.
 */
export const getUserProgress = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { userId } = req.params;
  const authenticatedUserId = req.user?.id;

  if (authenticatedUserId !== userId) {
    res.status(403).json({ error: 'Forbidden: You can only view your own progress.' });
    return;
  }

  try {
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Supabase error retrieving progress:', error);
      res.status(500).json({ error: 'Failed to retrieve user progress', details: error.message });
      return;
    }

    if (!data) {
      res.status(404).json({ error: 'User progress not found' });
      return;
    }
    res.status(200).json(data);
  } catch (err) {
    console.error('Server error retrieving progress:', err);
    res.status(500).json({ error: 'An unexpected error occurred.' });
  }
};

/**
 * Updates an existing progress record for the authenticated user.
 * The userId in the URL parameters must match the authenticated user's ID.
 * @param req - The authenticated request object, containing user ID, URL parameters, and request body with updates.
 * @param res - The response object.
 * @returns A JSON response with the updated user progress record or an error message.
 */
export const updateUserProgress = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { userId } = req.params;
  const payload = req.body as UpdateUserProgressPayload; // Use the specific payload type
  const authenticatedUserId = req.user?.id;

  if (authenticatedUserId !== userId) {
    res.status(403).json({ error: 'Forbidden: You can only update your own progress.' });
    return;
  }
  
  // Check if payload is empty, but allow if it's just for activity tracking (implicit update of last_activity_at)
  // However, for streak logic, some meaningful update (like lesson completion) is usually expected.
  // For now, we'll proceed even with an empty payload, as last_activity_at will be updated.
  // The streak logic below will handle cases where no lessons are explicitly completed.
  if (Object.keys(payload).length === 0 && req.method === 'PUT') { // Stricter check for PUT
    res.status(400).json({ error: 'Request body must contain fields to update.' });
    return;
  }

  // Mock vectors for simulation (replace with actual embedding generation in a real app)
  // Dimensions must match the vector(3) column in the database.
  const LESSON_COMPLETER_VECTOR = [0.8, 0.1, 0.1];
  const XP_GAINER_VECTOR = [0.1, 0.8, 0.1];
  const GENERAL_ACTIVITY_VECTOR = [0.3, 0.3, 0.3];

  try {
    // 1. Fetch current progress
    const { data: currentProgress, error: fetchError } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Supabase error fetching current progress:', fetchError);
      res.status(500).json({ error: 'Failed to fetch user progress for update.', details: fetchError.message });
      return;
    }

    if (!currentProgress) {
      res.status(404).json({ error: 'User progress not found, cannot update.' });
      return;
    }

    // 2. Prepare update data and timestamps
    const updateData: Partial<UserProgress> = { ...payload };
    const newActivityTime = new Date();
    updateData.last_activity_at = newActivityTime.toISOString();
    const dbLastActivityTime = new Date(currentProgress.last_activity_at);

    // 3. Handle lessons_completed_today
    if (isSameDay(newActivityTime, dbLastActivityTime)) {
      // Same day: if payload provides it, use it; otherwise, keep existing for the day.
      updateData.lessons_completed_today = payload.lessons_completed_today !== undefined 
        ? payload.lessons_completed_today 
        : currentProgress.lessons_completed_today;
    } else {
      // New day: if payload provides it, it's the count for the new day; otherwise, reset to 0.
      updateData.lessons_completed_today = payload.lessons_completed_today !== undefined 
        ? payload.lessons_completed_today 
        : 0;
    }

    // 4. Handle streak_days
    let newStreakDays = currentProgress.streak_days;
    const lessonsCompletedOnActivityDay = updateData.lessons_completed_today || 0;

    if (!isSameDay(newActivityTime, dbLastActivityTime)) { // Only adjust streak if it's a new day
      if (lessonsCompletedOnActivityDay > 0) { // A lesson was completed on this new day
        if (datesAreConsecutiveDays(newActivityTime, dbLastActivityTime)) {
          newStreakDays = currentProgress.streak_days + 1;
        } else { // Gap or first lesson after a break
          newStreakDays = 1;
        }
      } else { // No lesson completed on this new day
        // If it's a new day and no lesson was completed, the streak breaks (resets to 0).
        newStreakDays = 0;
      }
    }
    // If it's the same day, newStreakDays remains currentProgress.streak_days
    // (it would have been set by the first activity of the day if it was a consecutive day)
    updateData.streak_days = newStreakDays;

    // 4.5 Simulate and set activity_embedding
    // In a real application, you would generate embeddings based on meaningful data
    // (e.g., text summary of activity, lesson content) using an ML model.
    if (payload.lessons_completed_today && payload.lessons_completed_today > (currentProgress.lessons_completed_today || 0) ) {
      updateData.activity_embedding = LESSON_COMPLETER_VECTOR;
    } else if (payload.total_xp && payload.total_xp > (currentProgress.total_xp + 20)) { // Arbitrary "significant" XP gain for demo
      updateData.activity_embedding = XP_GAINER_VECTOR;
    } else if (Object.keys(payload).length > 0) { // Some other activity
      updateData.activity_embedding = GENERAL_ACTIVITY_VECTOR;
    } else {
      // If no specific activity pattern matched, keep existing or set to null/default
      updateData.activity_embedding = currentProgress.activity_embedding || null;
    }

    // 5. Perform the update
    const { data, error } = await supabase
      .from('user_progress')
      .update(updateData)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Supabase error updating progress:', error);
      res.status(500).json({ error: 'Failed to update user progress', details: error.message });
      return;
    }
    // !data case is covered by the initial fetch, but Supabase might return null on update if .single() expects a return and nothing matched.
    res.status(200).json(data);
  } catch (err) {
    console.error('Server error updating progress:', err);
    res.status(500).json({ error: 'An unexpected error occurred during update.' });
  }
};

/**
 * Retrieves a paginated leaderboard of users, ordered by total_xp.
 * @param req - The authenticated request object, can contain query parameters for pagination (page, limit).
 * @param res - The response object.
 * @returns A JSON response with the leaderboard data or an error message.
 */
export const getLeaderboard = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  // Default pagination values
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const offset = (page - 1) * limit;

  if (page < 1) {
    res.status(400).json({ error: 'Page number must be 1 or greater.' });
    return;
  }
  if (limit < 1 || limit > 100) { // Set a reasonable max limit
    res.status(400).json({ error: 'Limit must be between 1 and 100.' });
    return;
  }

  try {
    const { data, error, count } = await supabase
      .from('user_progress')
      .select('user_id, current_level, total_xp', { count: 'exact' }) // Specify columns and request total count
      .order('total_xp', { ascending: false })
      .order('user_id', { ascending: true }) // Secondary sort for consistent ordering on ties
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Supabase error retrieving leaderboard:', error);
      res.status(500).json({ error: 'Failed to retrieve leaderboard', details: error.message });
      return;
    }
    res.status(200).json({ data: data as LeaderboardEntry[], total: count, page, limit });
  } catch (err) {
    console.error('Server error retrieving leaderboard:', err);
    res.status(500).json({ error: 'An unexpected error occurred.' });
  }
};

/**
* Finds users with similar activity patterns based on vector embeddings.
* @param req - The authenticated request object, containing the target userId in params.
* @param res - The response object.
* @returns A JSON response with a list of similar user_ids or an error message.
*/
export const findSimilarUsers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
const { userId } = req.params;
const authenticatedUserId = req.user?.id; // Optional: restrict who can see recommendations

// Example: Allow any authenticated user to use this, or restrict to self/admin
// if (authenticatedUserId !== userId && !req.user?.isAdmin) {
//   res.status(403).json({ error: 'Forbidden: You can only find similar users for yourself.' });
//   return;
// }

try {
  // 1. Get the embedding of the target user
  const { data: targetUserProgress, error: fetchError } = await supabase
    .from('user_progress')
    .select('activity_embedding')
    .eq('user_id', userId)
    .single();

  if (fetchError || !targetUserProgress) {
    console.error('Supabase error fetching target user for similarity search:', fetchError?.message);
    res.status(404).json({ error: 'Target user progress not found or error fetching.' });
    return;
  }

  if (!targetUserProgress.activity_embedding) {
    res.status(404).json({ error: 'Target user does not have an activity embedding for comparison.' });
    return;
  }

  // 2. Find similar users using the <-> (L2 distance) operator from pgvector
  // We want to find users OTHER than the target user.
  // The vector must be formatted as a string '[x,y,z]' for the RPC call or direct query.
  const { data: similarUsers, error: similarityError } = await supabase
    .rpc('match_user_progress', {
      query_embedding: targetUserProgress.activity_embedding, // Pass as array
      match_threshold: 1.0, // Example: Max L2 distance to consider a match (lower is more similar)
      match_count: 5,       // Number of similar users to return
      exclude_user_id: userId // Exclude the user themselves
    });

  if (similarityError) {
    console.error('Supabase error finding similar users:', similarityError);
    res.status(500).json({ error: 'Failed to find similar users', details: similarityError.message });
    return;
  }

  res.status(200).json({ similar_users: similarUsers });

} catch (err) {
  console.error('Server error finding similar users:', err);
  res.status(500).json({ error: 'An unexpected error occurred while finding similar users.' });
}
};
