import React from 'react';
import './PageLayout.css';

const patients = [
  { id: 1, name: 'Aarav Mehta', age: 78, room: 'B-204', score: 82, status: 'stable', condition: 'COPD, Hypertension', bed: 'BED 04', lastAlert: '8 min ago', alertType: 'Respiratory Distress' },
  { id: 2, name: 'Priya Sharma', age: 82, room: 'A-101', score: 91, status: 'stable', condition: 'Dementia, Arthritis', bed: 'BED 01', lastAlert: '2 hrs ago', alertType: 'Meal Skipped' },
  { id: 3, name: 'Rajan Patel', age: 75, room: 'C-308', score: 58, status: 'critical', condition: 'Heart Failure, CKD', bed: 'BED 12', lastAlert: '14 min ago', alertType: 'Fall Risk' },
  { id: 4, name: 'Sunita Verma', age: 80, room: 'B-212', score: 74, status: 'warning', condition: 'Parkinson\'s', bed: 'BED 09', lastAlert: '22 min ago', alertType: 'Hydration Alert' },
  { id: 5, name: 'Mohan Das', age: 71, room: 'A-110', score: 88, status: 'stable', condition: 'Type 2 Diabetes', bed: 'BED 07', lastAlert: '31 min ago', alertType: 'Agitation' },
  { id: 6, name: 'Kavita Singh', age: 84, room: 'D-402', score: 45, status: 'critical', condition: 'Advanced Dementia', bed: 'BED 06', lastAlert: '5 min ago', alertType: 'Wandering Detected' },
];

const statusColor = { stable: '#4edea3', warning: '#F59E0B', critical: '#EF4444' };

export default function PatientRegistryPage() {
  return (
    <div className="page-layout">
      <div className="page-layout__header">
        <div className="page-layout__title-group">
          <span className="material-icons icon-lg" style={{ color: 'var(--primary)' }}>people</span>
          <div>
            <h1 className="page-layout__title">Patient Registry</h1>
            <p className="page-layout__subtitle">All monitored patients — Geriatric Care Ward</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '6px 12px', background: 'var(--surface-container)', borderRadius: 'var(--radius)', border: '1px solid var(--border-muted)' }}>
            <span className="material-icons icon-sm" style={{ color: 'var(--outline)' }}>search</span>
            <input placeholder="Search patients..." style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--on-surface)', fontFamily: 'var(--font-family)', fontSize: 12, width: 160 }} />
          </div>
          <button className="btn btn-primary">
            <span className="material-icons icon-sm">add</span>
            Add Patient
          </button>
        </div>
      </div>

      <div className="page-layout__content">
        {/* Summary Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[
            { label: 'Total Patients', value: '6', color: 'var(--primary)', icon: 'person' },
            { label: 'Stable', value: '3', color: '#4edea3', icon: 'check_circle' },
            { label: 'Warning', value: '1', color: '#F59E0B', icon: 'warning_amber' },
            { label: 'Critical', value: '2', color: '#EF4444', icon: 'emergency' },
          ].map(s => (
            <div key={s.label} className="glass-card" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className="material-icons" style={{ color: s.color, fontSize: 24 }}>{s.icon}</span>
              <div>
                <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 10, color: 'var(--outline)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Patient Table */}
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(11, 14, 20, 0.7)', borderBottom: '1px solid var(--border-muted)' }}>
                {['Patient', 'Bed / Room', 'Health Score', 'Status', 'Condition', 'Last Alert', 'Actions'].map(col => (
                  <th key={col} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--outline)', fontWeight: 700 }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {patients.map((p, i) => (
                <tr
                  key={p.id}
                  style={{
                    borderBottom: '1px solid rgba(48, 54, 61, 0.5)',
                    background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                    transition: 'background 0.15s',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(173, 198, 255, 0.04)'}
                  onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)'}
                >
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: `linear-gradient(135deg, var(--primary-container), var(--secondary-container))`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0,
                      }}>
                        {p.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--on-surface)' }}>{p.name}</div>
                        <div style={{ fontSize: 10, color: 'var(--outline)' }}>{p.age}y · Room {p.room}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>{p.bed}</div>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, maxWidth: 80, height: 4, background: 'var(--surface-container-high)', borderRadius: 100, overflow: 'hidden' }}>
                        <div style={{ width: `${p.score}%`, height: '100%', background: statusColor[p.status], borderRadius: 100 }} />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 800, color: statusColor[p.status] }}>{p.score}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span className={`badge badge-${p.status}`}>{p.status.toUpperCase()}</span>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>{p.condition}</span>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ fontSize: 11, color: p.status === 'critical' ? '#EF4444' : p.status === 'warning' ? '#F59E0B' : 'var(--outline)' }}>{p.alertType}</div>
                    <div style={{ fontSize: 9, color: 'var(--outline)' }}>{p.lastAlert}</div>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn-icon" title="View Twin" style={{ width: 28, height: 28 }}>
                        <span className="material-icons" style={{ fontSize: 14 }}>view_in_ar</span>
                      </button>
                      <button className="btn-icon" title="Alerts" style={{ width: 28, height: 28 }}>
                        <span className="material-icons" style={{ fontSize: 14 }}>notifications</span>
                      </button>
                      <button className="btn-icon" title="Report" style={{ width: 28, height: 28 }}>
                        <span className="material-icons" style={{ fontSize: 14 }}>description</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
