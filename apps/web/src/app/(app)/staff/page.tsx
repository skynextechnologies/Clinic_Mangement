'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchApi } from '../../../lib/api-client';
import { DataTable, Column } from '../../../components/ui/data-table';

interface Branch {
  id: string;
  name: string;
}

interface StaffUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  roles: string[];
  isActive: boolean;
  branches: Array<{ branch: Branch }>;
  staffProfile?: {
    specialty?: string;
    licenseNo?: string;
  };
}

export default function StaffPage() {
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [loading, setLoading] = useState(true);

  // Invite Modal State
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteData, setInviteData] = useState({
    email: '',
    roles: ['DOCTOR'],
    branchIds: [] as string[],
  });
  const [inviteResultToken, setInviteResultToken] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const loadDropdowns = async () => {
    try {
      const bRes = await fetchApi<{ items: Branch[] }>('/api/v1/branches?limit=100');
      setBranches(bRes.data.items || []);
    } catch {
      // ignore
    }
  };

  const loadStaff = async (p = page, q = search, r = selectedRole) => {
    setLoading(true);
    try {
      let query = `/api/v1/staff?page=${p}&limit=10&search=${encodeURIComponent(q)}`;
      if (r) query += `&role=${r}`;
      const res = await fetchApi<{ items: StaffUser[]; total: number }>(query);
      setStaffList(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDropdowns();
  }, []);

  useEffect(() => {
    loadStaff(page, search, selectedRole);
  }, [page, search, selectedRole]);

  const openInviteModal = () => {
    setInviteData({
      email: '',
      roles: ['DOCTOR'],
      branchIds: branches[0] ? [branches[0].id] : [],
    });
    setInviteResultToken('');
    setErrorMsg('');
    setShowInviteModal(true);
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInviteResultToken('');
    try {
      const res = await fetchApi<{ token: string }>('/api/v1/staff/invite', {
        method: 'POST',
        body: JSON.stringify(inviteData),
      });
      setInviteResultToken(res.data.token);
      loadStaff();
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'Failed to send invitation');
    }
  };

  const toggleDeactivate = async (staff: StaffUser) => {
    try {
      if (staff.isActive) {
        await fetchApi(`/api/v1/staff/${staff.id}/deactivate`, { method: 'POST' });
      } else {
        await fetchApi(`/api/v1/staff/${staff.id}/reactivate`, { method: 'POST' });
      }
      loadStaff();
    } catch {
      // ignore
    }
  };

  const columns: Column<StaffUser>[] = [
    {
      key: 'name',
      header: 'Staff Member',
      render: (item) => (
        <div>
          <Link
            href={`/staff/${item.id}`}
            className="font-semibold text-slate-900 hover:text-sky-600 transition"
          >
            {item.firstName} {item.lastName}
          </Link>
          <div className="text-xs text-slate-500">{item.email}</div>
        </div>
      ),
    },
    {
      key: 'roles',
      header: 'Role',
      render: (item) => (
        <span className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded text-xs font-medium">
          {item.roles.join(', ')}
        </span>
      ),
    },
    {
      key: 'branches',
      header: 'Branches',
      render: (item) => item.branches?.map((b) => b.branch?.name).join(', ') || '-',
    },
    {
      key: 'specialty',
      header: 'Specialty',
      render: (item) => item.staffProfile?.specialty || '-',
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (item) => (
        <span
          className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
            item.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
          }`}
        >
          {item.isActive ? 'Active' : 'Deactivated'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item) => (
        <div className="flex items-center gap-3">
          <Link
            href={`/staff/${item.id}`}
            className="text-sky-600 hover:text-sky-800 text-xs font-medium"
          >
            View / Edit Profile
          </Link>
          <button
            onClick={() => toggleDeactivate(item)}
            className={`text-xs font-medium ${
              item.isActive
                ? 'text-rose-600 hover:text-rose-800'
                : 'text-emerald-600 hover:text-emerald-800'
            }`}
          >
            {item.isActive ? 'Deactivate' : 'Reactivate'}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Staff & Organization Directory</h1>
          <p className="text-sm text-slate-500">
            Manage clinic personnel, role assignments, and invitations
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-sky-500"
          >
            <option value="">All Roles</option>
            <option value="DOCTOR">Doctor</option>
            <option value="NURSE">Nurse</option>
            <option value="RECEPTIONIST">Receptionist</option>
            <option value="ADMIN">Admin</option>
            <option value="PHARMACIST">Pharmacist</option>
            <option value="LAB_TECH">Lab Tech</option>
          </select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={staffList}
        total={total}
        page={page}
        limit={10}
        loading={loading}
        onPageChange={(p) => setPage(p)}
        onSearch={(q) => {
          setSearch(q);
          setPage(1);
        }}
        actionButton={
          <button
            onClick={openInviteModal}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-medium transition shadow-sm"
          >
            + Invite Staff Member
          </button>
        }
      />

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <h2 className="text-xl font-bold text-slate-900">Invite Staff Member</h2>

            {errorMsg && (
              <div className="p-3 bg-rose-50 text-rose-700 rounded-lg text-sm">{errorMsg}</div>
            )}

            {inviteResultToken ? (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-sm">
                  <p className="font-semibold mb-1">Invitation Issued Successfully!</p>
                  <p className="text-xs text-emerald-700 mb-2">
                    Share this invitation link with the new team member to complete account
                    creation:
                  </p>
                  <div className="p-2 bg-white border border-emerald-300 rounded font-mono text-xs break-all text-slate-800 select-all">
                    {typeof window !== 'undefined'
                      ? `${window.location.origin}/accept-invitation?token=${inviteResultToken}`
                      : `/accept-invitation?token=${inviteResultToken}`}
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleInviteSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={inviteData.email}
                    onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                    placeholder="doctor@clinicos.local"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Role
                  </label>
                  <select
                    value={inviteData.roles[0]}
                    onChange={(e) => setInviteData({ ...inviteData, roles: [e.target.value] })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    <option value="DOCTOR">Doctor</option>
                    <option value="NURSE">Nurse</option>
                    <option value="RECEPTIONIST">Receptionist</option>
                    <option value="ADMIN">Admin</option>
                    <option value="PHARMACIST">Pharmacist</option>
                    <option value="LAB_TECH">Lab Tech</option>
                    <option value="ACCOUNTANT">Accountant</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Assigned Branches
                  </label>
                  <div className="space-y-2 border border-slate-200 rounded-lg p-3 max-h-36 overflow-y-auto">
                    {branches.map((b) => (
                      <label
                        key={b.id}
                        className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={inviteData.branchIds.includes(b.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setInviteData({
                                ...inviteData,
                                branchIds: [...inviteData.branchIds, b.id],
                              });
                            } else {
                              setInviteData({
                                ...inviteData,
                                branchIds: inviteData.branchIds.filter((id) => id !== b.id),
                              });
                            }
                          }}
                          className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                        />
                        <span>{b.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-medium shadow-sm"
                  >
                    Generate Invitation
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
