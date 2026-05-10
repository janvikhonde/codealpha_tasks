// 📁 client/src/pages/BoardPage.jsx
import { useEffect, useState } from 'react';
import useBoardStore from '../store/boardStore';
import useAuthStore from '../store/authStore';
import useNotifStore from '../store/notifStore';
import useSocket from '../hooks/useSocket';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import KanbanBoard from '../components/board/KanbanBoard';
import TaskDetail from '../components/task/TaskDetail';
import BurndownChart from '../components/charts/BurndownChart';
import AIBreakdown from '../components/ai/AIBreakdown';
import MembersPanel from '../components/mood/MembersPanel';
import GuestLinksPanel from '../components/layout/GuestLinksPanel';

export default function BoardPage() {
  const { token } = useAuthStore();
  const { fetchProjects, activeProject, selectedTask, loading } = useBoardStore();
  const { fetchNotifications } = useNotifStore();
  const [activeTab, setActiveTab] = useState('Board');

  useSocket(token, activeProject?._id);

  useEffect(() => {
    fetchProjects();
    fetchNotifications();
  }, []);

  useEffect(() => {
    setActiveTab('Board');
  }, [activeProject?._id]);

  if (!activeProject) {
    return (
      <div className="flex h-screen overflow-hidden bg-dark-900">
        <Sidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <Topbar activeTab={activeTab} setActiveTab={setActiveTab} />
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
            <div className="text-6xl">📋</div>
            <h2 className="text-xl font-semibold text-white">No project selected</h2>
            <p className="text-gray-500 text-sm max-w-xs">
              Create a new project from the sidebar or select an existing one to get started.
            </p>
            <p className="text-xs text-gray-600">
              Click the <span className="text-brand font-medium">+</span> next to Projects in the sidebar
            </p>
          </div>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-600 text-sm animate-pulse">Loading tasks...</div>
        </div>
      );
    }
    switch (activeTab) {
      case 'Burndown':     return <BurndownChart />;
      case 'AI Breakdown': return <AIBreakdown />;
      case 'Members':      return <MembersPanel />;
      case 'Guest Links':  return <GuestLinksPanel />;
      case 'Notifications':  return <NotificationsTab />;
      default:
        return (
          <div className="flex flex-1 min-h-0 overflow-hidden">
            <div className="flex-1 min-w-0 overflow-auto"><KanbanBoard /></div>
            {selectedTask && <div className="flex-shrink-0"><TaskDetail /></div>}
          </div>
        );
    }
  };

  function NotificationsTab() {
  const { notifications, unreadCount, markRead, markAllRead, deleteNotif, clearAll } = useNotifStore();

  const timeAgo = (date) => {
    const diff = Math.floor((Date.now() - new Date(date)) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="p-6 max-w-lg">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-white">🔔 Notifications</h2>
          {unreadCount > 0 && (
            <span className="bg-brand text-white text-xs px-2 py-0.5 rounded-full">{unreadCount}</span>
          )}
        </div>
        <div className="flex gap-3">
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-xs text-brand hover:text-white">Mark all read</button>
          )}
          {notifications.length > 0 && (
            <button onClick={clearAll} className="text-xs text-gray-600 hover:text-gray-300">Clear all</button>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-12 text-gray-600">
          <div className="text-4xl mb-3">🔔</div>
          <p className="text-sm">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n._id}
              onClick={() => !n.read && markRead(n._id)}
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                n.read ? 'border-dark-500 bg-transparent' : 'border-brand/30 bg-brand/5'
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${n.read ? 'text-gray-500' : 'text-gray-200'}`}>{n.message}</p>
                <p className="text-xs text-gray-600 mt-1">{timeAgo(n.createdAt)}</p>
              </div>
              {!n.read && <div className="w-2 h-2 rounded-full bg-brand mt-1.5 flex-shrink-0" />}
              <button
                onClick={(e) => { e.stopPropagation(); deleteNotif(n._id); }}
                className="text-gray-600 hover:text-gray-300 text-xs flex-shrink-0"
              >✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

  return (
    <div className="flex h-screen overflow-hidden bg-dark-900">
      <Sidebar onTabChange={setActiveTab}/>
      <div className="flex flex-col flex-1 min-w-0">
        <Topbar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}