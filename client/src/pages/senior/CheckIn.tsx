import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { api } from '../../services/api';
import { useTranslations } from '../../i18n';
import { queueOfflineAction } from '../../offline/offlineQueue';

export default function CheckIn() {
  const { t } = useTranslations();
  const qc = useQueryClient();
  const [note, setNote] = useState('');
  const [justCheckedIn, setJustCheckedIn] = useState(false);

  const { data: todayCheckIn } = useQuery({
    queryKey: ['checkin', 'today'],
    queryFn: () => api.get<{ id: string; checkedAt: string; note?: string } | null>('/checkin/today').catch(() => null),
  });

  const checkInMutation = useMutation({
    mutationFn: async (data: { note?: string }) => {
      if (!navigator.onLine) {
        await queueOfflineAction('CHECKIN', data);
        return null;
      }
      return api.post('/checkin', data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['checkin', 'today'] });
      setJustCheckedIn(true);
    },
  });

  const isCheckedIn = !!todayCheckIn || justCheckedIn;

  return (
    <div className="px-4 pt-6 pb-4 space-y-5 animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-900">{t.checkIn.title}</h1>
      <p className="text-gray-500">{t.checkIn.letFamilyKnow}</p>

      {/* Main check-in card */}
      <div className={`card text-center py-8 ${isCheckedIn ? 'bg-green-50 border-green-200' : 'border-2 border-teal-300'}`}>
        {isCheckedIn ? (
          <>
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-12 h-12 text-green-600" aria-hidden="true" />
            </div>
            <h2 className="text-2xl font-bold text-green-800 mb-2">{t.checkIn.checkedInTitle}</h2>
            <p className="text-green-600">{t.checkIn.checkedInMsg}</p>
            {todayCheckIn?.checkedAt && (
              <p className="text-green-500 text-sm mt-2">
                {t.checkIn.checkedInAt} {format(new Date(todayCheckIn.checkedAt), 'h:mm a')}
              </p>
            )}
          </>
        ) : (
          <>
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">
              ✋
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{t.checkIn.imOkTitle}</h2>
            <p className="text-gray-500 mb-4">{t.checkIn.tapToLetFamily}</p>

            <div className="mb-4">
              <label className="label text-left block">{t.checkIn.note}</label>
              <textarea
                className="input-field text-left"
                rows={2}
                placeholder="e.g., Feeling great! Went for a walk this morning."
                value={note}
                onChange={e => setNote(e.target.value)}
                aria-label={t.checkIn.note}
              />
            </div>

            <button
              onClick={() => checkInMutation.mutate({ note: note || undefined })}
              disabled={checkInMutation.isPending}
              className="btn-primary w-full text-xl"
              aria-label={t.checkIn.button}
            >
              <span className="text-2xl">✋</span>
              {checkInMutation.isPending ? t.checkIn.checkingIn : t.checkIn.imOkButton}
            </button>

            {!navigator.onLine && (
              <p className="text-amber-600 text-sm mt-2">
                {t.checkIn.offline}
              </p>
            )}
          </>
        )}
      </div>

      {/* Information card */}
      <div className="card bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-800 mb-2">{t.checkIn.whyCheckIn}</h3>
        <ul className="space-y-1 text-blue-700 text-sm">
          <li>• {t.checkIn.whyPoint1}</li>
          <li>• {t.checkIn.whyPoint2}</li>
          <li>• {t.checkIn.whyPoint3}</li>
        </ul>
      </div>
    </div>
  );
}
