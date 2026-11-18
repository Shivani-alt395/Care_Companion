import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Check, X, Clock, Volume2 } from 'lucide-react';
import { api } from '../../services/api';
import { useTranslations } from '../../i18n';
import { DoseCardSkeleton } from '../../components/ui/Skeleton';
import { queueOfflineAction } from '../../offline/offlineQueue';

interface DoseLog {
  id: string;
  status: 'PENDING' | 'TAKEN' | 'SKIPPED' | 'MISSED' | 'SNOOZED';
  scheduledAt: string;
  takenAt?: string;
  skipReason?: string;
  medication: {
    id: string;
    name: string;
    dosage: string;
    form: string;
    pillColor?: string;
    pillShape?: string;
    withFood: boolean;
    withoutFood: boolean;
    notes?: string;
  };
}

function getTimeSlot(isoString: string): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = new Date(isoString).getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  if (hour < 20) return 'evening';
  return 'night';
}

const pillColorMap: Record<string, string> = {
  white: 'bg-white border-2 border-gray-300',
  yellow: 'bg-yellow-200',
  orange: 'bg-orange-300',
  pink: 'bg-pink-200',
  red: 'bg-red-200',
  blue: 'bg-blue-200',
  green: 'bg-green-200',
  brown: 'bg-amber-700',
  purple: 'bg-purple-200',
};

const slotIcons: Record<string, string> = {
  morning: '🌅',
  afternoon: '☀️',
  evening: '🌆',
  night: '🌙',
};

const LOCALE_MAP: Record<string, string> = {
  en: 'en-IN', hi: 'hi-IN', bn: 'bn-IN', mr: 'mr-IN', te: 'te-IN',
  ta: 'ta-IN', gu: 'gu-IN', ur: 'ur-PK', kn: 'kn-IN', or: 'or-IN', ml: 'ml-IN',
};

