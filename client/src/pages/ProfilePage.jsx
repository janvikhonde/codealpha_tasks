import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const COLORS = [
  '#6c63ff', '#4cbf9a', '#e05a5a', '#e0a040',
  '#4c9fea', '#b06cff', '#ff6cb0', '#63d4ff',
];

export default function ProfilePage() {
  const { user, updateProfile, logout } = useAuthStore();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name || '');
  const [color, setColor] = useState(user?.color || '#6c63ff');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');

  const handleSave = async () => {
    setSaving(true);
    const ok = await updateProfile({ name, color });
    setSaving(false);
    if (ok) {
      setSuccess('Profile updated!');
      setTimeout(() => setSuccess(''), 2000);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="text-gray-500 hover:text-gray-300 text-sm"
          >
            ← Back
          </button>
          <h1 className="text-white font-semibold text-lg">Profile</h1>
        </div>

        <div className="card space-y-5">
          {/* Avatar preview */}
          <div className="flex justify-center">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white"
              style={{ background: color }}
            >
              {name?.slice(0, 2).toUpperCase() || user?.initials}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Display Name</label>
            <input
              className="input w-full"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Email (read-only) */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Email</label>
            <input
              className="input w-full opacity-50 cursor-not-allowed"
              value={user?.email || ''}
              readOnly
            />
          </div>

          {/* Color picker */}
          <div>
            <label className="text-xs text-gray-500 mb-2 block">Avatar Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-full transition-transform hover:scale-110"
                  style={{
                    background: c,
                    outline: color === c ? `2px solid white` : 'none',
                    outlineOffset: '2px',
                  }}
                />
              ))}
            </div>
          </div>

          {success && <p className="text-xs text-green-400">{success}</p>}

          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary w-full disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>

          <hr className="border-dark-500" />

          <button
            onClick={handleLogout}
            className="w-full py-2 text-sm text-red-400 hover:text-red-300 transition-colors"
          >
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}