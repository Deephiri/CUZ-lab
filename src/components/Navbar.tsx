import React, { useState } from 'react';
import {
  QrCode,
  Layers,
  Clock,
  RotateCcw,
  Boxes,
  FileSpreadsheet,
  Users,
  LogOut,
  Menu,
  X,
  Mail,
  Sun,
  Moon,
  Sparkles,
  Shield,
  GraduationCap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useTheme } from '../context/ThemeContext.tsx';
import { ReceiptModal } from './ReceiptModal.tsx';
import { CavendishLogo } from './CavendishLogo.tsx';

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath, onNavigate }) => {
  const { user, logout, isTechnicianOrAdmin, isAdmin, isStudent } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showReceiptsModal, setShowReceiptsModal] = useState(false);

  const handleNav = (path: string) => {
    onNavigate(path);
    setMobileMenuOpen(false);
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'admin':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-[#00205B] uppercase tracking-wider shadow-xs">
            Admin
          </span>
        );
      case 'technician':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-300 text-[#00205B] uppercase tracking-wider shadow-xs">
            Technician
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-400 text-emerald-950 uppercase tracking-wider shadow-xs">
            Student
          </span>
        );
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#00205B] text-white shadow-lg border-b border-[#0B1B3D]/80 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* University Crest & Brand Logo */}
            <div
              className="flex items-center gap-3 cursor-pointer group py-1"
              onClick={() => handleNav(isTechnicianOrAdmin ? '/staff/dashboard' : '/borrow')}
              title="Cavendish University Zambia - Lab Equipment Borrowing System"
            >
              <CavendishLogo size="sm" variant="crest" />
              <div className="leading-tight">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-lg sm:text-xl tracking-tight text-white group-hover:text-amber-300 transition-colors">
                    CAVENDISH
                  </span>
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-white text-[#00205B] shadow-xs">
                    ZAMBIA
                  </span>
                </div>
                <div className="text-[11px] text-blue-200 font-medium tracking-wide flex items-center gap-1.5">
                  <span>Lab Equipment Borrowing</span>
                  <span className="hidden lg:inline text-blue-400">•</span>
                  <span className="hidden lg:inline text-amber-300 italic text-[10px]">Success Begins at Cavendish</span>
                </div>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1.5">
              {isStudent && (
                <>
                  <button
                    onClick={() => handleNav('/borrow')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                      currentPath.startsWith('/borrow')
                        ? 'bg-white text-[#00205B] shadow-sm shadow-blue-900/30 font-extrabold'
                        : 'text-blue-100 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <QrCode className="w-4 h-4 text-amber-300" />
                    Borrow Equipment
                  </button>
                  <button
                    onClick={() => handleNav('/my-loans')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                      currentPath === '/my-loans'
                        ? 'bg-white text-[#00205B] shadow-sm shadow-blue-900/30 font-extrabold'
                        : 'text-blue-100 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Clock className="w-4 h-4 text-amber-300" />
                    My Loans & Due Dates
                  </button>
                </>
              )}

              {isTechnicianOrAdmin && (
                <>
                  <button
                    onClick={() => handleNav('/staff/dashboard')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                      currentPath === '/staff/dashboard'
                        ? 'bg-white text-[#00205B] shadow-sm shadow-blue-900/30 font-extrabold'
                        : 'text-blue-100 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Layers className="w-4 h-4 text-amber-300" />
                    Live Approvals
                  </button>
                  <button
                    onClick={() => handleNav('/staff/returns')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                      currentPath === '/staff/returns'
                        ? 'bg-white text-[#00205B] shadow-sm shadow-blue-900/30 font-extrabold'
                        : 'text-blue-100 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <RotateCcw className="w-4 h-4 text-amber-300" />
                    Returns
                  </button>
                  <button
                    onClick={() => handleNav('/staff/inventory')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                      currentPath === '/staff/inventory'
                        ? 'bg-white text-[#00205B] shadow-sm shadow-blue-900/30 font-extrabold'
                        : 'text-blue-100 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Boxes className="w-4 h-4 text-amber-300" />
                    Inventory
                  </button>
                  <button
                    onClick={() => handleNav('/admin/stations')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                      currentPath === '/admin/stations'
                        ? 'bg-white text-[#00205B] shadow-sm shadow-blue-900/30 font-extrabold'
                        : 'text-blue-100 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <QrCode className="w-4 h-4 text-amber-300" />
                    Station QRs
                  </button>
                  <button
                    onClick={() => handleNav('/admin/reports')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                      currentPath === '/admin/reports'
                        ? 'bg-white text-[#00205B] shadow-sm shadow-blue-900/30 font-extrabold'
                        : 'text-blue-100 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <FileSpreadsheet className="w-4 h-4 text-amber-300" />
                    Reports
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => handleNav('/admin/users')}
                      className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                        currentPath === '/admin/users'
                          ? 'bg-white text-[#00205B] shadow-sm shadow-blue-900/30 font-extrabold'
                          : 'text-blue-100 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <Users className="w-4 h-4 text-amber-300" />
                      Staff Mgmt
                    </button>
                  )}
                </>
              )}
            </nav>

            {/* User Profile, Theme Mood Toggle, & Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Light / Dark Mood Toggle Button */}
              <button
                onClick={toggleTheme}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all duration-200 group"
                title={isDark ? 'Switch to Cavendish Light Mood' : 'Switch to Cavendish Dark Mood'}
                aria-label="Toggle theme mood"
              >
                {isDark ? (
                  <>
                    <Sun className="w-4 h-4 text-amber-300 animate-spin-slow group-hover:rotate-45 transition-transform" />
                    <span className="hidden xl:inline text-[11px] font-bold text-amber-300">Light Mood</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-blue-200 group-hover:text-white transition-colors" />
                    <span className="hidden xl:inline text-[11px] font-bold text-blue-100">Dark Mood</span>
                  </>
                )}
              </button>

              {user ? (
                <>
                  {/* Digital Receipts button */}
                  <button
                    onClick={() => setShowReceiptsModal(true)}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-blue-100 hover:text-amber-300 transition-colors relative"
                    title="View Official Digital Email Receipts"
                  >
                    <Mail className="w-4 h-4" />
                  </button>

                  {/* User Profile Chip */}
                  <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-xs backdrop-blur-xs">
                    <div className="w-7 h-7 rounded-lg bg-amber-400 text-[#00205B] flex items-center justify-center font-black text-xs shadow-xs">
                      {user.role === 'student' ? <GraduationCap className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-white leading-tight flex items-center gap-1.5">
                        <span>{user.fullName}</span>
                      </div>
                      <div className="text-[10px] text-blue-200 font-mono font-semibold">
                        {user.studentStaffId}
                      </div>
                    </div>
                    {getRoleBadge(user.role)}
                  </div>

                  {/* Sign Out Button */}
                  <button
                    onClick={async () => {
                      await logout();
                      onNavigate('/login');
                    }}
                    className="p-2 rounded-xl text-blue-200 hover:text-rose-300 hover:bg-white/10 transition-colors"
                    title="Sign Out of CUZ Lab System"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => handleNav('/login')}
                  className="px-4 py-2 rounded-xl bg-white text-[#00205B] font-extrabold text-xs hover:bg-amber-300 hover:text-[#00205B] shadow-md transition-all active:scale-95"
                >
                  Student & Staff Login
                </button>
              )}

              {/* Mobile menu hamburger */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-xl text-blue-200 hover:text-white hover:bg-white/10"
                aria-label="Open mobile menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#071329] border-b border-[#0B1B3D] px-4 pt-3 pb-5 space-y-2">
            {user && (
              <div className="p-3 mb-3 rounded-2xl bg-[#0C182E] border border-blue-900/60 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white text-sm">{user.fullName}</div>
                  <div className="text-xs text-blue-200 font-mono">{user.studentStaffId} • {user.email}</div>
                </div>
                {getRoleBadge(user.role)}
              </div>
            )}

            {/* Mobile mood toggle */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white">
              <span className="font-semibold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-300" /> System Mood
              </span>
              <button
                onClick={toggleTheme}
                className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold text-amber-300 flex items-center gap-1.5"
              >
                {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                {isDark ? 'Light Mood' : 'Dark Mood'}
              </button>
            </div>

            {isStudent && (
              <>
                <button
                  onClick={() => handleNav('/borrow')}
                  className="w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold text-blue-100 hover:bg-white/10 flex items-center gap-2.5"
                >
                  <QrCode className="w-4 h-4 text-amber-300" />
                  Borrow Equipment Form
                </button>
                <button
                  onClick={() => handleNav('/my-loans')}
                  className="w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold text-blue-100 hover:bg-white/10 flex items-center gap-2.5"
                >
                  <Clock className="w-4 h-4 text-amber-300" />
                  My Loans & Return Dates
                </button>
              </>
            )}

            {isTechnicianOrAdmin && (
              <>
                <button
                  onClick={() => handleNav('/staff/dashboard')}
                  className="w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold text-blue-100 hover:bg-white/10 flex items-center gap-2.5"
                >
                  <Layers className="w-4 h-4 text-amber-300" />
                  Live Pending Approvals
                </button>
                <button
                  onClick={() => handleNav('/staff/returns')}
                  className="w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold text-blue-100 hover:bg-white/10 flex items-center gap-2.5"
                >
                  <RotateCcw className="w-4 h-4 text-amber-300" />
                  Process Equipment Returns
                </button>
                <button
                  onClick={() => handleNav('/staff/inventory')}
                  className="w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold text-blue-100 hover:bg-white/10 flex items-center gap-2.5"
                >
                  <Boxes className="w-4 h-4 text-amber-300" />
                  Laboratory Inventory
                </button>
                <button
                  onClick={() => handleNav('/admin/stations')}
                  className="w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold text-blue-100 hover:bg-white/10 flex items-center gap-2.5"
                >
                  <QrCode className="w-4 h-4 text-amber-300" />
                  Station Counter QR Codes
                </button>
                <button
                  onClick={() => handleNav('/admin/reports')}
                  className="w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold text-blue-100 hover:bg-white/10 flex items-center gap-2.5"
                >
                  <FileSpreadsheet className="w-4 h-4 text-amber-300" />
                  Reports & CSV Export
                </button>
                {isAdmin && (
                  <button
                    onClick={() => handleNav('/admin/users')}
                    className="w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold text-blue-100 hover:bg-white/10 flex items-center gap-2.5"
                  >
                    <Users className="w-4 h-4 text-amber-300" />
                    Manage Staff & Users
                  </button>
                )}
              </>
            )}

            <button
              onClick={() => {
                setShowReceiptsModal(true);
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold text-blue-100 hover:bg-white/10 flex items-center gap-2.5"
            >
              <Mail className="w-4 h-4 text-amber-300" />
              Digital Receipts Inbox
            </button>
          </div>
        )}
      </header>

      {/* Receipts Preview Modal */}
      <ReceiptModal isOpen={showReceiptsModal} onClose={() => setShowReceiptsModal(false)} />
    </>
  );
};
