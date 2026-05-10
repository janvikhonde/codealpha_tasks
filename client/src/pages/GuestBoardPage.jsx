import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';

const STATUS_LABELS = { todo: 'To Do', inprogress: 'In Progress', review: 'Review', done: 'Done' };
const STATUS_COLORS = { todo: '#888', inprogress: '#6c63ff', review: '#e0a040', done: '#4cbf9a' };

export default function GuestBoardPage() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/guest/${token}`)
      .then(({ data: d }) => setData(d))
      .catch(() => setError('Invalid or expired guest link'));
  }, [token]);

  if (error) return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center text-red-400">{error}</div>
  );
  if (!data) return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center text-gray-600">Loading...</div>
  );

  const { project, tasks } = data;

  return (
    <div className="min-h-screen bg-dark-900 text-gray-200 font-sans">
      {/* Banner */}
      <div className="bg-dark-800 border-b border-dark-500 px-6 py-3 flex items-center gap-3">
        <div className="w-7 h-7 bg-brand rounded-lg flex items-center justify-center text-white font-bold text-sm">N</div>
        <span className="font-semibold text-white">{project.name}</span>
        <span className="ml-2 text-xs bg-green-900/30 text-green-400 px-2 py-0.5 rounded">Read-only view</span>
      </div>

      <div className="flex gap-4 p-6 overflow-x-auto">
        {Object.entries(STATUS_LABELS).map(([colId, label]) => {
          const colTasks = tasks.filter((t) => t.status === colId);
          return (
            <div key={colId} className="w-52 flex-shrink-0">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full" style={{ background: STATUS_COLORS[colId] }} />
                <span className="text-sm font-medium text-gray-400">{label}</span>
                <span className="ml-auto text-xs text-gray-600">{colTasks.length}</span>
              </div>
              <div className="space-y-2">
                {colTasks.map((t) => (
                  <div key={t._id} className="bg-dark-700 border border-dark-500 rounded-lg p-3">
                    <p className="text-xs font-medium text-gray-200 mb-1">{t.title}</p>
                    {t.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-1">
                        {t.tags.map((tag) => (
                          <span key={tag} className="text-[10px] bg-dark-600 text-gray-500 px-1.5 py-0.5 rounded">{tag}</span>
                        ))}
                      </div>
                    )}
                    {t.assignee && (
                      <div className="flex items-center gap-1 mt-1">
                        <div className="w-4 h-4 rounded-full text-[8px] font-semibold flex items-center justify-center" style={{ background: t.assignee.color, color: '#fff' }}>
                          {t.assignee.initials}
                        </div>
                        <span className="text-[10px] text-gray-600">{t.assignee.name}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}