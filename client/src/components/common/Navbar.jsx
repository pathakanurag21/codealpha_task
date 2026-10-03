import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import NotificationDropdown from '../notifications/NotificationDropdown';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm sticky top-0 z-40">
      <Link to="/" className="text-xl font-bold text-indigo-600 flex items-center gap-2">
        <span>⚡</span> ProjectFlow
      </Link>

      {user && (
        <div className="flex items-center gap-4">
          {/* Live Socket Notifications Bell */}
          <NotificationDropdown />

          <div className="h-5 w-[1px] bg-gray-200"></div>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-semibold flex items-center justify-center text-sm shadow-sm">
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <span className="text-sm font-medium text-gray-700">{user.name}</span>
          </div>

          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-red-600 font-medium px-3 py-1.5 rounded-md hover:bg-gray-100 transition"
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}