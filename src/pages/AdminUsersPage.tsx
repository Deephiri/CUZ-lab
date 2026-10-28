import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2,
  RefreshCw,
  Mail,
  Lock,
} from 'lucide-react';
import { User } from '../types.ts';
import { api } from '../services/api.ts';

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');

  // Add staff modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [staffId, setStaffId] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Password123!');
  const [role, setRole] = useState<'technician' | 'admin'>('technician');
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.listUsers(roleFilter === 'all' ? undefined : roleFilter);
      setUsers(res.users);
    } catch (err: any) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u => {
    const q = search.toLowerCase();
    return (
      u.fullName.toLowerCase().includes(q) ||
      u.studentStaffId.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  });

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.createStaff({
        staffId,
        fullName,
        email,
        password,
        role,
      });

      setNotice(res.message || `Staff member ${fullName} (${role}) added successfully.`);
      setModalOpen(false);
      setStaffId('');
      setFullName('');
      setEmail('');
      setPassword('Password123!');
      fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to add staff member');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      await api.updateUserRole(userId, newRole);
      setNotice('User role updated successfully');
      fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to update user role');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#00205B] dark:text-white tracking-tight flex items-center gap-2">
            <span>User & Staff Access Management</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Cavendish University Zambia • Add lab staff (technicians and administrators) and manage role permissions
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-[#00205B] hover:bg-[#0B1B3D] text-white font-black text-xs inline-flex items-center gap-2 shadow-md shadow-blue-950/20 transition-all self-start sm:self-auto active:scale-95"
        >
          <UserPlus className="w-4 h-4 text-amber-300" />
          Add Staff Member (Technician / Admin)
        </button>
      </div>

      {notice && (
        <div className="mb-6 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-200 text-xs flex items-center justify-between">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} className="font-bold underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#0C182E] rounded-3xl p-4 border border-blue-100 dark:border-blue-900/60 shadow-xs mb-6 flex flex-col md:flex-row items-center justify-between gap-3 transition-colors">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 dark:text-blue-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by ID (e.g. 115-564, TECH-CUZ-101), name, or email..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-[#071329] border border-slate-300 dark:border-blue-900/80 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-[#00205B] outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400 dark:text-blue-400" />
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-[#071329] border border-slate-300 dark:border-blue-900/80 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-[#00205B] outline-hidden w-full md:w-auto"
          >
            <option value="all">All Roles ({users.length})</option>
            <option value="student">Students</option>
            <option value="technician">Technicians</option>
            <option value="admin">Administrators</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-[#0C182E] rounded-3xl border border-blue-100 dark:border-blue-900/60 shadow-sm overflow-hidden transition-colors">
        {loading ? (
          <div className="py-16 text-center text-slate-400 dark:text-blue-300">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-[#00205B] dark:text-amber-400" />
            <p className="text-xs font-bold">Loading users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-16 text-center text-slate-400 dark:text-slate-500">
            <Users className="w-12 h-12 mx-auto mb-2 text-blue-200 dark:text-blue-900" />
            <p className="font-black text-sm text-[#00205B] dark:text-white">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-blue-50/50 dark:bg-[#071329] text-[#00205B] dark:text-blue-200 font-black border-b border-blue-100 dark:border-blue-900/60 uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Student / Staff ID</th>
                  <th className="py-3 px-4">Full Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">System Role</th>
                  <th className="py-3 px-4 text-right">Role Adjustment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-50 dark:divide-blue-900/40">
                {filteredUsers.map(u => (
                  <tr key={u.userId} className="hover:bg-blue-50/40 dark:hover:bg-blue-950/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#00205B] dark:text-white">
                      {u.studentStaffId}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white text-sm">
                      {u.fullName}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      {u.email}
                    </td>

                    <td className="py-3.5 px-4">
                      {u.role === 'admin' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-400 text-[#00205B]">
                          Admin
                        </span>
                      ) : u.role === 'technician' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-200 border border-blue-300 dark:border-blue-800">
                          Technician
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800">
                          Student
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <select
                        value={u.role}
                        onChange={e => handleRoleChange(u.userId, e.target.value)}
                        className="px-2.5 py-1 bg-slate-100 dark:bg-[#071329] border border-slate-200 dark:border-blue-900 rounded-lg text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-[#00205B] outline-hidden cursor-pointer"
                      >
                        <option value="student">Student</option>
                        <option value="technician">Technician</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD STAFF MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0C182E] rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-blue-100 dark:border-blue-900/60 animate-in fade-in zoom-in-95">
            <h3 className="font-black text-lg text-[#00205B] dark:text-white mb-1">
              Add New Staff Member
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
              Grant technician or administrator permissions to manage lab equipment, approve loans, and process returns
            </p>

            <form onSubmit={handleCreateStaff} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#00205B] dark:text-blue-200 mb-1">
                  Staff ID Number
                </label>
                <input
                  type="text"
                  required
                  value={staffId}
                  onChange={e => setStaffId(e.target.value.toUpperCase())}
                  placeholder="e.g. TECH-CUZ-105"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#071329] border border-slate-300 dark:border-blue-900 rounded-xl text-sm font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-[#00205B] outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#00205B] dark:text-blue-200 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="e.g. Kondwani Banda"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#071329] border border-slate-300 dark:border-blue-900 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-[#00205B] outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#00205B] dark:text-blue-200 mb-1">
                  Staff University Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="e.g. kbanda.tech@cuz.ac.zm"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#071329] border border-slate-300 dark:border-blue-900 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-[#00205B] outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#00205B] dark:text-blue-200 mb-1">
                  Role Assignment
                </label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#071329] border border-slate-300 dark:border-blue-900 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-[#00205B] outline-hidden"
                >
                  <option value="technician">Lab Technician (Approve loans, process returns, manage stock)</option>
                  <option value="admin">System Administrator (Full access including user control)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#00205B] dark:text-blue-200 mb-1">
                  Temporary Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#071329] border border-slate-300 dark:border-blue-900 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-[#00205B] outline-hidden"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-blue-900 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-[#071329]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-[#00205B] hover:bg-[#0B1B3D] text-white text-xs font-black shadow-md shadow-blue-950/20 transition-all active:scale-95"
                >
                  {submitting ? 'Creating Staff...' : 'Create Staff Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
