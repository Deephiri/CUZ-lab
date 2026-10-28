import React, { useState, useEffect } from 'react';
import {
  RotateCcw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  RefreshCw,
  Filter,
  Check,
} from 'lucide-react';
import { Loan } from '../types.ts';
import { api } from '../services/api.ts';

export const StaffReturnsPage: React.FC = () => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [returnNotes, setReturnNotes] = useState('Inspected and returned in good working condition');
  const [processing, setProcessing] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    setLoading(true);
    try {
      // Get Approved and Overdue loans
      const [approvedRes, overdueRes] = await Promise.all([
        api.getStaffLoans({ status: 'Approved' }),
        api.getStaffLoans({ status: 'Overdue' }),
      ]);
      const combined = [...overdueRes.loans, ...approvedRes.loans];
      setLoans(combined);
    } catch (err: any) {
      console.error('Failed to load active loans:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLoans = loans.filter(loan => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      loan.student_name?.toLowerCase().includes(q) ||
      loan.student_id_code?.toLowerCase().includes(q) ||
      loan.equipment_name?.toLowerCase().includes(q) ||
      loan.station_code?.toLowerCase().includes(q) ||
      String(loan.loan_id).includes(q)
    );
  });

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoan) return;

    setProcessing(true);
    setNotice(null);
    try {
      await api.returnLoan(selectedLoan.loan_id, returnNotes);
      setNotice({
        type: 'success',
        message: `Loan #${selectedLoan.loan_id} marked as Returned! ${selectedLoan.quantity} unit(s) of "${selectedLoan.equipment_name}" restored to available inventory.`,
      });
      setSelectedLoan(null);
      fetchLoans();
    } catch (err: any) {
      setNotice({
        type: 'error',
        message: err.message || 'Failed to process equipment return',
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 transition-colors">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#00205B] dark:text-white tracking-tight flex items-center gap-2">
            <span>Equipment Return & Stock Restoration</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Cavendish University Zambia • Search active loans, verify hardware condition, and restore stock levels
          </p>
        </div>

        <button
          onClick={fetchLoans}
          className="px-4 py-2 rounded-xl bg-white dark:bg-[#0C182E] border border-blue-100 dark:border-blue-900/60 hover:bg-blue-50 dark:hover:bg-blue-950 text-slate-700 dark:text-slate-200 text-xs font-bold inline-flex items-center gap-1.5 shadow-xs transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#00205B] dark:text-amber-400' : ''}`} />
          Refresh Active Loans
        </button>
      </div>

      {notice && (
        <div
          className={`mb-6 p-4 rounded-2xl text-xs font-semibold flex items-center justify-between border ${
            notice.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-900'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-900'
          }`}
        >
          <span>{notice.message}</span>
          <button onClick={() => setNotice(null)} className="font-bold underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Search Input Bar */}
      <div className="bg-white dark:bg-[#0C182E] rounded-3xl p-4 border border-blue-100 dark:border-blue-900/60 shadow-xs mb-6 transition-colors">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 dark:text-blue-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by student name, 6-digit Student ID (e.g. 115-564), item name, or loan #..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#071329] border border-slate-300 dark:border-blue-900/80 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-[#00205B] outline-hidden"
          />
        </div>
      </div>

      {/* Returns Table */}
      <div className="bg-white dark:bg-[#0C182E] rounded-3xl border border-blue-100 dark:border-blue-900/60 shadow-sm overflow-hidden transition-colors">
        <div className="p-4 sm:p-5 border-b border-blue-100 dark:border-blue-900/50 flex items-center justify-between">
          <span className="font-black text-sm text-[#00205B] dark:text-white">
            Active Checked-Out Loans ({filteredLoans.length})
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Click "Mark Returned" to record physical hand-in and restore stock
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400 dark:text-blue-300">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-[#00205B] dark:text-amber-400" />
            <p className="text-xs font-bold">Loading active loans...</p>
          </div>
        ) : filteredLoans.length === 0 ? (
          <div className="py-16 text-center text-slate-400 dark:text-slate-500">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-emerald-500" />
            <p className="font-black text-sm text-[#00205B] dark:text-white">No active loans found</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">All checked-out lab equipment has been returned!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-blue-50/50 dark:bg-[#071329] text-[#00205B] dark:text-blue-200 font-black border-b border-blue-100 dark:border-blue-900/60 uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Loan #</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Equipment</th>
                  <th className="py-3 px-4">Qty</th>
                  <th className="py-3 px-4">Station</th>
                  <th className="py-3 px-4">Expected Return</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-50 dark:divide-blue-900/40">
                {filteredLoans.map(loan => (
                  <tr key={loan.loan_id} className="hover:bg-blue-50/40 dark:hover:bg-blue-950/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-700 dark:text-blue-200">
                      #{loan.loan_id}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#00205B] dark:text-white text-sm">{loan.student_name}</div>
                      <div className="text-slate-500 dark:text-slate-400 font-mono text-[11px] font-semibold">{loan.student_id_code}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#00205B] dark:text-white">{loan.equipment_name}</div>
                      <div className="text-slate-400 dark:text-slate-500 text-[11px]">{loan.category}</div>
                    </td>

                    <td className="py-3.5 px-4 font-black text-[#00205B] dark:text-white">
                      {loan.quantity} unit(s)
                    </td>

                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-600 dark:text-blue-200">
                      {loan.station_code}
                    </td>

                    <td className="py-3.5 px-4">
                      <div
                        className={`font-mono font-bold ${
                          loan.status === 'Overdue' ? 'text-rose-600 dark:text-rose-400 font-black' : 'text-[#00205B] dark:text-slate-200'
                        }`}
                      >
                        {loan.expected_return_date}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {loan.status === 'Overdue' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-100 dark:bg-rose-950 text-rose-900 dark:text-rose-200 border border-rose-300 dark:border-rose-800 animate-pulse">
                          OVERDUE
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-200 border border-blue-300 dark:border-blue-800">
                          Active Loan
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedLoan(loan)}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs inline-flex items-center gap-1.5 shadow-xs transition-colors active:scale-95"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Mark Returned
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CONFIRM RETURN INSPECTION MODAL */}
      {selectedLoan && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0C182E] rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-blue-100 dark:border-blue-900/60 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-base text-[#00205B] dark:text-white">
                  Confirm Equipment Return #{selectedLoan.loan_id}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Student: {selectedLoan.student_name} ({selectedLoan.student_id_code})
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-[#071329] border border-blue-100 dark:border-blue-900/60 text-xs space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Equipment Item:</span>
                <span className="font-bold text-[#00205B] dark:text-white">{selectedLoan.equipment_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Quantity to Restore:</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400">+{selectedLoan.quantity} unit(s)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Expected Return:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{selectedLoan.expected_return_date}</span>
              </div>
            </div>

            <form onSubmit={handleReturnSubmit}>
              <label className="block text-xs font-bold text-[#00205B] dark:text-blue-200 mb-1">
                Inspection & Return Notes
              </label>
              <textarea
                rows={2}
                value={returnNotes}
                onChange={e => setReturnNotes(e.target.value)}
                placeholder="Physical hardware inspection condition..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#071329] border border-slate-300 dark:border-blue-900 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-[#00205B] outline-hidden mb-4"
              />

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedLoan(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-blue-900 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#071329]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-colors shadow-xs active:scale-95 disabled:opacity-50"
                >
                  {processing ? 'Restoring Stock...' : 'Confirm Return & Restore Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
