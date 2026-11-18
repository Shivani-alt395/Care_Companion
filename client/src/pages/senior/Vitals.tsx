import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Plus, TrendingUp, AlertTriangle } from 'lucide-react';
import { api } from '../../services/api';
import { useTranslations } from '../../i18n';

interface Vital {
  id: string;
  type: string;
  value: number;
  value2?: number;
  unit: string;
  recordedAt: string;
}

type VitalTrends = Record<string, { date: string; value: number; value2?: number }[]>;

const VITAL_CONFIG = {
  BLOOD_PRESSURE: { labelKey: 'bloodPressure' as const, unit: 'mmHg', icon: '🫀', color: '#e53e3e', normalRange: [90, 130] },
  BLOOD_SUGAR:    { labelKey: 'bloodSugar' as const,    unit: 'mg/dL', icon: '🩸', color: '#ed8936', normalRange: [70, 140] },
  WEIGHT:         { labelKey: 'weight' as const,         unit: 'kg',    icon: '⚖️',  color: '#3182ce', normalRange: [0, 999] },
  SLEEP:          { labelKey: 'sleep' as const,          unit: 'hours', icon: '😴', color: '#805ad5', normalRange: [6, 9] },
  MOOD:           { labelKey: 'mood' as const,           unit: 'scale', icon: '😊', color: '#38a169', normalRange: [3, 5] },
  PAIN:           { labelKey: 'pain' as const,           unit: 'scale', icon: '💢', color: '#e53e3e', normalRange: [0, 3] },
  SPO2:           { labelKey: 'spo2' as const,           unit: '%',     icon: '🫁', color: '#00b5d8', normalRange: [95, 100] },
  TEMPERATURE:    { labelKey: 'temperature' as const,    unit: '°C',    icon: '🌡️',  color: '#ed8936', normalRange: [36, 37.5] },
};

const MOOD_EMOJIS = ['', '😢', '😕', '😐', '😊', '😄'];

