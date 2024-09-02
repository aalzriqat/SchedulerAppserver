// reportIssuesRoutes.js
import express from 'express';
import { reportIssues, getReportIssues, deleteReportIssues, updateReportIssues } from '../controllers/reportIssuesController.js';

const router = express.Router();

// Route to create a new report issue
router.post('/', reportIssues);

// Route to get all report issues
router.get('/', getReportIssues);

// Route to delete a report issue by id
router.delete('/:id', deleteReportIssues);

// Route to update a report issue by id
router.patch('/:id', updateReportIssues);

export default router;