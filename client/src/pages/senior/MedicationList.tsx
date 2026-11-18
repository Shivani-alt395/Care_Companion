import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pill, Trash2, AlertTriangle, Package, Share2 } from 'lucide-react';
import { api } from '../../services/api';
import { useTranslations } from '../../i18n';
import { SkeletonCard } from '../../components/ui/Skeleton';

interface Medication {
  id: string;
  name: string;
  genericName?: string;
  dosage: string;
  form: string;
  pillColor?: string;
  pillShape?: string;
  scheduleTimes: string[];
  withFood: boolean;
  withoutFood: boolean;
  stockCount: number;
  stockUnit: string;
  dailyDoses: number;
  notes?: string;
  active: boolean;
}

const medSchema = z.object({
  name: z.string().min(1, 'Name required'),
  dosage: z.string().min(1, 'Dosage required'),
  form: z.enum(['TABLET', 'CAPSULE', 'SYRUP', 'INJECTION', 'DROPS', 'INHALER', 'PATCH', 'CREAM', 'OTHER']),
  pillColor: z.string().optional(),
  pillShape: z.string().optional(),
  scheduleTime0: z.string().regex(/^\d{2}:\d{2}$/).default('08:00'),
  withFood: z.boolean().default(false),
  withoutFood: z.boolean().default(false),
  startDate: z.string(),
  stockCount: z.coerce.number().int().min(0).default(0),
  dailyDoses: z.coerce.number().int().min(1).default(1),
  notes: z.string().optional(),
});

type MedForm = z.infer<typeof medSchema>;

const COLORS = ['white', 'yellow', 'orange', 'pink', 'red', 'blue', 'green', 'brown', 'purple'];
const SHAPES = ['round', 'oval', 'capsule', 'diamond', 'square'];

const colorBg: Record<string, string> = {
  white: 'bg-white border-2 border-gray-300',
  yellow: 'bg-yellow-200',
  orange: 'bg-orange-300',
  pink: 'bg-pink-200',
  red: 'bg-red-300',
  blue: 'bg-blue-300',
  green: 'bg-green-300',
  brown: 'bg-amber-700',
  purple: 'bg-purple-300',
};

