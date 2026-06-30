import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Search, BarChart2, BookOpen, LogOut, LayoutDashboard, Award } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { apiClient } from '../api/client';

export default function Navbar() {
  const navigate = useNavigate();
  const { socket } = useSocket();
  
  const [xp, setXp] = useState(132); 
  const [level, setLevel] = useState(2);
  const [animateBadge, setAnimateBadge] = useState(false);

  useEffect(() => {
    // Fetch initial XP and Level
    const fetchStats = async () => {
      try {
        const res = await apiClient.get('/auth/me');
        if (res.data.user) {
          setXp(res.data.user.xp);
          setLevel(res.data.user.level);
        }
      } catch (err) {
        console.error('Failed to fetch user stats', err);
      }
    };
    fetchStats();

    if (!socket) return;
    const handleNotification = (data: any) => {
      if (data.type === 'XP_GAINED') {
        setXp(data.newTotal);
        setAnimateBadge(true);
        setTimeout(() => setAnimateBadge(false), 1000);
      } else if (data.type === 'LEVEL_UP') {
        setLevel(data.newLevel);
      }
    };
    socket.on('notification', handleNotification);
    return () => { socket.off('notification', handleNotification); };
  }, [socket]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <nav style={{ 
      background: 'var(--surface)', 
      borderBottom: '1px solid var(--surface-border)', 
      padding: '16px 32px', 
      position: 'sticky', 
      top: 0, 
      zIndex: 50,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
    }}>
      
      {/* Brand Logo & Main Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => navigate('/')}>
          <MapPin color="var(--primary)" size={28} />
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: '#1e3a8a', letterSpacing: '-0.5px' }}>
            SAKSHAM
          </h1>
        </div>
        
        {/* Central Navigation Links */}
        <div style={{ display: 'flex', gap: '24px' }}>
          <button 
            onClick={() => navigate('/dashboard')}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <MapPin size={16} /> Report Issue
          </button>
          <button 
            onClick={() => navigate('/guide')}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <BookOpen size={16} /> Guide
          </button>
          <button 
            onClick={() => navigate('/track')}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Search size={16} /> Track Status
          </button>
          <button 
            onClick={() => navigate('/analytics')}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <BarChart2 size={16} /> Analytics
          </button>
          <button 
            onClick={() => navigate('/command-center')}
            style={{ background: 'rgba(37, 99, 235, 0.1)', border: 'none', color: 'var(--primary)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <LayoutDashboard size={16} /> Command Center
          </button>
        </div>
      </div>

      {/* User Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div 
          className="animate-slide-up" 
          style={{ 
            display: 'flex', alignItems: 'center', gap: '8px', 
            background: animateBadge ? 'rgba(37, 99, 235, 0.2)' : '#f8fafc', 
            border: `1px solid ${animateBadge ? 'var(--primary)' : 'var(--surface-border)'}`, 
            padding: '6px 12px', borderRadius: '20px', 
            transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            transform: animateBadge ? 'scale(1.1)' : 'scale(1)'
          }}
        >
          <Award color={animateBadge ? "var(--primary)" : "var(--text-secondary)"} size={18} />
          <span style={{ color: animateBadge ? "var(--primary)" : "var(--text-secondary)", fontWeight: 600, fontSize: '0.9rem' }}>
            Level {level} • {xp} XP
          </span>
        </div>

        <button 
          onClick={handleLogout}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', fontWeight: 500 }}
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>

    </nav>
  );
}
