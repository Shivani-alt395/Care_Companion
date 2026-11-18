import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  PieChart, Pie, Cell, ResponsiveContainer
} from 'recharts';
import { AlertTriangle, XCircle, Package, TrendingUp, Lightbulb } from 'lucide-react';
import { api } from '../../services/api';
import { useTranslations } from '../../i18n';

interface Senior {
  linkId: string;
  senior: {
    id: string;
    email: string;
    profile: {
      firstName: string;
      lastName: string;
      conditions: string[];
    } | null;
    medicationCount: number;
  };
}

interface Dashboard {
  profile: { firstName: string; lastName: string; conditions: string[] } | null;
  adherence: { percentage: number; taken: number; total: number };
  heatmap: { date: string; adherence: number | null; taken: number; total: number }[];
  missedTimeline: { medication: string; scheduledAt: string }[];
  lowStock: { id: string; name: string; stockCount: number; daysLeft: number }[];
  lastCheckIn: { checkedAt: string; note?: string } | null;
  vitalsAlerts: string[];
  activeSideEffects: number;
  insights: string[];
}

function HeatmapCell({ value }: { value: number | null }) {
  if (value === null) return <div className="w-5 h-5 bg-warm-100 dark:bg-gray-700 rounded-sm" />;
  if (value >= 90) return <div className="w-5 h-5 bg-green-500 rounded-sm" title={`${value}%`} />;
  if (value >= 70) return <div className="w-5 h-5 bg-green-300 rounded-sm" title={`${value}%`} />;
  if (value >= 50) return <div className="w-5 h-5 bg-amber-300 rounded-sm" title={`${value}%`} />;
  return <div className="w-5 h-5 bg-red-400 rounded-sm" title={`${value}%`} />;
}

