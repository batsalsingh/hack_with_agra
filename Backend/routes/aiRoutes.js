// /routes/aiRoutes.js
const express = require('express');
const router = express.Router();
const { suggestItinerary } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

router.post('/suggest-itinerary', protect, suggestItinerary);
module.exports = router;