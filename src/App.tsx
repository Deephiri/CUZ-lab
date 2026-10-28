import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { ThemeProvider, useTheme } from './context/ThemeContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { LoginPage } from './pages/LoginPage.tsx';
import { RegisterPage, Register } from './pages/RegisterPage.tsx';
import { BorrowPage } from './pages/BorrowPage.tsx';
import { MyLoansPage } from './pages/MyLoansPage.tsx';
import { StaffDashboardPage } from './pages/StaffDashboardPage.tsx';
import { StaffReturnsPage } from './pages/StaffReturnsPage.tsx';
import { StaffInventoryPage } from './pages/StaffInventoryPage.tsx';
import { AdminStationsPage } from './pages/AdminStationsPage.tsx';
import { AdminUsersPage } from './pages/AdminUsersPage.tsx';
import { AdminReportsPage } from './pages/AdminReportsPage.tsx';
import { CavendishLogo } from './components/CavendishLogo.tsx';
import { RefreshCw } from 'lucide-react';

function AppRouter() {
  const { user, loading, isTechnicianOrAdmin, isAdmin, isStudent } = useAuth();
  const [currentPath, setCurrentPath] = useState<string>(() => window.location.pathname || '/');
  const [searchParams, setSearchParams] = useState<URLSearchParams>(() => new URLSearchParams(window.location.search));

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
      setSearchParams(new URLSearchParams(window.location.search));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (pathWithQuery: string) => {
    const [path, search] = pathWithQuery.split('?');
    window.history.pushState({}, '', pathWithQuery);
    setCurrentPath(path || '/');
    setSearchParams(new URLSearchParams(search || ''));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#060D1A] flex items-center justify-center transition-colors">
        <div className="flex flex-col items-center gap-4 text-center p-6">
          <CavendishLogo size="lg" variant="crest" />
          <div className="flex items-center gap-2 text-[#00205B] dark:text-blue-200">
            <RefreshCw className="w-5 h-5 animate-spin text-[#00205B] dark:text-amber-400" />
            <span className="text-xs font-black uppercase tracking-wider">
              Cavendish University Zambia • Initializing System...
            </span>
          </div>
        </div>
      </div>
    );
  }

  const stationParam = searchParams.get('station');

  // Unauthenticated routing: Support /register and /login with station context preservation
  if (!user) {
    const isRegisterRoute = currentPath === '/register' || currentPath.startsWith('/register');

    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#060D1A] text-[#00205B] dark:text-white flex flex-col transition-colors duration-200">
        <Navbar currentPath={currentPath} onNavigate={navigate} />
        <main className="flex-1">
          {isRegisterRoute ? (
            <Register
              stationCode={stationParam}
              onNavigate={navigate}
              onRegisterSuccess={(targetUrl) => {
                navigate(targetUrl || (stationParam ? `/borrow?station=${stationParam}` : '/borrow'));
              }}
            />
          ) : (
            <LoginPage
              stationCode={stationParam}
              onNavigate={navigate}
              onLoginSuccess={(targetUrl) => {
                navigate(targetUrl || (stationParam ? `/borrow?station=${stationParam}` : '/borrow'));
              }}
            />
          )}
        </main>
      </div>
    );
  }

  // Determine view based on currentPath
  const renderCurrentPage = () => {
    // If at root '/' route, route based on role
    if (currentPath === '/' || currentPath === '') {
      if (isTechnicianOrAdmin) {
        return <StaffDashboardPage onNavigate={navigate} />;
      }
      return <BorrowPage stationCodeFromUrl={stationParam} onNavigate={navigate} />;
    }

    if (currentPath.startsWith('/borrow')) {
      return <BorrowPage stationCodeFromUrl={stationParam} onNavigate={navigate} />;
    }

    if (currentPath === '/my-loans') {
      return <MyLoansPage onNavigate={navigate} />;
    }

    if (currentPath === '/staff/dashboard') {
      return isTechnicianOrAdmin ? (
        <StaffDashboardPage onNavigate={navigate} />
      ) : (
        <BorrowPage stationCodeFromUrl={stationParam} onNavigate={navigate} />
      );
    }

    if (currentPath === '/staff/returns') {
      return isTechnicianOrAdmin ? (
        <StaffReturnsPage />
      ) : (
        <BorrowPage stationCodeFromUrl={stationParam} onNavigate={navigate} />
      );
    }

    if (currentPath === '/staff/inventory') {
      return isTechnicianOrAdmin ? (
        <StaffInventoryPage />
      ) : (
        <BorrowPage stationCodeFromUrl={stationParam} onNavigate={navigate} />
      );
    }

    if (currentPath === '/admin/stations') {
      return isTechnicianOrAdmin ? (
        <AdminStationsPage />
      ) : (
        <BorrowPage stationCodeFromUrl={stationParam} onNavigate={navigate} />
      );
    }

    if (currentPath === '/admin/reports') {
      return isTechnicianOrAdmin ? (
        <AdminReportsPage />
      ) : (
        <BorrowPage stationCodeFromUrl={stationParam} onNavigate={navigate} />
      );
    }

    if (currentPath === '/admin/users') {
      return isAdmin ? (
        <AdminUsersPage />
      ) : isTechnicianOrAdmin ? (
        <StaffDashboardPage onNavigate={navigate} />
      ) : (
        <BorrowPage stationCodeFromUrl={stationParam} onNavigate={navigate} />
      );
    }

    // Default fallback
    return <BorrowPage stationCodeFromUrl={stationParam} onNavigate={navigate} />;
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#060D1A] text-[#00205B] dark:text-white flex flex-col transition-colors duration-200">
      <Navbar currentPath={currentPath} onNavigate={navigate} />
      <main className="flex-1 pb-12">
        {renderCurrentPage()}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </ThemeProvider>
  );
}
