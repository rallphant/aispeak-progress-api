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
router.get('/similar/', protect, findSimilarUsers);
router.get('/', protect, getUserProgress);
router.put('/', protect, updateUserProgress);

export default router;