import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import API from '../api/axiosInstance';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import TaskModal from '../components/task/TaskModal'; // 1. Imported TaskModal

const COLUMNS = [
  { id: 'todo', title: 'To Do', color: 'bg-gray-100 border-gray-300' },
  { id: 'in_progress', title: 'In Progress', color: 'bg-blue-50 border-blue-200' },
  { id: 'review', title: 'Review', color: 'bg-yellow-50 border-yellow-200' },
  { id: 'done', title: 'Done', color: 'bg-green-50 border-green-200' },
];

export default function ProjectBoard() {
  const { id: projectId } = useParams();
  const socket = useSocket();
  const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null); // 2. Added state for selected task modal

  // Task Form State
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState('medium');
  const [taskStatus, setTaskStatus] = useState('todo');

  // Member Invite Form State
  const [memberEmail, setMemberEmail] = useState('');
  const [inviteError, setInviteError] = useState('');

  // Fetch Initial Board Data
  useEffect(() => {
    fetchBoardData();
  }, [projectId]);

  // Real-Time Socket Listeners
  useEffect(() => {
    if (!socket || !projectId) return;

    socket.emit('join_project', projectId);

    socket.on('task_created', (newTask) => {
      setTasks((prev) => [...prev, newTask]);
    });

    socket.on('task_updated', (updatedTask) => {
      setTasks((prev) =>
        prev.map((t) => (t._id === updatedTask._id ? updatedTask : t))
      );
    });

    socket.on('task_deleted', (deletedId) => {
      setTasks((prev) => prev.filter((t) => t._id !== deletedId));
    });

    return () => {
      socket.emit('leave_project', projectId);
      socket.off('task_created');
      socket.off('task_updated');
      socket.off('task_deleted');
    };
  }, [socket, projectId]);

  const fetchBoardData = async () => {
    try {
      const [projRes, tasksRes] = await Promise.all([
        API.get(`/projects/${projectId}`),
        API.get(`/tasks/project/${projectId}`),
      ]);
      setProject(projRes.data);
      setTasks(tasksRes.data);
    } catch (err) {
      console.error('Error loading board:', err);
    } finally {
      setLoading(false);
    }
  };

  // Drag and Drop Handler
  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) return;

    const targetStatus = destination.droppableId;

    // Optimistic UI Update
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task._id === draggableId ? { ...task, status: targetStatus } : task
      )
    );

    // Persist status change to backend
    try {
      await API.patch(`/tasks/${draggableId}`, {
        status: targetStatus,
        order: destination.index,
      });
    } catch (err) {
      console.error('Failed to save task move:', err);
      fetchBoardData(); // Rollback on failure
    }
  };

  // Create Task Handler
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    try {
      const { data } = await API.post('/tasks', {
        title: taskTitle,
        description: taskDesc,
        priority: taskPriority,
        status: taskStatus,
        projectId,
      });

      setTasks((prev) => [...prev, data]);
      setTaskTitle('');
      setTaskDesc('');
      setShowTaskModal(false);
    } catch (err) {
      console.error('Error creating task:', err);
    }
  };

  // Invite Member Handler
  const handleInviteMember = async (e) => {
    e.preventDefault();
    setInviteError('');

    try {
      const { data } = await API.post(`/projects/${projectId}/members`, {
        email: memberEmail,
      });

      setProject(data);
      setMemberEmail('');
      setShowMemberModal(false);
    } catch (err) {
      setInviteError(err.response?.data?.message || 'Failed to add member');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-6 min-h-[calc(100vh-65px)] flex flex-col">
      {/* Board Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-3">
            <Link to="/" className="text-sm font-medium text-indigo-600 hover:underline">
              ← Back
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">{project?.title}</h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">{project?.description}</p>
        </div>

        {/* Member Avatars & Action Buttons */}
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2 mr-2">
            {project?.members?.map((m) => (
              <div
                key={m.user._id}
                title={`${m.user.name} (${m.user.email})`}
                className="w-8 h-8 rounded-full bg-indigo-600 border-2 border-white text-white font-medium flex items-center justify-center text-xs"
              >
                {m.user.name.charAt(0).toUpperCase()}
              </div>
            ))}
          </div>

          <button
            onClick={() => setShowMemberModal(true)}
            className="px-3 py-1.5 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
          >
            + Invite Member
          </button>

          <button
            onClick={() => setShowTaskModal(true)}
            className="px-4 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition"
          >
            + New Task
          </button>
        </div>
      </div>

      {/* Drag and Drop Kanban Board Columns */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 flex-1 items-start">
          {COLUMNS.map((col) => {
            const columnTasks = tasks.filter((t) => t.status === col.id);

            return (
              <div
                key={col.id}
                className={`rounded-xl border p-4 ${col.color} min-h-[500px] flex flex-col`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider">
                    {col.title}
                  </h3>
                  <span className="text-xs font-bold bg-white text-gray-600 px-2 py-0.5 rounded-full border">
                    {columnTasks.length}
                  </span>
                </div>

                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 transition-colors rounded-lg p-1 ${
                        snapshot.isDraggingOver ? 'bg-indigo-50/50' : ''
                      }`}
                    >
                      {columnTasks.map((task, index) => (
                        <Draggable key={task._id} draggableId={task._id} index={index}>
                          {(provided, snapshot) => (
                            /* 3. Added onClick and cursor-pointer to open task details modal on card click */
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={() => setSelectedTask(task)}
                              className={`bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-3 hover:border-indigo-300 transition cursor-pointer ${
                                snapshot.isDragging ? 'shadow-lg rotate-1' : ''
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span
                                  className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                                    task.priority === 'high'
                                      ? 'bg-red-100 text-red-700'
                                      : task.priority === 'medium'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-green-100 text-green-700'
                                  }`}
                                >
                                  {task.priority}
                                </span>
                              </div>

                              <h4 className="font-semibold text-gray-900 text-sm mb-1">
                                {task.title}
                              </h4>
                              {task.description && (
                                <p className="text-xs text-gray-500 line-clamp-2 mb-3">
                                  {task.description}
                                </p>
                              )}

                              <div className="flex items-center justify-between pt-2 border-t border-gray-50 text-xs text-gray-400">
                                <span>{new Date(task.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {/* Modal: Create Task */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Create New Task Card</h2>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Task title..."
                  className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  rows={3}
                  placeholder="Card details..."
                  className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={taskStatus}
                    onChange={(e) => setTaskStatus(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg outline-none"
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="done">Done</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
                >
                  Create Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Invite Member */}
      {showMemberModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Invite Collaborator</h2>
            <p className="text-xs text-gray-500 mb-4">Enter a registered user's email to add them to this board.</p>

            {inviteError && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 text-xs rounded-lg border border-red-200">
                {inviteError}
              </div>
            )}

            <form onSubmit={handleInviteMember} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">User Email</label>
                <input
                  type="email"
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                  placeholder="teammate@example.com"
                  className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMemberModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
                >
                  Add to Board
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Render Task Detail & Comments Modal */}
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
}