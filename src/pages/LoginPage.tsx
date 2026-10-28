import React, { useState } from 'react';
import { QrCode, Lock, User, Mail, ShieldCheck, ArrowRight, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { ReceiptModal } from '../components/ReceiptModal.tsx';
import { CavendishLogo } from '../components/CavendishLogo.tsx';
import { EmailReceipt } from '../types.ts';

interface LoginPageProps {
  onLoginSuccess: (redirectUrl?: string) => void;
  stationCode?: string | null;
  onNavigate?: (path: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, stationCode, onNavigate }) => {
  const { login, registerStudent } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Login form state
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  // Register form state
  const [regStudentId, setRegStudentId] = useState('');
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Email receipt modal on self registration
  const [registeredReceipt, setRegisteredReceipt] = useState<EmailReceipt | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = await login(identifier, password);
      const targetUrl = stationCode ? `/borrow?station=${encodeURIComponent(stationCode)}` : (user.role === 'student' ? '/borrow' : '/staff/dashboard');
      onLoginSuccess(targetUrl);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = await registerStudent({
        studentId: regStudentId,
        fullName: regFullName,
        email: regEmail,
        password: regPassword,
      });

      setSuccessNotice(`Account registered! An official confirmation receipt was sent to ${regEmail}.`);

      setTimeout(() => {
        const targetUrl = stationCode ? `/borrow?station=${encodeURIComponent(stationCode)}` : '/borrow';
        onLoginSuccess(targetUrl);
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (id: string, pass: string) => {
    setIdentifier(id);
    setPassword(pass);
    setError(null);
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center p-4 sm:p-6 bg-[#F8FAFC] dark:bg-[#060D1A] transition-colors">
      <div className="max-w-md w-full bg-white dark:bg-[#0C182E] rounded-3xl shadow-2xl border border-blue-100 dark:border-blue-900/60 overflow-hidden transition-colors">
        {/* Cavendish Official Banner Header */}
        <div className="bg-[#00205B] text-white p-6 sm:p-8 text-center relative overflow-hidden border-b border-[#0B1B3D]">
          <div className="flex justify-center mb-3">
            <CavendishLogo size="md" variant="crest" />
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase">
            Cavendish University
          </h2>
          <p className="text-xs font-bold text-amber-300 tracking-wider uppercase mt-0.5">
            Zambia • School of Science & Technology
          </p>
          <div className="text-[11px] font-medium text-blue-200 mt-1 italic">
            Success Begins at Cavendish
          </div>

          {stationCode && (
            <div className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-amber-300 text-xs font-bold backdrop-blur-xs">
              <QrCode className="w-3.5 h-3.5" />
              Scanned Station Counter: <span className="font-mono text-white font-extrabold">{stationCode}</span>
            </div>
          )}
        </div>

        {/* Tab Toggle */}
        <div className="flex border-b border-blue-100 dark:border-blue-900/50 bg-blue-50/50 dark:bg-[#071329] p-1.5">
          <button
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
              mode === 'login'
                ? 'bg-white dark:bg-[#00205B] text-[#00205B] dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-blue-200 hover:text-[#00205B] dark:hover:text-white'
            }`}
          >
            Sign In (Student / Staff)
          </button>
          <button
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
              mode === 'register'
                ? 'bg-white dark:bg-[#00205B] text-[#00205B] dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-blue-200 hover:text-[#00205B] dark:hover:text-white'
            }`}
          >
            New Student? Register
          </button>
        </div>

        <div className="p-6 sm:p-8">
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

          {mode === 'login' ? (
            /* Login Form */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#00205B] dark:text-blue-200 mb-1">
                  Student ID, Staff ID, or University Email
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 dark:text-blue-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={e => setIdentifier(e.target.value)}
                    placeholder="e.g. 115-564 or jbanda.tech@cuz.ac.zm"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-[#071329] border border-slate-300 dark:border-blue-900/80 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-[#00205B] focus:border-[#00205B] focus:bg-white dark:focus:bg-[#071329] outline-hidden transition-all"
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Students: enter your 6-digit Student ID (e.g. <strong>115-564</strong>). Staff: use your Staff ID or email.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#00205B] dark:text-blue-200 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 dark:text-blue-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-[#071329] border border-slate-300 dark:border-blue-900/80 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-[#00205B] focus:border-[#00205B] focus:bg-white dark:focus:bg-[#071329] outline-hidden transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-[#00205B] hover:bg-[#0B1B3D] text-white font-black text-sm shadow-md shadow-blue-950/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50"
              >
                {loading ? 'Verifying Credentials...' : 'Sign In to CUZ Lab System'}
                <ArrowRight className="w-4 h-4 text-amber-300" />
              </button>
            </form>
          ) : (
            /* Student Self-Registration Form */
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#00205B] dark:text-blue-200 mb-1 flex items-center justify-between">
                  <span>Student ID Number</span>
                  <span className="text-[10px] text-[#00205B] dark:text-amber-300 font-mono font-bold bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                    6 Digits (e.g. 115-547)
                  </span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={7}
                  value={regStudentId}
                  onChange={e => setRegStudentId(e.target.value)}
                  placeholder="e.g. 115-547"
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-[#071329] border border-slate-300 dark:border-blue-900/80 rounded-xl text-sm font-mono text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-[#00205B] outline-hidden"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Enter your <strong>6-digit Student ID</strong> (e.g. <strong>115-547</strong>). Do not prefix with CUZ.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#00205B] dark:text-blue-200 mb-1">
                  Full Student Name
                </label>
                <input
                  type="text"
                  required
                  value={regFullName}
                  onChange={e => setRegFullName(e.target.value)}
                  placeholder="e.g. Kondwani Tembo"
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-[#071329] border border-slate-300 dark:border-blue-900/80 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-[#00205B] outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#00205B] dark:text-blue-200 mb-1">
                  Email Address (Receipts will be sent here)
                </label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={e => setRegEmail(e.target.value)}
                  placeholder="e.g. ktembo@student.cuz.ac.zm"
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-[#071329] border border-slate-300 dark:border-blue-900/80 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-[#00205B] outline-hidden"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  An official Cavendish registration confirmation receipt will be sent to this email address.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#00205B] dark:text-blue-200 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={regPassword}
                  onChange={e => setRegPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-[#071329] border border-slate-300 dark:border-blue-900/80 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-[#00205B] outline-hidden"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#00205B] font-black text-sm shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-4 active:scale-[0.99]"
              >
                {loading ? 'Creating Account & Dispatching Receipt...' : 'Register & Dispatch Email Receipt'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Quick Demo Switcher */}
          <div className="mt-6 pt-5 border-t border-slate-200 dark:border-blue-900/50">
            <div className="text-[11px] font-bold text-slate-400 dark:text-blue-300 uppercase tracking-wider mb-2.5 text-center">
              Quick Demo Accounts (Password: Password123!)
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillDemo('115-564', 'Password123!')}
                className="p-2 rounded-xl border border-blue-100 dark:border-blue-900/60 bg-blue-50/50 dark:bg-[#071329] hover:bg-blue-100 dark:hover:bg-[#0B1B3D] text-center text-xs transition-colors"
              >
                <div className="font-bold text-[#00205B] dark:text-white">Student</div>
                <div className="text-[10px] text-slate-500 dark:text-blue-300 truncate">115-564 (Dalitso)</div>
              </button>

              <button
                type="button"
                onClick={() => fillDemo('TECH-CUZ-101', 'Password123!')}
                className="p-2 rounded-xl border border-blue-100 dark:border-blue-900/60 bg-blue-50/50 dark:bg-[#071329] hover:bg-blue-100 dark:hover:bg-[#0B1B3D] text-center text-xs transition-colors"
              >
                <div className="font-bold text-[#00205B] dark:text-white">Technician</div>
                <div className="text-[10px] text-slate-500 dark:text-blue-300 truncate">Joseph B.</div>
              </button>

              <button
                type="button"
                onClick={() => fillDemo('ADM-CUZ-001', 'Password123!')}
                className="p-2 rounded-xl border border-blue-100 dark:border-blue-900/60 bg-blue-50/50 dark:bg-[#071329] hover:bg-blue-100 dark:hover:bg-[#0B1B3D] text-center text-xs transition-colors"
              >
                <div className="font-bold text-[#00205B] dark:text-white">Admin</div>
                <div className="text-[10px] text-slate-500 dark:text-blue-300 truncate">Dr. Mwamba</div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <ReceiptModal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        selectedReceipt={registeredReceipt}
      />
    </div>
  );
};
