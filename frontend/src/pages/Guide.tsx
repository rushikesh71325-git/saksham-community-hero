import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { Search, MapPin, PhoneCall, MessageSquare, Smartphone, Map, User, Award, Info, Share2, ExternalLink, FileText } from 'lucide-react';
import { apiClient } from '../api/client';

interface Corporation {
  id: string;
  name: string;
  headquarters: string;
  helpline: string;
  whatsapp: string;
  appLink: string | null;
  wardCount: number;
  mayorName: string;
  commissionerName: string;
  about: string;
}

export default function Guide() {
  const navigate = useNavigate();
  const [corporations, setCorporations] = useState<Corporation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCorp, setSelectedCorp] = useState<Corporation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCorps = async () => {
      try {
        const res = await apiClient.get('/corporations');
        setCorporations(res.data.data);
        if (res.data.data.length > 0) {
          setSelectedCorp(res.data.data[0]);
        }
      } catch (error) {
        console.error('Failed to fetch corporations', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCorps();
  }, []);

  const filteredCorps = corporations.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
      <Navbar />

      {/* Header */}
      <div style={{ textAlign: 'center', padding: '60px 24px 40px 24px', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ background: '#ecfdf5', color: '#059669', padding: '6px 16px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 800, letterSpacing: '1px', display: 'inline-block', marginBottom: '16px', border: '1px solid #a7f3d0' }}>
          CITIZEN RESOURCES
        </div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0f172a', margin: '0 0 16px 0' }}>Your civic hub for Pune</h1>
        <p style={{ color: '#64748b', fontSize: '1.1rem', lineHeight: 1.6, marginBottom: '32px' }}>
          Saksham helps residents in Pune report sanitation and civic problems and track updates in one place. Official helplines and links for your municipality are listed below.
        </p>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => navigate('/dashboard')}
            style={{ background: '#22c55e', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '30px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
          >
            <MapPin size={18} /> REPORT ON SAKSHAM
          </button>
          <button 
            onClick={() => navigate('/dashboard')}
            style={{ background: '#fff', color: '#0f172a', border: '1.5px solid #0f172a', padding: '12px 24px', borderRadius: '30px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
          >
            <Map size={18} /> CITY MAP & WARDS
          </button>
          <button 
            onClick={() => navigate('/track')}
            style={{ background: '#fff', color: '#0f172a', border: '1px solid #cbd5e1', padding: '12px 24px', borderRadius: '30px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
          >
            <Search size={18} /> TRACK YOUR COMPLAINT
          </button>
        </div>
      </div>

      {/* Main Content (Split Pane) */}
      <div style={{ display: 'flex', gap: '32px', padding: '0 48px 60px 48px', maxWidth: '1400px', margin: '0 auto', width: '100%', alignItems: 'flex-start' }}>
        
        {/* Left Column (Search + List) */}
        <div style={{ width: '380px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Search size={20} color="#22c55e" /> Find Corporation
            </h3>
            <input 
              type="text" 
              placeholder="pun"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', outline: 'none', marginBottom: '8px' }}
            />
            <p style={{ margin: '0 0 16px 0', fontSize: '0.8rem', color: '#94a3b8' }}>{filteredCorps.length} results</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {loading ? (
                <p style={{ color: '#94a3b8', textAlign: 'center' }}>Loading...</p>
              ) : filteredCorps.map(corp => (
                <button 
                  key={corp.id}
                  onClick={() => setSelectedCorp(corp)}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '16px', borderRadius: '12px', border: corp.id === selectedCorp?.id ? '2px solid #22c55e' : '1px solid #e2e8f0',
                    background: '#fff', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                    boxShadow: corp.id === selectedCorp?.id ? '0 4px 12px rgba(34,197,94,0.1)' : 'none'
                  }}
                >
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', color: '#0f172a', fontWeight: 700, fontSize: '0.95rem' }}>{corp.name}</h4>
                    <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.5px' }}>
                      {corp.name.split(' ')[0].toUpperCase()}
                    </p>
                  </div>
                  <span style={{ color: '#cbd5e1' }}>›</span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ background: '#022c22', borderRadius: '16px', padding: '24px', color: '#fff', position: 'relative', overflow: 'hidden' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '1.1rem', fontWeight: 700 }}>Citizen Pro-Tip</h4>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#a7f3d0', lineHeight: 1.5 }}>
              Municipalities respond 40% faster to reports with clear photos and exact locations verified via GPS tagging.
            </p>
            <Info size={120} color="rgba(255,255,255,0.05)" style={{ position: 'absolute', right: '-20px', bottom: '-20px' }} />
          </div>

          <div style={{ background: '#022c22', borderRadius: '16px', padding: '24px', color: '#fff', position: 'relative', overflow: 'hidden' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '1.1rem', fontWeight: 700 }}>City hub tip</h4>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#a7f3d0', lineHeight: 1.5 }}>
              Use Report on Saksham to submit an issue with location and evidence, or contact your municipality directly using the channels on this page.
            </p>
            <Info size={120} color="rgba(255,255,255,0.05)" style={{ position: 'absolute', right: '-20px', bottom: '-20px' }} />
          </div>

        </div>

        {/* Right Column (Details) */}
        {selectedCorp && (
          <div style={{ flex: 1, background: '#ffffff', borderRadius: '24px', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
            
            <div style={{ padding: '24px 32px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '8px', fontSize: '0.85rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.5px' }}>
              CITIZEN RESOURCES <span style={{ color: '#cbd5e1' }}>›</span> <span style={{ color: '#22c55e' }}>{selectedCorp.name.toUpperCase()}</span>
            </div>

            <div style={{ padding: '32px' }}>
              
              <div style={{ background: '#16a34a', borderRadius: '16px', padding: '32px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                  <p style={{ margin: '0 0 8px 0', fontSize: '0.8rem', fontWeight: 800, letterSpacing: '1px', color: '#bbf7d0' }}>
                    {selectedCorp.name.split(' ')[0].toUpperCase()} MUNICIPALITY
                  </p>
                  <h2 style={{ margin: '0 0 8px 0', fontSize: '2rem', fontWeight: 800 }}>{selectedCorp.name}</h2>
                  <p style={{ margin: 0, color: '#bbf7d0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={16} /> @{selectedCorp.name.split(' ').map(w => w[0]).join('')}{selectedCorp.name.split(' ')[0]}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button style={{ background: 'rgba(255,255,255,0.2)', border: 'none', padding: '10px 20px', borderRadius: '8px', color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <ExternalLink size={16} /> WEBSITE
                  </button>
                  <button style={{ background: 'rgba(255,255,255,0.2)', border: 'none', padding: '10px 20px', borderRadius: '8px', color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <Share2 size={16} /> SHARE
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '48px' }}>
                
                {/* Left Data Column */}
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '0.85rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '1px', margin: '0 0 24px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ height: '2px', width: '24px', background: '#e2e8f0' }}></span> CONTACT CHANNELS
                  </p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '40px' }}>
                    <div style={{ border: '1px solid #f1f5f9', background: '#f8fafc', borderRadius: '12px', padding: '20px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <div style={{ background: '#e2e8f0', padding: '12px', borderRadius: '12px' }}><MapPin size={20} color="#64748b" /></div>
                      <div>
                        <p style={{ margin: '0 0 4px 0', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '1px' }}>HEADQUARTERS</p>
                        <p style={{ margin: 0, color: '#0f172a', fontWeight: 700 }}>{selectedCorp.headquarters}</p>
                      </div>
                    </div>
                    
                    <div style={{ border: '1px solid #f1f5f9', background: '#f8fafc', borderRadius: '12px', padding: '20px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <div style={{ background: '#dbeafe', padding: '12px', borderRadius: '12px' }}><PhoneCall size={20} color="#3b82f6" /></div>
                      <div>
                        <p style={{ margin: '0 0 4px 0', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '1px' }}>HELPLINE</p>
                        <p style={{ margin: 0, color: '#0f172a', fontWeight: 800, fontSize: '1.1rem' }}>{selectedCorp.helpline}</p>
                      </div>
                    </div>

                    <div style={{ border: '1px solid #f1f5f9', background: '#f8fafc', borderRadius: '12px', padding: '20px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <div style={{ background: '#dcfce7', padding: '12px', borderRadius: '12px' }}><MessageSquare size={20} color="#22c55e" /></div>
                      <div>
                        <p style={{ margin: '0 0 4px 0', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '1px' }}>WHATSAPP</p>
                        <p style={{ margin: 0, color: '#0f172a', fontWeight: 800, fontSize: '1.1rem' }}>{selectedCorp.whatsapp}</p>
                      </div>
                    </div>

                    {selectedCorp.appLink && (
                      <div style={{ border: '1px solid #f1f5f9', background: '#f8fafc', borderRadius: '12px', padding: '20px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <div style={{ background: '#f3e8ff', padding: '12px', borderRadius: '12px' }}><Smartphone size={20} color="#a855f7" /></div>
                        <div>
                          <p style={{ margin: '0 0 4px 0', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '1px' }}>APP</p>
                          <p style={{ margin: 0, color: '#0f172a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>{selectedCorp.appLink} <ExternalLink size={14} color="#94a3b8" /></p>
                        </div>
                      </div>
                    )}
                    
                    <div style={{ border: '1px solid #f1f5f9', background: '#f8fafc', borderRadius: '12px', padding: '20px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <div style={{ background: '#ffedd5', padding: '12px', borderRadius: '12px' }}><Map size={20} color="#f97316" /></div>
                      <div>
                        <p style={{ margin: '0 0 4px 0', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '1px' }}>NO. OF WARDS</p>
                        <p style={{ margin: 0, color: '#0f172a', fontWeight: 800, fontSize: '1.1rem' }}>{selectedCorp.wardCount}</p>
                      </div>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.85rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '1px', margin: '0 0 24px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ height: '2px', width: '24px', background: '#e2e8f0' }}></span> LEADERSHIP
                  </p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                    <div style={{ border: '1px solid #f1f5f9', background: '#f8fafc', borderRadius: '12px', padding: '20px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <div style={{ background: '#fef3c7', padding: '12px', borderRadius: '12px' }}><Award size={20} color="#d97706" /></div>
                      <div>
                        <p style={{ margin: '0 0 4px 0', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '1px' }}>MAYOR</p>
                        <p style={{ margin: 0, color: '#0f172a', fontWeight: 700 }}>{selectedCorp.mayorName}</p>
                      </div>
                    </div>
                    
                    <div style={{ border: '1px solid #f1f5f9', background: '#f8fafc', borderRadius: '12px', padding: '20px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <div style={{ background: '#e0e7ff', padding: '12px', borderRadius: '12px' }}><User size={20} color="#4f46e5" /></div>
                      <div>
                        <p style={{ margin: '0 0 4px 0', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '1px' }}>COMMISSIONER</p>
                        <p style={{ margin: 0, color: '#0f172a', fontWeight: 700 }}>{selectedCorp.commissionerName}</p>
                      </div>
                    </div>
                  </div>

                </div>
                
                {/* Right Data Column */}
                <div style={{ flex: 1 }}>
                  
                  <div style={{ border: '1px solid #22c55e', background: '#f0fdf4', borderRadius: '12px', padding: '20px', marginBottom: '32px' }}>
                    <p style={{ margin: 0, color: '#166534', fontSize: '0.95rem', lineHeight: 1.5, fontWeight: 500 }}>
                      For sanitation and civic issues, use the helpline, WhatsApp, or report through Saksham.
                    </p>
                  </div>

                  <p style={{ fontSize: '0.85rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '1px', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={16} /> ABOUT
                  </p>
                  <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: 1.6, margin: '0 0 16px 0' }}>
                    {selectedCorp.about}
                  </p>
                  <button style={{ background: 'none', border: 'none', padding: 0, color: '#22c55e', fontWeight: 800, fontSize: '0.75rem', letterSpacing: '1px', cursor: 'pointer' }}>
                    READ MORE
                  </button>

                </div>
              </div>

              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '16px 20px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <Info size={20} color="#d97706" style={{ marginTop: '2px', flexShrink: 0 }} />
                <p style={{ margin: 0, color: '#b45309', fontSize: '0.85rem', lineHeight: 1.5 }}>
                  The contact details, helpline numbers, and process information shown here are sourced from publicly available records and are subject to change. Please verify with the official corporation website before taking action.
                </p>
              </div>

            </div>
          </div>
        )}
      </div>

    </div>
  );
}
