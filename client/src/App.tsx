import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { I18nProvider } from './i18n';
import { useSettings } from './hooks/useSettings';
import LoadingSpinner from './components/ui/LoadingSpinner';

// Lazy loaded pages
const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const SeniorLayout = lazy(() => import('./layouts/SeniorLayout'));
const CaregiverLayout = lazy(() => import('./layouts/CaregiverLayout'));
const Home = lazy(() => import('./pages/senior/Home'));
const MedicationList = lazy(() => import('./pages/senior/MedicationList'));
const TodayDoses = lazy(() => import('./pages/senior/TodayDoses'));
const Vitals = lazy(() => import('./pages/senior/Vitals'));
const CheckIn = lazy(() => import('./pages/senior/CheckIn'));
const Emergency = lazy(() => import('./pages/senior/Emergency'));
const Appointments = lazy(() => import('./pages/senior/Appointments'));
const SideEffects = lazy(() => import('./pages/senior/SideEffects'));
const BrainBoost = lazy(() => import('./pages/senior/BrainBoost'));
const DoctorReport = lazy(() => import('./pages/senior/DoctorReport'));
const SeniorSettings = lazy(() => import('./pages/senior/Settings'));
const CaregiverDashboard = lazy(() => import('./pages/caregiver/Dashboard'));
const CaregiverSettings = lazy(() => import('./pages/caregiver/Settings'));
const PrivacyPage = lazy(() => import('./pages/Privacy'));

function AppSettings({ children }: { children: React.ReactNode }) {
  useSettings(); // Apply settings on mount
  return <>{children}</>;
}

function ProtectedRoute({ children, role }: { children: React.ReactNode; role?: 'SENIOR' | 'CAREGIVER' }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) {
    return <Navigate to={user.role === 'SENIOR' ? '/senior' : '/caregiver'} replace />;
  }
  return <>{children}</>;
}

function RoleRedirect() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/" replace />;
  return <Navigate to={user.role === 'SENIOR' ? '/senior' : '/caregiver'} replace />;
}

export default function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <AppSettings>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/app" element={<RoleRedirect />} />

              {/* Senior routes */}
              <Route
                path="/senior"
                element={
                  <ProtectedRoute role="SENIOR">
                    <SeniorLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Home />} />
                <Route path="medicines" element={<MedicationList />} />
                <Route path="doses" element={<TodayDoses />} />
                <Route path="vitals" element={<Vitals />} />
                <Route path="checkin" element={<CheckIn />} />
                <Route path="emergency" element={<Emergency />} />
                <Route path="appointments" element={<Appointments />} />
                <Route path="side-effects" element={<SideEffects />} />
                <Route path="games" element={<BrainBoost />} />
                <Route path="report" element={<DoctorReport />} />
                <Route path="settings" element={<SeniorSettings />} />
              </Route>

              {/* Caregiver routes */}
              <Route
                path="/caregiver"
                element={
                  <ProtectedRoute role="CAREGIVER">
                    <CaregiverLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<CaregiverDashboard />} />
                <Route path="settings" element={<CaregiverSettings />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </AppSettings>
      </AuthProvider>
    </I18nProvider>
  );
}
