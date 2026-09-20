'use client';

import React, { useEffect, useState } from 'react';
import { fetchApi } from '../../../lib/api-client';
import { DataTable, Column } from '../../../components/ui/data-table';

interface Department {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [errorMsg, setErrorMsg] = useState('');

  const loadDepartments = async (p = page, q = search) => {
    setLoading(true);
    try {
      const res = await fetchApi<{ items: Department[]; total: number }>(
        `/api/v1/departments?page=${p}&limit=10&search=${encodeURIComponent(q)}`,
      );
      setDepartments(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments(page, search);
  }, [page, search]);

  const openCreateModal = () => {
    setEditingDept(null);
    setFormData({ name: '', description: '' });
    setErrorMsg('');
    setShowModal(true);
  };

  const openEditModal = (dept: Department) => {
    setEditingDept(dept);
    setFormData({ name: dept.name, description: dept.description || '' });
    setErrorMsg('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      if (editingDept) {
        await fetchApi(`/api/v1/departments/${editingDept.id}`, {
          method: 'PATCH',
          body: JSON.stringify(formData),
        });
      } else {
        await fetchApi('/api/v1/departments', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
      }
      setShowModal(false);
      loadDepartments();
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'Failed to save department');
    }
  };

  const toggleStatus = async (dept: Department) => {
    try {
      if (dept.isActive) {
        await fetchApi(`/api/v1/departments/${dept.id}/deactivate`, { method: 'PATCH' });
      } else {
        await fetchApi(`/api/v1/departments/${dept.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ isActive: true }),
        });
      }
      loadDepartments();
    } catch {
      // Handle error
    }
  };

  const columns: Column<Department>[] = [
    { key: 'name', header: 'Department Name' },
    { key: 'description', header: 'Description' },
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
          <h1 className="text-2xl font-bold text-slate-900">Medical Departments</h1>
          <p className="text-sm text-slate-500">
            Manage specialties and clinical department listings
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={departments}
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
            + Add Department
          </button>
        }
      />

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <h2 className="text-xl font-bold text-slate-900">
              {editingDept ? 'Edit Department' : 'Create New Department'}
            </h2>

            {errorMsg && (
              <div className="p-3 bg-rose-50 text-rose-700 rounded-lg text-sm">{errorMsg}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Department Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Cardiology"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Clinical specialty notes and scope"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
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
                  Save Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
