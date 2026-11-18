import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Shield, Download } from 'lucide-react';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-warm-50">
      <header className="px-4 py-4 flex items-center gap-2 border-b border-warm-200 bg-white">
        <div className="w-10 h-10 bg-teal-700 rounded-xl flex items-center justify-center">
          <Heart className="w-6 h-6 text-white fill-white" aria-hidden="true" />
        </div>
        <Link to="/" className="text-xl font-bold text-teal-800">CareCompanion</Link>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
        <section id="about">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">About CareCompanion</h1>
          <div className="card space-y-4">
            <p className="text-gray-700 leading-relaxed">
              CareCompanion is a medication management and health tracking platform designed specifically for elderly individuals
              and their caregivers. Our mission is to help seniors take the right medicine at the right time, track their health,
              and stay connected with family.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Built for a solo hackathon, CareCompanion is a full-stack web application with offline support, multilingual interface
              (English, Hindi, Kannada), voice reminders, and an accessibility-first design.
            </p>
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
              <p className="text-teal-800 font-semibold mb-1">⚕️ Medical Disclaimer</p>
              <p className="text-teal-700 text-sm">
                CareCompanion is designed to assist with medication reminders and health tracking only.
                It does not provide medical advice, diagnosis, or treatment recommendations.
                Always consult your doctor, pharmacist, or qualified healthcare provider for all medical decisions.
                Never ignore professional medical advice because of something you read in this app.
              </p>
            </div>
          </div>
        </section>

        <section id="privacy">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Shield className="w-6 h-6 text-teal-700" aria-hidden="true" /> Privacy Policy
          </h2>
          <div className="card space-y-4 text-gray-700">
            <p>Last updated: November 2026</p>

            <div>
              <h3 className="font-bold mb-2">What data we store</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Account information: email, hashed password, name, role</li>
                <li>Health profile: blood group, allergies, medical conditions (optional)</li>
                <li>Medications: names, dosages, schedules</li>
                <li>Dose logs: when medicines were taken, skipped, or missed</li>
                <li>Vitals: blood pressure, sugar, weight, sleep, mood, pain recordings</li>
                <li>Daily check-ins and notes</li>
                <li>Appointments and questions</li>
                <li>Side effect reports</li>
                <li>Caregiver linking information</li>
                <li>Audit logs: login events, data exports, account deletions</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold mb-2">How we use your data</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>To provide medication reminders and health tracking features</li>
                <li>To show caregivers the health status of linked seniors (with consent)</li>
                <li>To generate doctor visit summaries</li>
                <li>To send push notifications for missed doses and alerts</li>
                <li>We do NOT sell your data to third parties</li>
                <li>We do NOT use your health data for advertising</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold mb-2">Data security</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Passwords are hashed using Argon2id (industry standard)</li>
                <li>Authentication uses short-lived JWT tokens + rotating refresh tokens in httpOnly cookies</li>
                <li>All caregiver access requires explicit senior consent via invite codes</li>
                <li>Seniors can revoke caregiver access at any time</li>
                <li>Audit logs track all sensitive actions</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold mb-2 flex items-center gap-2">
                <Download className="w-4 h-4" aria-hidden="true" /> Your rights (GDPR-inspired)
              </h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li><strong>Export:</strong> Download all your data as JSON from Settings → Export My Data</li>
                <li><strong>Delete:</strong> Permanently delete your account and all data from Settings → Delete Account</li>
                <li><strong>Revoke:</strong> Revoke caregiver access at any time from Settings → Caregiver Access</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold mb-2">Data retention</h3>
              <p className="text-sm">
                Your data is retained while your account is active. When you delete your account, all personal data is permanently deleted within 24 hours.
                Anonymized audit logs may be retained for security purposes.
              </p>
            </div>

            <div>
              <h3 className="font-bold mb-2">Contact</h3>
              <p className="text-sm">
                For privacy concerns, email us at: <a href="mailto:privacy@carecompanion.app" className="text-teal-700 hover:underline">privacy@carecompanion.app</a>
              </p>
            </div>
          </div>
        </section>

        <div className="text-center">
          <Link to="/" className="btn-secondary inline-flex">← Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
