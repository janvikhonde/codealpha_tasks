import { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import useBoardStore from '../../store/boardStore';
import api from '../../services/api';

export default function BurndownChart() {
  const { activeProject } = useBoardStore();
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!activeProject) return;
    setLoading(true);
    api.get(`/projects/${activeProject._id}/burndown`)
      .then(({ data: d }) => { setData(d.days); setTotal(d.total); })
      .finally(() => setLoading(false));
  }, [activeProject?._id]);

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-600">Loading burndown...</div>;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white">{activeProject?.currentSprint?.name} — Burndown</h2>
        <p className="text-sm text-gray-500">{total} total tasks this sprint</p>
      </div>

      <div className="card">
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#666', fontSize: 11 }}
              tickFormatter={(v) => v.slice(5)} // MM-DD
            />
            <YAxis tick={{ fill: '#666', fontSize: 11 }} />
            <Tooltip
              contentStyle={{ background: '#1e1e1e', border: '1px solid #333', borderRadius: 8 }}
              labelStyle={{ color: '#999' }}
            />
            <Legend wrapperStyle={{ color: '#888', fontSize: 12 }} />
            <Line
              type="monotone"
              dataKey="remaining"
              stroke="#6c63ff"
              strokeWidth={2}
              dot={{ fill: '#6c63ff', r: 3 }}
              name="Remaining tasks"
            />
            <Line
              type="monotone"
              dataKey="ideal"
              stroke="#4cbf9a"
              strokeWidth={1.5}
              strokeDasharray="5 5"
              dot={false}
              name="Ideal burndown"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}