export default function TodayDoses() {
  const { t, language } = useTranslations();
  const qc = useQueryClient();
  const [skipDoseId, setSkipDoseId] = useState<string | null>(null);
  const [skipReason, setSkipReason] = useState('');
  const [alarmDose, setAlarmDose] = useState<DoseLog | null>(null);

  const { data: doses, isLoading, error, refetch } = useQuery<DoseLog[]>({
    queryKey: ['doses', 'today'],
    queryFn: () => api.get<DoseLog[]>('/doses/today'),
    refetchInterval: 30000,
  });

  const takeMutation = useMutation({
    mutationFn: async (doseId: string) => {
      if (!navigator.onLine) {
        await queueOfflineAction('DOSE_TAKEN', { doseId });
        return { status: 'TAKEN', id: doseId };
      }
      return api.post<DoseLog>(`/doses/${doseId}/take`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['doses', 'today'] });
    },
  });

  const skipMutation = useMutation({
    mutationFn: ({ doseId, reason }: { doseId: string; reason?: string }) =>
      api.post<DoseLog>(`/doses/${doseId}/skip`, { reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['doses', 'today'] });
      setSkipDoseId(null);
      setSkipReason('');
    },
  });

  const snoozeMutation = useMutation({
    mutationFn: (doseId: string) =>
      api.post<DoseLog>(`/doses/${doseId}/snooze`, { minutes: 10 }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['doses', 'today'] }),
  });

  function speak(text: string) {
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.85;
    u.lang = LOCALE_MAP[language] ?? 'en-IN';
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }

  if (isLoading) {
    return (
      <div className="px-4 pt-6 space-y-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">{t.doses.title}</h1>
        {[1, 2, 3].map(i => <DoseCardSkeleton key={i} />)}
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 pt-6 text-center">
        <p className="text-red-600 mb-4">{t.doses.failedToLoad}</p>
        <button onClick={() => refetch()} className="btn-secondary">{t.common.retry}</button>
      </div>
    );
  }

  const grouped: Record<string, DoseLog[]> = { morning: [], afternoon: [], evening: [], night: [] };
  for (const dose of doses ?? []) {
    const slot = getTimeSlot(dose.scheduledAt);
    grouped[slot].push(dose);
  }

  const totalTaken = doses?.filter(d => d.status === 'TAKEN').length ?? 0;
  const total = doses?.length ?? 0;

  return (
    <div className="px-4 pt-6 pb-4 space-y-5 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t.doses.title}</h1>
        <p className="text-gray-500 mt-1">{format(new Date(), 'EEEE, d MMMM')}</p>
        <div className="flex items-center gap-3 mt-3">
          <div className="flex-1 h-3 bg-warm-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-600 rounded-full transition-all duration-500"
              style={{ width: total > 0 ? `${(totalTaken / total) * 100}%` : '0%' }}
            />
          </div>
          <span className="text-sm font-semibold text-teal-700">{totalTaken}/{total}</span>
        </div>
      </div>

      {/* Full-screen alarm modal */}
      {alarmDose && (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-6 text-center">
          <div className="animate-pulse-slow mb-6">
            <div className={`w-24 h-24 rounded-full mx-auto flex items-center justify-center text-4xl shadow-xl ${pillColorMap[alarmDose.medication.pillColor ?? 'white'] ?? 'bg-white'}`}>
              💊
            </div>
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">{t.doses.alarmTitle}</h2>
          <p className="text-2xl text-white mb-2">
            {alarmDose.medication.dosage} <strong>{alarmDose.medication.name}</strong>
          </p>
          <p className="text-teal-300 text-lg mb-2">
            {alarmDose.medication.pillColor} {alarmDose.medication.pillShape} {alarmDose.medication.form?.toLowerCase()}
          </p>
          {alarmDose.medication.withFood && (
            <p className="text-amber-300 mb-2">{t.doses.withFoodAlarm}</p>
          )}
          {alarmDose.medication.withoutFood && (
            <p className="text-amber-300 mb-2">{t.doses.withoutFoodAlarm}</p>
          )}
          <p className="text-gray-300 text-sm mb-8">{format(new Date(alarmDose.scheduledAt), 'h:mm a')}</p>

          <div className="flex flex-col gap-3 w-full max-w-xs">
            <button
              onClick={() => { takeMutation.mutate(alarmDose.id); setAlarmDose(null); }}
              className="bg-green-500 text-white text-xl font-bold py-5 rounded-2xl"
            >
              {t.doses.takenButton}
            </button>
            <button
              onClick={() => { snoozeMutation.mutate(alarmDose.id); setAlarmDose(null); }}
              className="bg-amber-500 text-white text-lg font-bold py-4 rounded-2xl"
            >
              😴 {t.doses.snooze}
            </button>
            <button
              onClick={() => setAlarmDose(null)}
              className="text-gray-400 py-3"
            >
              {t.doses.dismiss}
            </button>
          </div>
        </div>
      )}

      {/* Skip reason modal */}
      {skipDoseId && (
        <div className="fixed inset-0 bg-black/60 z-40 flex items-end">
          <div className="bg-white dark:bg-gray-800 w-full rounded-t-3xl p-6 animate-slide-up">
            <h3 className="text-lg font-bold mb-4 dark:text-gray-100">{t.doses.skipTitle}</h3>
            <textarea
              className="input-field"
              placeholder={t.doses.skipPlaceholder}
              value={skipReason}
              onChange={e => setSkipReason(e.target.value)}
              rows={3}
              aria-label={t.doses.skipTitle}
            />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setSkipDoseId(null)} className="btn-secondary flex-1">{t.common.cancel}</button>
              <button
                onClick={() => skipMutation.mutate({ doseId: skipDoseId, reason: skipReason })}
                className="btn-danger flex-1"
                disabled={skipMutation.isPending}
              >
                {skipMutation.isPending ? t.doses.saving : t.doses.skipDose}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dose groups */}
      {(['morning', 'afternoon', 'evening', 'night'] as const).map(slot => {
        const slotDoses = grouped[slot];
        if (slotDoses.length === 0) return null;

        return (
          <section key={slot} aria-label={`${t.doses[slot]} medicines`}>
            <h2 className="font-bold text-gray-700 text-sm uppercase tracking-wide mb-3 flex items-center gap-2">
              <span>{slotIcons[slot]}</span>
              {t.doses[slot]}
            </h2>
            <div className="space-y-3">
              {slotDoses.map(dose => (
                <DoseCard
                  key={dose.id}
                  dose={dose}
                  onTake={() => takeMutation.mutate(dose.id)}
                  onSkip={() => setSkipDoseId(dose.id)}
                  onSnooze={() => snoozeMutation.mutate(dose.id)}
                  onAlarm={() => setAlarmDose(dose)}
                  onSpeak={() => speak(`${t.doses.alarmTitle} ${dose.medication.dosage} ${dose.medication.name}`)}
                  isTaking={takeMutation.isPending}
                />
              ))}
            </div>
          </section>
        );
      })}

      {doses?.length === 0 && (
        <div className="text-center py-12">
          <div className="text-5xl mb-4">💊</div>
          <p className="text-gray-500 text-lg">{t.doses.noDoses}</p>
        </div>
      )}
    </div>
  );
}

