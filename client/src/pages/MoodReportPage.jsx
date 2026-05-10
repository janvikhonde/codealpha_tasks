import { useEffect, useState } from 'react';
import useBoardStore from '../store/boardStore';
import api from '../services/api';
import Sidebar from '../components/layout/Sidebar';

const MOOD_MAP = { '😊': 'Happy', '😐': 'Neutral', '😤': 'Stressed', '🔥': 'Crushing it', '😴': 'Tired' };

export default function MoodReportPage() {
  const { activeProject } = useBoardStore();
  const [moods, setMoods] = useState([]);

  useEffect(() => {
    if (!activeProject) return;
    api.get(`/mood?project=${activeProject._id}`).then(({ data }) => setMoods(data));
  }, [activeProject?._id]);

  // Group by date
  const byDate = moods.reduce((acc, m) => {
    if (!acc[m.date]) acc[m.date] = [];
    acc[m.date].push(m);
    return acc;
  }, {});

  // Emoji counts overall
  const emojiCounts = moods.reduce((acc, m) => {
    acc[m.emoji] = (acc[m.emoji] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="flex h-screen overflow-hidden bg-dark-900">
      <Sidebar />
      <div className="flex-1 overflow-y-auto p-6">
        <h1 className="text-xl font-semibold text-white mb-2">Mood Report</h1>
        <p className="text-sm text-gray-500 mb-6">{activeProject?.name} — Last 30 days</p>

        {/* Emoji summary */}
        <div className="grid grid-cols-5 gap-3 mb-8">
          {Object.entries(MOOD_MAP).map(([emoji, label]) => (
            <div key={emoji} className="card text-center">
              <div className="text-3xl mb-1">{emoji}</div>
              <div className="text-lg font-semibold text-white">{emojiCounts[emoji] || 0}</div>
              <div className="text-xs text-gray-600">{label}</div>
            </div>
          ))}
        </div>

        {/* Daily breakdown */}
        <div className="card">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-4">Daily Team Mood</p>
          {Object.entries(byDate).sort((a, b) => b[0].localeCompare(a[0])).map(([date, entries]) => (
            <div key={date} className="flex items-center gap-4 py-3 border-b border-dark-600 last:border-0">
              <span className="text-xs text-gray-500 w-20 flex-shrink-0">{date.slice(5)}</span>
              <div className="flex gap-3 flex-wrap">
                {entries.map((e) => (
                  <div key={e._id} className="flex items-center gap-1.5">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-semibold"
                      style={{ background: e.user?.color, color: '#fff' }}
                    >
                      {e.user?.initials}
                    </div>
                    <span className="text-base">{e.emoji}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {moods.length === 0 && (
            <p className="text-sm text-gray-600 text-center py-8">No mood data yet. Use the emoji bar in the top nav!</p>
          )}
        </div>
      </div>
    </div>
  );
}