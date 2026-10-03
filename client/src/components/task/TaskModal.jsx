import { useState, useEffect } from 'react';
import API from '../../api/axiosInstance';
import { useSocket } from '../../context/SocketContext';

export default function TaskModal({ task, onClose }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const socket = useSocket();

  useEffect(() => {
    if (task) fetchComments();
  }, [task]);

  useEffect(() => {
    if (!socket || !task) return;

    socket.on('comment_added', ({ taskId, comment }) => {
      if (taskId === task._id) {
        setComments((prev) => [...prev, comment]);
      }
    });

    return () => socket.off('comment_added');
  }, [socket, task]);

  const fetchComments = async () => {
    try {
      const { data } = await API.get(`/comments/task/${task._id}`);
      setComments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const { data } = await API.post('/comments', {
        taskId: task._id,
        content: newComment,
      });
      setComments((prev) => [...prev, data]);
      setNewComment('');
    } catch (err) {
      console.error(err);
    }
  };

  if (!task) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-gray-100 max-h-[85vh] flex flex-col">
        <div className="flex items-start justify-between border-b pb-3 mb-4">
          <div>
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded">
              {task.status.replace('_', ' ')}
            </span>
            <h2 className="text-xl font-bold text-gray-900 mt-1">{task.title}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 font-bold text-lg">✕</button>
        </div>

        <div className="mb-4">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Description</h4>
          <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{task.description || 'No description provided.'}</p>
        </div>

        {/* Discussion Thread */}
        <div className="flex-1 overflow-y-auto mb-4 border-t pt-3">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Comments & Discussion</h4>
          {loading ? (
            <p className="text-xs text-gray-400">Loading comments...</p>
          ) : comments.length === 0 ? (
            <p className="text-xs text-gray-400 italic">No comments yet. Start the discussion below.</p>
          ) : (
            <div className="space-y-3">
              {comments.map((c) => (
                <div key={c._id} className="bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-xs text-gray-800">{c.author?.name || 'User'}</span>
                    <span className="text-[10px] text-gray-400">{new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-xs text-gray-600">{c.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Comment Input */}
        <form onSubmit={handlePostComment} className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="flex-1 px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button type="submit" className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition">
            Post
          </button>
        </form>
      </div>
    </div>
  );
}