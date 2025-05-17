import express from 'express';
import {
    createPreference,
    updatePreference,
    getPreferenceByUser,
    getPreferenceById,
    deletePreference,
    getAllPreferences,
    getPreferenceByWeek,
    getPreferenceByShift,
    getPreferenceByOffDay,
    getPreferenceByWeekAndShift,
    getPreferenceByWeekAndOffDay,
    getPreferenceByShiftAndOffDay
  } from '../controllers/PreferenceController.js';
import authMiddleware from '../middleware/authMiddleware.js'; // Import auth middleware
import { isAdmin } from '../controllers/usersController.js'; // Import isAdmin

const router = express.Router();

router.post('/create', authMiddleware, createPreference); // Protected: User creates their own preference
router.put('/update/:id', authMiddleware, updatePreference); // Protected: User updates their own preference (auth in controller)
router.get('/me', authMiddleware, getPreferenceByUser); // User gets their own preference (controller uses req.user.id)
// router.get('/user/:userId', authMiddleware, isAdmin, getPreferenceByUser); // Example for admin fetching specific user's preference
router.get('/id/:id', authMiddleware, getPreferenceById); // Protected (auth in controller)
router.delete('/delete/:id', authMiddleware, deletePreference); // Protected (auth in controller)
router.get('/all', authMiddleware, isAdmin, getAllPreferences); // Admin only
router.get('/week/:week', authMiddleware, isAdmin, getPreferenceByWeek); // Assuming admin only for broad filters
router.get('/shift/:shift', authMiddleware, isAdmin, getPreferenceByShift); // Assuming admin only
router.get('/offday/:offDay', authMiddleware, isAdmin, getPreferenceByOffDay); // Assuming admin only
router.get('/week/:week/shift/:shift', authMiddleware, isAdmin, getPreferenceByWeekAndShift); // Assuming admin only
router.get('/week/:week/offday/:offDay', authMiddleware, isAdmin, getPreferenceByWeekAndOffDay); // Assuming admin only
router.get('/shift/:shift/offday/:offDay', authMiddleware, isAdmin, getPreferenceByShiftAndOffDay); // Assuming admin only

export default router;

