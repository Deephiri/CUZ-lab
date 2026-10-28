import React, { useState, useEffect } from 'react';
import {
  QrCode,
  Calendar,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Package,
  Info,
  Clock,
  ArrowRight,
  ShieldAlert,
  Mail,
  MapPin,
  RefreshCw,
  Sparkles,
  GraduationCap,
  Check,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { Equipment, Station, Loan } from '../types.ts';
import { api } from '../services/api.ts';
import { ReceiptModal } from '../components/ReceiptModal.tsx';
import { CavendishLogo } from '../components/CavendishLogo.tsx';

interface BorrowPageProps {
  stationCodeFromUrl?: string | null;
  onNavigate: (path: string) => void;
}

export const BorrowPage: React.FC<BorrowPageProps> = ({ stationCodeFromUrl, onNavigate }) => {
  const { user, isStudent } = useAuth();

  // Stations
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [stationError, setStationError] = useState<string | null>(null);

  // Equipment catalog
  const [catalog, setCatalog] = useState<Equipment[]>([]);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<number | ''>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');

  // Return Date
  const todayStr = new Date().toISOString().split('T')[0];
  const defaultReturnDate = new Date();
  defaultReturnDate.setDate(defaultReturnDate.getDate() + 3);
  const defaultReturnStr = defaultReturnDate.toISOString().split('T')[0];

  const maxReturnDate = new Date();
  maxReturnDate.setDate(maxReturnDate.getDate() + 14);
  const maxReturnStr = maxReturnDate.toISOString().split('T')[0];

  const [returnDate, setReturnDate] = useState<string>(defaultReturnStr);

  // Eligibility & active loans
  const [eligibility, setEligibility] = useState<{
    canBorrow: boolean;
    reason?: string;
    activeLoanCount: number;
    hasOverdue: boolean;
  } | null>(null);

  // Submission state
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedLoan, setSubmittedLoan] = useState<Loan | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);

  // Load initial data
  useEffect(() => {
    loadStationsAndCatalog();
  }, [stationCodeFromUrl]);

  const loadStationsAndCatalog = async () => {
    setLoading(true);
    setStationError(null);

    try {
      // 1. Fetch stations
      const stationsRes = await api.getStations();
      setStations(stationsRes.stations);

      // Check URL station code
      const codeToUse = stationCodeFromUrl || (stationsRes.stations.length > 0 ? stationsRes.stations[0].station_code : null);
      if (codeToUse) {
        const found = stationsRes.stations.find(
          s => s.station_code.toLowerCase() === codeToUse.trim().toLowerCase()
        );
        if (found) {
          setSelectedStation(found);
        } else {
          setStationError(
            `Counter QR code "${codeToUse}" is invalid or unassigned. Please select a valid laboratory counter below.`
          );
          if (stationsRes.stations.length > 0) {
            setSelectedStation(stationsRes.stations[0]);
          }
        }
      }

      // 2. Fetch available equipment catalog
      const catRes = await api.getCatalog();
      setCatalog(catRes.items);
      if (catRes.items.length > 0 && !selectedEquipmentId) {
        setSelectedEquipmentId(catRes.items[0].equipment_id);
      }

      // 3. Fetch student eligibility if logged in
      if (user) {
        try {
          const loansData = await api.getMyLoans();
          const activeLoans = loansData.loans.filter(l => l.status === 'Pending' || l.status === 'Approved');
          const hasOverdue = loansData.hasOverdue || loansData.loans.some(l => l.status === 'Overdue');

          setEligibility({
            canBorrow: !hasOverdue && activeLoans.length < 3,
            reason: hasOverdue
              ? 'You currently have one or more OVERDUE items. University regulations prohibit borrowing until overdue items are returned to the lab technician.'
              : activeLoans.length >= 3
              ? 'You have reached the maximum active limit of 3 items.'
              : undefined,
            activeLoanCount: activeLoans.length,
            hasOverdue,
          });
        } catch (e) {
          // ignore if non-student
        }
      }
    } catch (err: any) {
      setSubmitError(err.message || 'Failed loading catalog data');
    } finally {
      setLoading(false);
    }
  };

  const selectedItem = catalog.find(item => item.equipment_id === Number(selectedEquipmentId));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStation) {
      setSubmitError('Please select a valid lab station counter');
      return;
    }
    if (!selectedEquipmentId) {
      setSubmitError('Please choose an equipment item from the catalog');
      return;
    }

    setSubmitError(null);
    setSubmitting(true);

    try {
      const res = await api.createLoan({
        equipmentId: Number(selectedEquipmentId),
        quantity,
        expectedReturnDate: returnDate,
        stationCode: selectedStation.station_code,
        notes,
      });

      setSubmittedLoan(res.loan);

      // Refresh catalog to reflect decremented stock
      const updatedCat = await api.getCatalog();
      setCatalog(updatedCat.items);
    } catch (err: any) {
      setSubmitError(err.message || 'Borrow request failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center p-6 bg-[#F8FAFC] dark:bg-[#060D1A] transition-colors">
        <div className="flex flex-col items-center gap-3 text-center">
          <CavendishLogo size="md" variant="crest" />
          <div className="flex items-center gap-2 text-[#00205B] dark:text-blue-200">
            <RefreshCw className="w-5 h-5 animate-spin text-[#00205B] dark:text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Connecting to Cavendish Lab Station Counter...
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8 transition-colors">
      {/* Student Greeting & Honor Standing Banner */}
      {user && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-[#0C182E] border border-blue-100 dark:border-blue-900/60 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00205B] text-white flex items-center justify-center font-bold">
              <GraduationCap className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-500 dark:text-blue-300">
                Welcome, Cavendish Scholar
              </div>
              <div className="text-sm font-black text-[#00205B] dark:text-white">
                {user.fullName} <span className="font-mono text-xs font-normal text-blue-800 dark:text-blue-300">({user.studentStaffId})</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {eligibility?.hasOverdue ? (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1.5 animate-pulse">
                <ShieldAlert className="w-3.5 h-3.5" />
                Overdue Item Hold
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Good Academic Standing ({eligibility?.activeLoanCount ?? 0}/3 Loans)
              </span>
            )}
          </div>
        </div>
      )}

      {/* Cavendish Station Counter Banner */}
      <div className="bg-[#00205B] text-white rounded-3xl p-5 sm:p-6 shadow-xl mb-6 border border-[#0B1B3D] relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-400 text-[#00205B] flex items-center justify-center font-black shadow-md shrink-0">
              <QrCode className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-white text-[#00205B] font-mono shadow-xs">
                  {selectedStation?.station_code || 'STATION'}
                </span>
                <span className="text-xs text-blue-200 font-semibold">Active Lab Counter</span>
              </div>
              <h1 className="text-base sm:text-xl font-black text-white mt-0.5">
                {selectedStation?.lab_name || 'Cavendish University Laboratory'}
              </h1>
            </div>
          </div>

          {/* Station selector dropdown */}
          <div className="shrink-0 bg-white/10 p-2 rounded-2xl border border-white/15 backdrop-blur-xs">
            <label className="block text-[10px] text-blue-200 uppercase font-black tracking-wider mb-1">
              Switch Counter
            </label>
            <select
              value={selectedStation?.station_code || ''}
              onChange={e => {
                const s = stations.find(st => st.station_code === e.target.value);
                if (s) setSelectedStation(s);
              }}
              className="bg-[#071329] text-white border border-blue-700/80 rounded-xl px-3 py-1.5 text-xs font-bold focus:ring-2 focus:ring-amber-400 outline-hidden cursor-pointer"
            >
              {stations.map(st => (
                <option key={st.station_code} value={st.station_code}>
                  {st.station_code} — {st.lab_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedStation?.location_description && (
          <div className="mt-4 pt-3.5 border-t border-white/15 flex items-center gap-2 text-xs text-blue-200">
            <MapPin className="w-4 h-4 text-amber-300 shrink-0" />
            <span>{selectedStation.location_description}</span>
          </div>
        )}
      </div>

      {stationError && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-900 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
          <div>
            <div className="font-bold text-sm">Station QR Notice</div>
            <p className="mt-0.5">{stationError}</p>
          </div>
        </div>
      )}

      {/* Overdue / Active Loans Eligibility Warning */}
      {eligibility?.hasOverdue && (
        <div className="mb-6 p-5 rounded-3xl bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-300 dark:border-rose-900 text-rose-900 dark:text-rose-200 shadow-md">
          <div className="flex items-start gap-3.5">
            <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-black text-sm text-rose-800 dark:text-rose-300">
                Borrowing Blocked: Overdue Items Found
              </h3>
              <p className="text-xs text-rose-700 dark:text-rose-400 mt-1 leading-relaxed">
                You have equipment that is currently marked as <strong>OVERDUE</strong>. University laboratory regulations
                require all overdue items to be physically returned to the technician before any new requests can be made.
              </p>
              <button
                onClick={() => onNavigate('/my-loans')}
                className="mt-3 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs inline-flex items-center gap-1.5"
              >
                View Overdue Loans & Return Deadlines <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3 Active Loans Limit Alert */}
      {!eligibility?.hasOverdue && eligibility?.canBorrow === false && (
        <div className="mb-6 p-5 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-900 text-amber-900 dark:text-amber-200">
          <div className="flex items-start gap-3.5">
            <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-black text-sm text-amber-800 dark:text-amber-300">
                Maximum Active Loan Limit Reached (3 / 3 Items)
              </h3>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                You currently have {eligibility.activeLoanCount} active borrowed items. Please return at least one item
                to the lab counter before requesting new hardware.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS CONFIRMATION RECEIPT CARD */}
      {submittedLoan ? (
        <div className="bg-white dark:bg-[#0C182E] rounded-3xl shadow-2xl border border-blue-100 dark:border-blue-900/60 p-6 sm:p-8 text-center animate-in fade-in zoom-in-95 duration-200 transition-colors">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center mb-4">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-extrabold text-xs">
            Loan Request #{submittedLoan.loan_id} Confirmed
          </span>

          <h2 className="text-xl sm:text-2xl font-black text-[#00205B] dark:text-white mt-3">
            Equipment Borrowing Successful!
          </h2>

          {/* Email receipt dispatched alert */}
          <div className="mt-3 p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-2xl text-emerald-900 dark:text-emerald-200 text-xs flex items-center justify-center gap-2 max-w-lg mx-auto">
            <Mail className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              An automated receipt has been sent to <strong>{user?.email || 'your student email'}</strong> with your official return deadline.
            </span>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-3 max-w-md mx-auto leading-relaxed">
            Your request for <strong>{submittedLoan.quantity} unit(s)</strong> of{' '}
            <strong>{submittedLoan.equipment_name}</strong> has been logged and the item is temporarily held at the counter.
          </p>

          {/* Official Return Deadline Box */}
          <div className="my-5 p-5 rounded-2xl bg-[#00205B] text-white text-center max-w-md mx-auto shadow-md border border-[#0B1B3D]">
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-amber-300 flex items-center justify-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-300" />
              Cavendish Official Return Deadline
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white mt-1.5 mb-1 font-mono">
              {submittedLoan.expected_return_date}
            </div>
            <p className="text-xs text-blue-200 font-medium">
              Return to <strong>{submittedLoan.station_name || submittedLoan.station_code}</strong> on or before this date to avoid overdue marks.
            </p>
          </div>

          <div className="mb-5 p-4 rounded-2xl bg-slate-50 dark:bg-[#071329] border border-slate-200 dark:border-blue-900/60 text-left text-xs space-y-2 max-w-md mx-auto">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Student ID:</span>
              <span className="font-mono font-bold text-[#00205B] dark:text-white">{user?.studentStaffId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Pickup Counter:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{submittedLoan.station_name || submittedLoan.station_code}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Item & Quantity:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{submittedLoan.quantity}x {submittedLoan.equipment_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Status:</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">Pending Technician Handover</span>
            </div>
          </div>

          <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-xl text-[#00205B] dark:text-blue-200 text-xs mb-6 max-w-md mx-auto">
            <strong>Next Step:</strong> Approach the lab technician at <strong>{submittedLoan.station_name || submittedLoan.station_code}</strong> and present your 6-digit Student ID (<strong>{user?.studentStaffId}</strong>) for physical handover of the equipment.
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => setShowReceiptModal(true)}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#00205B] hover:bg-[#0B1B3D] text-white font-bold text-xs inline-flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <Mail className="w-4 h-4 text-amber-300" />
              View Dispatched Email Receipt
            </button>

            <button
              onClick={() => {
                setSubmittedLoan(null);
                setNotes('');
              }}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 dark:border-blue-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#071329] font-bold text-xs transition-colors"
            >
              Borrow Another Item
            </button>

            <button
              onClick={() => onNavigate('/my-loans')}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white dark:bg-blue-900 border border-blue-200 dark:border-blue-800 text-[#00205B] dark:text-white hover:bg-blue-50 font-bold text-xs transition-colors"
            >
              Go to My Loans
            </button>
          </div>
        </div>
      ) : (
        /* BORROWING FORM */
        <div className="bg-white dark:bg-[#0C182E] rounded-3xl shadow-2xl border border-blue-100 dark:border-blue-900/60 p-5 sm:p-8 transition-colors">
          <div className="mb-6 pb-4 border-b border-blue-100 dark:border-blue-900/50 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-[#00205B] dark:text-white flex items-center gap-2">
                <span>Lab Equipment Checkout Form</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Select equipment, quantity, and your expected return date
              </p>
            </div>
            {user && (
              <div className="text-right">
                <span className="text-[11px] font-bold text-slate-400 dark:text-blue-300 uppercase">Active Loans</span>
                <div className="font-black text-sm text-[#00205B] dark:text-white">
                  {eligibility?.activeLoanCount ?? 0} / 3 Allowed
                </div>
              </div>
            )}
          </div>

          {submitError && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{submitError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 1. Equipment Catalog Dropdown */}
            <div>
              <label className="block text-xs font-bold text-[#00205B] dark:text-blue-200 mb-1.5 flex items-center justify-between">
                <span>1. Select Equipment to Borrow</span>
                <span className="text-[11px] text-[#00205B] dark:text-amber-300 font-semibold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                  {catalog.length} items in stock
                </span>
              </label>

              <select
                required
                value={selectedEquipmentId}
                onChange={e => {
                  const id = Number(e.target.value);
                  setSelectedEquipmentId(id);
                  setQuantity(1);
                }}
                disabled={eligibility?.canBorrow === false}
                className="w-full px-3.5 py-3 bg-slate-50 dark:bg-[#071329] border border-slate-300 dark:border-blue-900/80 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-[#00205B] focus:bg-white dark:focus:bg-[#071329] outline-hidden disabled:opacity-50 transition-all cursor-pointer"
              >
                {catalog.map(item => (
                  <option key={item.equipment_id} value={item.equipment_id}>
                    {item.object_name} ({item.available_quantity} available) — {item.category}
                  </option>
                ))}
              </select>

              {/* Selected Item Quick Specs */}
              {selectedItem && (
                <div className="mt-2.5 p-3.5 rounded-2xl bg-blue-50/60 dark:bg-[#071329] border border-blue-200 dark:border-blue-900/60 flex items-start justify-between gap-3 text-xs">
                  <div>
                    <span className="font-extrabold text-[#00205B] dark:text-white">{selectedItem.object_name}</span>
                    <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                      Category: {selectedItem.category} • {selectedItem.model_or_specs || 'Lab Equipment'}
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-black text-xs shrink-0 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    {selectedItem.available_quantity} In Stock
                  </span>
                </div>
              )}
            </div>

            {/* 2. Quantity Input */}
            <div>
              <label className="block text-xs font-bold text-[#00205B] dark:text-blue-200 mb-1.5">
                2. Quantity Needed
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  required
                  min={1}
                  max={selectedItem ? selectedItem.available_quantity : 1}
                  value={quantity}
                  onChange={e => setQuantity(Math.max(1, Number(e.target.value)))}
                  disabled={eligibility?.canBorrow === false}
                  className="w-32 px-3.5 py-2.5 bg-slate-50 dark:bg-[#071329] border border-slate-300 dark:border-blue-900/80 rounded-xl text-sm font-black text-center text-slate-900 dark:text-white focus:ring-2 focus:ring-[#00205B] outline-hidden"
                />
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  (Cannot exceed remaining stock of {selectedItem?.available_quantity || 1} units)
                </span>
              </div>
            </div>

            {/* 3. Expected Return Date Picker */}
            <div>
              <label className="block text-xs font-bold text-[#00205B] dark:text-blue-200 mb-1.5 flex items-center justify-between">
                <span>3. Expected Return Date (Max 14 days)</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Policy: 1 to 14 days</span>
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 dark:text-blue-400 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="date"
                  required
                  min={todayStr}
                  max={maxReturnStr}
                  value={returnDate}
                  onChange={e => setReturnDate(e.target.value)}
                  disabled={eligibility?.canBorrow === false}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-[#071329] border border-slate-300 dark:border-blue-900/80 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-[#00205B] outline-hidden"
                />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Latest permitted return date for this loan is <strong>{maxReturnStr}</strong>.
              </p>
            </div>

            {/* 4. Optional Project Notes */}
            <div>
              <label className="block text-xs font-bold text-[#00205B] dark:text-blue-200 mb-1.5">
                4. Lab Practical Session / Purpose (Optional)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="e.g. CS302 Microcontrollers Lab Practical, Final Year Robotics Project"
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-[#071329] border border-slate-300 dark:border-blue-900/80 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-[#00205B] outline-hidden"
              />
            </div>

            {/* Submit Action */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting || eligibility?.canBorrow === false}
                className="w-full py-3.5 px-4 rounded-xl bg-[#00205B] hover:bg-[#0B1B3D] text-white font-black text-sm shadow-md shadow-blue-950/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Reserving Stock in Database...
                  </>
                ) : (
                  <>
                    Submit Borrow Request to Counter
                    <ArrowRight className="w-4 h-4 text-amber-300" />
                  </>
                )}
              </button>
              <p className="text-[11px] text-center text-slate-400 dark:text-slate-400 mt-2">
                Submitting places a transactional reservation on the hardware. Physical handover is finalized by the lab technician.
              </p>
            </div>
          </form>
        </div>
      )}

      {/* Dispatched Receipt Modal */}
      <ReceiptModal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
      />
    </div>
  );
};
