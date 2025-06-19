// src/routes/progressRoutes.ts
import express from 'express';
import { protect } from '../middleware/authMiddleware';
import {
  createUserProgress,
  getUserProgress,
  updateUserProgress,
  getLeaderboard,
  findSimilarUsers,
} from '../controllers/progressController';

const router = express.Router();

router.get('/leaderboard', protect, getLeaderboard);

router.post('/', protect, createUserProgress);
router.get('/similar/:userId', protect, findSimilarUsers); // New route for similarity search
router.get('/:userId', protect, getUserProgress);
router.put('/:userId', protect, updateUserProgress);

export default router;