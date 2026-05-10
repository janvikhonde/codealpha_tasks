import { useState } from 'react';
import useBoardStore from '../../store/boardStore';
import useNotifStore from '../../store/notifStore';
import NotificationPanel from '../NotificationPanel';
import api from '../../services/api';

const MOODS = [
  { emoji: '😊', label: 'Happy' },
  { emoji: '😐', label: 'Neutral' },
  { emoji: '😤', label: 'Stressed' },
  { emoji: '🔥', label: 'Crushing it' },
  { emoji: '😴', label: 'Tired' },
];

const TABS = ['Board', 'AI Breakdown', 'Burndown', 'Members', 'Guest Links'];

export default function Topbar({ activeTab, setActiveTab }) {
  const { activeProject } = useBoardStore();
  const { unreadCount } = useNotifStore();
  const [todayMood, setTodayMood] = useState(null);
  const [showNotifs, setShowNotifs] = useState(false);

  const logMood = async (mood) => {
    if (!activeProject) return;
    try {
      await api.post('/mood', {
        emoji: mood.emoji,
        label: mood.label,
        project: activeProject._id,
      });
      setTodayMood(mood.emoji);
    } catch {}
  };

  return (
    <header className="h-12 bg-dark-800 border-b border-dark-500 flex items-center px-4 gap-2 flex-shrink-0">
      {TABS.map((t) => (
        <button
          key={t}
          onClick={() => setActiveTab(t)}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            activeTab === t
              ? 'bg-dark-700 text-white border border-dark-400'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          {t}
        </button>
      ))}

      <div className="ml-auto flex items-center gap-3">
        {/* Mood row */}
        <div className="flex items-center gap-1 text-base">
          {MOODS.map((m) => (
            <button
              key={m.emoji}
              title={m.label}
              onClick={() => logMood(m)}
              className={`transition-opacity hover:opacity-100 ${
                todayMood === m.emoji ? 'opacity-100 scale-110' : 'opacity-40'
              }`}
            >
              {m.emoji}
            </button>
          ))}
        </div>

        {/* Notification bell */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="text-gray-400 hover:text-white text-sm relative"
          >
            🔔
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
          {showNotifs && (
            <NotificationPanel onClose={() => setShowNotifs(false)} />
          )}
        </div>

        {/* Active project members */}
        <div className="flex">
          {activeProject?.members?.slice(0, 4).map((m) => (
            <div
              key={m._id}
              title={m.name}
              className="w-6 h-6 rounded-full text-[9px] font-semibold flex items-center justify-center -ml-1.5 first:ml-0 border border-dark-800"
              style={{ background: m.color || '#6c63ff', color: '#fff' }}
            >
              {m.initials}
            </div>
          ))}
        </div>
      </div>
    </header>
  );
}