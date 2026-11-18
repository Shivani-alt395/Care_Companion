import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { LogOut, Globe, Sun, Moon, Zap, Link2, Download, Trash2, Info, Shield } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTranslations } from '../../i18n';
import { useSettings } from '../../hooks/useSettings';
import { api } from '../../services/api';
import { type Language, LANGUAGE_OPTIONS } from '../../i18n/translations';

export default function SeniorSettings() {
  const { user, logout } = useAuth();
  const { t, language, setLanguage } = useTranslations();
  const { settings, update } = useSettings();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showInviteResult, setShowInviteResult] = useState<{ code: string; expiresAt: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data: careLinks } = useQuery({
    queryKey: ['care-links'],
    queryFn: () => api.get<{ id: string; caregiver: { profile: { firstName: string; lastName: string } } }[]>('/care-links'),
  });

  const inviteMutation = useMutation({
    mutationFn: () => api.post<{ code: string; expiresAt: string }>('/care-links/invite'),
    onSuccess: (data) => setShowInviteResult(data),
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/care-links/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['care-links'] }),
  });

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  async function handleExport() {
    const data = await api.get('/account/export');
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'carecompanion-export.json';
    a.click();
  }

  return (
    <div className="px-4 pt-6 pb-4 space-y-5 animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-900">{t.settings.title}</h1>

      {/* Profile */}
      <div className="card">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900 rounded-full flex items-center justify-center text-xl font-bold text-teal-700 dark:text-teal-300">
            {user?.profile?.firstName?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div>
            <p className="font-bold text-gray-900">{user?.profile?.firstName} {user?.profile?.lastName}</p>
            <p className="text-gray-500 text-sm">{user?.email}</p>
            <span className="badge-green text-xs mt-1">Senior</span>
          </div>
        </div>
      </div>

      {/* Accessibility */}
      <div className="card space-y-5">
        <h2 className="font-bold text-gray-900 flex items-center gap-2">
          <Zap className="w-5 h-5 text-teal-700" aria-hidden="true" /> {t.settings.accessibility}
        </h2>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="label mb-0">{t.settings.textSize}</label>
            <span className="text-sm text-gray-500">{Math.round(settings.fontScale * 100)}%</span>
          </div>
          <input
            type="range"
            min="1"
            max="2"
            step="0.1"
            value={settings.fontScale}
            onChange={e => update({ fontScale: parseFloat(e.target.value) })}
            className="w-full accent-teal-600"
            aria-label="Text size"
          />
          <div className="flex justify-between text-xs text-gray-400">
            <span>{t.settings.normal}</span>
            <span>{t.settings.large}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sun className="w-5 h-5 text-amber-500" aria-hidden="true" />
            <span className="font-medium">{t.settings.highContrast}</span>
          </div>
          <button
            onClick={() => update({ highContrast: !settings.highContrast })}
            className={`w-14 h-7 rounded-full transition-colors ${settings.highContrast ? 'bg-teal-600' : 'bg-gray-300'}`}
            aria-pressed={settings.highContrast}
            role="switch"
            aria-label="High contrast"
          >
            <span className={`block w-6 h-6 bg-white rounded-full shadow transition-transform ${settings.highContrast ? 'translate-x-7' : 'translate-x-0.5'}`} />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Moon className="w-5 h-5 text-indigo-500" aria-hidden="true" />
            <span className="font-medium">{t.settings.darkMode}</span>
          </div>
          <button
            onClick={() => update({ darkMode: !settings.darkMode })}
            className={`w-14 h-7 rounded-full transition-colors ${settings.darkMode ? 'bg-teal-600' : 'bg-gray-300'}`}
            aria-pressed={settings.darkMode}
            role="switch"
            aria-label="Dark mode"
          >
            <span className={`block w-6 h-6 bg-white rounded-full shadow transition-transform ${settings.darkMode ? 'translate-x-7' : 'translate-x-0.5'}`} />
          </button>
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

      {/* Caregiver linking */}
      <div className="card">
        <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-3">
          <Link2 className="w-5 h-5 text-teal-700" aria-hidden="true" /> {t.settings.caregiverAccess}
        </h2>

        {careLinks && careLinks.length > 0 && (
          <div className="space-y-2 mb-4">
            {careLinks.map(link => (
              <div key={link.id} className="flex items-center justify-between p-3 bg-teal-50 dark:bg-teal-900/40 rounded-xl">
                <div>
                  <p className="font-medium text-teal-800 dark:text-teal-300">
                    {link.caregiver.profile.firstName} {link.caregiver.profile.lastName}
                  </p>
                  <p className="text-teal-600 dark:text-teal-400 text-xs">{t.settings.caregiverRole}</p>
                </div>
                <button
                  onClick={() => revokeMutation.mutate(link.id)}
                  className="text-red-500 hover:text-red-700 text-sm font-medium"
                  aria-label="Revoke caregiver access"
                >
                  {t.settings.revoke}
                </button>
              </div>
            ))}
          </div>
        )}

        {showInviteResult ? (
          <div className="bg-teal-50 dark:bg-teal-900/30 border border-teal-300 dark:border-teal-700 rounded-xl p-4 text-center">
            <p className="text-sm text-teal-600 dark:text-teal-400 mb-1">{t.settings.shareCode}</p>
            <p className="text-4xl font-bold text-teal-800 dark:text-teal-300 tracking-widest mb-1">{showInviteResult.code}</p>
            <p className="text-xs text-gray-400">{t.settings.expiresIn24h}</p>
            <button onClick={() => { navigator.clipboard.writeText(showInviteResult.code); alert('Code copied!'); }} className="mt-2 text-teal-700 dark:text-teal-400 font-medium text-sm">
              {t.settings.copyCode}
            </button>
          </div>
        ) : (
          <button onClick={() => inviteMutation.mutate()} className="btn-secondary w-full" disabled={inviteMutation.isPending}>
            {inviteMutation.isPending ? t.settings.generating : t.settings.generateInviteCode}
          </button>
        )}
      </div>

      {/* Quick links */}
      <div className="card space-y-1">
        <button onClick={handleExport} className="w-full text-left flex items-center gap-3 py-3 px-2 rounded-xl hover:bg-warm-50 dark:hover:bg-gray-700 text-gray-700">
          <Download className="w-5 h-5 text-gray-400" aria-hidden="true" /> {t.settings.exportData}
        </button>
        <a href="/privacy" className="flex items-center gap-3 py-3 px-2 rounded-xl hover:bg-warm-50 dark:hover:bg-gray-700 text-gray-700">
          <Shield className="w-5 h-5 text-gray-400" aria-hidden="true" /> {t.settings.privacyPolicy}
        </a>
        <a href="/privacy#about" className="flex items-center gap-3 py-3 px-2 rounded-xl hover:bg-warm-50 dark:hover:bg-gray-700 text-gray-700">
          <Info className="w-5 h-5 text-gray-400" aria-hidden="true" /> {t.settings.about}
        </a>
      </div>

      {/* Danger zone */}
      <div className="card border-red-200 dark:border-red-900">
        <button onClick={handleLogout} className="w-full text-left flex items-center gap-3 py-3 px-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600">
          <LogOut className="w-5 h-5" aria-hidden="true" /> {t.settings.signOut}
        </button>
        <button onClick={() => setConfirmDelete(true)} className="w-full text-left flex items-center gap-3 py-3 px-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600">
          <Trash2 className="w-5 h-5" aria-hidden="true" /> {t.settings.deleteAccount}
        </button>
      </div>

      <p className="text-xs text-gray-400 text-center leading-relaxed">
        ⚕️ CareCompanion does not replace professional medical advice.<br />
        Always consult your doctor for medical decisions.
      </p>

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-red-800 dark:text-red-400 text-lg mb-2">{t.settings.deleteAccountTitle}</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">{t.settings.deleteAccountDesc}</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(false)} className="btn-secondary flex-1">{t.common.cancel}</button>
              <button
                onClick={async () => {
                  await api.delete('/account');
                  await logout();
                  navigate('/', { replace: true });
                }}
                className="btn-danger flex-1"
              >
                {t.settings.deleteForever}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
