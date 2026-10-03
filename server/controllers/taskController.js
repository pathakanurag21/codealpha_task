const Task = require('../models/Task');
const Project = require('../models/Project');
const Notification = require('../models/Notification');

// @desc    Create a new task card
// @route   POST /api/tasks
// @access  Private
const createTask = async (req, res) => {
  try {
    const { title, description, projectId, status, priority, assignees, dueDate } = req.body;

    if (!title || !projectId) {
      return res.status(400).json({ message: 'Task title and project ID are required' });
    }

    // Verify user belongs to the project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Count existing tasks in column to calculate 'order' sequence
    const count = await Task.countDocuments({ project: projectId, status: status || 'todo' });

    const task = await Task.create({
      title,
      description: description || '',
      project: projectId,
      status: status || 'todo',
      priority: priority || 'medium',
      assignees: assignees || [],
      dueDate: dueDate || null,
      order: count,
    });

    const populatedTask = await Task.findById(task._id).populate('assignees', 'name email avatar');

    // Broadcast new task to project room via Socket.io
    req.io.to(`project_${projectId}`).emit('task_created', populatedTask);

    // Send notifications to assignees if assigned
    if (assignees && assignees.length > 0) {
      for (const recipientId of assignees) {
        if (recipientId.toString() !== req.user._id.toString()) {
          const notif = await Notification.create({
            recipient: recipientId,
            sender: req.user._id,
            type: 'TASK_ASSIGNED',
            project: projectId,
            task: task._id,
          });

          req.io.to(`user_${recipientId}`).emit('new_notification', notif);
        }
      }
    }

    res.status(201).json(populatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all tasks for a specific project
// @route   GET /api/tasks/project/:projectId
// @access  Private
const getTasksByProject = async (req, res) => {
  try {
    const { projectId } = req.params;

    const tasks = await Task.find({ project: projectId })
      .populate('assignees', 'name email avatar')
      .sort({ order: 1 });

    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update task details (Status, Priority, Column Order, Assignees)
// @route   PATCH /api/tasks/:id
// @access  Private
const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const updatedTask = await Task.findByIdAndUpdate(id, updates, { new: true })
      .populate('assignees', 'name email avatar');

    // Emit live task update to everyone viewing the board
    req.io.to(`project_${task.project}`).emit('task_updated', updatedTask);

    res.status(200).json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete task card
// @route   DELETE /api/tasks/:id
// @access  Private
const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    await Task.findByIdAndDelete(id);

    // Broadcast deletion to room
    req.io.to(`project_${task.project}`).emit('task_deleted', id);

    res.status(200).json({ message: 'Task deleted successfully', id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createTask,
  getTasksByProject,
  updateTask,
  deleteTask,
};