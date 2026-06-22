import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
import './styles/global.css';
import './App.css';

export default function App() {
  const [activeSidebar, setActiveSidebar] = useState('family');

  return (
    <BrowserRouter>
      <div className="ambient-blob-2"></div>
      <div className="app">
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
              <Route path="/demo" element={<DemoModePage />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}
