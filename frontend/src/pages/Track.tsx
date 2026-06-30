import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import { Search, Clock, CheckCircle } from 'lucide-react';
import { apiClient } from '../api/client';

export default function Track() {
  const [trackingId, setTrackingId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [trackedIssue, setTrackedIssue] = useState<any>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingId.trim()) return;
    
    setLoading(true);
    setError('');
    setTrackedIssue(null);
    
    try {
      const res = await apiClient.get(`/issues/track/${trackingId.trim()}`);
      setTrackedIssue(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Issue not found or server error');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch(severity?.toUpperCase()) {
      case 'CRITICAL': return '#ef4444';
      case 'HIGH': return '#f97316';
      case 'MEDIUM': 
      case 'MODERATE': return '#f59e0b';
      case 'LOW': return '#10b981';
      default: return '#64748b';
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
      <Navbar />
      
      <main style={{ padding: '60px 24px', maxWidth: '800px', margin: '0 auto', width: '100%', flex: 1 }}>
        
        <h1 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '8px', color: '#0f172a' }}>Track status</h1>
        <p style={{ color: '#475569', fontSize: '1.1rem', marginBottom: '40px' }}>
          Choose what you want to track, then enter your reference number.
        </p>

        {/* Search Input Container */}
        <div style={{ marginBottom: '40px' }}>
          <p style={{ color: '#475569', fontSize: '0.95rem', marginBottom: '12px', fontWeight: 500 }}>
            Track a complaint you filed with your municipality.
          </p>
          <form onSubmit={handleSearch} style={{ position: 'relative' }}>
            <Search size={24} color="#94a3b8" style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Enter issue tracking ID (e.g. CH-2024-...)"
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '24px 24px 24px 60px', 
                fontSize: '1.2rem', 
                border: '1px solid #cbd5e1', 
                borderRadius: '16px', 
                outline: 'none',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
              }}
            />
            <button 
              type="submit"
              disabled={loading}
              style={{
                position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                background: '#0f172a', color: '#fff', border: 'none', padding: '14px 24px', borderRadius: '12px',
                fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </form>
          {error && <p style={{ color: '#ef4444', marginTop: '12px', fontWeight: 600 }}>{error}</p>}
        </div>

        {/* Dynamic Display Area */}
        {trackedIssue ? (
          <div style={{ background: '#ffffff', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
            
            {/* Header */}
            <div style={{ padding: '32px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <h2 style={{ margin: '0 0 8px 0', fontSize: '1.6rem', color: '#0f172a' }}>{trackedIssue.category || 'Civic Issue'}</h2>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '1rem' }}>{trackedIssue.addressResolved || trackedIssue.ward?.wardName || 'Unknown Location'}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#3b82f6', background: '#eff6ff', padding: '6px 16px', borderRadius: '20px', letterSpacing: '0.5px', display: 'inline-block', marginBottom: '8px' }}>
                    {trackedIssue.status.replace('_', ' ')}
                  </span>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700 }}>TRACKING ID: {trackedIssue.ticketCode}</p>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '16px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 800, color: getSeverityColor(trackedIssue.severity), border: `1px solid ${getSeverityColor(trackedIssue.severity)}40`, padding: '6px 16px', borderRadius: '20px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: getSeverityColor(trackedIssue.severity) }}></div>
                  SEVERITY: {trackedIssue.severity || 'PENDING'}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#64748b', background: '#f8fafc', padding: '6px 16px', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                  <Clock size={16} /> Reported {new Date(trackedIssue.submittedAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Timeline */}
            <div style={{ padding: '32px' }}>
              <h3 style={{ margin: '0 0 24px 0', fontSize: '1.1rem', color: '#0f172a' }}>ISSUE TIMELINE</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative' }}>
                {/* Vertical Line */}
                <div style={{ position: 'absolute', left: '16px', top: '24px', bottom: '24px', width: '2px', background: '#e2e8f0', zIndex: 0 }}></div>
                
                {/* Initial Report Event */}
                <div style={{ display: 'flex', gap: '24px', position: 'relative', zIndex: 1 }}>
                  <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#fff', border: '2px solid #3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#3b82f6' }}></div>
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', color: '#0f172a', fontSize: '1rem' }}>Issue Reported</h4>
                    <p style={{ margin: '0 0 12px 0', color: '#64748b', fontSize: '0.9rem' }}>{new Date(trackedIssue.submittedAt).toLocaleString()}</p>
                    <p style={{ margin: 0, color: '#475569', background: '#f8fafc', padding: '12px', borderRadius: '8px', fontSize: '0.95rem' }}>
                      {trackedIssue.description}
                    </p>
                    {trackedIssue.imageUrls && trackedIssue.imageUrls.length > 0 && (
                      <img 
                        src={trackedIssue.imageUrls[0].startsWith('http') ? trackedIssue.imageUrls[0] : `https://saksham-community-hero.onrender.com${trackedIssue.imageUrls[0]}`}
                        alt="Reported" 
                        style={{ width: '200px', height: '140px', objectFit: 'cover', borderRadius: '8px', marginTop: '12px' }} 
                      />
                    )}
                  </div>
                </div>

                {/* Additional Events (like RESOLVED) */}
                {trackedIssue.events && trackedIssue.events.map((event: any) => (
                  <div key={event.id} style={{ display: 'flex', gap: '24px', position: 'relative', zIndex: 1 }}>
                    <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#fff', border: `2px solid ${event.eventType === 'RESOLVED' ? '#22c55e' : '#e2e8f0'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {event.eventType === 'RESOLVED' ? <CheckCircle size={18} color="#22c55e" /> : <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#e2e8f0' }}></div>}
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', color: '#0f172a', fontSize: '1rem' }}>{event.eventType.replace('_', ' ')}</h4>
                      <p style={{ margin: '0 0 12px 0', color: '#64748b', fontSize: '0.9rem' }}>{new Date(event.occurredAt).toLocaleString()}</p>
                      
                      {event.newValue?.note && (
                        <div style={{ background: '#ecfdf5', padding: '16px', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                          <p style={{ margin: '0 0 8px 0', color: '#065f46', fontWeight: 700, fontSize: '0.85rem' }}>RESOLUTION NOTE</p>
                          <p style={{ margin: 0, color: '#065f46' }}>{event.newValue.note}</p>
                        </div>
                      )}

                      {event.newValue?.proofUrl && (
                        <img 
                          src={event.newValue.proofUrl.startsWith('http') ? event.newValue.proofUrl : `https://saksham-community-hero.onrender.com${event.newValue.proofUrl}`}
                          alt="Proof" 
                          style={{ width: '200px', height: '140px', objectFit: 'cover', borderRadius: '8px', marginTop: '12px', border: '2px solid #22c55e' }} 
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ 
            background: '#ffffff', 
            border: '1px dashed #cbd5e1', 
            borderRadius: '24px', 
            padding: '80px 40px', 
            textAlign: 'center',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px'
          }}>
            <Clock size={64} color="#cbd5e1" />
            <h3 style={{ fontSize: '1.5rem', color: '#64748b', margin: 0 }}>Search for a reference to see live progress</h3>
            <p style={{ color: '#94a3b8', margin: 0 }}>Select Civic issue above and enter your tracking ID.</p>
          </div>
        )}

      </main>
    </div>
  );
}
