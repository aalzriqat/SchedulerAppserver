import express from 'express';
import {
  createBreakingNews,
  getAllBreakingNews,
  getBreakingNewsById,
  updateBreakingNews,
  deleteBreakingNews,
  likeBreakingNews,
  commentOnBreakingNews,
  getBreakingNewsByCategory,
  getBreakingNewsBySearchQuery,
  getBreakingNewsByUser
} from '../controllers/newsController.js';
import BreakingNews from '../models/BreakingNews.js';

const BreakingNewsRoutes = express.Router();

// Route to create a new BreakingNews
router.post('/', createBreakingNews);

// Route to get all BreakingNews
router.get('/', getAllBreakingNews);

// Route to get a BreakingNews by ID
router.get('/:id', getBreakingNewsById);

// Route to update a BreakingNews
router.put('/:id', updateBreakingNews);

// Route to delete a BreakingNews
router.delete('/:id', deleteBreakingNews);

// Route to like a BreakingNews
router.post('/:id/like', likeBreakingNews);

// Route to comment on a BreakingNews
router.post('/:id/comment', commentOnBreakingNews);

// Route to get BreakingNews by category
router.get('/category/:category', getBreakingNewsByCategory);

// Route to get BreakingNews by search query
router.get('/search/:query', getBreakingNewsBySearchQuery);

// Route to get BreakingNews by user
router.get('/user/:id', getBreakingNewsByUser);

export default BreakingNewsRoutes;