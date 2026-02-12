import React from 'react';
import {
  PROFILE_CERTIFICATION_OPTIONS,
  PROFILE_SPECIALTY_OPTIONS,
} from '../../../../constants/profile';

interface ProfileExpertiseTabPanelProps {
  specialties: string[];
  certifications: string[];
  onToggleSpecialty: (option: string) => void;
  onToggleCertification: (option: string) => void;
}

export const ProfileExpertiseTabPanel: React.FC<ProfileExpertiseTabPanelProps> = ({
  specialties,
  certifications,
  onToggleSpecialty,
  onToggleCertification,
}) => {
  return (
    <div className="space-y-6">
      <section>
        <p className="mb-2 text-sm font-medium text-slate-700">專長領域</p>
        <div className="flex flex-wrap gap-3">
          {PROFILE_SPECIALTY_OPTIONS.map((option) => {
            const selected = specialties.includes(option);
            return (
              <button
                key={option}
                type="button"
                onClick={() => onToggleSpecialty(option)}
                className={`min-h-[44px] rounded-full border px-4 py-2 text-sm font-medium transition ${
                  selected
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 text-slate-600 hover:border-slate-400'
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <p className="mb-2 text-sm font-medium text-slate-700">證照</p>
        <div className="flex flex-wrap gap-3">
          {PROFILE_CERTIFICATION_OPTIONS.map((option) => {
            const selected = certifications.includes(option);
            return (
              <button
                key={option}
                type="button"
                onClick={() => onToggleCertification(option)}
                className={`min-h-[44px] rounded-full border px-4 py-2 text-sm font-medium transition ${
                  selected
                    ? 'border-emerald-600 bg-emerald-600 text-white'
                    : 'border-slate-200 text-slate-600 hover:border-slate-400'
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
};
