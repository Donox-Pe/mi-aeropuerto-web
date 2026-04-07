import { useState, useRef, useEffect } from 'react';
import { useNotifications, Notification } from '../hooks/useNotifications';

const typeIcons: Record<string, string> = {
  INFO: 'ℹ️',
  FLIGHT_UPDATE: '✈️',
  BOARDING: '🛫',
  PAYMENT: '💳',
  BOOKING: '📋',
  ALERT: '⚠️',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Ahora';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div ref={panelRef} style={{ position: 'relative' }}>
      <button
        id="notification-bell"
        onClick={() => setOpen(!open)}
        style={{
          background: 'transparent',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 10,
          color: '#fff',
          cursor: 'pointer',
          padding: '8px 12px',
          fontSize: 18,
          position: 'relative',
          transition: 'all 0.2s',
        }}
        title="Notificaciones"
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: -4,
            right: -4,
            background: '#dc2626',
            color: '#fff',
            fontSize: 10,
            fontWeight: 700,
            borderRadius: '50%',
            width: 18,
            height: 18,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'pulse 2s infinite',
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          bottom: 'calc(100% + 8px)',
          left: 0,
          width: 360,
          maxHeight: 440,
          background: '#111827',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 14,
          boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
          zIndex: 5000,
          overflow: 'hidden',
          animation: 'slideDown 0.2s ease-out',
        }}>
          {/* Header */}
          <div style={{
            padding: '14px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>
              Notificaciones {unreadCount > 0 && `(${unreadCount})`}
            </span>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead()}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#dc2626',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                Marcar todas leídas
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ maxHeight: 370, overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: 30, textAlign: 'center', color: '#64748b', fontSize: 14 }}>
                Sin notificaciones
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  onClick={() => { if (!n.isRead) markAsRead(n.id); }}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    cursor: n.isRead ? 'default' : 'pointer',
                    background: n.isRead ? 'transparent' : 'rgba(220, 38, 38, 0.06)',
                    transition: 'background 0.2s',
                    display: 'flex',
                    gap: 12,
                    alignItems: 'flex-start',
                  }}
                >
                  <span style={{ fontSize: 20, flexShrink: 0, marginTop: 2 }}>
                    {typeIcons[n.type] || 'ℹ️'}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      color: '#fff',
                      fontWeight: n.isRead ? 400 : 700,
                      fontSize: 13,
                      marginBottom: 2,
                    }}>
                      {n.title}
                    </div>
                    <div style={{
                      color: '#94a3b8',
                      fontSize: 12,
                      lineHeight: 1.4,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}>
                      {n.message}
                    </div>
                  </div>
                  <span style={{
                    color: '#64748b',
                    fontSize: 11,
                    flexShrink: 0,
                    marginTop: 2,
                  }}>
                    {timeAgo(n.createdAt)}
                  </span>
                  {!n.isRead && (
                    <span style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: '#dc2626',
                      flexShrink: 0,
                      marginTop: 6,
                    }} />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
