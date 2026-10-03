const Comment = require('../models/Comment');
const Task = require('../models/Task');
const Notification = require('../models/Notification');

// @desc    Add comment to task card
// @route   POST /api/comments
// @access  Private
const addComment = async (req, res) => {
  try {
    const { taskId, content } = req.body;

    if (!taskId || !content) {
      return res.status(400).json({ message: 'Task ID and comment content are required' });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const comment = await Comment.create({
      task: taskId,
      author: req.user._id,
      content,
    });

    const populatedComment = await Comment.findById(comment._id)
      .populate('author', 'name email avatar');

    // Emit comment live to board members
    req.io.to(`project_${task.project}`).emit('comment_added', {
      taskId,
      comment: populatedComment,
    });

    // Notify task assignees about the comment
    if (task.assignees && task.assignees.length > 0) {
      for (const assigneeId of task.assignees) {
        if (assigneeId.toString() !== req.user._id.toString()) {
          const notif = await Notification.create({
            recipient: assigneeId,
            sender: req.user._id,
            type: 'COMMENT_ADDED',
            project: task.project,
            task: task._id,
          });

          req.io.to(`user_${assigneeId}`).emit('new_notification', notif);
        }
      }
    }

    res.status(201).json(populatedComment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all comments for a task card
// @route   GET /api/comments/task/:taskId
// @access  Private
const getCommentsByTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    const comments = await Comment.find({ task: taskId })
      .populate('author', 'name email avatar')
      .sort({ createdAt: 1 });

    res.status(200).json(comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  addComment,
  getCommentsByTask,
};