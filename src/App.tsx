/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, Component, ErrorInfo, ReactNode } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { AuthModal } from './components/AuthModal';
import { DashboardView } from './components/DashboardView';
import { GroupsView } from './components/GroupsView';
import { CalendarView } from './components/CalendarView';
import { CoachesView } from './components/CoachesView';
import { StudentsView } from './components/StudentsView';
import { AttendanceView } from './components/AttendanceView';
import { PayrollView } from './components/PayrollView';
import { RemindersView } from './components/RemindersView';
import { StudentDashboardView } from './components/StudentDashboardView';
import { DataManagementModal } from './components/DataManagementModal';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = {
    hasError: false,
    error: undefined,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught component error:', error, errorInfo);
  }

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center space-y-4 rounded-3xl bg-red-500/10 border border-red-500/30 text-white max-w-lg mx-auto my-12 backdrop-blur-xl">
          <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white">Something went wrong in this view</h3>
            <p className="text-xs text-white/60 mt-1">
              {this.state.error?.message || 'An unexpected rendering error occurred.'}
            </p>
          </div>
          <button
            onClick={() => {
              this.setState({ hasError: false });
              window.location.reload();
            }}
            className="px-4 py-2 rounded-xl bg-[#BEF264] text-[#050B1A] font-black text-xs inline-flex items-center gap-2 hover:bg-[#aee64a] transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reload & Refresh</span>
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const MainLayout: React.FC = () => {
  const { currentUser, role, theme } = useApp();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // If user is not authenticated, show the login/signup screen directly
  if (!currentUser) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300 ${
          theme === 'dark' ? 'bg-[#050B1A] text-white app-dark' : 'bg-[#F1F5F9] text-slate-900 app-light'
        }`}
        style={
          theme === 'dark'
            ? { backgroundImage: 'radial-gradient(circle at 0% 0%, #0A192F 0%, #050B1A 100%)' }
            : { backgroundImage: 'radial-gradient(circle at 0% 0%, #E2E8F0 0%, #F1F5F9 100%)' }
        }
      >
        <AuthModal isOpen={true} onClose={() => {}} />
      </div>
    );
  }

  const handleNavigateTab = (tab: string) => {
    setCurrentTab(tab);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${
        theme === 'dark' ? 'bg-[#050B1A] text-white app-dark' : 'bg-[#F1F5F9] text-slate-900 app-light'
      }`}
      style={
        theme === 'dark'
          ? { backgroundImage: 'radial-gradient(circle at 0% 0%, #0A192F 0%, #050B1A 100%)' }
          : { backgroundImage: 'radial-gradient(circle at 0% 0%, #E2E8F0 0%, #F1F5F9 100%)' }
      }
    >
      {/* Top Navbar */}
      <Navbar
        onToggleMobileSidebar={() => setMobileMenuOpen(!mobileMenuOpen)}
        isMobileSidebarOpen={mobileMenuOpen}
        onNavigateTab={handleNavigateTab}
      />

      {/* Body container with Sidebar + Main Content */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row gap-6">
        {/* Navigation Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={handleNavigateTab}
          isOpenMobile={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
          onOpenDataManagement={() => setIsDataModalOpen(true)}
        />

        {/* Dynamic View Area */}
        <main className="flex-1 min-w-0 pb-12">
          <ErrorBoundary>
            {currentTab === 'dashboard' && (
              role === 'student' ? (
                <StudentDashboardView onNavigateTab={handleNavigateTab} />
              ) : (
                <DashboardView
                  onNavigateTab={handleNavigateTab}
                  onOpenCreateGroup={() => handleNavigateTab('groups')}
                  onOpenAddStudent={() => handleNavigateTab('students')}
                />
              )
            )}

            {currentTab === 'groups' && <GroupsView />}

            {currentTab === 'calendar' && (
              <CalendarView onNavigateTab={handleNavigateTab} />
            )}

            {currentTab === 'coaches' && role === 'admin' && <CoachesView />}

            {currentTab === 'students' && <StudentsView />}

            {currentTab === 'attendance' && <AttendanceView />}

            {currentTab === 'payroll' && <PayrollView />}

            {currentTab === 'reminders' && <RemindersView />}
          </ErrorBoundary>
        </main>
      </div>

      {/* Auth Modal if triggered via menu */}
      {isAuthModalOpen && (
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
        />
      )}

      {/* Data Management Modal for Owner */}
      {isDataModalOpen && (
        <DataManagementModal
          isOpen={isDataModalOpen}
          onClose={() => setIsDataModalOpen(false)}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
