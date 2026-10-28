import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  AlertTriangle,
  Clock,
  History,
  Calendar,
  Layers,
  RefreshCw,
  Filter,
} from 'lucide-react';
import { DashboardSummary } from '../types.ts';
import { api } from '../services/api.ts';

export const AdminReportsPage: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [overdueList, setOverdueList] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // CSV filter state
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [exporting, setExporting] = useState<boolean>(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sumRes, overdueRes, logsRes] = await Promise.all([
        api.getSummary(),
        api.getOverdue(),
        api.getAuditLogs(),
      ]);
      setSummary(sumRes.summary);
      setOverdueList(overdueRes.overdueList);
      setAuditLogs(logsRes.logs);
    } catch (err: any) {
      console.error('Failed to load reports data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCSV = async () => {
    setExporting(true);
    try {
      const csv = await api.downloadCSV(startDate, endDate, statusFilter);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `cuz_lab_loans_report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      alert(err.message || 'Failed to download CSV');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 transition-colors">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#00205B] dark:text-white tracking-tight flex items-center gap-2">
            <span>Laboratory Reports & Audit Intelligence</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Cavendish University Zambia • Real-time overdue monitoring, audit trails, and official CSV exports
          </p>
        </div>

        <button
          onClick={loadData}
          className="px-4 py-2 rounded-xl bg-white dark:bg-[#0C182E] border border-blue-100 dark:border-blue-900/60 hover:bg-blue-50 dark:hover:bg-blue-950 text-slate-700 dark:text-slate-200 text-xs font-bold inline-flex items-center gap-1.5 shadow-xs transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#00205B] dark:text-amber-400' : ''}`} />
          Refresh Metrics
        </button>
      </div>

      {/* CSV EXPORT CARD */}
      <div className="bg-[#00205B] text-white rounded-3xl p-6 sm:p-7 shadow-xl mb-8 border border-[#0B1B3D] transition-colors relative overflow-hidden">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-amber-400 text-[#00205B] flex items-center justify-center font-black shadow-md">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-black text-base sm:text-lg text-white">Institutional CSV Data Export</h2>
            <p className="text-xs text-blue-200">
              Download complete transaction records filtered by date range and loan status
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-[11px] font-black text-blue-200 uppercase mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-[#071329] border border-blue-700/80 rounded-xl text-xs text-white outline-hidden focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <div>
            <label className="block text-[11px] font-black text-blue-200 uppercase mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full px-3 py-2 bg-[#071329] border border-blue-700/80 rounded-xl text-xs text-white outline-hidden focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <div>
            <label className="block text-[11px] font-black text-blue-200 uppercase mb-1">Status Filter</label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-[#071329] border border-blue-700/80 rounded-xl text-xs text-white outline-hidden focus:ring-2 focus:ring-amber-400"
            >
              <option value="all">All Statuses</option>
              <option value="Approved">Approved (Active)</option>
              <option value="Overdue">Overdue</option>
              <option value="Returned">Returned</option>
              <option value="Rejected">Rejected</option>
              <option value="Pending">Pending</option>
            </select>
          </div>

          <div>
            <button
              onClick={handleDownloadCSV}
              disabled={exporting}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#00205B] font-black text-xs inline-flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {exporting ? 'Generating CSV...' : 'Download CSV File'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* OVERDUE TRACKING LIST */}
        <div className="bg-white dark:bg-[#0C182E] rounded-3xl border border-blue-100 dark:border-blue-900/60 shadow-sm overflow-hidden transition-colors">
          <div className="p-5 border-b border-blue-100 dark:border-blue-900/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
              <h2 className="font-black text-base text-[#00205B] dark:text-white">
                Overdue Loans Watchlist ({overdueList.length})
              </h2>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">Hourly Cron Audit</span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400 dark:text-blue-300 text-xs font-bold">Loading overdue records...</div>
          ) : overdueList.length === 0 ? (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500">
              <Clock className="w-10 h-10 mx-auto mb-2 text-emerald-500" />
              <p className="font-black text-sm text-[#00205B] dark:text-white">No overdue loans!</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">All equipment has been returned within expected dates.</p>
            </div>
          ) : (
            <div className="divide-y divide-blue-50 dark:divide-blue-900/40 max-h-96 overflow-y-auto">
              {overdueList.map(item => (
                <div key={item.loan_id} className="p-4 hover:bg-rose-50/20 dark:hover:bg-rose-950/20 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-sm text-[#00205B] dark:text-white">{item.student_name}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-mono font-semibold">
                        {item.student_id} • {item.student_email}
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 font-black text-xs">
                      {item.days_overdue} Day(s) Overdue
                    </span>
                  </div>

                  <div className="mt-2 text-xs flex flex-wrap items-center gap-2 text-slate-600 dark:text-slate-300">
                    <span className="font-bold text-slate-800 dark:text-white">{item.quantity}x {item.equipment_name}</span>
                    <span>•</span>
                    <span>Expected Return: <strong className="text-rose-600 dark:text-rose-400">{item.expected_return_date}</strong></span>
                    <span>•</span>
                    <span className="font-mono bg-slate-100 dark:bg-blue-950 px-2 py-0.5 rounded text-[#00205B] dark:text-blue-200">{item.station_code}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AUDIT LOG TIMELINE */}
        <div className="bg-white dark:bg-[#0C182E] rounded-3xl border border-blue-100 dark:border-blue-900/60 shadow-sm overflow-hidden transition-colors">
          <div className="p-5 border-b border-blue-100 dark:border-blue-900/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-amber-500" />
              <h2 className="font-black text-base text-[#00205B] dark:text-white">
                Security & Status Change Audit Log
              </h2>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">Immutable trail</span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400 dark:text-blue-300 text-xs font-bold">Loading audit logs...</div>
          ) : auditLogs.length === 0 ? (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500">
              <p className="text-xs">No audit logs recorded yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-blue-50 dark:divide-blue-900/40 max-h-96 overflow-y-auto">
              {auditLogs.map(log => (
                <div key={log.log_id} className="p-3.5 text-xs hover:bg-blue-50/40 dark:hover:bg-blue-950/40 transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#00205B] dark:text-white">Loan #{log.loan_id}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950 text-[#00205B] dark:text-blue-300">
                        {log.old_status ? `${log.old_status} → ` : ''}{log.new_status}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {new Date(log.changed_at).toLocaleString()}
                    </span>
                  </div>

                  <div className="mt-1 text-slate-600 dark:text-slate-300">
                    <span className="font-semibold text-slate-900 dark:text-white">{log.student_name}</span> ({log.equipment_name})
                  </div>

                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 italic">
                    {log.comments || 'Status update logged'}
                    {log.changed_by_name && (
                      <span className="not-italic text-[#00205B] dark:text-amber-300 font-semibold"> • by {log.changed_by_name} ({log.changed_by_role})</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