export default function MedicationList() {
  const { t } = useTranslations();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [interactionWarnings, setInteractionWarnings] = useState<{ severity: string; message: string }[]>([]);

  const { data: medications, isLoading, error, refetch } = useQuery<Medication[]>({
    queryKey: ['medications'],
    queryFn: () => api.get<Medication[]>('/medications'),
  });

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<MedForm>({
    resolver: zodResolver(medSchema),
    defaultValues: { form: 'TABLET', startDate: new Date().toISOString().split('T')[0], stockCount: 30, dailyDoses: 1 },
  });

  const watchedName = watch('name');

  const createMutation = useMutation({
    mutationFn: (data: MedForm) => {
      const payload = {
        ...data,
        scheduleTimes: [data.scheduleTime0],
        startDate: new Date(data.startDate).toISOString(),
      };
      return api.post('/medications', payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['medications'] });
      setShowForm(false);
      reset();
      setInteractionWarnings([]);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/medications/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['medications'] }),
  });

  async function checkInteractions(newName: string) {
    if (!newName || !medications?.length) return;
    const names = [...medications.map(m => m.name), newName].join(',');
    try {
      const res = await api.get<{ warnings: { severity: string; message: string }[] }>(`/interactions/check?medicines=${encodeURIComponent(names)}`);
      setInteractionWarnings(res.warnings);
    } catch (_e) {
      // Interaction check is best-effort; fail silently
    }
  }

  function shareRefillList() {
    if (!medications) return;
    const lowStock = medications.filter(m => m.stockCount <= 7);
    const text = lowStock.map(m => `• ${m.name} ${m.dosage} – ${m.stockCount} ${t.medications.left} (${Math.floor(m.stockCount / m.dailyDoses)} ${t.medications.days})`).join('\n');
    if (text) {
      navigator.clipboard.writeText(`💊 ${t.medications.refillList}:\n${text}`);
      alert(`${t.medications.refillList} copied! Share via WhatsApp or SMS.`);
    } else {
      alert(`No medicines running low!`);
    }
  }

  if (isLoading) return <div className="px-4 pt-6 space-y-4">{[1, 2, 3].map(i => <SkeletonCard key={i} />)}</div>;
  if (error) return (
    <div className="px-4 pt-6 text-center">
      <p className="text-red-600 mb-4">{t.medications.failedToLoad}</p>
      <button onClick={() => refetch()} className="btn-secondary">{t.common.retry}</button>
    </div>
  );

  const lowStockMeds = medications?.filter(m => m.stockCount <= 7) ?? [];

  return (
    <div className="px-4 pt-6 pb-4 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t.medications.title}</h1>
        <div className="flex gap-2">
          {lowStockMeds.length > 0 && (
            <button onClick={shareRefillList} className="btn-ghost text-sm px-3 py-2" aria-label={t.medications.refillList}>
              <Share2 className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
          <button onClick={() => setShowForm(true)} className="btn-primary text-sm px-4 py-2" style={{ minHeight: 44 }}>
            <Plus className="w-4 h-4" aria-hidden="true" /> {t.common.add}
          </button>
        </div>
      </div>

      {/* Low stock alert */}
      {lowStockMeds.length > 0 && (
        <div className="card border-amber-300 bg-amber-50">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" aria-hidden="true" />
            <h2 className="font-semibold text-amber-800">{t.medications.lowStockAlert}</h2>
          </div>
          <div className="space-y-1">
            {lowStockMeds.map(m => (
              <p key={m.id} className="text-amber-700 text-sm">
                • <strong>{m.name}</strong>: {m.stockCount} {m.stockUnit} {t.medications.left}
                {' '}({Math.floor(m.stockCount / m.dailyDoses)} {t.medications.days})
              </p>
            ))}
          </div>
          <button onClick={shareRefillList} className="mt-3 text-teal-700 font-semibold text-sm flex items-center gap-1">
            <Share2 className="w-4 h-4" aria-hidden="true" />
            {t.medications.shareRefillListWA}
          </button>
        </div>
      )}

      {/* Medication list */}
      <div className="space-y-3">
        {medications?.map(med => (
          <article key={med.id} className="card">
            <div className="flex items-start gap-4">
              {/* Pill icon */}
              <div className={`w-12 h-12 ${colorBg[med.pillColor ?? 'white'] ?? 'bg-gray-100'} rounded-full flex items-center justify-center text-xl flex-shrink-0`}>
                💊
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{med.name}</h3>
                    <p className="text-gray-500 text-sm">{med.dosage} · {med.form}</p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => deleteMutation.mutate(med.id)}
                      className="w-9 h-9 bg-red-50 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-100"
                      aria-label={`${t.medications.delete} ${med.name}`}
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-xs bg-teal-50 text-teal-700 px-2 py-1 rounded-full">
                    🕐 {med.scheduleTimes.join(', ')}
                  </span>
                  {med.withFood && <span className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-full">🍽️ {t.medications.withFoodLabel}</span>}
                  {med.withoutFood && <span className="text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded-full">{t.medications.emptyStomach}</span>}
                </div>

                {/* Stock indicator */}
                <div className="flex items-center gap-2 mt-2">
                  <Package className="w-4 h-4 text-gray-400" aria-hidden="true" />
                  <div className="flex-1 h-2 bg-warm-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${med.stockCount <= 7 ? 'bg-red-500' : med.stockCount <= 14 ? 'bg-amber-500' : 'bg-green-500'}`}
                      style={{ width: `${Math.min((med.stockCount / 30) * 100, 100)}%` }}
                    />
                  </div>
                  <span className={`text-xs font-medium ${med.stockCount <= 7 ? 'text-red-600' : 'text-gray-500'}`}>
                    {med.stockCount} {t.medications.left}
                  </span>
                </div>
                {med.stockCount <= 7 && (
                  <p className="text-red-600 text-xs mt-1 font-medium">
                    ⚠️ {t.medications.runsOutIn} ~{Math.floor(med.stockCount / med.dailyDoses)} {t.medications.days}
                  </p>
                )}

                {med.notes && <p className="text-gray-400 text-xs mt-1">{med.notes}</p>}
              </div>
            </div>
          </article>
        ))}

        {medications?.length === 0 && (
          <div className="text-center py-12">
            <Pill className="w-12 h-12 text-gray-300 mx-auto mb-3" aria-hidden="true" />
            <p className="text-gray-500">{t.medications.noMedicines}</p>
          </div>
        )}
      </div>

      {/* Add Medicine Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-40 flex items-end">
          <div className="bg-white dark:bg-gray-800 w-full max-h-[90vh] rounded-t-3xl overflow-y-auto animate-slide-up">
            <div className="sticky top-0 bg-white dark:bg-gray-800 px-6 py-4 border-b border-warm-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-bold dark:text-gray-100">{t.medications.add}</h2>
              <button onClick={() => { setShowForm(false); reset(); setInteractionWarnings([]); }} aria-label={t.common.close}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="px-6 py-4 space-y-4">
              <div>
                <label className="label">{t.medications.name} *</label>
                <input
                  type="text"
                  className={`input-field ${errors.name ? 'border-red-400' : ''}`}
                  {...register('name')}
                  onBlur={() => checkInteractions(watchedName)}
                  placeholder="e.g., Metformin"
                />
                {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>}
              </div>

              {/* Interaction warnings */}
              {interactionWarnings.length > 0 && (
                <div className="space-y-2">
                  {interactionWarnings.map((w, i) => (
                    <div key={i} className={`p-3 rounded-xl text-sm ${w.severity === 'red' ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-amber-50 text-amber-800 border border-amber-200'}`}>
                      {w.severity === 'red' ? '🔴' : '🟡'} {w.message}
                    </div>
                  ))}
                </div>
              )}

              <div>
                <label className="label">{t.medications.dosage} *</label>
                <input type="text" className={`input-field ${errors.dosage ? 'border-red-400' : ''}`} {...register('dosage')} placeholder="e.g., 500mg" />
              </div>

              <div>
                <label className="label">{t.medications.form}</label>
                <select className="input-field" {...register('form')}>
                  {['TABLET', 'CAPSULE', 'SYRUP', 'INJECTION', 'DROPS', 'INHALER', 'PATCH', 'CREAM', 'OTHER'].map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">{t.medications.scheduleTime}</label>
                <input type="time" className="input-field" {...register('scheduleTime0')} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">{t.medications.pillColor}</label>
                  <div className="flex flex-wrap gap-2">
                    {COLORS.map(c => (
                      <label key={c} className="cursor-pointer">
                        <input type="radio" value={c} {...register('pillColor')} className="sr-only" />
                        <div className={`w-8 h-8 rounded-full ${colorBg[c]} cursor-pointer hover:scale-110 transition-transform`} title={c} />
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="label">{t.medications.pillShape}</label>
                  <select className="input-field" {...register('pillShape')}>
                    <option value="">Select...</option>
                    {SHAPES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" {...register('withFood')} className="w-5 h-5 rounded accent-teal-600" />
                  <span className="text-sm font-medium">{t.medications.withFoodLabel}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" {...register('withoutFood')} className="w-5 h-5 rounded accent-teal-600" />
                  <span className="text-sm font-medium">{t.medications.emptyStomach}</span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">{t.medications.startDateLabel}</label>
                  <input type="date" className="input-field" {...register('startDate')} />
                </div>
                <div>
                  <label className="label">{t.medications.stockCount}</label>
                  <input type="number" min="0" className="input-field" {...register('stockCount')} />
                </div>
              </div>

              <div>
                <label className="label">{t.medications.notesOptional}</label>
                <textarea className="input-field" rows={2} {...register('notes')} placeholder="Any special instructions..." />
              </div>

              <div className="flex gap-3 pb-4">
                <button type="button" onClick={() => { setShowForm(false); reset(); }} className="btn-secondary flex-1">{t.common.cancel}</button>
                <button type="submit" className="btn-primary flex-1" disabled={isSubmitting || createMutation.isPending}>
                  {createMutation.isPending ? t.common.saving : t.medications.saveMedicine}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
