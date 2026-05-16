import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import MainLayout from './components/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';
import { Login, Register } from './pages/Auth/Auth';
import Dashboard from './pages/Dashboard';
import Complaints from './pages/Complaints';
import Amenities from './pages/Amenities';
import Announcements from './pages/Announcements';
import Visitors from './pages/Visitors';
import Payments from './pages/Payments';
import Profile from './pages/Profile';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/auth">
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route index element={<Navigate to="login" replace />} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="complaints" element={<Complaints />} />
            <Route path="amenities" element={<Amenities />} />
            <Route path="announcements" element={<Announcements />} />
            <Route path="visitors" element={<Visitors />} />
            <Route path="payments" element={<Payments />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
}