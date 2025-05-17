import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { 
    getNotificationsForUser, 
    markNotificationsAsRead,
    deleteNotification,
    deleteAllNotificationsForUser
} from '../controllers/notificationController.js';

const router = express.Router();

// Get all notifications for the authenticated user
router.get('/me', authMiddleware, getNotificationsForUser);

// Mark specific notifications as read
router.patch('/read', authMiddleware, markNotificationsAsRead); 
// Expects { notificationIds: ["id1", "id2"] } in body

// Delete a specific notification
router.delete('/:notificationId', authMiddleware, deleteNotification);

// Delete all notifications for the authenticated user
router.delete('/all/me', authMiddleware, deleteAllNotificationsForUser);


export default router;