export default function CaregiverDashboard() {
  const { t } = useTranslations();

  const { data: seniors } = useQuery<Senior[]>({
    queryKey: ['caregiver', 'seniors'],
    queryFn: () => api.get<Senior[]>('/caregiver/seniors'),
    refetchInterval: 60000,
  });

  const [selectedSeniorId, setSelectedSeniorId] = useState<string | null>(null);

  const activeSeniorId = selectedSeniorId ?? seniors?.[0]?.senior.id ?? null;

  const { data: dashboard, isLoading: dashLoading } = useQuery<Dashboard>({
    queryKey: ['caregiver', 'dashboard', activeSeniorId],
    queryFn: () => api.get<Dashboard>(`/caregiver/seniors/${activeSeniorId}/dashboard`),
    enabled: !!activeSeniorId,
    refetchInterval: 60000,
  });

  if (!seniors || seniors.length === 0) {
    return (
      <div className="text-center py-16 px-4">
        <div className="text-5xl mb-4">👨‍👩‍👧</div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">{t.caregiver.noSeniorsLinked}</h2>
        <p className="text-gray-500 mb-4">{t.caregiver.noSeniorsDesc}</p>
        <RedeemInviteCard />
      </div>
    );
  }

  return (
    <div className="space-y-5 py-4">
      {/* Senior selector */}
      {seniors.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {seniors.map(({ senior }) => (
            <button
              key={senior.id}
              onClick={() => setSelectedSeniorId(senior.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl font-medium transition-colors ${activeSeniorId === senior.id ? 'bg-teal-700 text-white' : 'bg-white dark:bg-gray-800 border border-warm-200 dark:border-gray-600 text-gray-700 dark:text-gray-200'}`}
            >
              {senior.profile?.firstName ?? 'Senior'}
            </button>
          ))}
        </div>
      )}

      {dashLoading && (
        <div className="text-center py-8">
          <div className="w-8 h-8 border-4 border-teal-200 border-t-teal-700 rounded-full animate-spin mx-auto" />
        </div>
      )}

      {dashboard && (
        <>
          {/* Senior header */}
          <div className="card-teal">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-teal-200 text-sm">{t.caregiver.monitoring}</p>
                <h2 className="text-2xl font-bold">{dashboard.profile?.firstName} {dashboard.profile?.lastName}</h2>
                <div className="flex flex-wrap gap-1 mt-1">
                  {dashboard.profile?.conditions.map(c => (
                    <span key={c} className="text-teal-200 bg-teal-600 text-xs px-2 py-0.5 rounded-full">{c}</span>
                  ))}
                </div>
              </div>
              <div className="text-right">
                <p className="text-teal-200 text-xs">{t.caregiver.lastCheckIn}</p>
                {dashboard.lastCheckIn ? (
                  <p className="text-white font-medium text-sm">{format(new Date(dashboard.lastCheckIn.checkedAt), 'MMM d, h:mm a')}</p>
                ) : (
                  <p className="text-red-300 font-medium text-sm flex items-center gap-1">
                    <XCircle className="w-4 h-4" aria-hidden="true" /> {t.caregiver.noCheckIn}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Alerts banner */}
          {(!dashboard.lastCheckIn || dashboard.vitalsAlerts.length > 0) && (
            <div className="card bg-red-50 border-red-300">
              <h3 className="font-bold text-red-800 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" aria-hidden="true" /> {t.caregiver.alerts}
              </h3>
              {!dashboard.lastCheckIn && (
                <p className="text-red-700 text-sm mb-1">⚠️ {dashboard.profile?.firstName} {t.caregiver.noCheckInToday}</p>
              )}
              {dashboard.vitalsAlerts.map((alert, i) => (
                <p key={i} className="text-red-700 text-sm mb-1">⚠️ {alert}</p>
              ))}
            </div>
          )}

          {/* Adherence ring */}
          <div className="grid grid-cols-2 gap-4">
            <div className="card text-center">
              <p className="text-xs text-gray-400 mb-2 font-medium">{t.caregiver.adherence30}</p>
              <div className="relative inline-block">
                <ResponsiveContainer width={120} height={120}>
                  <PieChart>
                    <Pie
                      data={[
                        { value: dashboard.adherence.percentage },
                        { value: 100 - dashboard.adherence.percentage },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={55}
                      startAngle={90}
                      endAngle={-270}
                      dataKey="value"
                    >
                      <Cell fill={dashboard.adherence.percentage >= 80 ? '#22c55e' : dashboard.adherence.percentage >= 60 ? '#f59e0b' : '#ef4444'} />
                      <Cell fill="var(--ring-bg, #f0ece8)" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-2xl font-bold ${dashboard.adherence.percentage >= 80 ? 'text-green-600' : dashboard.adherence.percentage >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                    {dashboard.adherence.percentage}%
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-1">{dashboard.adherence.taken}/{dashboard.adherence.total} doses</p>
            </div>

            <div className="space-y-3">
              {/* Stats */}
              <div className="card bg-amber-50">
                <p className="text-xs text-amber-600 font-medium">{t.caregiver.lowStock}</p>
                <p className="text-2xl font-bold text-amber-800">{dashboard.lowStock.length}</p>
                <p className="text-xs text-amber-500">{t.caregiver.lowStockMedicines}</p>
              </div>
              <div className="card bg-purple-50">
                <p className="text-xs text-purple-600 font-medium">{t.caregiver.sideEffectsActive}</p>
                <p className="text-2xl font-bold text-purple-800">{dashboard.activeSideEffects}</p>
                <p className="text-xs text-purple-500">{t.caregiver.activeLabel}</p>
              </div>
            </div>
          </div>

          {/* 30-day heatmap */}
          <div className="card">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-teal-700" aria-hidden="true" />
              {t.caregiver.adherenceCalendar}
            </h3>
            <div className="flex flex-wrap gap-1">
              {dashboard.heatmap.map(day => (
                <div key={day.date} title={`${day.date}: ${day.adherence !== null ? day.adherence + '%' : t.caregiver.noData}`}>
                  <HeatmapCell value={day.adherence} />
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
              <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-500 rounded-sm" /> ≥90%</div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 bg-amber-300 rounded-sm" /> 50-70%</div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-400 rounded-sm" /> &lt;50%</div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 bg-warm-100 dark:bg-gray-700 rounded-sm border dark:border-gray-600" /> {t.caregiver.noData}</div>
            </div>
          </div>

          {/* Weekly insights */}
          {dashboard.insights.length > 0 && (
            <div className="card bg-teal-50 border-teal-200">
              <h3 className="font-bold text-teal-800 mb-3 flex items-center gap-2">
                <Lightbulb className="w-5 h-5" aria-hidden="true" /> {t.caregiver.insights}
              </h3>
              <ul className="space-y-2">
                {dashboard.insights.map((insight, i) => (
                  <li key={i} className="text-teal-700 text-sm">{insight}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Low stock */}
          {dashboard.lowStock.length > 0 && (
            <div className="card border-amber-200">
              <h3 className="font-bold text-amber-800 mb-3 flex items-center gap-2">
                <Package className="w-5 h-5" aria-hidden="true" /> {t.caregiver.lowStock}
              </h3>
              <div className="space-y-2">
                {dashboard.lowStock.map(m => (
                  <div key={m.id} className="flex items-center justify-between py-2 border-b border-warm-100 last:border-0">
                    <span className="font-medium text-gray-800">{m.name}</span>
                    <div className="text-right">
                      <span className="text-amber-600 font-bold text-sm">{m.stockCount} {t.medications.left}</span>
                      <p className="text-xs text-gray-400">~{m.daysLeft} {t.medications.days}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Missed dose timeline */}
          {dashboard.missedTimeline.length > 0 && (
            <div className="card">
              <h3 className="font-bold text-gray-900 mb-3">{t.caregiver.recentMissed}</h3>
              <div className="space-y-2">
                {dashboard.missedTimeline.slice(-5).reverse().map((m, i) => (
                  <div key={i} className="flex items-center justify-between text-sm py-1">
                    <span className="font-medium text-gray-800">💊 {m.medication}</span>
                    <span className="text-red-500 text-xs">{format(new Date(m.scheduledAt), 'MMM d, h:mm a')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Redeem invite */}
          <RedeemInviteCard />
        </>
      )}
    </div>
  );
}

function RedeemInviteCard() {
  const { t } = useTranslations();
  const [code, setCode] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  async function handleRedeem() {
    setError('');
    try {
      await api.post('/care-links/redeem', { code: code.toUpperCase() });
      setSuccess(true);
      window.location.reload();
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message ?? t.caregiver.invalidCode);
    }
  }

  if (success) return <div className="card bg-green-50 text-center text-green-700">{t.caregiver.linkedSuccessfully}</div>;

  return (
    <div className="card">
      <h3 className="font-semibold text-gray-800 mb-3">{t.caregiver.linkNewSenior}</h3>
      <p className="text-sm text-gray-500 mb-3">{t.caregiver.enterCode}</p>
      {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
      <div className="flex gap-2">
        <input
          type="text"
          maxLength={6}
          className="input-field flex-1 uppercase tracking-widest text-center text-xl font-bold"
          placeholder="XXXXXX"
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          aria-label="Invite code"
        />
        <button
          onClick={handleRedeem}
          disabled={code.length !== 6}
          className="btn-primary px-6"
          style={{ minHeight: 52 }}
        >
          {t.caregiver.link}
        </button>
      </div>
    </div>
  );
}
