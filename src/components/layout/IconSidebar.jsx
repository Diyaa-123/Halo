import React from 'react';
import { useNavigate } from 'react-router-dom';
import './IconSidebar.css';

const sidebarItems = [
  { id: 'family', icon: 'diversity_1', title: 'Family Members', path: '/' },
  { id: 'twin', icon: 'accessibility_new', title: 'Ambient Twin', path: '/clinical' },
  { id: 'sensors', icon: 'router', title: 'Network Status', path: '/live' },
  { id: 'reports', icon: 'assignment', title: 'Weekly Summaries', path: '/report' },
];

export default function IconSidebar({ activeId = 'family', onSelect }) {
  const navigate = useNavigate();

  return (
    <aside className="icon-sidebar">
      {sidebarItems.map(item => (
        <button
          key={item.id}
          className={`icon-sidebar__btn ${activeId === item.id ? 'icon-sidebar__btn--active' : ''}`}
          onClick={() => {
            onSelect && onSelect(item.id);
            navigate(item.path);
          }}
          title={item.title}
        >
          <span className="material-icons">{item.icon}</span>
        </button>
      ))}
    </aside>
  );
}
