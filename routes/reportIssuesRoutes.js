// reportIssuesRoutes.js
import express from 'express';
import {
    reportIssues,
    getReportIssues,
    deleteReportIssues,
    updateReportIssues,
    updateIssueStatus, // Import new controller
    getMyReportedIssues // Import new controller
} from '../controllers/reportIssuesController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { isAdmin } from '../controllers/usersController.js';

const router = express.Router();

// Route to create a new report issue - Authenticated users
router.post('/', authMiddleware, reportIssues);

// Route to get all report issues - Admin only
router.get('/all', authMiddleware, isAdmin, getReportIssues); // Changed path to /all for clarity

// Route for authenticated user to get their own reported issues
router.get('/me', authMiddleware, getMyReportedIssues);

// Route to update issue status by id - Admin only
router.put('/:id/status', authMiddleware, isAdmin, updateIssueStatus);

// Route to update a report issue by id (general fields) - Admin only
router.patch('/:id', authMiddleware, isAdmin, updateReportIssues);

// Route to delete a report issue by id - Admin only
router.delete('/:id', authMiddleware, isAdmin, deleteReportIssues);

export default router;