function DoseCard({ dose, onTake, onSkip, onSnooze, onAlarm, onSpeak, isTaking }: {
  dose: DoseLog;
  onTake: () => void;
  onSkip: () => void;
  onSnooze: () => void;
  onAlarm: () => void;
  onSpeak: () => void;
  isTaking: boolean;
}) {
  const { t } = useTranslations();
  const statusColors: Record<string, string> = {
    TAKEN: 'border-l-4 border-l-green-500 bg-green-50',
    MISSED: 'border-l-4 border-l-red-500 bg-red-50',
    SKIPPED: 'border-l-4 border-l-gray-400 bg-gray-50',
    SNOOZED: 'border-l-4 border-l-amber-500 bg-amber-50',
    PENDING: 'border-l-4 border-l-teal-500',
  };

  const pillColor = dose.medication.pillColor ?? 'white';
  const bgClass = pillColorMap[pillColor] ?? 'bg-white border-2 border-gray-200';

  return (
    <article
      className={`card ${statusColors[dose.status] ?? ''}`}
      aria-label={`${dose.medication.name} - ${dose.status}`}
    >
      <div className="flex items-start gap-4">
        {/* Pill visual */}
        <button
          onClick={onAlarm}
          aria-label={`Open alarm for ${dose.medication.name}`}
          className={`w-14 h-14 ${bgClass} rounded-full flex items-center justify-center text-xl flex-shrink-0 shadow-sm`}
        >
          💊
        </button>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-bold text-gray-900 text-lg leading-tight">{dose.medication.name}</h3>
              <p className="text-gray-500 text-sm">{dose.medication.dosage}</p>
            </div>
            <button
              onClick={onSpeak}
              className="w-9 h-9 bg-teal-50 rounded-full flex items-center justify-center text-teal-600 flex-shrink-0"
              aria-label={`Read aloud ${dose.medication.name}`}
            >
              <Volume2 className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          <div className="flex flex-wrap gap-2 mt-2">
            <span className="text-xs text-teal-600 font-medium bg-teal-50 px-2 py-1 rounded-full">
              {format(new Date(dose.scheduledAt), 'h:mm a')}
            </span>
            {dose.medication.withFood && (
              <span className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded-full">🍽️ {t.doses.withFood}</span>
            )}
            {dose.medication.withoutFood && (
              <span className="text-xs text-orange-700 bg-orange-50 px-2 py-1 rounded-full">{t.doses.withoutFood}</span>
            )}
          </div>

          {dose.status === 'TAKEN' && dose.takenAt && (
            <p className="text-green-600 text-sm mt-2 font-medium flex items-center gap-1">
              <Check className="w-4 h-4" aria-hidden="true" />
              {t.doses.takenAt} {format(new Date(dose.takenAt), 'h:mm a')}
            </p>
          )}
          {dose.status === 'MISSED' && (
            <p className="text-red-600 text-sm mt-2 font-medium">❌ {t.doses.missedLabel}</p>
          )}
          {dose.status === 'SKIPPED' && dose.skipReason && (
            <p className="text-gray-500 text-sm mt-2">{t.doses.skippedLabel} {dose.skipReason}</p>
          )}
        </div>
      </div>

      {/* Action buttons */}
      {(dose.status === 'PENDING' || dose.status === 'SNOOZED') && (
        <div className="flex gap-2 mt-4">
          <button
            onClick={onTake}
            disabled={isTaking}
            className="flex-1 bg-green-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-base hover:bg-green-700 active:bg-green-800 transition-colors min-h-[52px]"
            aria-label={`Mark ${dose.medication.name} as taken`}
          >
            <Check className="w-5 h-5" aria-hidden="true" />
            {isTaking ? t.doses.saving : t.doses.take}
          </button>
          <button
            onClick={onSnooze}
            className="bg-amber-500 text-white font-bold py-3 px-3 rounded-xl flex items-center justify-center gap-1 text-sm hover:bg-amber-600 transition-colors min-h-[52px]"
            aria-label={`Snooze ${dose.medication.name} for 10 minutes`}
          >
            <Clock className="w-4 h-4" aria-hidden="true" />
            10m
          </button>
          <button
            onClick={onSkip}
            className="bg-gray-200 text-gray-700 font-bold py-3 px-3 rounded-xl flex items-center justify-center hover:bg-gray-300 transition-colors min-h-[52px]"
            aria-label={`Skip ${dose.medication.name}`}
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
      )}
    </article>
  );
}
