import React, { useState, useEffect } from 'react';
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  Mail,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Info,
  Sparkles,
  Check,
  Building2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { Loan } from '../types.ts';
import { api } from '../services/api.ts';
import { ReceiptModal } from '../components/ReceiptModal.tsx';
import { CavendishLogo } from '../components/CavendishLogo.tsx';

interface MyLoansPageProps {
  onNavigate: (path: string) => void;
}

export const MyLoansPage: React.FC<MyLoansPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [upcomingDue, setUpcomingDue] = useState<Loan[]>([]);
  const [hasOverdue, setHasOverdue] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'history'>('all');
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);

  useEffect(() => {
    loadLoans();
  }, []);

  const loadLoans = async () => {
    setLoading(true);
    try {
      const data = await api.getMyLoans();
      setLoans(data.loans);
      setUpcomingDue(data.upcomingDueLoans || []);
      setHasOverdue(data.hasOverdue || data.loans.some(l => l.status === 'Overdue'));
    } catch (err) {
      console.error('Failed to load student loans:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLoans = loans.filter(l => {
    if (filter === 'active') return l.status === 'Pending' || l.status === 'Approved' || l.status === 'Overdue';
    if (filter === 'history') return l.status === 'Returned' || l.status === 'Rejected';
    return true;
  });

  const getStatusBadge = (status: Loan['status']) => {
    switch (status) {
      case 'Pending':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-100 text-amber-900 border border-amber-300">
            Pending Handover
          </span>
        );
      case 'Approved':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-200 border border-blue-300 dark:border-blue-800">
            Active Loan
          </span>
        );
      case 'Overdue':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-rose-100 dark:bg-rose-950 text-rose-900 dark:text-rose-200 border border-rose-300 dark:border-rose-800 animate-pulse">
            OVERDUE
          </span>
        );
      case 'Returned':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
            <Check className="w-3 h-3 text-emerald-600" />
            Returned & Cleared
          </span>
        );
      case 'Rejected':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
            Request Rejected
          </span>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#00205B] dark:text-white flex items-center gap-2">
            <span>My Lab Loans & Due Dates</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Student profile: <span className="font-bold text-[#00205B] dark:text-white">{user?.fullName}</span>{' '}
            <span className="font-mono text-xs">({user?.studentStaffId})</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowReceiptModal(true)}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#0C182E] border border-blue-200 dark:border-blue-900 hover:bg-blue-50 dark:hover:bg-blue-950 text-[#00205B] dark:text-blue-200 text-xs font-bold inline-flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Mail className="w-4 h-4 text-amber-500" />
            My Email Receipts
          </button>
          <button
            onClick={() => onNavigate('/borrow')}
            className="px-4 py-2 rounded-xl bg-[#00205B] hover:bg-[#0B1B3D] text-white text-xs font-black inline-flex items-center gap-1.5 shadow-md shadow-blue-950/20 transition-all active:scale-95"
          >
            Borrow Equipment
          </button>
        </div>
      </div>

      {/* 1. OVERDUE ALERT BANNER */}
      {hasOverdue && (
        <div className="mb-6 p-5 rounded-3xl bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-300 dark:border-rose-900 text-rose-900 dark:text-rose-200 shadow-md">
          <div className="flex items-start gap-3.5">
            <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h2 className="font-black text-sm sm:text-base text-rose-900 dark:text-rose-200">
                Action Required: You Have Overdue Lab Equipment!
              </h2>
              <p className="text-xs sm:text-sm text-rose-800 dark:text-rose-300 mt-1 leading-relaxed">
                One or more borrowed items have exceeded their official return deadline. Further borrowings are temporarily suspended.
                Please visit the lab counter immediately to return the hardware.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 2. UPCOMING RETURN BANNER (DUE WITHIN 24 HOURS) */}
      {upcomingDue.length > 0 && (
        <div className="mb-6 p-5 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-900 text-amber-950 dark:text-amber-200 shadow-md">
          <div className="flex items-start gap-3.5">
            <Clock className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-xs uppercase tracking-wider px-2 py-0.5 rounded bg-amber-300 text-amber-950">
                  Due Soon
                </span>
                <h3 className="font-black text-sm sm:text-base text-amber-950 dark:text-amber-200">
                  Equipment Due for Return Within 24 Hours!
                </h3>
              </div>
              <div className="mt-2.5 space-y-2 text-xs text-amber-900 dark:text-amber-300">
                {upcomingDue.map(item => (
                  <div key={item.loan_id} className="flex items-center gap-2 font-medium">
                    <span className="w-2 h-2 rounded-full bg-amber-600 dark:bg-amber-400 shrink-0" />
                    <span>
                      <strong>{item.quantity}x {item.equipment_name}</strong> — Return deadline:{' '}
                      <span className="font-mono font-bold underline">{item.expected_return_date}</span> at{' '}
                      {item.station_name || item.station_code}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-blue-100 dark:border-blue-900/50 pb-3 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-colors ${
            filter === 'all'
              ? 'bg-[#00205B] text-white shadow-xs'
              : 'text-slate-600 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-[#0C182E]'
          }`}
        >
          All Records ({loans.length})
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-colors ${
            filter === 'active'
              ? 'bg-[#00205B] text-white shadow-xs'
              : 'text-slate-600 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-[#0C182E]'
          }`}
        >
          Active & Pending ({loans.filter(l => ['Pending', 'Approved', 'Overdue'].includes(l.status)).length})
        </button>
        <button
          onClick={() => setFilter('history')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-colors ${
            filter === 'history'
              ? 'bg-[#00205B] text-white shadow-xs'
              : 'text-slate-600 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-[#0C182E]'
          }`}
        >
          Cleared History ({loans.filter(l => ['Returned', 'Rejected'].includes(l.status)).length})
        </button>
      </div>

      {/* Loans List */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 dark:text-blue-300">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-[#00205B] dark:text-amber-400" />
          <p className="text-xs font-bold uppercase tracking-wider">Loading your loan records...</p>
        </div>
      ) : filteredLoans.length === 0 ? (
        <div className="bg-white dark:bg-[#0C182E] rounded-3xl border border-blue-100 dark:border-blue-900/60 p-8 text-center text-slate-500 dark:text-slate-400">
          <Clock className="w-12 h-12 text-blue-200 dark:text-blue-800 mx-auto mb-3" />
          <h3 className="font-black text-base text-[#00205B] dark:text-white">No loan records in this tab</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Scan a laboratory counter QR code at Cavendish to check out equipment.
          </p>
          <button
            onClick={() => onNavigate('/borrow')}
            className="mt-4 px-4 py-2 rounded-xl bg-[#00205B] hover:bg-[#0B1B3D] text-white text-xs font-black transition-colors shadow-xs"
          >
            Borrow Equipment Now
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredLoans.map(loan => (
            <div
              key={loan.loan_id}
              className={`bg-white dark:bg-[#0C182E] rounded-3xl border p-4 sm:p-5 transition-all shadow-xs ${
                loan.status === 'Overdue'
                  ? 'border-rose-300 dark:border-rose-800 ring-2 ring-rose-200 dark:ring-rose-950 bg-rose-50/20 dark:bg-rose-950/20'
                  : loan.status === 'Pending'
                  ? 'border-amber-200 dark:border-amber-900/60 bg-amber-50/20 dark:bg-amber-950/20'
                  : 'border-blue-100 dark:border-blue-900/60 hover:border-blue-300 dark:hover:border-blue-700'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 font-bold ${
                      loan.status === 'Overdue'
                        ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                        : loan.status === 'Returned'
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                        : loan.status === 'Pending'
                        ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                        : 'bg-blue-100 dark:bg-blue-950 text-[#00205B] dark:text-blue-300'
                    }`}
                  >
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-black text-sm sm:text-base text-[#00205B] dark:text-white">
                        {loan.equipment_name}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-blue-950 text-slate-700 dark:text-blue-300">
                        Qty: {loan.quantity}
                      </span>
                      {getStatusBadge(loan.status)}
                    </div>

                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-2.5">
                      <span>Counter: <strong className="text-slate-700 dark:text-slate-200">{loan.station_name || loan.station_code}</strong></span>
                      <span>•</span>
                      <span>Requested: {new Date(loan.request_date).toLocaleDateString()}</span>
                      {loan.handler_name && (
                        <>
                          <span>•</span>
                          <span>Handled by: <strong className="text-slate-700 dark:text-slate-200">{loan.handler_name}</strong></span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Return Date Column */}
                <div className="flex items-center justify-between sm:justify-end gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-blue-50 dark:border-blue-900/50">
                  <div className="text-left sm:text-right">
                    <div className="text-[10px] text-slate-400 dark:text-blue-300 font-bold uppercase tracking-wider">
                      {loan.actual_return_date ? 'Returned Date' : 'Expected Return Deadline'}
                    </div>
                    <div
                      className={`text-xs sm:text-sm font-mono font-bold ${
                        loan.status === 'Overdue'
                          ? 'text-rose-600 dark:text-rose-400 font-black'
                          : loan.status === 'Returned'
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-[#00205B] dark:text-white'
                      }`}
                    >
                      {loan.actual_return_date
                        ? new Date(loan.actual_return_date).toLocaleDateString()
                        : loan.expected_return_date}
                    </div>
                  </div>

                  <button
                    onClick={() => setShowReceiptModal(true)}
                    className="p-2.5 rounded-xl border border-blue-200 dark:border-blue-900 hover:bg-blue-50 dark:hover:bg-blue-950 text-[#00205B] dark:text-amber-300 transition-colors"
                    title="View Dispatched Email Receipt"
                  >
                    <Mail className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Rejection / Note banner */}
              {loan.rejection_reason && (
                <div className="mt-3 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-300">
                  <strong>Rejection Note from Lab:</strong> {loan.rejection_reason}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Dispatched Receipts Modal */}
      <ReceiptModal isOpen={showReceiptModal} onClose={() => setShowReceiptModal(false)} />
    </div>
  );
};
