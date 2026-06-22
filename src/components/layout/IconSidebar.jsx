import React from 'react';
import './IconSidebar.css';

const sidebarItems = [
  { id: 'family', icon: 'diversity_1', title: 'Family Members' },
  { id: 'twin', icon: 'accessibility_new', title: 'Ambient Twin' },
  { id: 'sensors', icon: 'router', title: 'Network Status' },
  { id: 'reports', icon: 'assignment', title: 'Weekly Summaries' },
];

export default function IconSidebar({ activeId = 'family', onSelect }) {
  return (
    <aside className="icon-sidebar">
      {sidebarItems.map(item => (
        <button
          key={item.id}
          className={`icon-sidebar__btn ${activeId === item.id ? 'icon-sidebar__btn--active' : ''}`}
          onClick={() => onSelect && onSelect(item.id)}
          title={item.title}
        >
          <span className="material-icons">{item.icon}</span>
        </button>
      ))}
    </aside>
  );
}
