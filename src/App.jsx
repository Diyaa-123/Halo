import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';

import TopNav from './components/layout/TopNav';
import IconSidebar from './components/layout/IconSidebar';

import HomeDashboard from './pages/HomeDashboard';
import SleepAnalyticsPage from './pages/SleepAnalyticsPage';
import MobilityPage from './pages/MobilityPage';
import BiometricProfilePage from './pages/BiometricProfilePage';
import AttributionPage from './pages/AttributionPage';
import SafetyLogPage from './pages/SafetyLogPage';
import WeeklyReportPage from './pages/WeeklyReportPage';
import DemoModePage from './pages/DemoModePage';
import LiveSensingPage from './pages/LiveSensingPage';
import SettingsPage from './pages/SettingsPage';
import SleepApneaDashboard from './pages/SleepApneaDashboard';
import FallDetectionPage from './pages/FallDetectionPage';
import GaitAnalysisPage from './pages/GaitAnalysisPage';
import EatingMonitorPage from './pages/EatingMonitorPage';
import AgitationModule from './pages/AgitationModule';
import ClinicalDashboard from './pages/ClinicalDashboard';
import ClinicalReportPage from './pages/ClinicalReportPage';
import PatientRegistryPage from './pages/PatientRegistryPage';
import AnalyticsPage from './pages/AnalyticsPage';

import './styles/global.css';
import './App.css';

function AppShell({ activeSidebar, setActiveSidebar }) {
  const location = useLocation();

  useEffect(() => {
    const sidebarByPath = {
      '/': 'family',
      '/clinical': 'twin',
      '/live': 'sensors',
      '/report': 'reports',
    };

    setActiveSidebar(sidebarByPath[location.pathname] || 'family');
  }, [location.pathname, setActiveSidebar]);

  return (
    <>
      <TopNav />
      <div className="app__content">
        <IconSidebar activeId={activeSidebar} onSelect={setActiveSidebar} />
        <main className="app__main">
          <Routes>
            <Route path="/" element={<HomeDashboard />} />
            <Route path="/sleep" element={<SleepAnalyticsPage />} />
            <Route path="/mobility" element={<MobilityPage />} />
            <Route path="/biometrics" element={<BiometricProfilePage />} />
            <Route path="/attribution" element={<AttributionPage />} />
            <Route path="/safety" element={<SafetyLogPage />} />
            <Route path="/report" element={<WeeklyReportPage />} />
            <Route path="/live" element={<LiveSensingPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/sleep-apnea" element={<SleepApneaDashboard />} />
            <Route path="/fall" element={<FallDetectionPage />} />
            <Route path="/gait" element={<GaitAnalysisPage />} />
            <Route path="/eating" element={<EatingMonitorPage />} />
            <Route path="/agitation" element={<AgitationModule />} />
            <Route path="/clinical" element={<ClinicalDashboard />} />
            <Route path="/clinical-report" element={<ClinicalReportPage />} />
            <Route path="/registry" element={<PatientRegistryPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/demo" element={<DemoModePage />} />
          </Routes>
        </main>
      </div>
    </>
  );
}

export default function App() {
  const [activeSidebar, setActiveSidebar] = useState('family');

  return (
    <BrowserRouter>
      <div className="ambient-blob-2" />
      <div className="app">
        <AppShell activeSidebar={activeSidebar} setActiveSidebar={setActiveSidebar} />
      </div>
    </BrowserRouter>
  );
}
