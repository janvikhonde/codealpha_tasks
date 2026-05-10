import { useEffect, useRef } from 'react';
import useNotifStore from '../store/notifStore';

const TYPE_ICON = {
  task_assigned:  '👤',
  task_moved:     '🔄',
  comment_added:  '💬',
  project_invite: '🎉',
  task_done:      '✅',
  mention:        '📣',
};

const timeAgo = (date) => {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

export default function NotificationPanel({ onClose }) {
  const {
    notifications, unreadCount,
    markRead, markAllRead, deleteNotif, clearAll, fetchNotifications,
  } = useNotifStore();
  const panelRef = useRef(null);

  useEffect(() => { fetchNotifications(); }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div
      ref={panelRef}
      style={{
        position: 'absolute', top: '48px', right: 0,
        width: '360px', maxHeight: '520px',
        background: '#1a1a2e', border: '1px solid #2a2a3e',
        borderRadius: '14px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        zIndex: 1000, display: 'flex', flexDirection: 'column',
        overflow: 'hidden', fontFamily: 'Arial, sans-serif',
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 18px', borderBottom: '1px solid #2a2a3e',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>Notifications</span>
          {unreadCount > 0 && (
            <span style={{
              background: '#6c63ff', color: '#fff', borderRadius: 20,
              padding: '1px 8px', fontSize: 11, fontWeight: 'bold',
            }}>{unreadCount}</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {unreadCount > 0 && (
            <button onClick={markAllRead} style={{
              background: 'none', border: 'none', color: '#6c63ff',
              fontSize: 12, cursor: 'pointer', fontWeight: 'bold',
            }}>Mark all read</button>
          )}
          {notifications.length > 0 && (
            <button onClick={clearAll} style={{
              background: 'none', border: 'none', color: '#666',
              fontSize: 12, cursor: 'pointer',
            }}>Clear all</button>
          )}
        </div>
      </div>

      {/* List */}
      <div style={{ overflowY: 'auto', flex: 1 }}>
        {notifications.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: '#555' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🔔</div>
            <p style={{ fontSize: 14 }}>No notifications yet</p>
            <p style={{ fontSize: 12, marginTop: 4, color: '#444' }}>
              You'll see task updates here
            </p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif._id}
              onClick={() => !notif.read && markRead(notif._id)}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 12,
                padding: '14px 18px',
                background: notif.read ? 'transparent' : 'rgba(108,99,255,0.08)',
                borderBottom: '1px solid #1e1e30',
                cursor: notif.read ? 'default' : 'pointer',
              }}
            >
              {/* Icon */}
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: '#0f0f1a', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontSize: 16, flexShrink: 0,
              }}>
                {TYPE_ICON[notif.type] || '🔔'}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  color: notif.read ? '#888' : '#ddd',
                  fontSize: 13, margin: 0, lineHeight: 1.4,
                }}>{notif.message}</p>
                {notif.project && (
                  <p style={{ color: '#555', fontSize: 11, margin: '4px 0 0' }}>
                    📁 {notif.project.name}
                  </p>
                )}
                <p style={{ color: '#444', fontSize: 11, margin: '2px 0 0' }}>
                  {timeAgo(notif.createdAt)}
                </p>
              </div>

              {/* Unread dot + delete */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                {!notif.read && (
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%', background: '#6c63ff',
                  }} />
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); deleteNotif(notif._id); }}
                  style={{
                    background: 'none', border: 'none', color: '#444',
                    cursor: 'pointer', fontSize: 14, padding: 2,
                  }}
                  title="Delete"
                >✕</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}