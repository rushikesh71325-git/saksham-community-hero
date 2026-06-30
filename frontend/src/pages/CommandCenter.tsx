import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { apiClient } from '../api/client';
import { Search, MapPin, User, MessageSquare, Camera, CheckCircle } from 'lucide-react';

interface Issue {
  id: string;
  ticketCode: string;
  title: string;
  status: string;
  severity: string;
  category: string;
  latitude: number;
  longitude: number;
  submittedAt: string;
  ward: { wardName: string } | null;
  imageUrls: string[];
  addressResolved?: string;
  description?: string;
  reporter?: { displayName: string } | null;
}

export default function CommandCenter() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'ASSIGNED' | 'IN PROGRESS' | 'RESOLVED'>('ALL');
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [proofImage, setProofImage] = useState<File | null>(null);
  const [proofImagePreview, setProofImagePreview] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);

  const handleResolve = async () => {
    if (!selectedIssue || !resolutionNote || !proofImage) return;
    setIsResolving(true);
    try {
      const formData = new FormData();
      formData.append('resolutionNote', resolutionNote);
      formData.append('proof', proofImage);

      const res = await apiClient.post(`/issues/${selectedIssue.id}/resolve`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      alert('Issue marked as resolved!');
      
      // Update local state
      const updated = res.data.data;
      setIssues(issues.map(i => i.id === updated.id ? updated : i));
      setSelectedIssue(updated);
      setResolutionNote('');
      setProofImage(null);
      setProofImagePreview(null);
    } catch (err) {
      console.error(err);
      alert('Failed to resolve issue.');
    } finally {
      setIsResolving(false);
    }
  };

  const handleAcknowledge = async () => {
    if (!selectedIssue) return;
    try {
      const res = await apiClient.patch(`/issues/${selectedIssue.id}/acknowledge`);
      const updated = res.data.data;
      setIssues(issues.map(i => i.id === updated.id ? updated : i));
      setSelectedIssue(updated);
    } catch (err) {
      console.error(err);
      alert('Failed to acknowledge issue.');
    }
  };

  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const response = await apiClient.get('/issues?limit=100');
        const data = response.data.data as Issue[];
        setIssues(data);
        if (data.length > 0) setSelectedIssue(data[0]);
      } catch (error) {
        console.error("Failed to fetch issues:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchIssues();
  }, []);

  const filteredIssues = issues.filter(issue => {
    if (filter === 'RESOLVED' && !issue.status.includes('CLOSED') && issue.status !== 'RESOLVED') return false;
    if (filter === 'IN PROGRESS' && issue.status !== 'IN_PROGRESS') return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return issue.ticketCode?.toLowerCase().includes(q) || 
             issue.title?.toLowerCase().includes(q) || 
             issue.ward?.wardName?.toLowerCase().includes(q);
    }
    return true;
  });

  const getSeverityColor = (severity: string) => {
    switch(severity?.toUpperCase()) {
      case 'CRITICAL': return '#ef4444';
      case 'HIGH': return '#f97316';
      case 'MODERATE': 
      case 'MEDIUM': return '#f59e0b';
      case 'LOW': return '#10b981';
      default: return '#64748b';
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f4f7fa' }}>
      <Navbar />
      
      {/* Header */}
      <div style={{ padding: '32px 48px 16px 48px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0 0 8px 0', color: '#0f172a' }}>COMMAND CENTER</h1>
        <p style={{ margin: 0, color: '#64748b', fontSize: '1.05rem', fontWeight: 500 }}>Manage assigned tasks and provide resolution proof.</p>
      </div>

      <div style={{ display: 'flex', gap: '32px', padding: '0 48px 48px 48px', height: 'calc(100vh - 160px)' }}>
        
        {/* Left Column (Search + List) */}
        <div style={{ width: '380px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Search Card */}
          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ position: 'relative', marginBottom: '16px' }}>
              <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Search by ID, address, or category..."
                title="Matches tracking ID, address, or category. Press slash on the keyboard to move focus here when not typing in a field."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '12px 16px 12px 42px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.9rem', outline: 'none', background: '#f8fafc' }}
              />
            </div>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {[{val:'ALL', label:'All'}, {val:'ASSIGNED', label:'Assigned'}, {val:'IN PROGRESS', label:'In Progress'}, {val:'RESOLVED', label:'Resolved'}].map(f => (
                <button 
                  key={f.val}
                  onClick={() => setFilter(f.val as any)}
                  style={{
                    padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                    fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.5px',
                    background: filter === f.val ? '#0f172a' : '#f1f5f9',
                    color: filter === f.val ? '#ffffff' : '#64748b',
                    transition: 'all 0.2s'
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Issue List Scroll Area */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '8px' }}>
            <style>{`
              ::-webkit-scrollbar { width: 14px; }
              ::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 10px; }
              ::-webkit-scrollbar-thumb { background: #94a3b8; border-radius: 10px; border: 3px solid #f1f5f9; }
            `}</style>
            
            {loading ? (
              <p style={{ textAlign: 'center', color: '#94a3b8', marginTop: '40px' }}>Loading tasks...</p>
            ) : filteredIssues.map(issue => (
              <div 
                key={issue.id} 
                onClick={() => setSelectedIssue(issue)}
                style={{ 
                  background: '#ffffff', 
                  border: `2px solid ${selectedIssue?.id === issue.id ? '#22c55e' : '#e2e8f0'}`,
                  borderRadius: '12px', padding: '20px', cursor: 'pointer',
                  boxShadow: selectedIssue?.id === issue.id ? '0 4px 12px rgba(34, 197, 94, 0.15)' : '0 1px 3px rgba(0,0,0,0.05)',
                  transition: 'all 0.2s',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '1px' }}>{issue.ticketCode}</span>
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#3b82f6', background: '#eff6ff', padding: '4px 8px', borderRadius: '4px', letterSpacing: '0.5px' }}>
                    {issue.status?.replace('_', ' ') || 'UNKNOWN'}
                  </span>
                </div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', color: '#0f172a', fontWeight: 700 }}>{issue.title || issue.category || 'Civic Issue'}</h4>
                <p style={{ margin: '0 0 16px 0', fontSize: '0.85rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {issue.addressResolved || issue.ward?.wardName || 'Unknown Location'}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 800, color: getSeverityColor(issue.severity), border: `1px solid ${getSeverityColor(issue.severity)}40`, padding: '4px 10px', borderRadius: '16px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: getSeverityColor(issue.severity) }}></div>
                    {issue.severity || 'MODERATE'}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700 }}>
                    <div style={{ border: '1px solid #cbd5e1', borderRadius: '50%', width: '12px', height: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: '1px', height: '4px', background: '#cbd5e1', marginTop: '-2px' }}></div>
                    </div>
                    {Math.max(1, Math.floor((new Date().getTime() - new Date(issue.submittedAt).getTime()) / (1000 * 3600 * 24)))} DAYS AGO
                  </span>
                </div>
                
                {selectedIssue?.id === issue.id && (
                  <div style={{ position: 'absolute', right: '-10px', top: '50%', transform: 'translateY(-50%)', background: '#ffffff', borderRadius: '50%', padding: '2px', color: '#22c55e', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right Resolution Panel */}
        <div style={{ flex: 1, background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {selectedIssue ? (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              
              {/* Card Header */}
              <div style={{ padding: '32px 40px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2 style={{ margin: '0 0 8px 0', fontSize: '1.6rem', color: '#0f172a', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '-0.5px' }}>
                    {selectedIssue.category || selectedIssue.title || 'UNCLASSIFIED ISSUE'}
                  </h2>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: '#94a3b8', fontWeight: 700, letterSpacing: '1px' }}>
                    REPORT ID: <span style={{ color: '#64748b' }}>{selectedIssue.ticketCode}</span>
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: '0 0 8px 0', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 800, letterSpacing: '1px' }}>CURRENT STATUS</p>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#3b82f6', background: '#eff6ff', padding: '6px 16px', borderRadius: '20px', letterSpacing: '0.5px' }}>
                    {selectedIssue.status?.replace('_', ' ') || 'UNKNOWN'}
                  </span>
                </div>
              </div>

              {/* Scrollable Content Body */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '40px' }}>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '48px', borderBottom: '1px solid #f1f5f9', paddingBottom: '40px', marginBottom: '40px' }}>
                  
                  {/* Left Detail Column */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    <div style={{ display: 'flex', gap: '20px' }}>
                      <div style={{ background: '#f1f5f9', padding: '12px', borderRadius: '50%', height: '44px', width: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><MapPin color="#64748b" size={20} /></div>
                      <div>
                        <p style={{ margin: '0 0 6px 0', fontSize: '0.8rem', color: '#94a3b8', fontWeight: 800, letterSpacing: '1px' }}>LOCATION</p>
                        <p style={{ margin: '0 0 6px 0', fontSize: '1.1rem', color: '#0f172a', fontWeight: 700 }}>{selectedIssue.addressResolved || selectedIssue.ward?.wardName || 'Address resolving...'}</p>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b', fontWeight: 500 }}>
                          {selectedIssue.category || 'Issue'} • {selectedIssue.ward?.wardName || 'Local'} Municipal Corporation
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '20px' }}>
                      <div style={{ background: '#f1f5f9', padding: '12px', borderRadius: '50%', height: '44px', width: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User color="#64748b" size={20} /></div>
                      <div>
                        <p style={{ margin: '0 0 6px 0', fontSize: '0.8rem', color: '#94a3b8', fontWeight: 800, letterSpacing: '1px' }}>REPORTER</p>
                        <p style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a', fontWeight: 700 }}>{selectedIssue.reporter?.displayName || 'Citizen'}</p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '20px' }}>
                      <div style={{ background: '#f1f5f9', padding: '12px', borderRadius: '50%', height: '44px', width: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><MessageSquare color="#64748b" size={20} /></div>
                      <div>
                        <p style={{ margin: '0 0 6px 0', fontSize: '0.8rem', color: '#94a3b8', fontWeight: 800, letterSpacing: '1px' }}>DESCRIPTION</p>
                        <p style={{ margin: 0, fontSize: '1rem', color: '#475569', lineHeight: 1.6 }}>{selectedIssue.description || selectedIssue.title || 'The road connects key routes. Affects daily life.'}</p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '20px' }}>
                      <div style={{ background: '#fff0f2', border: `1px solid ${getSeverityColor(selectedIssue.severity)}40`, borderRadius: '50%', height: '44px', width: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: getSeverityColor(selectedIssue.severity) }}></div>
                      </div>
                      <div>
                        <p style={{ margin: '0 0 6px 0', fontSize: '0.8rem', color: '#94a3b8', fontWeight: 800, letterSpacing: '1px' }}>SEVERITY</p>
                        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: getSeverityColor(selectedIssue.severity), border: `1px solid ${getSeverityColor(selectedIssue.severity)}40`, padding: '6px 16px', borderRadius: '20px', display: 'inline-block', marginBottom: '8px' }}>
                          <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: getSeverityColor(selectedIssue.severity), marginRight: '6px', marginBottom: '1px' }}></span>
                          {selectedIssue.severity || 'CRITICAL'}
                        </span>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b' }}>Emergency — immediate response required</p>
                      </div>
                    </div>
                  </div>

                  {/* Right Media Column */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <p style={{ margin: '0 0 6px 0', fontSize: '0.8rem', color: '#94a3b8', fontWeight: 800, letterSpacing: '1px' }}>REPORTED PHOTO</p>
                      <p style={{ margin: '0 0 16px 0', fontSize: '1rem', color: '#0f172a', fontWeight: 700 }}>As reported (before)</p>
                      {selectedIssue.imageUrls && selectedIssue.imageUrls.length > 0 ? (
                        <img 
                          src={selectedIssue.imageUrls[0].startsWith('http') ? selectedIssue.imageUrls[0] : `https://saksham-community-hero.onrender.com${selectedIssue.imageUrls[0]}`} 
                          alt="Issue Evidence" 
                          style={{ width: '100%', height: '240px', objectFit: 'cover', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }} 
                        />
                      ) : (
                        <div style={{ width: '100%', height: '240px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontWeight: 600 }}>
                          No photo provided
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Area for Officer */}
                <div style={{ background: '#f8fafc', padding: '24px 32px', borderTop: '1px solid #e2e8f0' }}>
                  {selectedIssue.status === 'PENDING' || selectedIssue.status === 'ASSIGNED' ? (
                    <div style={{ textAlign: 'center' }}>
                      <h3 style={{ margin: '0 0 12px 0', fontSize: '1.2rem' }}>Ready to dispatch a team?</h3>
                      <button 
                        onClick={handleAcknowledge}
                        className="btn-primary"
                        style={{ padding: '12px 24px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '1rem', cursor: 'pointer' }}
                      >
                        Acknowledge & Start Work
                      </button>
                    </div>
                  ) : selectedIssue.status === 'IN_PROGRESS' ? (
                    <>
                      <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', color: '#0f172a' }}>Provide Resolution Proof</h3>
                      
                      <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#475569', fontSize: '0.9rem' }}>Resolution Note (Required)</label>
                        <textarea 
                          value={resolutionNote}
                          onChange={(e) => setResolutionNote(e.target.value)}
                          placeholder="Describe what was done to resolve this issue..."
                          style={{ width: '100%', height: '120px', padding: '20px', border: '2px solid #22c55e', borderRadius: '12px', resize: 'none', fontSize: '1rem', fontFamily: 'inherit', outline: 'none', color: '#0f172a', boxShadow: '0 0 0 4px rgba(34, 197, 94, 0.1)' }}
                        ></textarea>
                      </div>
                      
                      <div style={{ marginBottom: '20px' }}>
                        <p style={{ margin: '0 0 12px 0', fontSize: '0.85rem', color: '#94a3b8', fontWeight: 700, letterSpacing: '0.5px' }}>After Photo (Proof) — Required</p>
                        <div style={{ position: 'relative', width: '100%', height: '200px', border: '2px dashed #cbd5e1', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: proofImage ? '#f0fdf4' : '#ffffff', color: '#94a3b8', transition: 'border 0.2s', overflow: 'hidden' }} onMouseOver={e => e.currentTarget.style.borderColor='#94a3b8'} onMouseOut={e => e.currentTarget.style.borderColor='#cbd5e1'}>
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={(e) => { 
                              if (e.target.files && e.target.files[0]) {
                                setProofImage(e.target.files[0]); 
                                setProofImagePreview(URL.createObjectURL(e.target.files[0]));
                              }
                            }}
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', zIndex: 10 }} 
                          />
                          {proofImagePreview ? (
                            <img src={proofImagePreview} alt="Proof Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <>
                              <Camera size={36} style={{ marginBottom: '12px', color: '#cbd5e1' }} />
                              <p style={{ margin: '0 0 6px 0', fontWeight: 700, fontSize: '0.95rem', color: '#64748b', letterSpacing: '0.5px' }}>
                                Click to Upload Proof
                              </p>
                              <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>JPEG, PNG or WEBP - max 10 MB</p>
                            </>
                          )}
                        </div>
                      </div>

                      <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '20px' }}>
                        <CheckCircle color="#10b981" size={24} style={{ marginTop: '2px' }} />
                        <div>
                          <p style={{ margin: '0 0 4px 0', fontSize: '0.95rem', fontWeight: 800, color: '#065f46' }}>AUTOMATIC NOTIFICATION</p>
                          <p style={{ margin: 0, fontSize: '0.9rem', color: '#047857' }}>Marking as resolved will automatically notify the citizen and request their feedback.</p>
                        </div>
                      </div>

                      <button 
                        onClick={handleResolve}
                        disabled={isResolving || !resolutionNote || !proofImage}
                        style={{ width: '100%', padding: '20px', background: (isResolving || !resolutionNote || !proofImage) ? '#d1d5db' : '#86efac', border: 'none', borderRadius: '12px', color: '#ffffff', fontWeight: 800, fontSize: '1.1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', cursor: (isResolving || !resolutionNote || !proofImage) ? 'not-allowed' : 'pointer', letterSpacing: '0.5px', transition: 'background 0.2s' }}
                      >
                        <CheckCircle size={22} color="#ffffff" /> {isResolving ? 'RESOLVING...' : 'MARK AS RESOLVED & NOTIFY CITIZEN'}
                      </button>
                    </>
                  ) : null}
                </div>

              </div>
            </div>
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
              <p>Select an issue from the list to view details.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
