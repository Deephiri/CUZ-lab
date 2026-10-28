import React, { useState } from 'react';
import {
  Lock,
  User,
  Mail,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  LogIn,
  QrCode,
  GraduationCap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { ReceiptModal } from '../components/ReceiptModal.tsx';
import { CavendishLogo } from '../components/CavendishLogo.tsx';
import { EmailReceipt } from '../types.ts';

interface RegisterPageProps {
  stationCode?: string | null;
  onRegisterSuccess?: (redirectUrl?: string) => void;
  onNavigate: (path: string) => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({
  stationCode,
  onRegisterSuccess,
  onNavigate,
}) => {
  const { registerStudent } = useAuth();

  const [studentId, setStudentId] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Client-side 6-digit student ID validation helper (e.g. 115-547 or 115547)
  const isSixDigitId = (id: string) => {
    const clean = id.trim();
    return /^\d{3}-\d{3}$/.test(clean) || /^\d{6}$/.test(clean);
  };

  const handleIdChange = (val: string) => {
    // Clean input and allow typing 6 digits or 115-547
    let clean = val.trim();
    if (/^CUZ/i.test(clean)) {
      setError('Please enter only your 6-digit Student ID number (e.g. 115-547). Do not include the CUZ prefix.');
    } else {
      setError(null);
    }
    setStudentId(clean);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessNotice(null);

    const cleanId = studentId.trim();
    if (!cleanId) {
      setError('Student ID number is required.');
      return;
    }

    if (/^CUZ/i.test(cleanId)) {
      setError('Please enter only your 6-digit Student ID number (e.g. 115-547). Do not include the CUZ prefix.');
      return;
    }

    if (!isSixDigitId(cleanId)) {
      setError('Student ID must be a 6-digit number, for example: 115-547.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      // Calls the registration endpoint with 6-digit ID
      const user = await registerStudent({
        studentId: cleanId,
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      setSuccessNotice(
        `Registration successful! An automated welcome & registration receipt has been dispatched to ${email}.`
      );

      // Smooth redirect to borrow page (retaining counter station context if scanned via QR)
      setTimeout(() => {
        const targetUrl = stationCode
          ? `/borrow?station=${encodeURIComponent(stationCode)}`
          : '/borrow';

        if (onRegisterSuccess) {
          onRegisterSuccess(targetUrl);
        } else {
          onNavigate(targetUrl);
        }
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check your details and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center p-4 sm:p-6 bg-[#F8FAFC] dark:bg-[#060D1A] transition-colors">
      <div className="max-w-md w-full bg-white dark:bg-[#0C182E] rounded-3xl shadow-2xl border border-blue-100 dark:border-blue-900/60 overflow-hidden transition-colors">
        {/* Cavendish Header */}
        <div className="bg-[#00205B] text-white p-6 sm:p-8 text-center relative overflow-hidden border-b border-[#0B1B3D]">
          <div className="flex justify-center mb-3">
            <CavendishLogo size="md" variant="crest" />
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase">
            CAVENDISH UNIVERSITY
          </h2>
          <p className="text-xs font-bold text-amber-300 tracking-wider uppercase mt-0.5">
            Zambia • Student Lab Registration
          </p>
          <div className="text-[11px] font-medium text-blue-200 mt-1 italic">
            Success Begins at Cavendish
          </div>

          {stationCode && (
            <div className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-amber-300 text-xs font-bold backdrop-blur-xs">
              <QrCode className="w-3.5 h-3.5" />
              Counter Check-in: <span className="font-mono text-white font-extrabold">{stationCode}</span>
            </div>
          )}
        </div>

        {/* Form Container */}
        <div className="p-6 sm:p-8">
          <div className="mb-6 pb-4 border-b border-blue-100 dark:border-blue-900/50">
            <div className="flex items-center gap-2 text-xs font-bold text-[#00205B] dark:text-blue-200 uppercase tracking-wider mb-1">
              <GraduationCap className="w-4 h-4 text-amber-500" />
              <span>Student Account Creation</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Create your Cavendish lab credentials to borrow lab components, hardware kits, and test devices.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successNotice && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>{successNotice}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#00205B] dark:text-blue-200 mb-1 flex items-center justify-between">
                <span>Student ID Number</span>
                <span className="text-[10px] text-[#00205B] dark:text-amber-300 font-mono font-bold bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                  Strictly 6 Digits (e.g. 115-547)
                </span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 dark:text-blue-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  maxLength={7}
                  value={studentId}
                  onChange={e => handleIdChange(e.target.value)}
                  placeholder="e.g. 115-547"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-[#071329] border border-slate-300 dark:border-blue-900/80 rounded-xl text-sm font-mono text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-[#00205B] outline-hidden transition-all"
                />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Enter your <strong>6-digit Student ID</strong> (e.g. <strong>115-547</strong>). Do not add the CUZ prefix.
              </p>
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
                placeholder="e.g. Kondwani Tembo"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#071329] border border-slate-300 dark:border-blue-900/80 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-[#00205B] outline-hidden transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#00205B] dark:text-blue-200 mb-1">
                Student Email (Receipts will be sent here)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 dark:text-blue-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="ktembo@student.cuz.ac.zm"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-[#071329] border border-slate-300 dark:border-blue-900/80 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-[#00205B] outline-hidden transition-all"
                />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                An official electronic registration confirmation receipt will be automatically sent to this address.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#00205B] dark:text-blue-200 mb-1">
                Create Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 dark:text-blue-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-[#071329] border border-slate-300 dark:border-blue-900/80 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-[#00205B] outline-hidden transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-[#00205B] hover:bg-[#0B1B3D] text-white font-black text-sm shadow-md shadow-blue-950/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50 mt-2"
            >
              {loading ? 'Creating Account & Dispatching Receipt...' : 'Complete Registration & Send Receipt'}
              <ArrowRight className="w-4 h-4 text-amber-300" />
            </button>
          </form>

          {/* Already have an account link */}
          <div className="mt-6 pt-5 border-t border-slate-200 dark:border-blue-900/50 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Already registered in the CUZ Lab system?{' '}
              <button
                type="button"
                onClick={() => onNavigate(stationCode ? `/login?station=${encodeURIComponent(stationCode)}` : '/login')}
                className="font-bold text-[#00205B] dark:text-amber-300 hover:underline inline-flex items-center gap-1"
              >
                Sign In here
              </button>
            </p>
          </div>
        </div>
      </div>

      <ReceiptModal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
      />
    </div>
  );
};

export const Register = RegisterPage;
