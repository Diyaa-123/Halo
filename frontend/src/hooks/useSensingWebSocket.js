import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useSensingWebSocket
 * 
 * Connects to the SilentSense Python backend via WebSocket and provides
 * real-time sensing data to any React component. Handles automatic
 * reconnection, connection state, and data parsing.
 * 
 * @param {string} url - WebSocket URL (default: ws://localhost:8765)
 * @returns {object} { data, isConnected, error, reconnect }
 */
const DEFAULT_WS_URL = 'ws://localhost:8765';

export default function useSensingWebSocket(url = DEFAULT_WS_URL) {
  const [data, setData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);
  const mountedRef = useRef(true);

  const connect = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) return;
        setIsConnected(true);
        setError(null);
        console.log('[SilentSense] WebSocket connected to', url);
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        try {
          const parsed = JSON.parse(event.data);
          setData(parsed);
        } catch (e) {
          console.warn('[SilentSense] Failed to parse message:', e);
        }
      };

      ws.onerror = (e) => {
        if (!mountedRef.current) return;
        setError('WebSocket error');
        console.warn('[SilentSense] WebSocket error:', e);
      };

      ws.onclose = () => {
        if (!mountedRef.current) return;
        setIsConnected(false);
        console.log('[SilentSense] WebSocket disconnected. Reconnecting in 3s...');
        // Auto-reconnect after 3 seconds
        reconnectTimer.current = setTimeout(() => {
          if (mountedRef.current) connect();
        }, 3000);
      };
    } catch (e) {
      setError(e.message);
    }
  }, [url]);

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;
      clearTimeout(reconnectTimer.current);
      if (wsRef.current) {
        wsRef.current.onclose = null; // prevent reconnect on unmount
        wsRef.current.close();
      }
    };
  }, [connect]);

  // Derived convenience fields
  const vitals = data?.vital_signs || {};
  const features = data?.features || {};
  const classification = data?.classification || {};
  const nodes = data?.nodes || [];
  const csiAmplitude = nodes[0]?.amplitude || [];
  const estimatedPersons = data?.estimated_persons ?? 0;
  const source = data?.source || 'disconnected';
  const streamStatus = data?.stream_status || (isConnected ? 'live' : 'offline');
  const streamMessage = data?.stream_message ?? null;

  return {
    // Raw data
    data,
    
    // Connection state
    isConnected,
    error,
    reconnect: connect,
    
    // Parsed convenience fields
    vitals,
    allVitals: data?.all_vitals || [],
    features,
    classification,
    nodes,
    csiAmplitude,
    estimatedPersons,
    source,
    streamStatus,
    streamMessage,
    lastUpdateAt: data?.timestamp ?? null,
    
    // Individual vital sign values (with safe defaults)
    heartRate: vitals.heart_rate_bpm ?? null,
    breathingRate: vitals.breathing_rate_bpm ?? null,
    
    // Individual feature values
    meanRssi: features.mean_rssi ?? null,
    variance: features.variance ?? null,
    motionPower: features.motion_band_power ?? null,
    breathingPower: features.breathing_band_power ?? null,
    
    // Classification
    presence: classification.presence ?? false,
    motionLevel: classification.motion_level ?? 'absent',
    confidence: classification.confidence ?? 0,

    // HAR (Gait Analysis)
    harPrediction: data?.har_prediction ?? null,
    harConfidence: data?.har_confidence ?? null,
  };
}
