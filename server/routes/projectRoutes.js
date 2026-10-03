const express = require('express');
const router = express.Router();
const {
  createProject,
  getProjects,
  getProjectById,
  addMemberToProject,
} = require('../controllers/projectController');
const { protect } = require('../middleware/authMiddleware');

// All project routes require authentication
router.use(protect);

router.route('/')
  .post(createProject)
  .get(getProjects);

router.route('/:id')
  .get(getProjectById);

router.route('/:id/members')
  .post(addMemberToProject);

module.exports = router;