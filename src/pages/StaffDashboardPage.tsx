import React, { useState, useEffect, useRef } from 'react';
import {
  Layers,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  Boxes,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  User,
  ShieldCheck,
  Pause,
  Play,
  Mail,
  Sparkles,
} from 'lucide-react';
import { Loan, DashboardSummary } from '../types.ts';
import { api } from '../services/api.ts';
import { ReceiptModal } from '../components/ReceiptModal.tsx';
import { CavendishLogo } from '../components/CavendishLogo.tsx';

interface StaffDashboardPageProps {
  onNavigate: (path: string) => void;
}

export const StaffDashboardPage: React.FC<StaffDashboardPageProps> = ({ onNavigate }) => {
  const [pendingLoans, setPendingLoans] = useState<Loan[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [countdown, setCountdown] = useState<number>(5);

  // Reject modal state
  const [rejectModalLoan, setRejectModalLoan] = useState<Loan | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showReceiptsModal, setShowReceiptsModal] = useState<boolean>(false);

  useEffect(() => {
    fetchData();
  }, []);

  // 5-second polling timer
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          fetchData(false);
          return 5;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const fetchData = async (showLoadingState = true) => {
    if (showLoadingState) setRefreshing(true);
    try {
      const [loansRes, sumRes] = await Promise.all([
        api.getStaffLoans({ status: 'Pending' }),
        api.getSummary(),
      ]);
      setPendingLoans(loansRes.loans);
      setSummary(sumRes.summary);
    } catch (err: any) {
      console.error('Failed to refresh dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleApprove = async (loanId: number) => {
    setActionLoading(true);
    setActionNotice(null);
    try {
      await api.approveLoan(loanId);
      setActionNotice({
        type: 'success',
        message: `Loan #${loanId} approved successfully. Handover confirmed.`,
      });
      fetchData(false);
    } catch (err: any) {
      setActionNotice({
        type: 'error',
        message: err.message || 'Failed to approve loan',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModalLoan || !rejectionReason.trim()) return;

    setActionLoading(true);
    try {
      await api.rejectLoan(rejectModalLoan.loan_id, rejectionReason.trim());
      setActionNotice({
        type: 'success',
        message: `Request #${rejectModalLoan.loan_id} rejected. Reserved stock was restored.`,
      });
      setRejectModalLoan(null);
      setRejectionReason('');
      fetchData(false);
    } catch (err: any) {
      setActionNotice({
        type: 'error',
        message: err.message || 'Failed to reject request',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getTimeAgo = (dateStr: string) => {
    const diffSec = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 1000);
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    return `${diffHr}h ago`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 transition-colors">
      {/* Top Bar with Live Polling Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <h1 className="text-xl sm:text-2xl font-black text-[#00205B] dark:text-white tracking-tight flex items-center gap-2">
              <span>Lab Technician Approval Desk</span>
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Cavendish University Zambia • Live station counter requests & handover authorization
          </p>
        </div>

        {/* Live Auto-Refresh Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#0C182E] border border-blue-100 dark:border-blue-900/60 text-xs shadow-xs">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-blue-200 hover:text-[#00205B] dark:hover:text-white transition-colors"
              title={autoRefresh ? 'Pause 5s auto-refresh' : 'Resume auto-refresh'}
            >
              {autoRefresh ? (
                <>
                  <Pause className="w-3.5 h-3.5 text-amber-500" />
                  <span>Live (5s)</span>
                  <span className="w-4 h-4 rounded-full bg-[#00205B] dark:bg-amber-400 text-white dark:text-[#00205B] text-[10px] flex items-center justify-center font-mono font-bold">
                    {countdown}
                  </span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-slate-500 dark:text-slate-400">Paused</span>
                </>
              )}
            </button>
          </div>

          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="p-2.5 rounded-xl bg-white dark:bg-[#0C182E] border border-blue-100 dark:border-blue-900/60 hover:bg-blue-50 dark:hover:bg-blue-950 text-slate-700 dark:text-slate-200 shadow-xs transition-colors"
            title="Refresh now"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-[#00205B] dark:text-amber-400' : ''}`} />
          </button>

          <button
            onClick={() => onNavigate('/staff/returns')}
            className="px-4 py-2 rounded-xl bg-[#00205B] hover:bg-[#0B1B3D] text-white text-xs font-black transition-all inline-flex items-center gap-1.5 shadow-md shadow-blue-950/20 active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-300" />
            Process Returns
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <div className="bg-white dark:bg-[#0C182E] rounded-3xl p-5 border border-blue-100 dark:border-blue-900/60 shadow-xs relative overflow-hidden transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pending Handover</span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 mt-2">
            {summary?.counts.pending ?? 0}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Awaiting physical handover</p>
        </div>

        <div className="bg-white dark:bg-[#0C182E] rounded-3xl p-5 border border-blue-100 dark:border-blue-900/60 shadow-xs transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Loans</span>
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#00205B] dark:text-white mt-2">
            {summary?.counts.active ?? 0}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Currently with students</p>
        </div>

        <div className="bg-white dark:bg-[#0C182E] rounded-3xl p-5 border border-blue-100 dark:border-blue-900/60 shadow-xs transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Overdue Items</span>
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 mt-2">
            {summary?.counts.overdue ?? 0}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Exceeded return date</p>
        </div>

        <div className="bg-white dark:bg-[#0C182E] rounded-3xl p-5 border border-blue-100 dark:border-blue-900/60 shadow-xs transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Cleared & Returned</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-400 mt-2">
            {summary?.counts.returned ?? 0}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Completed loans</p>
        </div>
      </div>

      {actionNotice && (
        <div
          className={`mb-6 p-4 rounded-2xl text-xs font-semibold flex items-center justify-between border ${
            actionNotice.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-900'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-900'
          }`}
        >
          <span>{actionNotice.message}</span>
          <button onClick={() => setActionNotice(null)} className="font-bold underline text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* LIVE PENDING REQUESTS TABLE */}
      <div className="bg-white dark:bg-[#0C182E] rounded-3xl border border-blue-100 dark:border-blue-900/60 shadow-sm overflow-hidden transition-colors">
        <div className="p-4 sm:p-6 border-b border-blue-100 dark:border-blue-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-black text-base sm:text-lg text-[#00205B] dark:text-white">
                Pending Borrow Requests Queue ({pendingLoans.length})
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 font-extrabold text-xs">
                Auto-Updating
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Verify student identity at counter, then click Approve to confirm physical handover
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400 dark:text-blue-300">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-[#00205B] dark:text-amber-400" />
            <p className="text-xs font-bold">Loading approval queue...</p>
          </div>
        ) : pendingLoans.length === 0 ? (
          <div className="py-16 text-center text-slate-400 dark:text-slate-500">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-500" />
            <h3 className="font-black text-base text-[#00205B] dark:text-white">Queue is Clear!</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              No pending equipment checkout requests awaiting approval right now.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-blue-50/50 dark:bg-[#071329] text-[#00205B] dark:text-blue-200 font-black border-b border-blue-100 dark:border-blue-900/60 uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Equipment Item</th>
                  <th className="py-3 px-4">Qty</th>
                  <th className="py-3 px-4">Station Counter</th>
                  <th className="py-3 px-4">Expected Return</th>
                  <th className="py-3 px-4">Requested</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-50 dark:divide-blue-900/40">
                {pendingLoans.map(loan => (
                  <tr key={loan.loan_id} className="hover:bg-blue-50/40 dark:hover:bg-blue-950/40 transition-colors">
                    {/* Student */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#00205B] dark:text-white text-sm">{loan.student_name}</div>
                      <div className="text-slate-500 dark:text-slate-400 font-mono text-[11px] font-semibold">{loan.student_id_code}</div>
                    </td>

                    {/* Item */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#00205B] dark:text-white">{loan.equipment_name}</div>
                      <div className="text-slate-400 dark:text-slate-500 text-[11px]">{loan.category}</div>
                    </td>

                    {/* Qty */}
                    <td className="py-3.5 px-4 font-black text-[#00205B] dark:text-white">
                      <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
                        {loan.quantity}
                      </span>
                    </td>

                    {/* Station */}
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-blue-950 text-slate-700 dark:text-blue-300 font-mono font-bold text-[11px]">
                        {loan.station_code}
                      </span>
                      <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate max-w-[120px]">
                        {loan.station_name}
                      </div>
                    </td>

                    {/* Return Date */}
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-rose-600 dark:text-rose-400">{loan.expected_return_date}</div>
                    </td>

                    {/* Request Time */}
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                      <span className="px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-semibold">
                        {getTimeAgo(loan.request_date)}
                      </span>
                    </td>

                    {/* Action buttons */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleApprove(loan.loan_id)}
                          disabled={actionLoading}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs inline-flex items-center gap-1 shadow-xs transition-colors active:scale-95 disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            setRejectModalLoan(loan);
                            setRejectionReason('');
                          }}
                          disabled={actionLoading}
                          className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 font-bold text-xs inline-flex items-center gap-1 transition-colors active:scale-95 disabled:opacity-50"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectModalLoan && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0C182E] rounded-3xl max-w-md w-full p-6 shadow-2xl border border-blue-100 dark:border-blue-900/60 animate-in fade-in zoom-in-95">
            <h3 className="font-black text-base text-[#00205B] dark:text-white mb-2">
              Reject Request #{rejectModalLoan.loan_id}?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Item: <strong>{rejectModalLoan.equipment_name}</strong> for student{' '}
              <strong>{rejectModalLoan.student_name}</strong> ({rejectModalLoan.student_id_code}).
              Rejecting will automatically restore the reserved stock in the inventory.
            </p>

            <form onSubmit={handleRejectSubmit}>
              <label className="block text-xs font-bold text-[#00205B] dark:text-blue-200 mb-1">
                Reason for Rejection (Required)
              </label>
              <textarea
                required
                rows={3}
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                placeholder="e.g. Student failed identity check, requested item undergoing calibration, incorrect course practical slot"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#071329] border border-slate-300 dark:border-blue-900 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-[#00205B] outline-hidden mb-4"
              />

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectModalLoan(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-blue-900 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#071329]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !rejectionReason.trim()}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black transition-colors disabled:opacity-50"
                >
                  {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dispatched Receipts Modal */}
      <ReceiptModal isOpen={showReceiptsModal} onClose={() => setShowReceiptsModal(false)} />
    </div>
  );
};
