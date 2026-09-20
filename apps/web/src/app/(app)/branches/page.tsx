'use client';

import React, { useEffect, useState } from 'react';
import { fetchApi } from '../../../lib/api-client';
import { DataTable, Column } from '../../../components/ui/data-table';

interface Branch {
  id: string;
  code: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  timezone: string;
  isActive: boolean;
  createdAt: string;
}

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    address: '',
    phone: '',
    email: '',
    timezone: 'UTC',
  });
  const [errorMsg, setErrorMsg] = useState('');

  const loadBranches = async (p = page, q = search) => {
    setLoading(true);
    try {
      const res = await fetchApi<{ items: Branch[]; total: number }>(
        `/api/v1/branches?page=${p}&limit=10&search=${encodeURIComponent(q)}`,
      );
      setBranches(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBranches(page, search);
  }, [page, search]);

  const openCreateModal = () => {
    setEditingBranch(null);
    setFormData({ code: '', name: '', address: '', phone: '', email: '', timezone: 'UTC' });
    setErrorMsg('');
    setShowModal(true);
  };

  const openEditModal = (branch: Branch) => {
    setEditingBranch(branch);
    setFormData({
      code: branch.code,
      name: branch.name,
      address: branch.address || '',
      phone: branch.phone || '',
      email: branch.email || '',
      timezone: branch.timezone || 'UTC',
    });
    setErrorMsg('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      if (editingBranch) {
        await fetchApi(`/api/v1/branches/${editingBranch.id}`, {
          method: 'PATCH',
          body: JSON.stringify(formData),
        });
      } else {
        await fetchApi('/api/v1/branches', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
      }
      setShowModal(false);
      loadBranches();
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'Failed to save branch');
    }
  };

  const toggleStatus = async (branch: Branch) => {
    try {
      if (branch.isActive) {
        await fetchApi(`/api/v1/branches/${branch.id}/deactivate`, { method: 'PATCH' });
      } else {
        await fetchApi(`/api/v1/branches/${branch.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ isActive: true }),
        });
      }
      loadBranches();
    } catch {
      // Handle error
    }
  };

  const columns: Column<Branch>[] = [
    { key: 'code', header: 'Code' },
    { key: 'name', header: 'Branch Name' },
    { key: 'phone', header: 'Phone' },
    { key: 'email', header: 'Email' },
    {
      key: 'isActive',
      header: 'Status',
      render: (item) => (
        <span
          className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
            item.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
          }`}
        >
          {item.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item) => (
        <div className="flex gap-2">
          <button
            onClick={() => openEditModal(item)}
            className="text-sky-600 hover:text-sky-800 text-xs font-medium"
          >
            Edit
          </button>
          <button
            onClick={() => toggleStatus(item)}
            className="text-slate-600 hover:text-slate-800 text-xs font-medium"
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
          <h1 className="text-2xl font-bold text-slate-900">Clinic Branches</h1>
          <p className="text-sm text-slate-500">
            Manage location details, contact info, and status
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={branches}
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
            onClick={openCreateModal}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-medium transition shadow-sm"
          >
            + Add Branch
          </button>
        }
      />

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <h2 className="text-xl font-bold text-slate-900">
              {editingBranch ? 'Edit Branch' : 'Create New Branch'}
            </h2>

            {errorMsg && (
              <div className="p-3 bg-rose-50 text-rose-700 rounded-lg text-sm">{errorMsg}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Branch Code
                </label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. MAIN_01"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Branch Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Downtown Central Clinic"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="123 Health Ave, City"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+15550199"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="branch@clinicos.local"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-medium shadow-sm"
                >
                  Save Branch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
