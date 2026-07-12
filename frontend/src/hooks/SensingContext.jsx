import React, { createContext, useContext } from 'react';
import useSensingWebSocket from '../hooks/useSensingWebSocket';

/**
 * SensingContext
 * 
 * Provides live sensing data from the backend WebSocket to the entire
 * component tree. Wrap your app (or a subtree) with <SensingProvider>
 * and consume with useSensing() in any child component.
 */
const SensingContext = createContext(null);

export function SensingProvider({ children, wsUrl = 'ws://localhost:8765' }) {
  const sensing = useSensingWebSocket(wsUrl);
  return (
    <SensingContext.Provider value={sensing}>
      {children}
    </SensingContext.Provider>
  );
}

/**
 * useSensing hook — call in any component to get the live sensing data.
 * Returns the same object as useSensingWebSocket.
 */
export function useSensing() {
  const ctx = useContext(SensingContext);
  if (!ctx) {
    // Fallback: return safe defaults if provider is not mounted
    return {
      data: null,
      isConnected: false,
      error: null,
      vitals: {},
      allVitals: [],
      features: {},
      classification: {},
      nodes: [],
      csiAmplitude: [],
      estimatedPersons: 0,
      source: 'disconnected',
      streamStatus: 'offline',
      streamMessage: null,
      lastUpdateAt: null,
      heartRate: null,
      breathingRate: null,
      meanRssi: null,
      variance: null,
      motionPower: null,
      breathingPower: null,
      presence: false,
      motionLevel: 'absent',
      confidence: 0,
      harPrediction: null,
      harConfidence: null,
    };
  }
  return ctx;
}
