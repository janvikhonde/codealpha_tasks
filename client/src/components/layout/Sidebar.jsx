import { Link, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import useBoardStore from '../../store/boardStore';
import useNotifStore from '../../store/notifStore';
import { useState } from 'react';

export default function Sidebar({ onTabChange = () => {} }) {  // ✅ FIX: default to no-op so it never crashes
  const { user, logout } = useAuthStore();
  const { projects, activeProject, setActiveProject, createProject } = useBoardStore();
  const { unreadCount } = useNotifStore();
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const location = useLocation();

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    const p = await createProject({ name: newProjectName.trim() });
    setActiveProject(p);
    setNewProjectName('');
    setShowNewProject(false);
  };

  const PROJECT_COLORS = ['#6c63ff', '#4cbf9a', '#e05a5a', '#e0a040', '#4c9fea'];

  return (
    <aside className="w-52 bg-dark-800 border-r border-dark-500 flex flex-col h-full flex-shrink-0">
      {/* Logo */}
      <div className="p-4 border-b border-dark-500 flex items-center gap-2">
        <div className="w-7 h-7 bg-brand rounded-lg flex items-center justify-center text-white font-bold text-sm">N</div>
        <span className="font-semibold text-white text-sm">Nexus PM</span>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {/* Workspace */}
        <div className="px-3 pt-3 pb-1 text-[10px] text-gray-600 uppercase tracking-widest font-medium">Workspace</div>
        <NavItem to="/" label="Board" dot="#6c63ff" active={location.pathname === '/'} />
        <NavItem to="/mood" label="Mood Report" dot="#e05a5a" />

        {/* Projects */}
        <div className="px-3 pt-4 pb-1 text-[10px] text-gray-600 uppercase tracking-widest font-medium flex items-center justify-between">
          <span>Projects</span>
          <button onClick={() => setShowNewProject(true)} className="text-gray-500 hover:text-brand text-lg leading-none">+</button>
        </div>

        {projects.map((p, i) => (
          <button
            key={p._id}
            onClick={() => setActiveProject(p)}
            className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left transition-colors border-l-2 ${
              activeProject?._id === p._id
                ? 'text-white bg-dark-700 border-brand'
                : 'text-gray-400 hover:text-gray-200 hover:bg-dark-700 border-transparent'
            }`}
          >
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: PROJECT_COLORS[i % PROJECT_COLORS.length] }} />
            <span className="truncate">{p.name}</span>
          </button>
        ))}

        {showNewProject && (
          <form onSubmit={handleCreateProject} className="px-3 py-2">
            <input
              autoFocus
              className="input text-xs py-1.5"
              placeholder="Project name..."
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onBlur={() => { if (!newProjectName.trim()) setShowNewProject(false); }}
            />
          </form>
        )}

        {/* Tools */}
        <div className="px-3 pt-4 pb-1 text-[10px] text-gray-600 uppercase tracking-widest font-medium">Tools</div>
        <NavItem to="/" label="Recurring Tasks" dot="#4cbf9a" />

        <button
          onClick={() => onTabChange('Guest Links')}
          className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left text-gray-400 hover:text-gray-200 hover:bg-dark-700 border-l-2 border-transparent transition-colors"
        >
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#e0a040' }} />
          <span>Guest Links</span>
        </button>

        <button
          onClick={() => onTabChange('Notifications')}
          className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left text-gray-400 hover:text-gray-200 hover:bg-dark-700 border-l-2 border-transparent transition-colors"
        >
          <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
          <span>Notifications</span>
          {unreadCount > 0 && (
            <span className="ml-auto bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{unreadCount}</span>
          )}
        </button>
      </div>

      {/* User */}
      <div className="p-3 border-t border-dark-500 flex items-center gap-2">
        <Link to="/profile" className="flex-shrink-0">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold hover:opacity-80 transition-opacity"
            style={{ background: user?.color || '#6c63ff', color: '#fff' }}
          >
            {user?.initials}
          </div>
        </Link>
        <Link to="/profile" className="flex-1 min-w-0">
          <span className="text-xs text-gray-400 truncate block hover:text-gray-200 transition-colors">
            {user?.name}
          </span>
        </Link>
        <button onClick={logout} className="text-xs text-gray-600 hover:text-gray-300" title="Logout">↪</button>
      </div>
    </aside>
  );
}

function NavItem({ to, label, dot, active }) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-2 px-3 py-1.5 text-sm transition-colors border-l-2 ${
        active ? 'text-white bg-dark-700 border-brand' : 'text-gray-400 hover:text-gray-200 hover:bg-dark-700 border-transparent'
      }`}
    >
      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: dot }} />
      {label}
    </Link>
  );
}