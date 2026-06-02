import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import AdminDashboard from './pages/AdminDashboard';
import AgentDashboard from './pages/AgentDashboard';
import PassengerDashboard from './pages/PassengerDashboard';
import ProtectedRoute from './routes/ProtectedRoute';
import PremiumFlightBackground from './components/PremiumFlightBackground';
import CursorGlow from './components/CursorGlow';

import ThemeToggle from './components/ThemeToggle';

export default function App() {
  return (
    <>
      <ThemeToggle />
      <CursorGlow />
      <PremiumFlightBackground />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route path="/admin/*" element={<ProtectedRoute roles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />

        <Route path="/agent/*" element={<ProtectedRoute roles={['AGENT']}><AgentDashboard /></ProtectedRoute>} />

        <Route path="/passenger/*" element={<ProtectedRoute roles={['PASSENGER']}><PassengerDashboard /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}