export default function Vitals() {
  const { t } = useTranslations();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [trendDays, setTrendDays] = useState(7);
  const [chartType, setChartType] = useState('BLOOD_PRESSURE');

  // Form state
  const [vitalType, setVitalType] = useState('BLOOD_PRESSURE');
  const [bpSystolic, setBpSystolic] = useState('');
  const [bpDiastolic, setBpDiastolic] = useState('');
  const [simpleValue, setSimpleValue] = useState('');
  const [mood, setMood] = useState(3);
  const [pain, setPain] = useState(0);
  const [formError, setFormError] = useState('');

  const { data: trends } = useQuery<VitalTrends>({
    queryKey: ['vitals', 'trends', trendDays],
    queryFn: () => api.get<VitalTrends>(`/vitals/trends?days=${trendDays}`),
  });

  const { data: recentVitals } = useQuery<Vital[]>({
    queryKey: ['vitals', 'recent'],
    queryFn: () => api.get<Vital[]>('/vitals?days=7'),
  });

  const recordMutation = useMutation({
    mutationFn: (data: { type: string; value: number; value2?: number; unit: string }) =>
      api.post('/vitals', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vitals'] });
      setShowForm(false);
      setBpSystolic(''); setBpDiastolic(''); setSimpleValue('');
      setFormError('');
    },
    onError: (err: unknown) => {
      const e = err as { message?: string };
      setFormError(e?.message ?? t.common.error);
    },
  });

  function handleRecord() {
    setFormError('');
    const cfg = VITAL_CONFIG[vitalType as keyof typeof VITAL_CONFIG];
    if (!cfg) return;

    if (vitalType === 'BLOOD_PRESSURE') {
      if (!bpSystolic || !bpDiastolic) { setFormError('Please enter both Systolic and Diastolic values.'); return; }
      recordMutation.mutate({ type: vitalType, value: parseFloat(bpSystolic), value2: parseFloat(bpDiastolic), unit: 'mmHg' });
    } else if (vitalType === 'MOOD') {
      recordMutation.mutate({ type: vitalType, value: mood, unit: 'scale' });
    } else if (vitalType === 'PAIN') {
      recordMutation.mutate({ type: vitalType, value: pain, unit: 'scale' });
    } else {
      if (!simpleValue) { setFormError(`Please enter a value.`); return; }
      recordMutation.mutate({ type: vitalType, value: parseFloat(simpleValue), unit: cfg.unit });
    }
  }

  function openForm(type?: string) {
    setVitalType(type ?? 'BLOOD_PRESSURE');
    setFormError('');
    setBpSystolic(''); setBpDiastolic(''); setSimpleValue('');
    setShowForm(true);
  }

  function isAbnormal(type: string, value: number): boolean {
    const cfg = VITAL_CONFIG[type as keyof typeof VITAL_CONFIG];
    if (!cfg) return false;
    return value < cfg.normalRange[0] || value > cfg.normalRange[1];
  }

  // Get latest reading per vital type from last 7 days
  const latestByType: Record<string, Vital> = {};
  for (const v of recentVitals ?? []) {
    if (!latestByType[v.type]) latestByType[v.type] = v;
  }

  const chartData = trends?.[chartType] ?? [];
  const chartCfg = VITAL_CONFIG[chartType as keyof typeof VITAL_CONFIG];

  return (
    <div className="px-4 pt-6 pb-32 space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t.vitals.title}</h1>
        <button onClick={() => openForm()} className="btn-primary text-sm px-4 py-2" style={{ minHeight: 44 }}>
          <Plus className="w-4 h-4" aria-hidden="true" /> {t.vitals.record}
        </button>
      </div>

      {/* Quick vital cards — tap to open form pre-filled for that type */}
      <div className="grid grid-cols-2 gap-3">
        {Object.entries(VITAL_CONFIG).slice(0, 6).map(([type, cfg]) => {
          const latest = latestByType[type];
          const abnormal = latest && isAbnormal(type, latest.value);
          const label = t.vitals[cfg.labelKey] ?? cfg.labelKey;
          return (
            <button
              key={type}
              onClick={() => openForm(type)}
              className={`card text-left hover:shadow-md transition-shadow ${abnormal ? 'border-2 border-red-400' : ''}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{cfg.icon}</span>
                <span className="text-xs text-gray-500 font-medium truncate">{label}</span>
                {abnormal && <AlertTriangle className="w-3 h-3 text-red-500 flex-shrink-0" aria-hidden="true" />}
              </div>
              {latest ? (
                <p className={`text-lg font-bold ${abnormal ? 'text-red-600' : 'text-gray-900'}`}>
                  {type === 'BLOOD_PRESSURE'
                    ? `${latest.value}/${latest.value2}`
                    : type === 'MOOD'
                    ? MOOD_EMOJIS[Math.round(latest.value)]
                    : latest.value}
                  <span className="text-xs text-gray-400 font-normal ml-1">{cfg.unit}</span>
                </p>
              ) : (
                <p className="text-sm text-teal-600 font-medium">{t.vitals.tapToRecord}</p>
              )}
            </button>
          );
        })}
      </div>

      {/* Trend chart */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-teal-600" aria-hidden="true" />
            <h2 className="font-bold text-gray-900">{t.vitals.trends}</h2>
          </div>
          <div className="flex gap-2">
            {[7, 30].map(d => (
              <button key={d} onClick={() => setTrendDays(d)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${trendDays === d ? 'bg-teal-700 text-white' : 'bg-warm-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                {d}d
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
          {Object.entries(VITAL_CONFIG).map(([type, cfg]) => (
            <button key={type} onClick={() => setChartType(type)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex-shrink-0 ${chartType === type ? 'bg-teal-700 text-white' : 'bg-warm-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
              {cfg.icon} {t.vitals[cfg.labelKey] ?? cfg.labelKey}
            </button>
          ))}
        </div>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0ece8" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => `${v} ${chartCfg?.unit ?? ''}`} />
              <Line type="monotone" dataKey="value" stroke={chartCfg?.color ?? '#0d7a73'} strokeWidth={2} dot={false} />
              {chartType === 'BLOOD_PRESSURE' && (
                <Line type="monotone" dataKey="value2" stroke="#805ad5" strokeWidth={2} dot={false} strokeDasharray="5 5" />
              )}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-32 flex items-center justify-center text-gray-400 text-sm text-center">
            {t.vitals.noDataYet}
          </div>
        )}
      </div>

      {/* ── Record Vital Modal ─────────────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end" onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div className="bg-white dark:bg-gray-800 w-full rounded-t-3xl flex flex-col" style={{ maxHeight: '85vh' }}>

            {/* Header */}
            <div className="flex-shrink-0 px-6 pt-5 pb-4 border-b border-warm-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t.vitals.recordVital}</h2>
              <button onClick={() => setShowForm(false)} className="w-10 h-10 rounded-full bg-warm-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-300 text-lg hover:bg-warm-200 dark:hover:bg-gray-600" aria-label={t.common.close}>✕</button>
            </div>

            {/* Scrollable form */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">

              {/* Type selector */}
              <div>
                <label className="label">{t.vitals.whatRecording}</label>
                <select
                  className="input-field text-base"
                  value={vitalType}
                  onChange={e => { setVitalType(e.target.value); setFormError(''); setBpSystolic(''); setBpDiastolic(''); setSimpleValue(''); }}
                >
                  {Object.entries(VITAL_CONFIG).map(([type, cfg]) => (
                    <option key={type} value={type}>{cfg.icon} {t.vitals[cfg.labelKey] ?? cfg.labelKey} ({cfg.unit})</option>
                  ))}
                </select>
              </div>

              {/* Input fields per type */}
              {vitalType === 'BLOOD_PRESSURE' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">{t.vitals.systolic}</label>
                    <input type="number" inputMode="numeric" className="input-field text-xl font-bold" placeholder="e.g. 120" value={bpSystolic} onChange={e => setBpSystolic(e.target.value)} autoFocus />
                  </div>
                  <div>
                    <label className="label">{t.vitals.diastolic}</label>
                    <input type="number" inputMode="numeric" className="input-field text-xl font-bold" placeholder="e.g. 80" value={bpDiastolic} onChange={e => setBpDiastolic(e.target.value)} />
                  </div>
                  <p className="col-span-2 text-xs text-gray-400">Normal range: 90–130 / 60–90 mmHg</p>
                </div>
              )}

              {vitalType === 'BLOOD_SUGAR' && (
                <div>
                  <label className="label">{t.vitals.bloodSugar} (mg/dL)</label>
                  <input type="number" inputMode="numeric" className="input-field text-xl font-bold" placeholder="e.g. 110" value={simpleValue} onChange={e => setSimpleValue(e.target.value)} autoFocus />
                  <p className="text-xs text-gray-400 mt-1">Normal fasting: 70–100 mg/dL · After meal: &lt;140 mg/dL</p>
                </div>
              )}

              {vitalType === 'WEIGHT' && (
                <div>
                  <label className="label">{t.vitals.weight} (kg)</label>
                  <input type="number" inputMode="decimal" step="0.1" className="input-field text-xl font-bold" placeholder="e.g. 65.5" value={simpleValue} onChange={e => setSimpleValue(e.target.value)} autoFocus />
                </div>
              )}

              {vitalType === 'SLEEP' && (
                <div>
                  <label className="label">{t.vitals.sleep} (hours last night)</label>
                  <input type="number" inputMode="decimal" step="0.5" min="0" max="24" className="input-field text-xl font-bold" placeholder="e.g. 7" value={simpleValue} onChange={e => setSimpleValue(e.target.value)} autoFocus />
                  <p className="text-xs text-gray-400 mt-1">Recommended: 7–9 hours for seniors</p>
                </div>
              )}

              {vitalType === 'SPO2' && (
                <div>
                  <label className="label">{t.vitals.spo2} (%)</label>
                  <input type="number" inputMode="numeric" min="80" max="100" className="input-field text-xl font-bold" placeholder="e.g. 98" value={simpleValue} onChange={e => setSimpleValue(e.target.value)} autoFocus />
                  <p className="text-xs text-gray-400 mt-1">Normal: 95–100%. Below 94% — contact doctor.</p>
                </div>
              )}

              {vitalType === 'TEMPERATURE' && (
                <div>
                  <label className="label">{t.vitals.temperature} (°C)</label>
                  <input type="number" inputMode="decimal" step="0.1" className="input-field text-xl font-bold" placeholder="e.g. 37.0" value={simpleValue} onChange={e => setSimpleValue(e.target.value)} autoFocus />
                  <p className="text-xs text-gray-400 mt-1">Normal: 36–37.5°C. Fever: above 38°C</p>
                </div>
              )}

              {vitalType === 'MOOD' && (
                <div>
                  <label className="label">{t.checkIn.note}</label>
                  <div className="flex justify-between gap-2 mt-3">
                    {[1, 2, 3, 4, 5].map(v => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setMood(v)}
                        className={`flex-1 py-4 rounded-2xl text-3xl transition-all border-2 ${mood === v ? 'border-teal-500 bg-teal-50 scale-105' : 'border-warm-200 bg-white dark:bg-gray-700 dark:border-gray-600'}`}
                        aria-label={`Mood ${v}`}
                        aria-pressed={mood === v}
                      >
                        {MOOD_EMOJIS[v]}
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-1 px-1">
                    <span>{t.vitals.sad}</span><span>{t.vitals.happy}</span>
                  </div>
                </div>
              )}

              {vitalType === 'PAIN' && (
                <div>
                  <label className="label">{t.vitals.pain}: <strong className="text-teal-700">{pain}/10</strong>
                    {pain === 0 && ' — No pain 😊'}
                    {pain >= 1 && pain <= 3 && ' — Mild 🙂'}
                    {pain >= 4 && pain <= 6 && ' — Moderate 😐'}
                    {pain >= 7 && ' — Severe 😣'}
                  </label>
                  <input
                    type="range" min="0" max="10" step="1" value={pain}
                    onChange={e => setPain(parseInt(e.target.value))}
                    className="w-full mt-3 accent-teal-600" style={{ height: '8px' }}
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>0 – {t.vitals.noPain}</span>
                    <span>10 – {t.vitals.worstPain}</span>
                  </div>
                </div>
              )}

              {/* Error message */}
              {formError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm font-medium">
                  ⚠️ {formError}
                </div>
              )}

            </div>

            {/* Fixed Save button */}
            <div className="flex-shrink-0 px-6 py-4 border-t border-warm-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex gap-3">
              <button onClick={() => setShowForm(false)} className="btn-secondary" style={{ minWidth: 100 }}>
                {t.common.cancel}
              </button>
              <button
                onClick={handleRecord}
                disabled={recordMutation.isPending}
                className="btn-primary flex-1 text-lg"
              >
                {recordMutation.isPending ? t.vitals.saving : t.vitals.saveRecord}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
