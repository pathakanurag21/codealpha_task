const Project = require('../models/Project');
const User = require('../models/User');

// @desc    Create a new project board
// @route   POST /api/projects
// @access  Private
const createProject = async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Project title is required' });
    }

    // Create project with logged in user as owner and admin member
    const project = await Project.create({
      title,
      description: description || '',
      owner: req.user._id,
      members: [
        {
          user: req.user._id,
          role: 'admin',
        },
      ],
    });

    const populatedProject = await Project.findById(project._id)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar');

    res.status(201).json(populatedProject);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all projects user belongs to (as owner or member)
// @route   GET /api/projects
// @access  Private
const getProjects = async (req, res) => {
  try {
    const projects = await Project.find({
      'members.user': req.user._id,
    })
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar')
      .sort({ updatedAt: -1 });

    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single project by ID
// @route   GET /api/projects/:id
// @access  Private
const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is a member of this project
    const isMember = project.members.some(
      (m) => m.user._id.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: 'Not authorized to access this project' });
    }

    res.status(200).json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add collaborator/member to project by email
// @route   POST /api/projects/:id/members
// @access  Private
const addMemberToProject = async (req, res) => {
  try {
    const { email, role } = req.body;
    const { id: projectId } = req.params;

    if (!email) {
      return res.status(400).json({ message: 'User email is required' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Ensure requesting user is a member/admin of the project
    const requester = project.members.find(
      (m) => m.user.toString() === req.user._id.toString()
    );

    if (!requester) {
      return res.status(403).json({ message: 'Not authorized to manage this project' });
    }

    // Find user to add by email
    const userToAdd = await User.findOne({ email });
    if (!userToAdd) {
      return res.status(404).json({ message: 'User with this email not found' });
    }

    // Check if user is already in project
    const alreadyMember = project.members.some(
      (m) => m.user.toString() === userToAdd._id.toString()
    );

    if (alreadyMember) {
      return res.status(400).json({ message: 'User is already a member of this project' });
    }

    project.members.push({
      user: userToAdd._id,
      role: role || 'member',
    });

    await project.save();

    const updatedProject = await Project.findById(projectId)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar');

    // Notify user in real time via Socket.io
    req.io.to(`user_${userToAdd._id}`).emit('new_notification', {
      type: 'PROJECT_INVITE',
      project: project.title,
      sender: req.user.name,
    });

    res.status(200).json(updatedProject);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  addMemberToProject,
};