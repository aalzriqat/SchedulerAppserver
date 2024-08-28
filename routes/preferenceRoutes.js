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
const router = express.Router();

router.post('/create', createPreference);
router.put('/update/:id', updatePreference);
router.get('/user/:user', getPreferenceByUser);
router.get('/id/:id', getPreferenceById);
router.delete('/delete/:id', deletePreference);
router.get('/all', getAllPreferences);
router.get('/week/:week', getPreferenceByWeek);
router.get('/shift/:shift', getPreferenceByShift);
router.get('/offday/:offDay', getPreferenceByOffDay);
router.get('/week/:week/shift/:shift', getPreferenceByWeekAndShift);
router.get('/week/:week/offday/:offDay', getPreferenceByWeekAndOffDay);
router.get('/shift/:shift/offday/:offDay', getPreferenceByShiftAndOffDay);

export default router;

