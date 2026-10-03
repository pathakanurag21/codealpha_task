import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  // Fetch projects on component mount
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data } = await API.get('/projects');
      setProjects(data);
    } catch (err) {
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setCreating(true);
    setError('');

    try {
      const { data } = await API.post('/projects', { title, description });
      setProjects([data, ...projects]);
      setTitle('');
      setDescription('');
      setShowModal(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header Bar */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Your Projects</h1>
          <p className="text-sm text-gray-500">Manage and collaborate on your team boards</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg shadow-sm transition flex items-center gap-2"
        >
          <span>+</span> Create Project
        </button>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-500 mb-4">No projects found. Create your first project board to get started!</p>
          <button
            onClick={() => setShowModal(true)}
            className="text-indigo-600 font-semibold hover:underline"
          >
            + Create New Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Link
              key={project._id}
              to={`/project/${project._id}`}
              className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition hover:border-indigo-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-lg text-gray-900 group-hover:text-indigo-600">
                    {project.title}
                  </h3>
                  {project.owner._id === user?._id && (
                    <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full border border-indigo-100">
                      Owner
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                  {project.description || 'No description provided.'}
                </p>
              </div>

              {/* Footer / Members Info */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                <div className="flex -space-x-2">
                  {project.members?.slice(0, 4).map((m) => (
                    <div
                      key={m.user._id}
                      title={m.user.name}
                      className="w-7 h-7 rounded-full bg-indigo-500 border-2 border-white text-white font-medium flex items-center justify-center text-[10px]"
                    >
                      {m.user.name.charAt(0).toUpperCase()}
                    </div>
                  ))}
                  {project.members?.length > 4 && (
                    <div className="w-7 h-7 rounded-full bg-gray-200 border-2 border-white text-gray-600 font-medium flex items-center justify-center text-[10px]">
                      +{project.members.length - 4}
                    </div>
                  )}
                </div>
                <span>{project.members?.length} {project.members?.length === 1 ? 'member' : 'members'}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Modal: Create New Project */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Create New Project</h2>
            <p className="text-sm text-gray-500 mb-4">Set up a new board for your team or personal work.</p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Website Redesign"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short summary of goals..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create Board'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}