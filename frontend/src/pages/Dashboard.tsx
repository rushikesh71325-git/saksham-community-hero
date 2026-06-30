import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { apiClient } from '../api/client';
import { AlertCircle, Clock, MapPin, CheckCircle, ArrowUpCircle, Send, Map as MapIcon, List, Image as ImageIcon } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet marker icon issue in React
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({
  iconRetinaUrl: iconRetinaUrl,
  iconUrl: iconUrl,
  shadowUrl: shadowUrl,
});

// Component to dynamically update map center
function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

interface Issue {
  id: string;
  ticketCode: string;
  title: string;
  description: string;
  status: string;
  severity: string;
  category: string;
  upvoteCount: number;
  latitude: number;
  longitude: number;
  addressResolved?: string;
  imageUrls?: string[];
  ward: { wardName: string } | null;
  reporter: { displayName: string } | null;
  submittedAt: string;
}

export default function Dashboard() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'feed' | 'map'>('map'); // Default to map view for Saksham

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Location State
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locationError, setLocationError] = useState('');

  // 1. Fetch Issues from our API
  const handleUpvote = async (issueId: string) => {
    try {
      await apiClient.post(`/issues/${issueId}/upvote`);
      // Optimistically update the UI
      setIssues(prevIssues => prevIssues.map(issue => {
        if (issue.id === issueId) {
          const newCount = issue.upvoteCount + 1;
          const newSeverity = (newCount >= 10 && issue.severity !== 'CRITICAL') ? 'CRITICAL' : issue.severity;
          return { ...issue, upvoteCount: newCount, severity: newSeverity };
        }
        return issue;
      }));
    } catch (error) {
      console.error('Failed to upvote:', error);
      alert('Failed to upvote issue.');
    }
  };

  const fetchIssues = async () => {
    try {
      // If we have user location, fetch nearby issues. Otherwise fetch global latest.
      let url = '/issues?limit=50';
      if (userLocation) {
        url += `&lat=${userLocation.lat}&lng=${userLocation.lng}&radius=20`; // 20km radius
      }
      const response = await apiClient.get(url);
      setIssues(response.data.data);
    } catch (error) {
      console.error('Failed to fetch issues:', error);
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch issues if user location changes so we load nearby ones
  useEffect(() => {
    fetchIssues();
  }, [userLocation]);

  useEffect(() => {
    // Only fetch initially if location is not available yet to avoid double fetch
    if (!userLocation) {
      fetchIssues();
    }
    
    // Automatically get the user's GPS coordinates for accurate reporting
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error("Location error:", error);
          setLocationError('Please enable GPS location to report issues accurately.');
          // Fallback to Delhi for demo purposes if they block it
          setUserLocation({ lat: 28.7045, lng: 77.1030 });
        },
        { enableHighAccuracy: true }
      );
    } else {
      setLocationError('Geolocation is not supported by your browser.');
    }
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      // Create local preview URL
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // 2. Submit a new issue using FormData (Multipart)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userLocation) {
      alert("Still waiting for GPS location...");
      return;
    }
    
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('latitude', userLocation.lat.toString());
      formData.append('longitude', userLocation.lng.toString());
      formData.append('isAnonymous', 'false');
      
      if (image) {
        formData.append('images', image);
      }

      await apiClient.post('/issues', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setTitle('');
      setDescription('');
      setImage(null);
      setImagePreview(null);
      
      // Switch to feed view to see the new issue processing
      setViewMode('feed');
      setTimeout(fetchIssues, 2000); 
    } catch (error) {
      console.error('Failed to submit:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch(severity) {
      case 'CRITICAL': return 'var(--critical)';
      case 'HIGH': return 'var(--high)';
      case 'MEDIUM': return 'var(--medium)';
      case 'LOW': return 'var(--low)';
      default: return 'var(--text-muted)';
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      
      <main style={{ padding: '30px 24px', maxWidth: '1400px', margin: '0 auto', width: '100%', flex: 1, display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px' }}>
        
        {/* Left Column: Report Form */}
        <section>
          <div className="glass-panel animate-slide-up" style={{ padding: '24px', position: 'sticky', top: '100px' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle color="var(--primary)" size={20} />
              Report Civic Issue
            </h2>
            
            {locationError && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--critical)', padding: '10px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.9rem' }}>
                {locationError}
              </div>
            )}
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Issue Title</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="e.g. Broken Streetlight"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Description</label>
                <textarea 
                  className="input-field" 
                  placeholder="Describe the problem in detail..."
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  required
                  style={{ resize: 'none' }}
                />
              </div>
              
              {/* Image Upload Area */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Attach Photo Proof</label>
                {imagePreview ? (
                  <div style={{ position: 'relative', marginBottom: '10px' }}>
                    <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--surface-border)' }} />
                    <button 
                      type="button" 
                      onClick={() => { setImage(null); setImagePreview(null); }}
                      style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.7)', color: 'white', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer' }}
                    >
                      X
                    </button>
                  </div>
                ) : (
                  <div style={{ border: '2px dashed var(--surface-border)', borderRadius: '8px', padding: '20px', textAlign: 'center', cursor: 'pointer', background: 'rgba(15, 23, 42, 0.4)' }} onClick={() => document.getElementById('file-upload')?.click()}>
                    <ImageIcon color="var(--text-muted)" size={32} style={{ margin: '0 auto 8px' }} />
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Click to upload an image</span>
                    <input 
                      id="file-upload" 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageChange} 
                      style={{ display: 'none' }} 
                    />
                  </div>
                )}
              </div>

              {/* Location Status */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: userLocation ? 'var(--secondary)' : 'var(--text-muted)' }}>
                <MapPin size={16} />
                {userLocation ? `Location Acquired: ${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}` : 'Acquiring GPS location...'}
              </div>

              <button type="submit" className="btn-primary" disabled={submitting || !userLocation}>
                {submitting ? 'Submitting...' : <><Send size={18} /> Submit Report (+10 XP)</>}
              </button>
            </form>
          </div>
        </section>

        {/* Right Column: Interactive Map & Feed */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.5rem' }}>Community Hub</h2>
            
            {/* View Toggle */}
            <div style={{ display: 'flex', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '8px', padding: '4px' }}>
              <button 
                onClick={() => setViewMode('map')}
                style={{ background: viewMode === 'map' ? 'var(--primary)' : 'transparent', color: viewMode === 'map' ? 'white' : 'var(--text-muted)', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', transition: 'all 0.2s' }}
              >
                <MapIcon size={16} /> Map
              </button>
              <button 
                onClick={() => setViewMode('feed')}
                style={{ background: viewMode === 'feed' ? 'var(--primary)' : 'transparent', color: viewMode === 'feed' ? 'white' : 'var(--text-muted)', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', transition: 'all 0.2s' }}
              >
                <List size={16} /> Feed
              </button>
            </div>
          </div>

          <div style={{ height: 'calc(100vh - 200px)', overflowY: 'auto' }}>
            {viewMode === 'map' ? (
              /* MAP VIEW */
              <div className="glass-panel animate-slide-up" style={{ height: '100%', minHeight: '600px', borderRadius: 'var(--radius)', overflow: 'hidden', position: 'relative' }}>
                {userLocation ? (
                  <MapContainer center={[userLocation.lat, userLocation.lng]} zoom={13} style={{ height: '100%', width: '100%' }}>
                    <MapUpdater center={[userLocation.lat, userLocation.lng]} />
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    
                    {/* Render all reported issues on the map */}
                    {issues.map(issue => (
                      <Marker key={issue.id} position={[issue.latitude, issue.longitude]}>
                        <Popup>
                          <strong style={{ color: 'var(--bg-color)' }}>{issue.title}</strong><br/>
                          <span style={{ fontSize: '0.8rem', color: '#666' }}>{issue.severity} • {issue.status}</span>
                        </Popup>
                      </Marker>
                    ))}
                    
                    {/* Render current user location */}
                    <Marker position={[userLocation.lat, userLocation.lng]}>
                      <Popup>You are here</Popup>
                    </Marker>
                  </MapContainer>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                    Loading Map...
                  </div>
                )}
              </div>
            ) : (
              /* FEED VIEW */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {loading ? (
                  <p style={{ color: 'var(--text-muted)' }}>Loading city feed...</p>
                ) : issues.length === 0 ? (
                  <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No issues reported yet. Be the first!
                  </div>
                ) : (
                  issues.map((issue, index) => (
                    <div key={issue.id} className={`glass-panel animate-slide-up animate-delay-${(index % 3) + 1}`} style={{ padding: '20px', display: 'flex', gap: '16px' }}>
                      
                      {/* Upvote Column */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', minWidth: '40px' }}>
                        <button onClick={() => handleUpvote(issue.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                          <ArrowUpCircle size={24} />
                        </button>
                        <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>{issue.upvoteCount}</span>
                      </div>

                      {/* Content Column */}
                      <div style={{ flex: 1 }}>
                        
                        {/* Header & Ticket */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                          <div>
                            <h3 style={{ fontSize: '1.3rem', margin: '0 0 4px 0', color: 'var(--text-primary)' }}>{issue.title || issue.category}</h3>
                            <span style={{ background: 'rgba(37, 99, 235, 0.1)', color: 'var(--primary)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '1px' }}>
                              TRACKING ID: {issue.ticketCode}
                            </span>
                          </div>
                        </div>

                        {/* Main Body (Split layout if image exists) */}
                        <div style={{ display: 'flex', gap: '24px', marginBottom: '20px', flexDirection: 'column' }}>
                          {/* Description */}
                          {issue.description && (
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, margin: 0 }}>
                              {issue.description}
                            </p>
                          )}

                          {/* Uploaded Photo Evidence */}
                          {issue.imageUrls && issue.imageUrls.length > 0 && (
                            <div style={{ width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--surface-border)', background: '#f1f5f9' }}>
                              <img 
                                src={issue.imageUrls[0].startsWith('http') ? issue.imageUrls[0] : `https://saksham-community-hero.onrender.com${issue.imageUrls[0]}`}
                                alt="Issue Evidence" 
                                style={{ width: '100%', maxHeight: '400px', objectFit: 'contain', display: 'block' }}
                              />
                            </div>
                          )}
                        </div>
                        
                        {/* Enhanced Saksham Tags */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '0.85rem', marginTop: '16px' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: getSeverityColor(issue.severity), background: 'rgba(15,23,42,0.05)', padding: '6px 12px', borderRadius: '6px', border: `1px solid ${getSeverityColor(issue.severity)}40` }}>
                            <AlertCircle size={16} />
                            <strong style={{ opacity: 0.7 }}>Severity:</strong> {issue.severity || 'AI PROCESSING'}
                          </span>
                          
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', background: 'rgba(15,23,42,0.05)', padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--surface-border)' }}>
                            <CheckCircle size={16} />
                            <strong style={{ opacity: 0.7 }}>Status:</strong> {issue.status?.replace('_', ' ') || 'UNKNOWN'}
                          </span>

                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)', background: 'rgba(15,23,42,0.05)', padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--surface-border)' }}>
                            <MapPin size={16} color="var(--primary)" />
                            <strong style={{ opacity: 0.7, color: 'var(--text-secondary)' }}>Location:</strong> {issue.addressResolved || issue.ward?.wardName || 'Locating...'}
                          </span>

                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', marginLeft: 'auto', background: '#f8fafc', padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--surface-border)' }}>
                            <Clock size={16} />
                            <strong style={{ opacity: 0.7, color: 'var(--text-secondary)' }}>Reported On:</strong> {new Date(issue.submittedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
