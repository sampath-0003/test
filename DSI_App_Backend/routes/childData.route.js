import express from 'express';
import { 
    getAllChildData, 
    getChildDataByRole, 
    updateChildDataScore,
    updateAllScores
} from '../controllers/childData.controller.js';

const router = express.Router();

// ✅ GET /api/child-data/get-all-child-data
router.get('/get-all-child-data', getAllChildData);

// ✅ GET /api/child-data/get-by-role?role=Professional&phone=9876543210
router.get('/get-by-role', getChildDataByRole);

// ✅ PATCH /api/child-data/update-score/:reportId
router.patch('/update-score/:reportId', updateChildDataScore);

// ✅ PATCH /api/child-data/update-all-scores/:reportId
router.patch('/update-all-scores/:reportId', updateAllScores);

export default router;