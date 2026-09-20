'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchApi } from '../../../../lib/api-client';

interface StaffDetail {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  roles: string[];
  isActive: boolean;
  branches: Array<{ branch: { id: string; name: string } }>;
  staffProfile?: {
    specialty?: string;
    qualifications?: string;
    licenseNo?: string;
    consultationFeeMinor?: number;
    slotMinutes?: number;
    bio?: string;
    isPublic?: boolean;
  };
}

export default function StaffDetailPage() {
  const params = useParams();
  const router = useRouter();
  const staffId = params?.id as string;

  const [staff, setStaff] = useState<StaffDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [profileForm, setProfileForm] = useState({
    specialty: '',
    qualifications: '',
    licenseNo: '',
    consultationFeeMinor: 0,
    slotMinutes: 15,
    bio: '',
    isPublic: true,
  });

  const loadStaffDetail = async () => {
    setLoading(true);
    try {
      const res = await fetchApi<StaffDetail>(`/api/v1/staff/${staffId}`);
      setStaff(res.data);
      if (res.data.staffProfile) {
        setProfileForm({
          specialty: res.data.staffProfile.specialty || '',
          qualifications: res.data.staffProfile.qualifications || '',
          licenseNo: res.data.staffProfile.licenseNo || '',
          consultationFeeMinor: res.data.staffProfile.consultationFeeMinor || 0,
          slotMinutes: res.data.staffProfile.slotMinutes || 15,
          bio: res.data.staffProfile.bio || '',
          isPublic: res.data.staffProfile.isPublic !== false,
        });
      }
    } catch {
      setErrorMsg('Failed to load staff details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (staffId) loadStaffDetail();
  }, [staffId]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      await fetchApi(`/api/v1/staff/${staffId}/profile`, {
        method: 'PATCH',
        body: JSON.stringify(profileForm),
      });
      setSuccessMsg('Staff metadata & clinical profile updated successfully!');
      loadStaffDetail();
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading staff profile...</div>;
  }

  if (!staff) {
    return <div className="p-8 text-center text-rose-600">Staff member not found.</div>;
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/staff')}
          className="text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          ← Back to Staff Directory
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
        <div className="flex items-start justify-between border-b border-slate-200 pb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {staff.firstName} {staff.lastName}
            </h1>
            <p className="text-sm text-slate-500">{staff.email}</p>
            <div className="flex gap-2 mt-2">
              <span className="px-2.5 py-0.5 bg-sky-100 text-sky-800 rounded-full text-xs font-semibold">
                {staff.roles.join(', ')}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  staff.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}
              >
                {staff.isActive ? 'Active' : 'Deactivated'}
              </span>
            </div>
          </div>
          <div className="text-right text-xs text-slate-500">
            <div>Assigned Branches:</div>
            <div className="font-semibold text-slate-700">
              {staff.branches?.map((b) => b.branch?.name).join(', ') || 'None'}
            </div>
          </div>
        </div>

        {/* Messages */}
        {successMsg && (
          <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg text-sm">{successMsg}</div>
        )}
        {errorMsg && (
          <div className="p-3 bg-rose-50 text-rose-800 rounded-lg text-sm">{errorMsg}</div>
        )}

        {/* Profile metadata form */}
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Clinical Profile & Metadata</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Medical Specialty
              </label>
              <input
                type="text"
                value={profileForm.specialty}
                onChange={(e) => setProfileForm({ ...profileForm, specialty: e.target.value })}
                placeholder="e.g. Cardiology / Internal Medicine"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                License / Registration Number
              </label>
              <input
                type="text"
                value={profileForm.licenseNo}
                onChange={(e) => setProfileForm({ ...profileForm, licenseNo: e.target.value })}
                placeholder="e.g. MED-889911"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
              Qualifications & Degrees
            </label>
            <input
              type="text"
              value={profileForm.qualifications}
              onChange={(e) => setProfileForm({ ...profileForm, qualifications: e.target.value })}
              placeholder="e.g. MBBS, MD (Cardiology), FACC"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Consultation Fee (in Minor Units, e.g. 5000 = $50.00)
              </label>
              <input
                type="number"
                min="0"
                value={profileForm.consultationFeeMinor}
                onChange={(e) =>
                  setProfileForm({
                    ...profileForm,
                    consultationFeeMinor: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Default Slot Duration (Minutes)
              </label>
              <input
                type="number"
                min="5"
                max="240"
                value={profileForm.slotMinutes}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, slotMinutes: parseInt(e.target.value) || 15 })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
              Public Bio
            </label>
            <textarea
              rows={3}
              value={profileForm.bio}
              onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
              placeholder="Brief professional summary visible on booking portal"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isPublic"
              checked={profileForm.isPublic}
              onChange={(e) => setProfileForm({ ...profileForm, isPublic: e.target.checked })}
              className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
            />
            <label htmlFor="isPublic" className="text-sm font-medium text-slate-700 cursor-pointer">
              Show Doctor on Public Patient Booking Directory
            </label>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium shadow-sm transition"
            >
              {saving ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
