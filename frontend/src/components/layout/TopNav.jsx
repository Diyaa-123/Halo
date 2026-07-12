import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './TopNav.css';
import { useToast } from './ToastContext';

const navItems = [
  { icon: 'dashboard',       label: 'Overview',           path: '/'            },
  { icon: 'sensors',         label: 'Live Sensing',        path: '/live'        },
  { icon: 'bedtime',         label: 'Sleep & Vitals',      path: '/sleep'       },
  { icon: 'directions_walk', label: 'Mobility & Fall Risk', path: '/mobility'  },
  { icon: 'monitor_heart',   label: 'Biometrics',          path: '/biometrics'  },
  { icon: 'policy',          label: 'Attribution',         path: '/attribution' },
  { icon: 'warning',         label: 'Safety Log',          path: '/safety'      },
  { icon: 'summarize',       label: 'Reports',             path: '/report'      },
];

export default function TopNav() {
  const toast = useToast();
  const navigate  = useNavigate();
  const location  = useLocation();

  return (
    <div className="top-nav-wrapper">
      <nav className="top-nav">
        {/* Logo */}
        <div className="top-nav__logo" onClick={() => navigate('/')}>
          <span className="material-icons top-nav__logo-icon">wifi_tethering</span>
          <span className="top-nav__logo-name">SilentSense</span>
        </div>

        {/* Navigation Links */}
        <div className="top-nav__links">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                className={`top-nav__link ${isActive ? 'top-nav__link--active' : ''}`}
                onClick={() => navigate(item.path)}
                title={item.label}
              >
                <span className="material-icons icon-sm">{item.icon}</span>
                <span className="top-nav__link-text">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Side Controls */}
        <div className="top-nav__actions">
          {/* Settings icon */}
          <button
            className={`top-nav__icon-btn ${location.pathname === '/settings' ? 'top-nav__icon-btn--active' : ''}`}
            onClick={() => navigate('/settings')}
            title="Settings"
          >
            <span className="material-icons">settings</span>
          </button>

          <button className="top-nav__icon-btn" style={{ position: 'relative' }} onClick={() => toast('Opening Notifications Panel...', 'info')}>
            <span className="material-icons">notifications_none</span>
            <span className="top-nav__notif-dot"></span>
          </button>

          <div className="top-nav__avatar">
            <img src="https://i.pravatar.cc/100?img=11" alt="Caregiver Profile" />
          </div>
        </div>
      </nav>
    </div>
  );
}
