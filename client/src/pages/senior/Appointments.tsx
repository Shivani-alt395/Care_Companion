import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Calendar, MapPin, User, CheckSquare, Printer, Trash2 } from 'lucide-react';
import { format, isFuture, isPast } from 'date-fns';
import { api } from '../../services/api';
import { useTranslations } from '../../i18n';

interface Appointment {
  id: string;
  doctorName: string;
  specialty?: string;
  location?: string;
  appointmentAt: string;
  questions: string[];
  notes?: string;
  completed: boolean;
}

const schema = z.object({
  doctorName: z.string().min(1),
  specialty: z.string().optional(),
  location: z.string().optional(),
  appointmentAt: z.string().min(1),
  notes: z.string().optional(),
});
type AppointmentForm = z.infer<typeof schema>;

export default function Appointments() {
  const { t } = useTranslations();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [newQuestion, setNewQuestion] = useState('');
  const [questions, setQuestions] = useState<string[]>([]);

  const { data: appointments } = useQuery<Appointment[]>({
    queryKey: ['appointments'],
    queryFn: () => api.get<Appointment[]>('/appointments'),
  });

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<AppointmentForm>({
    resolver: zodResolver(schema),
  });

  const createMutation = useMutation({
    mutationFn: (data: AppointmentForm) => api.post('/appointments', { ...data, questions, appointmentAt: new Date(data.appointmentAt).toISOString() }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['appointments'] }); setShowForm(false); reset(); setQuestions([]); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/appointments/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  });

  const upcoming = appointments?.filter(a => !a.completed && isFuture(new Date(a.appointmentAt))) ?? [];
  const past = appointments?.filter(a => a.completed || isPast(new Date(a.appointmentAt))) ?? [];

  return (
    <div className="px-4 pt-6 pb-4 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t.appointments.title}</h1>
        <button onClick={() => setShowForm(true)} className="btn-primary text-sm px-4 py-2" style={{ minHeight: 44 }}>
          <Plus className="w-4 h-4" aria-hidden="true" /> {t.common.add}
        </button>
      </div>

      {/* Upcoming */}
      <section>
        <h2 className="font-bold text-gray-700 text-sm uppercase tracking-wide mb-3">📅 {t.appointments.upcoming}</h2>
        {upcoming.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Calendar className="w-10 h-10 mx-auto mb-2 text-gray-300" aria-hidden="true" />
            <p>{t.appointments.noUpcoming}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map(appt => (
              <ApptCard
                key={appt.id}
                appt={appt}
                onView={() => setSelectedAppt(appt)}
                onDelete={() => deleteMutation.mutate(appt.id)}
              />
            ))}
          </div>
        )}
      </section>

      {past.length > 0 && (
        <section>
          <h2 className="font-bold text-gray-700 text-sm uppercase tracking-wide mb-3">✅ {t.appointments.past}</h2>
          <div className="space-y-3">
            {past.slice(0, 3).map(appt => (
              <ApptCard key={appt.id} appt={appt} onView={() => setSelectedAppt(appt)} onDelete={() => deleteMutation.mutate(appt.id)} />
            ))}
          </div>
        </section>
      )}

      {/* Detail modal */}
      {selectedAppt && (
        <div className="fixed inset-0 bg-black/60 z-40 flex items-end">
          <div className="bg-white dark:bg-gray-800 w-full max-h-[90vh] rounded-t-3xl overflow-y-auto animate-slide-up">
            <div className="sticky top-0 bg-white dark:bg-gray-800 px-6 py-4 border-b border-warm-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-bold dark:text-gray-100">{selectedAppt.doctorName}</h2>
              <div className="flex gap-2">
                <button onClick={() => window.print()} aria-label={t.appointments.visitSummary} className="text-gray-400 hover:text-teal-700">
                  <Printer className="w-5 h-5" aria-hidden="true" />
                </button>
                <button onClick={() => setSelectedAppt(null)} aria-label={t.common.close}>✕</button>
              </div>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="flex items-center gap-2 text-gray-500"><MapPin className="w-4 h-4" />{selectedAppt.location}</div>
              <div className="flex items-center gap-2 text-gray-500"><Calendar className="w-4 h-4" />{format(new Date(selectedAppt.appointmentAt), 'PPPp')}</div>
              {selectedAppt.questions.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">{t.appointments.questionsToAsk}</h3>
                  <ul className="space-y-2">
                    {selectedAppt.questions.map((q, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckSquare className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" aria-hidden="true" />
                        <span className="text-gray-700">{q}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {selectedAppt.notes && <p className="text-gray-600 text-sm">{selectedAppt.notes}</p>}
            </div>
          </div>
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-40 flex items-end">
          <div className="bg-white dark:bg-gray-800 w-full max-h-[90vh] rounded-t-3xl overflow-y-auto animate-slide-up">
            <div className="sticky top-0 bg-white dark:bg-gray-800 px-6 py-4 border-b border-warm-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-bold dark:text-gray-100">{t.appointments.addApptTitle}</h2>
              <button onClick={() => { setShowForm(false); reset(); setQuestions([]); }} aria-label={t.common.close}>✕</button>
            </div>
            <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="px-6 py-4 space-y-4">
              <div>
                <label className="label">{t.appointments.doctor} *</label>
                <input type="text" className="input-field" {...register('doctorName')} />
              </div>
              <div>
                <label className="label">{t.appointments.specialty}</label>
                <input type="text" className="input-field" {...register('specialty')} placeholder="e.g., Cardiologist" />
              </div>
              <div>
                <label className="label">{t.appointments.location}</label>
                <input type="text" className="input-field" {...register('location')} placeholder="e.g., Apollo Hospital" />
              </div>
              <div>
                <label className="label">{t.appointments.date} *</label>
                <input type="datetime-local" className="input-field" {...register('appointmentAt')} />
              </div>

              <div>
                <label className="label">{t.appointments.questions}</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="input-field flex-1"
                    placeholder={t.appointments.typeQuestion}
                    value={newQuestion}
                    onChange={e => setNewQuestion(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newQuestion.trim()) { setQuestions(q => [...q, newQuestion.trim()]); setNewQuestion(''); }
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => { if (newQuestion.trim()) { setQuestions(q => [...q, newQuestion.trim()]); setNewQuestion(''); } }}
                    className="btn-secondary px-4"
                    style={{ minHeight: 52 }}
                  >
                    {t.common.add}
                  </button>
                </div>
                {questions.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {questions.map((q, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                        <CheckSquare className="w-4 h-4 text-teal-600 flex-shrink-0" aria-hidden="true" />
                        <span className="flex-1">{q}</span>
                        <button type="button" onClick={() => setQuestions(qs => qs.filter((_, j) => j !== i))} aria-label="Remove question" className="text-red-400 hover:text-red-600">✕</button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <label className="label">{t.appointments.notesOptional}</label>
                <textarea className="input-field" rows={2} {...register('notes')} />
              </div>

              <div className="flex gap-3 pb-4">
                <button type="button" onClick={() => { setShowForm(false); reset(); }} className="btn-secondary flex-1">{t.common.cancel}</button>
                <button type="submit" className="btn-primary flex-1" disabled={isSubmitting || createMutation.isPending}>
                  {createMutation.isPending ? t.common.saving : t.common.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ApptCard({ appt, onView, onDelete }: {
  appt: Appointment;
  onView: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslations();
  return (
    <article className="card cursor-pointer hover:shadow-md transition-shadow" onClick={onView}>
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/40 rounded-xl flex items-center justify-center flex-shrink-0">
          <User className="w-6 h-6 text-blue-700 dark:text-blue-300" aria-hidden="true" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-gray-900">{appt.doctorName}</h3>
          {appt.specialty && <p className="text-gray-500 text-sm">{appt.specialty}</p>}
          <p className="text-teal-600 font-medium text-sm mt-1">{format(new Date(appt.appointmentAt), 'PPPp')}</p>
          {appt.location && <p className="text-gray-400 text-xs mt-0.5">📍 {appt.location}</p>}
          {appt.questions.length > 0 && (
            <p className="text-gray-400 text-xs mt-1">
              📝 {appt.questions.length} {appt.questions.length > 1 ? t.appointments.questionCountPlural.replace('{n}', String(appt.questions.length)) : t.appointments.questionCount.replace('{n}', '1')}
            </p>
          )}
        </div>
        <button
          onClick={e => { e.stopPropagation(); onDelete(); }}
          className="text-gray-300 hover:text-red-500 p-1"
          aria-label={t.common.delete}
        >
          <Trash2 className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </article>
  );
}
