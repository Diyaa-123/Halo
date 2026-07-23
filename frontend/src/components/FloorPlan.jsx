import React, { useEffect, useMemo, useState } from 'react';
import floorplan from '../config/floorplan.json';
import './FloorPlan.css';

const STORAGE_KEY = 'sightsense.floorplan.override.v1';

function toNumber(value, fallback = 0) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function normalizePlan(source) {
  const rooms = Array.isArray(source?.rooms)
    ? source.rooms
        .filter(Boolean)
        .map((room, index) => ({
          id: String(room.id || `room-${index + 1}`),
          label: String(room.label || `Room ${index + 1}`),
          x: toNumber(room.x),
          y: toNumber(room.y),
          width: Math.max(1, toNumber(room.width, 100)),
          height: Math.max(1, toNumber(room.height, 100)),
        }))
    : [];

  return {
    scale_note: String(source?.scale_note || '1 unit = 1 cm'),
    sensor_position: {
      x: toNumber(source?.sensor_position?.x, 150),
      y: toNumber(source?.sensor_position?.y, 125),
    },
    rooms,
  };
}

function getBounds(plan) {
  const points = [];

  plan.rooms.forEach((room) => {
    points.push([room.x, room.y], [room.x + room.width, room.y + room.height]);
  });

  points.push([plan.sensor_position.x, plan.sensor_position.y]);

  if (points.length === 0) {
    return null;
  }

  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);

  return {
    minX: Math.min(...xs),
    minY: Math.min(...ys),
    maxX: Math.max(...xs),
    maxY: Math.max(...ys),
  };
}

function safeLoadPlan() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return normalizePlan(JSON.parse(raw));
    }
  } catch {
    // Keep bundled sample.
  }
  return normalizePlan(floorplan);
}

