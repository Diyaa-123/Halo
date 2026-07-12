import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import CustomCursor from '../components/landing/CustomCursor';
import ThreeScene from '../components/landing/ThreeScene';
import '../styles/landing.css';

export default function LoginPage() {
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    navigate('/dashboard');
  };

  return (
    <div className="landing-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', overflow: 'hidden' }}>
      <CustomCursor />
      
      {/* Background 3D Scene */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}>
        <ThreeScene cards={[]} scrollProgress={0} />
      </div>

      <Link to="/" style={{ position: 'absolute', top: '40px', left: '40px', zIndex: 20, color: '#0ea5e9', textDecoration: 'none', fontWeight: 'bold', fontSize: '1.2rem', letterSpacing: '2px' }}>
        ← RETURN
      </Link>
      
      {/* Login Card */}
      <div className="helix-card" style={{ zIndex: 10, position: 'relative', width: '100%', maxWidth: '420px', minHeight: 'auto', padding: '48px', pointerEvents: 'auto', margin: '0 20px', background: 'rgba(255, 255, 255, 0.85)' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ 
            width: '64px', 
            height: '64px', 
            background: 'linear-gradient(135deg, #0284c7, #0ea5e9)', 
            borderRadius: '16px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '28px',
            marginBottom: '24px',
            boxShadow: '0 8px 16px rgba(2, 132, 199, 0.2)'
          }}>
            SS
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#0f172a' }}>Clinical Access</h1>
          <p style={{ color: '#475569', marginTop: '8px', fontSize: '1rem' }}>Enter your credentials to view patient telemetry.</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>CLINICIAN ID</label>
            <input 
              type="email" 
              placeholder="id@hospital.org" 
              defaultValue="admin@silentsense.org"
              required
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid #cbd5e1',
                background: '#f8fafc',
                outline: 'none',
                fontFamily: 'var(--font-family)',
                fontSize: '1rem',
                color: '#0f172a',
                transition: 'border-color 0.2s, box-shadow 0.2s',
                cursor: 'none'
              }}
              onFocus={(e) => { e.target.style.borderColor = '#0ea5e9'; e.target.style.boxShadow = '0 0 0 3px rgba(14, 165, 233, 0.1)'; }}
              onBlur={(e) => { e.target.style.borderColor = '#cbd5e1'; e.target.style.boxShadow = 'none'; }}
              data-cursor="expand"
            />
          </div>
          
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>SECURE PIN</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              defaultValue="admin1234"
              required
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid #cbd5e1',
                background: '#f8fafc',
                outline: 'none',
                fontFamily: 'var(--font-family)',
                fontSize: '1rem',
                color: '#0f172a',
                transition: 'border-color 0.2s, box-shadow 0.2s',
                cursor: 'none'
              }}
              onFocus={(e) => { e.target.style.borderColor = '#0ea5e9'; e.target.style.boxShadow = '0 0 0 3px rgba(14, 165, 233, 0.1)'; }}
              onBlur={(e) => { e.target.style.borderColor = '#cbd5e1'; e.target.style.boxShadow = 'none'; }}
              data-cursor="expand"
            />
          </div>

          <button 
            type="submit" 
            style={{ 
              width: '100%', 
              marginTop: '16px', 
              border: 'none',
              background: '#0f172a',
              color: 'white',
              padding: '16px',
              borderRadius: '12px',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              cursor: 'none',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#1e293b'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#0f172a'}
            data-cursor="expand"
          >
            Authenticate
          </button>
        </form>
      </div>
    </div>
  );
}
