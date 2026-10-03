import { useState, useEffect } from 'react';
import API from '../../api/axiosInstance';
import { useSocket } from '../../context/SocketContext';

export default function NotificationDropdown() {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const socket = useSocket();

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('new_notification', (newNotif) => {
      setNotifications((prev) => [newNotif, ...prev]);
    });

    return () => socket.off('new_notification');
  }, [socket]);

  const fetchNotifications = async () => {
    try {
      const { data } = await API.get('/notifications');
      setNotifications(data);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  const markAsRead = async (id) => {
    try {
      await API.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-gray-600 hover:text-indigo-600 rounded-full hover:bg-gray-100 transition focus:outline-none"
        title="Notifications"
      >
        <span className="text-lg">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 z-50 p-3 max-h-80 overflow-y-auto">
          <div className="flex items-center justify-between border-b pb-2 mb-2">
            <h4 className="font-bold text-sm text-gray-800">Notifications</h4>
            <span className="text-xs text-indigo-600 font-semibold">{unreadCount} unread</span>
          </div>
          {notifications.length === 0 ? (
            <p className="text-xs text-gray-400 py-4 text-center">No notifications yet</p>
          ) : (
            notifications.map((n) => (
              <div
                key={n._id}
                onClick={() => markAsRead(n._id)}
                className={`p-2.5 rounded-lg text-xs mb-1 cursor-pointer transition ${
                  n.read ? 'bg-gray-50 text-gray-500' : 'bg-indigo-50/80 text-indigo-900 font-medium border-l-2 border-indigo-600'
                }`}
              >
                <p>
                  <strong className="font-semibold">{n.sender?.name || 'Someone'}</strong>{' '}
                  {n.type === 'TASK_ASSIGNED'
                    ? 'assigned you a task card'
                    : n.type === 'COMMENT_ADDED'
                    ? 'commented on a task'
                    : 'invited you to a project'}
                </p>
                <span className="text-[10px] text-gray-400 mt-1 block">
                  {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}