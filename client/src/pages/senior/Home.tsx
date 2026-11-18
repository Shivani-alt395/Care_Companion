import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Pill, Heart, Calendar, Shield, Brain, AlertTriangle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../../hooks/useAuth';
import { useTranslations } from '../../i18n';
import { api } from '../../services/api';
import { SkeletonCard } from '../../components/ui/Skeleton';

interface DoseLog {
  id: string;
  status: string;
  scheduledAt: string;
  medication: { name: string; dosage: string };
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  if (hour < 20) return 'evening';
  return 'night';
}

export default function Home() {
  const { user } = useAuth();
  const { t, language } = useTranslations();

  const { data: todayDoses, isLoading } = useQuery<DoseLog[]>({
    queryKey: ['doses', 'today'],
    queryFn: () => api.get<DoseLog[]>('/doses/today'),
    refetchInterval: 60000,
  });

  const { data: checkIn } = useQuery({
    queryKey: ['checkin', 'today'],
    queryFn: () => api.get<{ id: string } | null>('/checkin/today').catch(() => null),
  });

  const pendingDoses = todayDoses?.filter(d => d.status === 'PENDING' || d.status === 'SNOOZED') ?? [];
  const takenCount = todayDoses?.filter(d => d.status === 'TAKEN').length ?? 0;
  const totalCount = todayDoses?.length ?? 0;
  const adherence = totalCount > 0 ? Math.round((takenCount / totalCount) * 100) : 0;

  const firstName = user?.profile?.firstName ?? 'there';
  const greetingKey = getGreeting();

  // Map language codes to BCP-47 locale codes for speech
  const speechLocale: Record<string, string> = {
    en: 'en-IN', hi: 'hi-IN', bn: 'bn-IN', mr: 'mr-IN',
    te: 'te-IN', ta: 'ta-IN', gu: 'gu-IN', ur: 'ur-PK',
    kn: 'kn-IN', or: 'or-IN', ml: 'ml-IN',
  };

  function readAloud(text: string) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.85;
    utterance.lang = speechLocale[language] ?? 'en-IN';
    window.speechSynthesis.speak(utterance);
  }

  // Build translated quick links
  const quickLinks = [
    { to: '/senior/vitals',       icon: Heart,     label: t.vitals.title,       color: 'bg-rose-50 text-rose-700',   iconBg: 'bg-rose-100'   },
    { to: '/senior/appointments', icon: Calendar,  label: t.appointments.title, color: 'bg-blue-50 text-blue-700',   iconBg: 'bg-blue-100'   },
    { to: '/senior/emergency',    icon: Shield,    label: t.emergency.title,    color: 'bg-red-50 text-red-700',     iconBg: 'bg-red-100'    },
    { to: '/senior/games',        icon: Brain,     label: t.games.title,        color: 'bg-purple-50 text-purple-700', iconBg: 'bg-purple-100' },
  ];

  const remainingText = pendingDoses.length > 0
    ? `${pendingDoses.length} ${t.nav.medicines}`
    : totalCount > 0 ? t.doses.allDone : t.doses.noDoses;

  return (
    <div className="px-4 pt-6 pb-4 space-y-5 animate-fade-in">
      {/* Greeting */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-500 text-base">{t.greeting[greetingKey]},</p>
          <h1 className="text-3xl font-bold text-gray-900">{firstName} ☀️</h1>
          <p className="text-gray-400 text-sm mt-1">{format(new Date(), 'EEEE, d MMMM yyyy')}</p>
        </div>
        <button
          onClick={() => readAloud(`${t.greeting[greetingKey]}, ${firstName}. ${remainingText}`)}
          className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center text-teal-700"
          aria-label="Read aloud"
        >
          🔊
        </button>
      </div>

      {/* Daily Check-in banner */}
      {!checkIn && (
        <div className="card border-2 border-amber-300 bg-amber-50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-2xl">✋</div>
            <div className="flex-1">
              <p className="font-semibold text-amber-800">{t.checkIn.title}</p>
              <p className="text-amber-600 text-sm">{t.settings.medical_disclaimer.split('.')[0]}</p>
            </div>
            <Link to="/senior/checkin" className="bg-amber-500 text-white font-bold px-4 py-2 rounded-xl text-sm">
              {t.checkIn.button}
            </Link>
          </div>
        </div>
      )}

      {checkIn && (
        <div className="card bg-green-50 border-green-200">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-600" aria-hidden="true" />
            <div>
              <p className="font-semibold text-green-800">{t.checkIn.done}</p>
            </div>
          </div>
        </div>
      )}

      {/* Medicine adherence card */}
      <div className="card-teal">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-white">{t.doses.title}</h2>
          <span className="text-teal-200 text-sm">{takenCount}/{totalCount} {t.doses.taken}</span>
        </div>
        {isLoading ? (
          <div className="h-2 bg-teal-600 rounded-full" />
        ) : (
          <div className="h-3 bg-teal-600 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-500"
              style={{ width: `${adherence}%` }}
              role="progressbar"
              aria-valuenow={adherence}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        )}
        <p className="text-teal-200 text-sm mt-2">{remainingText}</p>

        <Link
          to="/senior/doses"
          className="mt-4 w-full bg-white text-teal-700 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2"
        >
          <Pill className="w-5 h-5" aria-hidden="true" /> {t.doses.title}
        </Link>
      </div>

      {/* Quick access grid */}
      <div className="grid grid-cols-2 gap-3">
        {quickLinks.map(({ to, icon: Icon, label, color, iconBg }) => (
          <Link
            key={to}
            to={to}
            className={`card flex flex-col items-center gap-3 py-5 ${color} border-0`}
          >
            <div className={`w-12 h-12 ${iconBg} rounded-xl flex items-center justify-center`}>
              <Icon className="w-6 h-6" aria-hidden="true" />
            </div>
            <span className="font-semibold text-sm text-center">{label}</span>
          </Link>
        ))}
      </div>

      {/* Next upcoming dose */}
      {pendingDoses.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-amber-600" aria-hidden="true" />
            <h3 className="font-semibold text-gray-800">{t.doses.pending}</h3>
          </div>
          {isLoading ? <SkeletonCard /> : (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-gray-900 text-lg">{pendingDoses[0].medication.name}</p>
                <p className="text-gray-500">{pendingDoses[0].medication.dosage}</p>
                <p className="text-teal-600 font-medium text-sm mt-1">
                  {format(new Date(pendingDoses[0].scheduledAt), 'h:mm a')}
                </p>
              </div>
              <Link to="/senior/doses" className="btn-primary text-sm px-4">
                {t.doses.take}
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
