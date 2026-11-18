import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Home, Pill, Heart, Calendar, Settings } from 'lucide-react';
import { useTranslations } from '../i18n';
import OfflineBanner from '../components/ui/OfflineBanner';
import ErrorBoundary from '../components/ui/ErrorBoundary';

export default function SeniorLayout() {
  const { t } = useTranslations();

  const navItems = [
    { to: '/senior', icon: Home, label: t.nav.home, end: true },
    { to: '/senior/doses', icon: Pill, label: t.nav.medicines },
    { to: '/senior/vitals', icon: Heart, label: t.nav.vitals },
    { to: '/senior/appointments', icon: Calendar, label: t.nav.appointments },
    { to: '/senior/settings', icon: Settings, label: t.nav.more },
  ];

  return (
    <div className="min-h-screen bg-warm-50 dark:bg-gray-900 flex flex-col transition-colors duration-200">
      <OfflineBanner />
      <main className="flex-1 pb-24 max-w-lg mx-auto w-full" id="main-content">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>

      {/* Bottom navigation */}
      <nav
        className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-warm-200 dark:border-gray-700 px-2 py-1 shadow-lg z-40"
        aria-label="Main navigation"
      >
        <div className="max-w-lg mx-auto flex justify-around">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `bottom-nav-item ${isActive ? 'active' : ''}`
              }
              aria-label={label}
            >
              <Icon className="w-6 h-6" aria-hidden="true" />
              <span className="text-xs font-medium">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