export default function FloorPlan({ presenceStatus = 'uncalibrated', className = '' }) {
  const [editMode, setEditMode] = useState(false);
  const [draftPlan, setDraftPlan] = useState(() => normalizePlan(floorplan));
  const [draftError, setDraftError] = useState(null);

  useEffect(() => {
    setDraftPlan(safeLoadPlan());
  }, []);

  const bounds = useMemo(() => getBounds(draftPlan), [draftPlan]);
  const isInside = presenceStatus === 'inside';
  const isCalibrated = presenceStatus !== 'uncalibrated';
  const hasRooms = draftPlan.rooms.length > 0;
  const layout = useMemo(() => {
    if (!bounds) {
      return null;
    }
    const width = Math.max(1, bounds.maxX - bounds.minX);
    const height = Math.max(1, bounds.maxY - bounds.minY);
    return {
      width,
      height,
      scaleX: 100 / width,
      scaleY: 100 / height,
      minX: bounds.minX,
      minY: bounds.minY,
    };
  }, [bounds]);

  function updateRoom(index, patch) {
    setDraftPlan((current) => {
      const next = normalizePlan(current);
      next.rooms = next.rooms.map((room, roomIndex) => (roomIndex === index ? { ...room, ...patch } : room));
      return next;
    });
  }

  function addRoom() {
    setDraftPlan((current) => {
      const next = normalizePlan(current);
      next.rooms = [
        ...next.rooms,
        {
          id: `room-${next.rooms.length + 1}`,
          label: `Room ${next.rooms.length + 1}`,
          x: 0,
          y: 0,
          width: 200,
          height: 160,
        },
      ];
      return next;
    });
  }

  function removeRoom(index) {
    setDraftPlan((current) => {
      const next = normalizePlan(current);
      next.rooms = next.rooms.filter((_, roomIndex) => roomIndex !== index);
      return next;
    });
  }

  function savePlan() {
    try {
      setDraftError(null);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draftPlan));
      setEditMode(false);
    } catch {
      setDraftError('Could not save floor plan in this browser.');
    }
  }

  function resetPlan() {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage errors.
    }
    setDraftPlan(normalizePlan(floorplan));
    setDraftError(null);
  }

  return (
    <div
      className={`floor-plan-shell ${isInside ? 'floor-plan-shell--active' : ''} ${className}`.trim()}
      data-presence={presenceStatus}
    >
      <div className="floor-plan-card glass-card">
        <div className="floor-plan-card__header">
          <div>
            <div className="section-label" style={{ marginBottom: 4 }}>Flat Context Plan</div>
            <div className="floor-plan-card__subtitle">
              Manual layout for context only. Edit it here from the dashboard. No room-level detection.
            </div>
          </div>
          <div className={`floor-plan-badge ${isInside ? 'floor-plan-badge--inside' : ''}`}>
            {isInside ? 'Presence inside flat' : isCalibrated ? 'No flat presence' : 'Uncalibrated'}
          </div>
        </div>

        <div className="floor-plan-card__canvas">
          {hasRooms && layout ? (
            <div
              className="floor-plan-stage"
              style={{
                aspectRatio: `${layout.width} / ${layout.height}`,
              }}
            >
              <div className="floor-plan-stage__frame" />
              {isInside && <div className="floor-plan-stage__glow" />}

              {draftPlan.rooms.map((room) => {
                const left = (room.x - layout.minX) * layout.scaleX;
                const top = (room.y - layout.minY) * layout.scaleY;
                const width = room.width * layout.scaleX;
                const height = room.height * layout.scaleY;

                return (
                  <div
                    key={room.id}
                    className="floor-plan-room"
                    style={{
                      left: `${left}%`,
                      top: `${top}%`,
                      width: `${width}%`,
                      height: `${height}%`,
                    }}
                  >
                    <span className="floor-plan-room__label">{room.label}</span>
                  </div>
                );
              })}

              <div
                className="floor-plan-sensor"
                style={{
                  left: `${(draftPlan.sensor_position.x - layout.minX) * layout.scaleX}%`,
                  top: `${(draftPlan.sensor_position.y - layout.minY) * layout.scaleY}%`,
                }}
              >
                <span className="floor-plan-sensor__halo" />
                <span className="floor-plan-sensor__dot" />
                <span className="floor-plan-sensor__label">Sensor</span>
              </div>
            </div>
          ) : (
            <div className="floor-plan-empty">
              <div className="floor-plan-empty__text">Floor plan not configured</div>
              <div className="floor-plan-empty__subtext">
                Add room rectangles in the editor below to render the manual layout.
              </div>
            </div>
          )}
        </div>

        <div className="floor-plan-card__footer">
          <span className="floor-plan-card__note">{draftPlan.scale_note || 'Scale note unavailable'}</span>
          <span className="floor-plan-card__note">
            {isInside ? 'Flat-wide presence glow enabled' : 'No flat-wide presence glow'}
          </span>
        </div>

        <div className="floor-plan-editor">
          <div className="floor-plan-editor__toolbar">
            <button className="btn btn-sm btn-outline" type="button" onClick={() => setEditMode((value) => !value)}>
              {editMode ? 'Close Editor' : 'Edit Layout'}
            </button>
            <button className="btn btn-sm btn-outline" type="button" onClick={resetPlan}>
              Reset Sample
            </button>
          </div>

          {editMode && (
            <div className="floor-plan-editor__panel">
              <div className="floor-plan-editor__row floor-plan-editor__row--sensor">
                <label>
                  Sensor X
                  <input
                    type="number"
                    value={draftPlan.sensor_position.x}
                    onChange={(event) =>
                      setDraftPlan((current) => ({
                        ...current,
                        sensor_position: {
                          ...current.sensor_position,
                          x: toNumber(event.target.value, current.sensor_position.x),
                        },
                      }))
                    }
                  />
                </label>
                <label>
                  Sensor Y
                  <input
                    type="number"
                    value={draftPlan.sensor_position.y}
                    onChange={(event) =>
                      setDraftPlan((current) => ({
                        ...current,
                        sensor_position: {
                          ...current.sensor_position,
                          y: toNumber(event.target.value, current.sensor_position.y),
                        },
                      }))
                    }
                  />
                </label>
              </div>

              <div className="floor-plan-editor__rooms">
                {draftPlan.rooms.map((room, index) => (
                  <div key={room.id} className="floor-plan-editor__room">
                    <div className="floor-plan-editor__room-head">
                      <strong>{room.label || `Room ${index + 1}`}</strong>
                      <button className="btn btn-sm btn-outline" type="button" onClick={() => removeRoom(index)}>
                        Remove
                      </button>
                    </div>
                    <div className="floor-plan-editor__grid">
                      <label>
                        Label
                        <input
                          type="text"
                          value={room.label}
                          onChange={(event) => updateRoom(index, { label: event.target.value })}
                        />
                      </label>
                      <label>
                        X
                        <input
                          type="number"
                          value={room.x}
                          onChange={(event) => updateRoom(index, { x: toNumber(event.target.value, room.x) })}
                        />
                      </label>
                      <label>
                        Y
                        <input
                          type="number"
                          value={room.y}
                          onChange={(event) => updateRoom(index, { y: toNumber(event.target.value, room.y) })}
                        />
                      </label>
                      <label>
                        Width
                        <input
                          type="number"
                          value={room.width}
                          onChange={(event) => updateRoom(index, { width: Math.max(1, toNumber(event.target.value, room.width)) })}
                        />
                      </label>
                      <label>
                        Height
                        <input
                          type="number"
                          value={room.height}
                          onChange={(event) => updateRoom(index, { height: Math.max(1, toNumber(event.target.value, room.height)) })}
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              <div className="floor-plan-editor__actions">
                <button className="btn btn-sm btn-outline" type="button" onClick={addRoom}>
                  Add Room
                </button>
                <button className="btn btn-sm btn-primary" type="button" onClick={savePlan}>
                  Save Layout
                </button>
              </div>

              {draftError && <div className="floor-plan-editor__error">{draftError}</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
