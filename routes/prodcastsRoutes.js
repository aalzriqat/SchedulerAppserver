import express from 'express';
import {
  createProdcast,
  getAllProdcasts,
  getProdcastById,
  updateProdcast,
  deleteProdcast,
  likeProdcast,
  commentOnProdcast,
  getProdcastsByCategory,
  getProdcastsBySearchQuery,
  getProdcastsByUser
} from '../controllers/prodcastsController.js';

const router = express.Router();

// Route to create a new prodcast
router.post('/', createProdcast);

// Route to get all prodcasts
router.get('/', getAllProdcasts);

// Route to get a prodcast by ID
router.get('/:id', getProdcastById);

// Route to update a prodcast
router.put('/:id', updateProdcast);

// Route to delete a prodcast
router.delete('/:id', deleteProdcast);

// Route to like a prodcast
router.post('/:id/like', likeProdcast);

// Route to comment on a prodcast
router.post('/:id/comment', commentOnProdcast);

// Route to get prodcasts by category
router.get('/category/:category', getProdcastsByCategory);

// Route to get prodcasts by search query
router.get('/search/:query', getProdcastsBySearchQuery);

// Route to get prodcasts by user
router.get('/user/:id', getProdcastsByUser);

export default router;