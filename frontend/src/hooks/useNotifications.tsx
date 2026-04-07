import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { connectSocket, disconnectSocket, getSocket } from '../services/socketService';
import { api } from '../services/api';
import { useAuth } from './useAuth';

export type Notification = {
  id: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
};

type NotificationContextType = {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refresh: () => Promise<void>;
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState<Notification[]>([]);
  const socketInitiated = useRef(false);

  // Fetch notificaciones desde API
  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const [notifRes, countRes] = await Promise.all([
        api.get('/notifications?limit=50'),
        api.get('/notifications/unread-count'),
      ]);
      setNotifications(notifRes.data.notifications || []);
      setUnreadCount(countRes.data.count || 0);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Conectar socket cuando el usuario está autenticado
  useEffect(() => {
    if (!isAuthenticated) {
      disconnectSocket();
      socketInitiated.current = false;
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    // Initial fetch
    refresh();

    // Connect socket
    try {
      const socket = connectSocket();
      socketInitiated.current = true;

      socket.on('notification', (data: Notification) => {
        setNotifications(prev => [data, ...prev]);
        setUnreadCount(prev => prev + 1);
        // Add toast
        setToasts(prev => [...prev, data]);
        // Auto-remove toast after 5s
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== data.id));
        }, 5000);
      });
    } catch {
      // No token, ignore
    }

    return () => {
      disconnectSocket();
      socketInitiated.current = false;
    };
  }, [isAuthenticated, refresh]);

  const markAsRead = useCallback(async (id: number) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, loading, markAsRead, markAllAsRead, refresh }}>
      {children}
      {/* Toast overlay */}
      {toasts.length > 0 && (
        <div style={{
          position: 'fixed',
          top: 20,
          right: 20,
          zIndex: 10000,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          maxWidth: 380,
        }}>
          {toasts.map(toast => (
            <div
              key={toast.id}
              style={{
                background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
                border: '1px solid rgba(220, 38, 38, 0.4)',
                borderRadius: 12,
                padding: '14px 18px',
                color: '#fff',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                animation: 'slideInRight 0.4s ease-out',
                cursor: 'pointer',
              }}
              onClick={() => {
                markAsRead(toast.id);
                setToasts(prev => prev.filter(t => t.id !== toast.id));
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{toast.title}</div>
              <div style={{ fontSize: 13, opacity: 0.85, lineHeight: 1.4 }}>{toast.message}</div>
              <div style={{ fontSize: 11, opacity: 0.5, marginTop: 6 }}>Haz clic para descartar</div>
            </div>
          ))}
        </div>
      )}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications debe usarse dentro de NotificationProvider');
  return ctx;
}
