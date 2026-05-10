import { useState } from 'react';
import useBoardStore from '../../store/boardStore';
import api from '../../services/api';

export default function GuestLinksPanel() {
  const { activeProject } = useBoardStore();
  const [guestLink, setGuestLink] = useState('');
  const [expires, setExpires] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!activeProject) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post(`/projects/${activeProject._id}/guest-token`);
      const link = `${window.location.origin}/guest/${data.guestToken}`;
      setGuestLink(link);
      setExpires(new Date(data.expires).toLocaleString());
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate link');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(guestLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!activeProject) {
    return <div className="p-6 text-gray-500 text-sm">No project selected.</div>;
  }

  return (
    <div className="p-6 max-w-lg">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white mb-1">🔗 Guest Links</h2>
        <p className="text-sm text-gray-500">
          Generate a read-only link to share{' '}
          <span className="text-gray-300">{activeProject.name}</span> with
          anyone — no login required.
        </p>
      </div>

      <div className="card space-y-4">
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="btn-primary w-full disabled:opacity-50"
        >
          {loading ? '⏳ Generating...' : '✨ Generate Guest Link'}
        </button>

        {error && <p className="text-xs text-red-400">{error}</p>}

        {guestLink && (
          <>
            <div className="bg-dark-900 border border-dark-400 rounded-lg p-3 flex items-center gap-2">
              <p className="text-xs text-gray-400 truncate flex-1 font-mono">
                {guestLink}
              </p>
              <button
                onClick={handleCopy}
                className="text-xs text-brand hover:text-white transition-colors flex-shrink-0 font-medium"
              >
                {copied ? '✅ Copied!' : 'Copy'}
              </button>
            </div>
            <p className="text-xs text-gray-600">
              🕐 Expires: {expires}
            </p>
            <p className="text-xs text-gray-600">
              Anyone with this link can view the board in read-only mode.
            </p>
          </>
        )}
      </div>
    </div>
  );
}