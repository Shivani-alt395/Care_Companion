import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Shield, Bell, ChevronRight, Users, Pill, Activity } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function Landing() {
  const navigate = useNavigate();
  const { login } = useAuth();

  async function tryDemo(type: 'senior' | 'caregiver') {
    const email = type === 'senior' ? 'demo.senior@carecompanion.app' : 'demo.caregiver@carecompanion.app';
    await login(email, 'Demo@1234');
    navigate(type === 'senior' ? '/senior' : '/caregiver');
  }

  return (
    <div className="min-h-screen bg-warm-50">
      {/* Header */}
      <header className="px-4 py-4 flex items-center justify-between max-w-5xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-teal-700 rounded-xl flex items-center justify-center">
            <Heart className="w-6 h-6 text-white fill-white" aria-hidden="true" />
          </div>
          <span className="text-xl font-bold text-teal-800">CareCompanion</span>
        </div>
        <div className="flex gap-2">
          <Link to="/login" className="btn-ghost text-sm px-4 py-2" style={{ minHeight: 44 }}>
            Login
          </Link>
          <Link to="/register" className="btn-primary text-sm px-4 py-2" style={{ minHeight: 44 }}>
            Sign Up
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="px-4 py-12 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-teal-50 text-teal-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
          <Heart className="w-4 h-4 fill-teal-200" aria-hidden="true" />
          Trusted by caregivers across India
        </div>

        <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
          Right medicine,<br />
          <span className="text-teal-700">right time, every time</span>
        </h1>

        <p className="text-lg text-gray-600 mb-8 leading-relaxed">
          CareCompanion helps elderly parents take medicines on schedule,
          tracks their health, and keeps family caregivers informed — all in one simple app.
        </p>

        {/* Demo buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
          <button
            onClick={() => tryDemo('senior')}
            className="btn-primary text-lg"
          >
            <Pill className="w-5 h-5" aria-hidden="true" />
            Try Demo (Senior View)
          </button>
          <button
            onClick={() => tryDemo('caregiver')}
            className="btn-secondary text-lg"
          >
            <Users className="w-5 h-5" aria-hidden="true" />
            Try Demo (Caregiver View)
          </button>
        </div>
        <p className="text-sm text-gray-500">Demo credentials: <code>Demo@1234</code> • No signup required</p>
      </section>

      {/* How it works */}
      <section className="px-4 py-12 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-10">How it works</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: '1',
                icon: Pill,
                title: 'Add Medicines',
                desc: 'Set up medicines with schedule, dosage, pill color and shape. Get reminders at the right time.',
                color: 'bg-teal-50 text-teal-700',
              },
              {
                step: '2',
                icon: Bell,
                title: 'Smart Reminders',
                desc: 'Full-screen alarm with voice: "Time to take 1 white round tablet of Metformin after breakfast."',
                color: 'bg-amber-50 text-amber-700',
              },
              {
                step: '3',
                icon: Users,
                title: 'Stay Connected',
                desc: 'Share a 6-digit code with your caregiver. They see adherence, vitals, and get alerts if something is wrong.',
                color: 'bg-blue-50 text-blue-700',
              },
            ].map(({ step, icon: Icon, title, desc, color }) => (
              <div key={step} className="card text-center">
                <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                  <Icon className="w-7 h-7" aria-hidden="true" />
                </div>
                <div className="text-sm font-bold text-gray-400 mb-1">Step {step}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-12 max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-10">Everything you need</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { icon: Bell, text: 'Voice & push medication reminders' },
            { icon: Activity, text: 'Daily wellness check-in (BP, sugar, mood)' },
            { icon: Shield, text: 'Emergency SOS with Medical ID & QR code' },
            { icon: Users, text: 'Caregiver dashboard with adherence heatmap' },
            { icon: Pill, text: 'Drug interaction & food warning checker' },
            { icon: Heart, text: 'Side effect journal for doctor visits' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3 p-4 bg-white rounded-xl border border-warm-200">
              <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-teal-700" aria-hidden="true" />
              </div>
              <span className="font-medium text-gray-800">{text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-16 bg-teal-700 text-white text-center">
        <h2 className="text-3xl font-bold mb-4">Start caring better today</h2>
        <p className="text-teal-200 mb-8 text-lg">Free to use. No subscription. Works offline.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/register" className="bg-white text-teal-700 font-semibold px-8 py-4 rounded-xl hover:bg-teal-50 transition-colors inline-flex items-center gap-2">
            Create Free Account <ChevronRight className="w-5 h-5" aria-hidden="true" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-8 text-center text-sm text-gray-500 border-t border-warm-200">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>© 2026 CareCompanion. Built with ❤️ for elderly care.</p>
          <div className="flex gap-6">
            <Link to="/privacy" className="hover:text-teal-700 transition-colors">Privacy</Link>
            <Link to="/privacy#about" className="hover:text-teal-700 transition-colors">About</Link>
          </div>
        </div>
        <p className="mt-4 text-xs text-gray-400 max-w-2xl mx-auto">
          ⚕️ Medical Disclaimer: This app is designed to assist with medication reminders and health tracking only.
          It does not replace professional medical advice, diagnosis, or treatment.
          Always consult your doctor or pharmacist for medical decisions.
        </p>
      </footer>
    </div>
  );
}
