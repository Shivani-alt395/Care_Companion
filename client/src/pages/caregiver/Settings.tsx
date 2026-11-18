import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Shield, Info, Globe } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTranslations } from '../../i18n';
import { type Language, LANGUAGE_OPTIONS } from '../../i18n/translations';

export default function CaregiverSettings() {
  const { user, logout } = useAuth();
  const { language, setLanguage } = useTranslations();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="px-4 py-6 space-y-5">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      {/* Profile card */}
      <div className="card">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900 rounded-full flex items-center justify-center text-xl font-bold text-teal-700 dark:text-teal-300">
            {user?.profile?.firstName?.[0]?.toUpperCase() ?? 'C'}
          </div>
          <div>
            <p className="font-bold text-gray-900">{user?.profile?.firstName} {user?.profile?.lastName}</p>
            <p className="text-gray-500 text-sm">{user?.email}</p>
            <span className="badge-green text-xs mt-1">Caregiver</span>
          </div>
        </div>
      </div>

      {/* Language picker */}
      <div className="card">
        <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-3">
          <Globe className="w-5 h-5 text-teal-700" aria-hidden="true" /> Language / भाषा
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {LANGUAGE_OPTIONS.map(({ code, label, nativeLabel }) => (
            <button
              key={code}
              onClick={() => setLanguage(code as Language)}
              className={`flex items-center gap-2 px-3 py-3 rounded-xl font-medium text-left transition-colors border-2 ${
                language === code
                  ? 'bg-teal-700 text-white border-teal-700'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-warm-200 dark:border-gray-600 hover:border-teal-300'
              }`}
              aria-pressed={language === code}
              lang={code}
            >
              <span className="text-base leading-none">{nativeLabel}</span>
              {language !== code && (
                <span className="text-xs text-gray-400 ml-auto">{label}</span>
              )}
              {language === code && (
                <span className="ml-auto text-teal-200 text-sm">✓</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Links */}
      <div className="card space-y-1">
        <a href="/privacy" className="flex items-center gap-3 py-3 px-2 rounded-xl hover:bg-warm-50 dark:hover:bg-gray-700 text-gray-700">
          <Shield className="w-5 h-5 text-gray-400" aria-hidden="true" /> Privacy Policy
        </a>
        <a href="/privacy#about" className="flex items-center gap-3 py-3 px-2 rounded-xl hover:bg-warm-50 dark:hover:bg-gray-700 text-gray-700">
          <Info className="w-5 h-5 text-gray-400" aria-hidden="true" /> About
        </a>
        <button onClick={handleLogout} className="w-full text-left flex items-center gap-3 py-3 px-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600">
          <LogOut className="w-5 h-5" aria-hidden="true" /> Sign Out
        </button>
      </div>
    </div>
  );
}
