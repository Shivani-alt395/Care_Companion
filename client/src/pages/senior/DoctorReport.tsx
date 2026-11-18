import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Printer } from 'lucide-react';
import { format } from 'date-fns';
import { api } from '../../services/api';
import { useTranslations } from '../../i18n';

interface DoctorSummary {
  generatedAt: string;
  period: { days: number; since: string };
  patient: { name: string; conditions: string[]; allergies: string[] };
  adherence: { percentage: number; taken: number; total: number };
  missedDoses: { medication: string; scheduledAt: string }[];
  medications: { name: string; dosage: string; form: string; times: string[] }[];
  vitals: { type: string; latest: number; min: number; max: number; avg: number }[];
  sideEffects: { description: string; severity: number; medication?: string; occurredAt: string; resolved: boolean }[];
}

export default function DoctorReport() {
  const { t } = useTranslations();

  const { data: summary, isLoading } = useQuery<DoctorSummary>({
    queryKey: ['report', 'doctor-summary'],
    queryFn: () => api.get<DoctorSummary>('/reports/doctor-summary?days=30'),
  });

  if (isLoading) {
    return (
      <div className="px-4 pt-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-warm-200 rounded w-3/4" />
          {[1,2,3].map(i => <div key={i} className="h-24 bg-warm-200 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-8 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t.report.title}</h1>
          <p className="text-gray-500 text-sm">{t.report.last30days}</p>
        </div>
        <button onClick={() => window.print()} className="btn-secondary text-sm px-4 py-2" style={{ minHeight: 44 }}>
          <Printer className="w-4 h-4" aria-hidden="true" /> {t.common.print}
        </button>
      </div>

      {summary && (
        <div id="printable-report" className="space-y-4">
          {/* Patient info */}
          <div className="card">
            <h2 className="font-bold text-gray-900 mb-3">{t.report.patientInfo}</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400">{t.emergency.name}</p>
                <p className="font-semibold">{summary.patient.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">{t.report.reportPeriod}</p>
                <p className="font-semibold">{t.report.days30}</p>
              </div>
            </div>
            {summary.patient.conditions.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-gray-400 mb-1">{t.report.conditions}</p>
                <div className="flex flex-wrap gap-2">
                  {summary.patient.conditions.map(c => <span key={c} className="badge-amber">{c}</span>)}
                </div>
              </div>
            )}
            {summary.patient.allergies.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-gray-400 mb-1">{t.report.allergies}</p>
                <div className="flex flex-wrap gap-2">
                  {summary.patient.allergies.map(a => <span key={a} className="badge-red">{a}</span>)}
                </div>
              </div>
            )}
          </div>

          {/* Adherence */}
          <div className="card">
            <h2 className="font-bold text-gray-900 mb-3">{t.report.adherence}</h2>
            <div className="flex items-center gap-4">
              <div
                className={`text-4xl font-bold ${summary.adherence.percentage >= 80 ? 'text-green-600' : summary.adherence.percentage >= 60 ? 'text-amber-600' : 'text-red-600'}`}
              >
                {summary.adherence.percentage}%
              </div>
              <div className="flex-1">
                <div className="h-4 bg-warm-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${summary.adherence.percentage >= 80 ? 'bg-green-500' : summary.adherence.percentage >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                    style={{ width: `${summary.adherence.percentage}%` }}
                  />
                </div>
                <p className="text-sm text-gray-500 mt-1">{summary.adherence.taken} {t.common.of} {summary.adherence.total} doses taken</p>
              </div>
            </div>
          </div>

          {/* Medications */}
          <div className="card">
            <h2 className="font-bold text-gray-900 mb-3">{t.report.currentMeds}</h2>
            <div className="space-y-2">
              {summary.medications.map((m, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-warm-100 last:border-0">
                  <span className="text-xl">💊</span>
                  <div>
                    <p className="font-medium">{m.name} <span className="text-gray-400 font-normal">{m.dosage}</span></p>
                    <p className="text-xs text-gray-400">{m.form} · {m.times.join(', ')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Vitals summary */}
          {summary.vitals.length > 0 && (
            <div className="card">
              <h2 className="font-bold text-gray-900 mb-3">{t.report.vitalsSummary30}</h2>
              <div className="space-y-2">
                {summary.vitals.map((v, i) => (
                  <div key={i} className="grid grid-cols-4 gap-2 py-2 border-b border-warm-100 last:border-0 text-sm">
                    <span className="font-medium text-gray-700 col-span-1">{v.type.replace(/_/g, ' ')}</span>
                    <span className="text-gray-500">{t.report.avg} <strong>{v.avg}</strong></span>
                    <span className="text-gray-500">{t.report.min} {v.min}</span>
                    <span className="text-gray-500">{t.report.max} {v.max}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Side effects */}
          {summary.sideEffects.length > 0 && (
            <div className="card">
              <h2 className="font-bold text-gray-900 mb-3">{t.report.sideEffects30}</h2>
              <div className="space-y-2">
                {summary.sideEffects.map((s, i) => (
                  <div key={i} className="text-sm py-2 border-b border-warm-100 last:border-0">
                    <p className="font-medium">{s.description}</p>
                    {s.medication && <p className="text-teal-600 text-xs">{t.report.related} {s.medication}</p>}
                    <p className="text-gray-400 text-xs">{format(new Date(s.occurredAt), 'MMM d')} · {t.report.severity} {s.severity}/5 · {s.resolved ? '✅ ' + t.common.resolved : '⚠️ ' + t.common.active}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <div className="card bg-blue-50 border-blue-200">
            <p className="text-xs text-blue-600">
              {t.report.fullDisclaimer}
            </p>
          </div>

          <p className="text-xs text-gray-400 text-center">{t.report.generated} {format(new Date(summary.generatedAt), 'PPPp')}</p>
        </div>
      )}
    </div>
  );
}
