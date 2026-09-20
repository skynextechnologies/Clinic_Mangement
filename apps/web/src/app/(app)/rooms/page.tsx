'use client';

import React, { useEffect, useState } from 'react';
import { fetchApi } from '../../../lib/api-client';
import { DataTable, Column } from '../../../components/ui/data-table';

interface Branch {
  id: string;
  name: string;
  code: string;
}

interface Department {
  id: string;
  name: string;
}

interface Room {
  id: string;
  branchId: string;
  departmentId?: string;
  name: string;
  code?: string;
  type?: string;
  isActive: boolean;
  branch?: Branch;
  department?: Department;
  createdAt: string;
}

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [formData, setFormData] = useState({
    branchId: '',
    departmentId: '',
    name: '',
    code: '',
    type: 'CONSULTATION',
  });
  const [errorMsg, setErrorMsg] = useState('');

  const loadDropdowns = async () => {
    try {
      const [bRes, dRes] = await Promise.all([
        fetchApi<{ items: Branch[] }>('/api/v1/branches?limit=100'),
        fetchApi<{ items: Department[] }>('/api/v1/departments?limit=100'),
      ]);
      setBranches(bRes.data.items || []);
      setDepartments(dRes.data.items || []);
    } catch {
      // ignore
    }
  };

  const loadRooms = async (p = page, q = search, bId = selectedBranch) => {
    setLoading(true);
    try {
      let query = `/api/v1/rooms?page=${p}&limit=10&search=${encodeURIComponent(q)}`;
      if (bId) query += `&branchId=${bId}`;
      const res = await fetchApi<{ items: Room[]; total: number }>(query);
      setRooms(res.data.items || []);
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
    loadRooms(page, search, selectedBranch);
  }, [page, search, selectedBranch]);

  const openCreateModal = () => {
    setEditingRoom(null);
    setFormData({
      branchId: branches[0]?.id || '',
      departmentId: '',
      name: '',
      code: '',
      type: 'CONSULTATION',
    });
    setErrorMsg('');
    setShowModal(true);
  };

  const openEditModal = (room: Room) => {
    setEditingRoom(room);
    setFormData({
      branchId: room.branchId,
      departmentId: room.departmentId || '',
      name: room.name,
      code: room.code || '',
      type: room.type || 'CONSULTATION',
    });
    setErrorMsg('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const payload = {
        branchId: formData.branchId,
        departmentId: formData.departmentId || null,
        name: formData.name,
        code: formData.code || null,
        type: formData.type || null,
      };

      if (editingRoom) {
        await fetchApi(`/api/v1/rooms/${editingRoom.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      } else {
        await fetchApi('/api/v1/rooms', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      setShowModal(false);
      loadRooms();
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'Failed to save room');
    }
  };

  const toggleStatus = async (room: Room) => {
    try {
      if (room.isActive) {
        await fetchApi(`/api/v1/rooms/${room.id}/deactivate`, { method: 'PATCH' });
      } else {
        await fetchApi(`/api/v1/rooms/${room.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ isActive: true }),
        });
      }
      loadRooms();
    } catch {
      // ignore
    }
  };

  const columns: Column<Room>[] = [
    { key: 'name', header: 'Room Name' },
    { key: 'code', header: 'Code' },
    { key: 'type', header: 'Type' },
    {
      key: 'branch',
      header: 'Branch',
      render: (item) => item.branch?.name || item.branchId,
    },
    {
      key: 'department',
      header: 'Department',
      render: (item) => item.department?.name || '-',
    },
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
          <h1 className="text-2xl font-bold text-slate-900">Clinic Rooms & Facilities</h1>
          <p className="text-sm text-slate-500">
            Manage consultation rooms, procedure spaces, and lab areas
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-sky-500"
          >
            <option value="">All Branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={rooms}
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
            + Add Room
          </button>
        }
      />

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <h2 className="text-xl font-bold text-slate-900">
              {editingRoom ? 'Edit Room' : 'Create New Room'}
            </h2>

            {errorMsg && (
              <div className="p-3 bg-rose-50 text-rose-700 rounded-lg text-sm">{errorMsg}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Branch
                </label>
                <select
                  required
                  value={formData.branchId}
                  onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                >
                  <option value="">Select Branch</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Department (Optional)
                </label>
                <select
                  value={formData.departmentId}
                  onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                >
                  <option value="">None / Unassigned</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Room Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Room 101"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Room Code
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value.toUpperCase() })
                    }
                    placeholder="RM-101"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Room Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                >
                  <option value="CONSULTATION">Consultation</option>
                  <option value="EXAMINATION">Examination</option>
                  <option value="PROCEDURE">Procedure</option>
                  <option value="LABORATORY">Laboratory</option>
                  <option value="WAITING">Waiting Area</option>
                </select>
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
                  Save Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
