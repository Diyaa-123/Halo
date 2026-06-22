import React, { useState } from 'react';
import './PageLayout.css';

const weekMeals = [
  { day: 'Mon', meals: 3, duration: 28, missed: 0, score: 92 },
  { day: 'Tue', meals: 3, duration: 32, missed: 0, score: 95 },
  { day: 'Wed', meals: 2, duration: 20, missed: 1, score: 68 },
  { day: 'Thu', meals: 3, duration: 25, missed: 0, score: 88 },
  { day: 'Fri', meals: 2, duration: 15, missed: 1, score: 72 },
  { day: 'Sat', meals: 3, duration: 30, missed: 0, score: 90 },
  { day: 'Sun', meals: 2, duration: 18, missed: 1, score: 75 },
];

export default function EatingMonitorPage() {
  const [selectedDay, setSelectedDay] = useState(null);

  return (
    <div className="page-layout">
      <div className="page-layout__header">
        <div className="page-layout__title-group">
          <span className="material-icons icon-lg" style={{ color: '#4edea3' }}>restaurant</span>
          <div>
            <h1 className="page-layout__title">Eating Habit Monitoring</h1>
            <p className="page-layout__subtitle">Nutritional analytics and meal pattern — Aarav Mehta</p>
          </div>
        </div>
        <span className="badge badge-warning">3 MISSED MEALS — WEEK</span>
      </div>

      <div className="page-layout__content">
        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
          {[
            { label: 'Meal Frequency', value: '2.4', unit: '/day', color: '#4edea3', status: 'stable' },
            { label: 'Avg Meal Duration', value: '24', unit: 'min', color: '#adc6ff', status: 'stable' },
            { label: 'Missed Meals', value: '3', unit: 'this week', color: '#EF4444', status: 'critical' },
            { label: 'Nutrition Adherence', value: '76%', unit: '', color: '#F59E0B', status: 'warning' },
            { label: 'Consistency Score', value: '82', unit: '/100', color: '#4edea3', status: 'stable' },
          ].map(m => (
            <div key={m.label} className="glass-card" style={{ padding: 14, borderLeft: `3px solid ${m.color}` }}>
              <div style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--outline)', fontWeight: 700, marginBottom: 6 }}>{m.label}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                <span style={{ fontSize: 24, fontWeight: 800, color: m.color }}>{m.value}</span>
                <span style={{ fontSize: 11, color: 'var(--outline)' }}>{m.unit}</span>
              </div>
              <span className={`badge badge-${m.status}`} style={{ fontSize: 9 }}>{m.status.toUpperCase()}</span>
            </div>
          ))}
        </div>

        {/* Weekly Meal Chart */}
        <div className="glass-card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="material-icons" style={{ fontSize: 16, color: '#4edea3' }}>bar_chart</span>
              <span style={{ fontSize: 13, fontWeight: 700 }}>Weekly Meal Pattern</span>
            </div>
            <div style={{ display: 'flex', gap: 12, fontSize: 10, color: 'var(--outline)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 10, background: '#4edea3', borderRadius: 2, display: 'inline-block' }}/> Meals</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 10, background: '#EF4444', borderRadius: 2, display: 'inline-block' }}/> Missed</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', height: 140 }}>
            {weekMeals.map((day, i) => (
              <div
                key={day.day}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer' }}
                onClick={() => setSelectedDay(selectedDay === i ? null : i)}
              >
                {/* Missed meals bar */}
                {day.missed > 0 && (
                  <div style={{ width: '60%', height: day.missed * 20, background: 'rgba(239, 68, 68, 0.4)', borderRadius: '3px 3px 0 0', border: '1px solid #EF4444' }} />
                )}
                {/* Meals bar */}
                <div style={{
                  width: '60%',
                  height: (day.meals / 3) * 80,
                  background: selectedDay === i ? '#4edea3' : 'rgba(78, 222, 163, 0.6)',
                  borderRadius: '3px 3px 0 0',
                  border: '1px solid rgba(78, 222, 163, 0.4)',
                  transition: 'all 0.2s',
                  boxShadow: selectedDay === i ? '0 0 12px rgba(78, 222, 163, 0.5)' : 'none',
                }} />
                <span style={{ fontSize: 10, color: selectedDay === i ? '#4edea3' : 'var(--outline)', fontWeight: 600 }}>{day.day}</span>
              </div>
            ))}
          </div>
          {/* Selected day detail */}
          {selectedDay !== null && (
            <div style={{ marginTop: 12, padding: 10, background: 'rgba(78, 222, 163, 0.06)', borderRadius: 8, border: '1px solid rgba(78, 222, 163, 0.2)', animation: 'slide-in-up 0.15s ease' }}>
              <div style={{ display: 'flex', gap: 24 }}>
                {[
                  { label: 'Meals Consumed', value: weekMeals[selectedDay].meals + '/3' },
                  { label: 'Total Duration', value: weekMeals[selectedDay].duration + ' min' },
                  { label: 'Missed', value: weekMeals[selectedDay].missed },
                  { label: 'Score', value: weekMeals[selectedDay].score + '/100' },
                ].map(s => (
                  <div key={s.label}>
                    <div style={{ fontSize: 9, color: 'var(--outline)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#4edea3' }}>{s.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Behavior analytics */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="glass-card" style={{ padding: 16 }}>
            <div className="section-label" style={{ marginBottom: 12 }}>Meal Time Patterns</div>
            {[
              { meal: 'Breakfast', time: '07:30 AM', regularity: 92, color: '#4edea3' },
              { meal: 'Lunch', time: '12:45 PM', regularity: 78, color: '#F59E0B' },
              { meal: 'Dinner', time: '06:30 PM', regularity: 65, color: '#ffb786' },
              { meal: 'Snacks', time: 'Irregular', regularity: 40, color: '#EF4444' },
            ].map(m => (
              <div key={m.meal} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--on-surface)' }}>{m.meal}</span>
                  <span style={{ fontSize: 10, color: 'var(--outline)' }}>{m.time}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, height: 5, background: 'var(--surface-container-high)', borderRadius: 100, overflow: 'hidden' }}>
                    <div style={{ width: `${m.regularity}%`, height: '100%', background: m.color, borderRadius: 100, transition: 'width 0.5s ease' }} />
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: m.color }}>{m.regularity}%</span>
                </div>
              </div>
            ))}
          </div>

          <div className="glass-card" style={{ padding: 16 }}>
            <div className="section-label" style={{ marginBottom: 12 }}>AI Nutritional Insight</div>
            <div style={{ display: 'flex', gap: 8, padding: 12, background: 'rgba(78, 222, 163, 0.06)', borderRadius: 8, border: '1px solid rgba(78, 222, 163, 0.2)', marginBottom: 12 }}>
              <span className="material-icons" style={{ color: '#4edea3', fontSize: 20, flexShrink: 0 }}>psychology</span>
              <p style={{ fontSize: 12, color: 'var(--on-surface-variant)', lineHeight: 1.6 }}>
                Patient skipped dinner on 3 occasions this week. Likely correlated with increased evening agitation levels. Recommend scheduled meal reminders and caregiver-assisted dining.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary btn-sm" style={{ flex: 1 }}>Set Meal Reminder</button>
              <button className="btn btn-ghost btn-sm" style={{ flex: 1 }}>View History</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
