import { useState } from 'react';
import useBoardStore from '../../store/boardStore';
import useAuthStore from '../../store/authStore';
import api from '../../services/api';

export default function MembersPanel() {
  const { activeProject, setActiveProject } = useBoardStore();
  const { user } = useAuthStore();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isOwner = activeProject?.owner?._id === user?._id ||
                  activeProject?.owner === user?._id;

  const handleInvite = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const { data } = await api.post(`/projects/${activeProject._id}/invite`, { email });
      setActiveProject(data);
      setSuccess(`${email} added to project!`);
      setEmail('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to invite member');
    } finally {
      setLoading(false);
    }
  };

  if (!activeProject) {
    return (
      <div className="p-6 text-gray-500 text-sm">No project selected.</div>
    );
  }

  const members = activeProject.members || [];

  return (
    <div className="p-6 max-w-lg">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white mb-1">👥 Members</h2>
        <p className="text-sm text-gray-500">
          {members.length} member{members.length !== 1 ? 's' : ''} in{' '}
          <span className="text-gray-300">{activeProject.name}</span>
        </p>
      </div>

      {/* Member List */}
      <div className="card mb-4 space-y-3">
        {members.map((m) => {
          const isProjectOwner =
            activeProject.owner?._id === m._id ||
            activeProject.owner === m._id;
          return (
            <div key={m._id} className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                style={{ background: m.color || '#6c63ff', color: '#fff' }}
              >
                {m.initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-200 truncate">{m.name}</p>
                <p className="text-xs text-gray-600 truncate">{m.email}</p>
              </div>
              {isProjectOwner && (
                <span className="text-[10px] bg-brand/20 text-brand px-2 py-0.5 rounded-full">
                  Owner
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Invite Section — only for owner */}
      {isOwner && (
        <div className="card space-y-3">
          <p className="text-xs text-gray-500 uppercase tracking-widest">
            Invite by email
          </p>
          <div className="flex gap-2">
            <input
              className="input flex-1 text-sm"
              placeholder="teammate@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
            />
            <button
              onClick={handleInvite}
              disabled={loading || !email.trim()}
              className="btn-primary px-4 text-sm disabled:opacity-50"
            >
              {loading ? '...' : 'Invite'}
            </button>
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          {success && <p className="text-xs text-green-400">{success}</p>}
        </div>
      )}

      {!isOwner && (
        <p className="text-xs text-gray-600 mt-2">
          Only the project owner can invite members.
        </p>
      )}
    </div>
  );
}