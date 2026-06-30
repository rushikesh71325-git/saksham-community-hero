import { useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useNavigate } from 'react-router-dom';
import { Camera, Brain, Zap, ArrowRight, ShieldCheck, Activity } from 'lucide-react';
import '../index.css';

export default function Home() {
  const navigate = useNavigate();

  // Add scroll listener for parallax effects
  useEffect(() => {
    const handleScroll = () => {
      const elements = document.querySelectorAll('.parallax');
      elements.forEach((el: any) => {
        let speed = el.dataset.speed || 0.5;
        el.style.transform = `translateY(${window.scrollY * speed}px)`;
      });
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#0a0f1c', color: '#fff', overflowX: 'hidden' }}>
      <Navbar />
      
      <main style={{ flex: 1, position: 'relative' }}>
        
        {/* Dynamic Background Elements */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
          <div className="parallax" data-speed="0.2" style={{ position: 'absolute', top: '-10%', left: '-10%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(0,0,0,0) 70%)', filter: 'blur(60px)', borderRadius: '50%' }} />
          <div className="parallax" data-speed="0.4" style={{ position: 'absolute', top: '40%', right: '-5%', width: '40vw', height: '40vw', background: 'radial-gradient(circle, rgba(16,185,129,0.1) 0%, rgba(0,0,0,0) 70%)', filter: 'blur(60px)', borderRadius: '50%' }} />
          <div className="parallax" data-speed="0.1" style={{ position: 'absolute', bottom: '-20%', left: '20%', width: '60vw', height: '60vw', background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, rgba(0,0,0,0) 70%)', filter: 'blur(80px)', borderRadius: '50%' }} />
        </div>

        {/* HERO SECTION */}
        <section style={{ position: 'relative', zIndex: 1, padding: '120px 24px', textAlign: 'center', minHeight: '85vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            
            <div className="animate-slide-up animate-delay-1" style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', padding: '8px 20px', borderRadius: '30px', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '2px', marginBottom: '32px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '8px', color: '#93c5fd' }}>
              <Zap size={14} fill="#93c5fd" /> THE UPI FOR CIVIC INFRASTRUCTURE
            </div>
            
            <h1 className="animate-slide-up animate-delay-2" style={{ fontSize: 'clamp(3rem, 6vw, 5rem)', fontWeight: 800, lineHeight: 1.1, margin: '0 0 32px 0', letterSpacing: '-1px' }}>
              Transform your city with <br/>
              <span style={{ 
                background: 'linear-gradient(to right, #60a5fa, #34d399, #818cf8)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: 'inline-block'
              }}>
                Radical Transparency
              </span>
            </h1>
            
            <p className="animate-slide-up animate-delay-3" style={{ fontSize: '1.25rem', color: '#94a3b8', marginBottom: '48px', maxWidth: '700px', lineHeight: 1.7 }}>
              Saksham is an intelligent civic accountability engine. Report issues, let AI route them to the right authority, and track real-time resolution on an immutable ledger.
            </p>
            
            <div className="animate-slide-up animate-delay-4" style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button 
                onClick={() => navigate('/dashboard')}
                className="btn-primary"
                style={{ fontSize: '1.1rem', padding: '18px 40px', borderRadius: '14px', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.4)' }}
              >
                Launch App <ArrowRight size={20} />
              </button>
              <button 
                onClick={() => navigate('/analytics')}
                style={{ fontSize: '1.1rem', padding: '18px 40px', borderRadius: '14px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', transition: 'all 0.3s' }}
                onMouseOver={e => e.currentTarget.style.background='rgba(255,255,255,0.1)'}
                onMouseOut={e => e.currentTarget.style.background='rgba(255,255,255,0.05)'}
              >
                <Activity size={20} /> View Analytics
              </button>
            </div>
          </div>
        </section>

        {/* FEATURES GRID */}
        <section style={{ position: 'relative', zIndex: 1, padding: '100px 24px', background: '#0f172a' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            
            <div style={{ textAlign: 'center', marginBottom: '80px' }}>
              <h2 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 16px 0' }}>The Architecture of Action</h2>
              <p style={{ color: '#94a3b8', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>A seamless ecosystem designed to hold authorities accountable and empower citizens.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px' }}>
              
              {/* Feature 1 */}
              <div className="glass-panel" style={{ padding: '40px 32px', background: 'rgba(30,41,59,0.5)', border: '1px solid rgba(255,255,255,0.05)', transition: 'transform 0.3s' }}
                   onMouseOver={e => e.currentTarget.style.transform='translateY(-10px)'}
                   onMouseOut={e => e.currentTarget.style.transform='translateY(0)'}>
                <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: 'linear-gradient(135deg, rgba(59,130,246,0.2) 0%, rgba(59,130,246,0) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', border: '1px solid rgba(59,130,246,0.3)' }}>
                  <Camera color="#60a5fa" size={28} />
                </div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0 0 16px 0', color: '#f8fafc' }}>Geo-Verified Reporting</h3>
                <p style={{ color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
                  Snap a photo of the defect. We instantly extract GPS coordinates and cryptographically sign the metadata to prevent tampering.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="glass-panel" style={{ padding: '40px 32px', background: 'rgba(30,41,59,0.5)', border: '1px solid rgba(255,255,255,0.05)', transition: 'transform 0.3s' }}
                   onMouseOver={e => e.currentTarget.style.transform='translateY(-10px)'}
                   onMouseOut={e => e.currentTarget.style.transform='translateY(0)'}>
                <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: 'linear-gradient(135deg, rgba(167,139,250,0.2) 0%, rgba(167,139,250,0) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', border: '1px solid rgba(167,139,250,0.3)' }}>
                  <Brain color="#c084fc" size={28} />
                </div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0 0 16px 0', color: '#f8fafc' }}>Gemini AI Routing</h3>
                <p style={{ color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
                  Our AI models classify the issue severity and mathematically map the coordinates to the exact municipal corporation responsible.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="glass-panel" style={{ padding: '40px 32px', background: 'rgba(30,41,59,0.5)', border: '1px solid rgba(255,255,255,0.05)', transition: 'transform 0.3s' }}
                   onMouseOver={e => e.currentTarget.style.transform='translateY(-10px)'}
                   onMouseOut={e => e.currentTarget.style.transform='translateY(0)'}>
                <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: 'linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(16,185,129,0) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', border: '1px solid rgba(16,185,129,0.3)' }}>
                  <ShieldCheck color="#34d399" size={28} />
                </div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0 0 16px 0', color: '#f8fafc' }}>Immutable Ledger</h3>
                <p style={{ color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
                  Every status change, official comment, and resolution photo is permanently recorded. No more vanishing complaints.
                </p>
              </div>

            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
