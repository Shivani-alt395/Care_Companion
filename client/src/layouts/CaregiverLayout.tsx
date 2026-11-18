import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Settings } from 'lucide-react';
import { useTranslations } from '../i18n';
import OfflineBanner from '../components/ui/OfflineBanner';
import ErrorBoundary from '../components/ui/ErrorBoundary';
import { useAuth } from '../hooks/useAuth';

export default function CaregiverLayout() {
  const { t } = useTranslations();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-warm-50 dark:bg-gray-900 transition-colors duration-200">
      <OfflineBanner />

      {/* Top bar */}
      <header className="bg-teal-700 dark:bg-teal-900 text-white px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-sm font-bold">
              {user?.profile?.firstName?.[0] ?? 'C'}
            </span>
          </div>
          <div>
            <h1 className="font-bold text-base">{t.caregiver.title}</h1>  {/* translates with language */}
            <p className="text-teal-200 text-xs">
              {user?.profile?.firstName} {user?.profile?.lastName}
            </p>
          </div>
        </div>
        <NavLink to="/caregiver/settings" aria-label="Settings">
          <Settings className="w-6 h-6 text-white/80" />
        </NavLink>
      </header>

      <main className="max-w-4xl mx-auto p-4" id="main-content">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  );
}
