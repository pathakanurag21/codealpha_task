const express = require('express');
const router = express.Router();
const { addComment, getCommentsByTask } = require('../controllers/commentController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/', addComment);
router.get('/task/:taskId', getCommentsByTask);

module.exports = router;