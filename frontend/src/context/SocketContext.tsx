import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Award } from 'lucide-react';

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
}

const SocketContext = createContext<SocketContextType>({ socket: null, connected: false });

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  
  // Custom Toast state for Gamification alerts
  const [toast, setToast] = useState<{title: string, message: string} | null>(null);

  useEffect(() => {
    // Only connect if the user is logged in (has a token), or use fallback for demo
    const token = localStorage.getItem('token') || 'mock';

    // Connect to the Node.js Socket.IO server
    const socketInstance = io('https://saksham-community-hero.onrender.com', {
      auth: { token },
      transports: ['websocket'], // Force websockets for lightning speed
    });

    socketInstance.on('connect', () => {
      console.log('🟢 Connected to Saksham Real-Time Server!');
      setConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('🔴 Disconnected from Real-Time Server.');
      setConnected(false);
    });

    // Listen for Gamification Notifications globally!
    socketInstance.on('notification', (data) => {
      console.log('🔔 INCOMING NOTIFICATION:', data);
      
      // Trigger our beautiful glassmorphism popup!
      setToast({ title: data.title, message: data.message });
      
      // Auto-hide the popup after 5 seconds
      setTimeout(() => setToast(null), 5000);
    });

    setSocket(socketInstance);

    // Cleanup on unmount
    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}

      {/* Global Real-Time Toast Notification */}
      {toast && (
        <div className="animate-slide-up" style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
          background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(16px)',
          border: '1px solid var(--primary)', borderRadius: 'var(--radius)',
          padding: '16px 20px', boxShadow: '0 8px 32px var(--glass-glow)',
          display: 'flex', alignItems: 'center', gap: '16px', minWidth: '300px'
        }}>
          <div style={{ background: 'rgba(79, 70, 229, 0.2)', padding: '10px', borderRadius: '50%' }}>
            <Award color="var(--primary)" size={24} />
          </div>
          <div>
            <h4 style={{ margin: '0 0 4px 0', fontSize: '1.1rem' }}>{toast.title}</h4>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{toast.message}</p>
          </div>
        </div>
      )}
    </SocketContext.Provider>
  );
};
