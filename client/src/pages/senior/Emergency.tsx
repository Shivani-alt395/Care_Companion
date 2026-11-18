import React, { useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Phone, Printer, Share2, Shield } from 'lucide-react';
import QRCode from 'qrcode';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { useTranslations } from '../../i18n';

interface MedicalId {
  name: string;
  dateOfBirth: string;
  bloodGroup: string;
  allergies: string[];
  conditions: string[];
  medications: { name: string; dosage: string; form: string; times: string[] }[];
  emergencyContacts: { name: string; relation: string; phone: string }[];
}

export default function Emergency() {
  const { t } = useTranslations();
  const { user } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { data: medId } = useQuery<MedicalId>({
    queryKey: ['emergency', 'medical-id'],
    queryFn: () => api.get<MedicalId>('/emergency/medical-id'),
  });

  useEffect(() => {
    if (medId && canvasRef.current) {
      const data = JSON.stringify({
        name: medId.name,
        blood: medId.bloodGroup,
        allergies: medId.allergies.join(', '),
        meds: medId.medications.map(m => `${m.name} ${m.dosage}`).join(', '),
        emergency: medId.emergencyContacts[0]?.phone,
      });
      QRCode.toCanvas(canvasRef.current, data, { width: 160, margin: 1 });
    }
  }, [medId]);

  const emergencyContacts = user?.profile?.emergencyContacts as { name: string; relation: string; phone: string }[] ?? [];

  return (
    <div className="px-4 pt-6 pb-4 space-y-5 animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
        <Shield className="w-7 h-7 text-teal-700" aria-hidden="true" />
        {t.emergency.title}
      </h1>

      {/* Giant SOS button */}
      <div className="card bg-red-50 border-2 border-red-300 text-center py-8">
        <h2 className="font-bold text-red-800 text-xl mb-6">{t.emergency.needHelp}</h2>
        <div className="flex flex-col gap-4 max-w-xs mx-auto">
          <a
            href="tel:108"
            className="bg-red-600 text-white text-xl font-bold py-5 rounded-2xl sos-pulse flex items-center justify-center gap-3"
            aria-label={t.emergency.callAmbulance}
          >
            <Phone className="w-7 h-7 fill-white" aria-hidden="true" />
            {t.emergency.callAmbulance}
          </a>

          {emergencyContacts.map((contact) => (
            <a
              key={contact.phone}
              href={`tel:${contact.phone}`}
              className="bg-teal-600 text-white text-lg font-bold py-4 rounded-2xl flex items-center justify-center gap-3"
              aria-label={`Call ${contact.name} (${contact.relation})`}
            >
              <Phone className="w-6 h-6" aria-hidden="true" />
              {t.emergency.callCaregiver} – {contact.name} ({contact.relation})
            </a>
          ))}
        </div>
      </div>

      {/* Medical ID Card */}
      {medId && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900 text-lg">🏥 {t.emergency.medicalId}</h2>
            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="btn-ghost text-sm px-3 py-2"
                aria-label={t.emergency.printMedicalId}
              >
                <Printer className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                onClick={() => {
                  const text = `MEDICAL ID\nName: ${medId.name}\nBlood: ${medId.bloodGroup}\nAllergies: ${medId.allergies.join(', ')}\nConditions: ${medId.conditions.join(', ')}\nMedicines: ${medId.medications.map(m => `${m.name} ${m.dosage}`).join(', ')}\nEmergency: ${medId.emergencyContacts[0]?.name} ${medId.emergencyContacts[0]?.phone}`;
                  navigator.clipboard.writeText(text);
                  alert('Medical ID copied to clipboard!');
                }}
                className="btn-ghost text-sm px-3 py-2"
                aria-label={t.emergency.shareQR}
              >
                <Share2 className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div id="medical-id-printable" className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide">{t.emergency.name}</p>
                <p className="font-bold text-gray-900">{medId.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide">{t.emergency.bloodGroup}</p>
                <p className="font-bold text-red-600 text-xl">{medId.bloodGroup}</p>
              </div>
            </div>

            {medId.allergies.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide mb-1">⚠️ {t.emergency.allergies}</p>
                <div className="flex flex-wrap gap-2">
                  {medId.allergies.map(a => (
                    <span key={a} className="badge-red">{a}</span>
                  ))}
                </div>
              </div>
            )}

            {medId.conditions.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide mb-1">{t.emergency.medicalConditions}</p>
                <div className="flex flex-wrap gap-2">
                  {medId.conditions.map(c => (
                    <span key={c} className="badge-amber">{c}</span>
                  ))}
                </div>
              </div>
            )}

            {medId.medications.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide mb-1">{t.emergency.currentMedicines}</p>
                <div className="space-y-1">
                  {medId.medications.map((m, i) => (
                    <p key={i} className="text-sm text-gray-700">
                      • <strong>{m.name}</strong> {m.dosage} at {m.times.join(', ')}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {medId.emergencyContacts.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide mb-1">{t.emergency.emergencyContacts}</p>
                <div className="space-y-1">
                  {medId.emergencyContacts.map((c, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-sm">{c.name}</span>
                        <span className="text-gray-400 text-xs ml-1">({c.relation})</span>
                      </div>
                      <a href={`tel:${c.phone}`} className="text-teal-700 font-bold text-sm">{c.phone}</a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* QR Code */}
            <div className="text-center pt-3 border-t border-warm-200">
              <p className="text-xs text-gray-400 mb-2">{t.emergency.scanQR}</p>
              <canvas ref={canvasRef} className="mx-auto rounded-lg" aria-label="Medical ID QR Code" />
            </div>
          </div>
        </div>
      )}

      {/* Missed dose guidance */}
      <div className="card bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-800 mb-2">{t.emergency.missedDoseTitle}</h3>
        <p className="text-blue-700 text-sm mb-2">{t.emergency.missedDoseIntro}</p>
        <ul className="space-y-1 text-blue-700 text-sm">
          <li>• {t.emergency.missedPoint1}</li>
          <li>• {t.emergency.missedPoint2}</li>
          <li>• {t.emergency.missedPoint3}</li>
          <li>• {t.emergency.missedPoint4}</li>
        </ul>
        <p className="text-xs text-blue-500 mt-2 italic">{t.emergency.missedDisclaimer}</p>
      </div>
    </div>
  );
}
