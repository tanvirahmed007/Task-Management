// hooks/useNotifications.ts
import { useState, useEffect, useCallback } from 'react';

interface Notification {
  type: string;
  task_id: string;
  task_title: string;
  completed_by: string;
  timestamp: string;
  message: string;
}

export function useNotifications(userId: string, userRole: number) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Safe browser notification permission
  const requestNotificationPermission = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          console.log('Notification permission:', permission);
        }).catch(err => {
          console.warn('Notification permission error:', err);
        });
      }
    }
  }, []);

  const showBrowserNotification = useCallback((title: string, body: string) => {
    if (typeof window === 'undefined') return;
    
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/favicon.ico',
          tag: 'task-completion'
        });
      } catch (err) {
        console.warn('Browser notification error:', err);
      }
    }
  }, []);

  useEffect(() => {
    requestNotificationPermission();
  }, [requestNotificationPermission]);

  useEffect(() => {
    // Only run in browser and for team leaders
    if (typeof window === 'undefined' || userRole !== 2222) {
      return;
    }

    let eventSource: EventSource | null = null;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    let reconnectTimeout: NodeJS.Timeout;

    const connect = () => {
      if (reconnectAttempts >= maxReconnectAttempts) {
        setError('Failed to connect after multiple attempts');
        return;
      }

      try {
        eventSource = new EventSource(
          `/api/notifications/stream?userId=${encodeURIComponent(userId)}&userRole=${userRole}`
        );

        eventSource.onopen = () => {
          console.log('✅ Notification stream connected');
          setIsConnected(true);
          setError(null);
          reconnectAttempts = 0; // Reset on successful connection
        };

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('📨 Received notification:', data);
            
            if (data.type === 'task_completed') {
              setNotifications(prev => [data, ...prev.slice(0, 49)]);
              showBrowserNotification('Task Completed', data.message);
            } else if (data.type === 'connected') {
              console.log('🔗 SSE connection established');
            }
          } catch (parseError) {
            console.warn('Failed to parse notification:', parseError);
          }
        };

        eventSource.onerror = (error) => {
          console.error('❌ Notification stream error:', error);
          setIsConnected(false);
          setError('Connection error');
          
          // Attempt reconnect with exponential backoff
          reconnectAttempts++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
          
          console.log(`Reconnecting in ${delay}ms... (attempt ${reconnectAttempts})`);
          reconnectTimeout = setTimeout(connect, delay);
        };

      } catch (setupError) {
        console.error('❌ Failed to setup EventSource:', setupError);
        setError('Setup error');
      }
    };

    // Initial connection
    connect();

    // Cleanup function
    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (eventSource) {
        eventSource.close();
        console.log('🔌 Notification stream closed');
      }
      setIsConnected(false);
    };
  }, [userId, userRole, showBrowserNotification]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { 
    notifications, 
    isConnected, 
    error,
    clearNotifications, 
    clearError 
  };
}