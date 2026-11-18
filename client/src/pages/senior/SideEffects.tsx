import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { api } from '../../services/api';
import { useTranslations } from '../../i18n';

interface SideEffect {
  id: string;
  medicationId?: string;
  description: string;
  severity: number;
  occurredAt: string;
  resolved: boolean;
  medication?: { name: string; dosage: string };
}

interface Medication {
  id: string;
  name: string;
  dosage: string;
}

export default function SideEffects() {
  const { t } = useTranslations();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState(2);
  const [selectedMedId, setSelectedMedId] = useState('');

  const SEVERITY_LABELS = [
    '', t.sideEffects.veryMild, t.sideEffects.mild, t.sideEffects.moderate, t.sideEffects.severe, t.sideEffects.verySevere
  ];
  const SEVERITY_COLORS = ['', 'text-green-600', 'text-green-600', 'text-amber-600', 'text-red-600', 'text-red-800'];

  const { data: effects } = useQuery<SideEffect[]>({
    queryKey: ['side-effects'],
    queryFn: () => api.get<SideEffect[]>('/side-effects'),
  });

  const { data: medications } = useQuery<Medication[]>({
    queryKey: ['medications'],
    queryFn: () => api.get<Medication[]>('/medications'),
  });

  const createMutation = useMutation({
    mutationFn: () => api.post('/side-effects', {
      description,
      severity,
      medicationId: selectedMedId || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['side-effects'] });
      setShowForm(false);
      setDescription('');
      setSeverity(2);
      setSelectedMedId('');
    },
  });

  const resolveMutation = useMutation({
    mutationFn: (id: string) => api.put(`/side-effects/${id}`, { resolved: true, resolvedAt: new Date().toISOString() }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['side-effects'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/side-effects/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['side-effects'] }),
  });

  const active = effects?.filter(e => !e.resolved) ?? [];
  const resolved = effects?.filter(e => e.resolved) ?? [];

  return (
    <div className="px-4 pt-6 pb-4 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t.sideEffects.title}</h1>
          <p className="text-gray-500 text-sm">{t.sideEffects.trackShare}</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary text-sm px-4 py-2" style={{ minHeight: 44 }}>
          <Plus className="w-4 h-4" aria-hidden="true" /> {t.sideEffects.add}
        </button>
      </div>

      {/* Active effects */}
      {active.length > 0 && (
        <section>
          <h2 className="font-bold text-gray-700 text-sm uppercase mb-3">{t.sideEffects.active}</h2>
          <div className="space-y-3">
            {active.map(effect => (
              <article key={effect.id} className="card border-l-4 border-l-amber-500">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{effect.description}</p>
                    {effect.medication && (
                      <p className="text-sm text-teal-600 mt-1">💊 {effect.medication.name} {effect.medication.dosage}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <span className={`text-sm font-medium ${SEVERITY_COLORS[effect.severity]}`}>
                        {t.sideEffects.severityLabel} {SEVERITY_LABELS[effect.severity]}
                      </span>
                      <span className="text-xs text-gray-400">{format(new Date(effect.occurredAt), 'MMM d')}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => resolveMutation.mutate(effect.id)}
                      className="text-green-600 hover:text-green-800 p-1"
                      title={t.sideEffects.resolve}
                      aria-label={t.sideEffects.resolve}
                    >
                      <CheckCircle className="w-5 h-5" aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => deleteMutation.mutate(effect.id)}
                      className="text-gray-300 hover:text-red-500 p-1"
                      aria-label={t.common.delete}
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {active.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <p className="text-4xl mb-2">✅</p>
          <p>{t.sideEffects.noActive}</p>
        </div>
      )}

      {resolved.length > 0 && (
        <section>
          <h2 className="font-bold text-gray-700 text-sm uppercase mb-3">{t.sideEffects.resolvedLabel}</h2>
          <div className="space-y-2">
            {resolved.slice(0, 5).map(effect => (
              <div key={effect.id} className="card bg-gray-50 opacity-70">
                <p className="text-gray-600 line-through text-sm">{effect.description}</p>
                <p className="text-xs text-gray-400 mt-1">{format(new Date(effect.occurredAt), 'MMM d')}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Add form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-40 flex items-end">
          <div className="bg-white dark:bg-gray-800 w-full rounded-t-3xl animate-slide-up">
            <div className="px-6 py-4 border-b border-warm-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-bold dark:text-gray-100">{t.sideEffects.logTitle}</h2>
              <button onClick={() => setShowForm(false)} aria-label={t.common.close}>✕</button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="label">{t.sideEffects.whatHappened}</label>
                <textarea className="input-field" rows={3} placeholder="e.g., Nausea after taking Metformin..." value={description} onChange={e => setDescription(e.target.value)} />
              </div>

              <div>
                <label className="label">{t.sideEffects.relatedMedicine}</label>
                <select className="input-field" value={selectedMedId} onChange={e => setSelectedMedId(e.target.value)}>
                  <option value="">{t.sideEffects.selectMedicine}</option>
                  {medications?.map(m => <option key={m.id} value={m.id}>{m.name} {m.dosage}</option>)}
                </select>
              </div>

              <div>
                <label className="label">{t.sideEffects.severityLabel} {SEVERITY_LABELS[severity]}</label>
                <input type="range" min="1" max="5" value={severity} onChange={e => setSeverity(parseInt(e.target.value))} className="w-full accent-teal-600 mt-2" />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>{t.sideEffects.veryMild}</span>
                  <span>{t.sideEffects.verySevere}</span>
                </div>
              </div>

              <div className="flex gap-3 pb-4">
                <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">{t.common.cancel}</button>
                <button onClick={() => createMutation.mutate()} className="btn-primary flex-1" disabled={!description || createMutation.isPending}>
                  {createMutation.isPending ? t.common.saving : t.common.save}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
