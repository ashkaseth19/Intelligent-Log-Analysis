import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { MainLayout } from './components/layout/MainLayout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { LogAnalysis } from './pages/LogAnalysis';
import { ThreatAlerts } from './pages/ThreatAlerts';
import { Logs } from './pages/Logs';
import { ModelPerformance } from './pages/ModelPerformance';
import { About } from './pages/About';
import { NotFound } from './pages/NotFound';

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={<MainLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="analysis" element={<LogAnalysis />} />
            <Route path="alerts" element={<ThreatAlerts />} />
            <Route path="logs" element={<Logs />} />
            <Route path="models" element={<ModelPerformance />} />
            <Route path="reports" element={<Navigate to="/models" replace />} />
            <Route path="about" element={<About />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
