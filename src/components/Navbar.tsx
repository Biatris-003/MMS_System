import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MMSLogo } from './MMSLogo';
import {
  Bell,
  Globe,
  LogOut,
  Shield,
  UserCheck,
  GraduationCap,
  ChevronDown,
  Clock,
  Sparkles,
  Menu,
  X,
  Sun,
  Moon,
  CheckCheck,
} from 'lucide-react';

interface NavbarProps {
  onToggleMobileSidebar?: () => void;
  isMobileSidebarOpen?: boolean;
  onNavigateTab?: (tab: string) => void;
  onOpenAuth?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleMobileSidebar,
  isMobileSidebarOpen,
  onNavigateTab,
  onOpenAuth,
}) => {
  const {
    currentUser,
    role,
    language,
    theme,
    t,
    setLanguage,
    setTheme,
    logout,
    switchRolePersona,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    coaches,
    students,
  } = useApp();

  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);

  const unreadNotifs = notifications.filter((n) => !n.isRead);

  const handleToggleNotifMenu = () => {
    if (!showNotifMenu) {
      setShowNotifMenu(true);
      if (unreadNotifs.length > 0) {
        markAllNotificationsRead();
      }
    } else {
      setShowNotifMenu(false);
    }
  };

  return (
    <header
      id="main-navbar"
      className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#050B1A]/80 backdrop-blur-xl transition-colors duration-200"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
        {/* Left: Mobile Menu Toggle & Academy Brand Logo */}
        <div className="flex items-center gap-3">
          {onToggleMobileSidebar && (
            <button
              onClick={onToggleMobileSidebar}
              className="md:hidden p-2 rounded-xl text-white/70 hover:text-white bg-white/5 border border-white/10 transition-colors"
              aria-label="Toggle Navigation"
            >
              {isMobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}
          <MMSLogo size="md" />
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Demo Switcher / Persona Previewer */}
          {currentUser && (
            <div className="relative">
              <button
                id="persona-dropdown-btn"
                onClick={() => setShowPersonaMenu(!showPersonaMenu)}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#BEF264]/30 bg-[#BEF264]/10 text-xs font-bold text-[#BEF264] hover:bg-[#BEF264]/20 transition-all backdrop-blur-md"
                title="Switch between Owner, Coach, and Student preview"
              >
                {role === 'admin' ? (
                  <Shield className="w-3.5 h-3.5 text-[#BEF264]" />
                ) : role === 'student' ? (
                  <GraduationCap className="w-3.5 h-3.5 text-[#BEF264]" />
                ) : (
                  <UserCheck className="w-3.5 h-3.5 text-[#BEF264]" />
                )}
                <span>
                  {role === 'admin'
                    ? t.ownerBadge
                    : role === 'student'
                    ? `Student: ${currentUser.name.split(' ')[0] || currentUser.name}`
                    : `${t.coachBadge}: ${currentUser.name.split(' ')[1] || currentUser.name}`}
                </span>
                <ChevronDown className="w-3 h-3 opacity-70" />
              </button>

              {showPersonaMenu && (
                <div
                  className={`absolute mt-2 w-64 rounded-2xl bg-[#070E20]/95 backdrop-blur-2xl border border-white/15 shadow-2xl p-2 z-50 animate-fade-in ${
                    language === 'ar' ? 'left-0' : 'right-0'
                  }`}
                >
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white/40">
                    {t.switchPersona}
                  </div>
                  <button
                    id="switch-to-owner-btn"
                    onClick={() => {
                      switchRolePersona('admin');
                      setShowPersonaMenu(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-left transition-all ${
                      role === 'admin'
                        ? 'bg-[#BEF264] text-[#050B1A] font-bold shadow-md shadow-[#BEF264]/20'
                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Shield className="w-4 h-4 shrink-0" />
                    <div className="truncate">
                      <div className="font-bold">{t.roleOwner}</div>
                      <div className="text-[10px] opacity-70">Master Academy Control</div>
                    </div>
                  </button>

                  <div className="my-1.5 border-t border-white/10" />

                  <div className="px-3 py-1 text-[10px] text-white/40 font-bold uppercase tracking-wider">
                    Available Coaches:
                  </div>
                  {coaches
                    .filter((c) => c.status === 'active')
                    .slice(0, 3)
                    .map((coach) => (
                      <button
                        key={coach.id}
                        onClick={() => {
                          switchRolePersona('coach', coach.id);
                          setShowPersonaMenu(false);
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-left transition-all ${
                          role === 'coach' && currentUser?.id === coach.id
                            ? 'bg-[#BEF264] text-[#050B1A] font-bold shadow-md shadow-[#BEF264]/20'
                            : 'text-white/70 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <UserCheck className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{coach.name}</span>
                      </button>
                    ))}

                  <div className="my-1.5 border-t border-white/10" />

                  <div className="px-3 py-1 text-[10px] text-[#BEF264] font-bold uppercase tracking-wider">
                    Student Portals:
                  </div>
                  {students.slice(0, 3).map((std) => (
                    <button
                      key={std.id}
                      onClick={() => {
                        switchRolePersona('student', std.id);
                        setShowPersonaMenu(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-left transition-all ${
                        role === 'student' && currentUser?.id === std.id
                          ? 'bg-[#BEF264] text-[#050B1A] font-bold shadow-md shadow-[#BEF264]/20'
                          : 'text-white/70 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <GraduationCap className="w-3.5 h-3.5 shrink-0 text-[#BEF264]" />
                      <div className="truncate">
                        <span className="font-bold text-white block">{std.name}</span>
                        <span className="text-[10px] text-white/50">{std.track || 'Robotics'} • Lvl {std.level || 1}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Notifications / Reminders Dropdown */}
          <div className="relative">
            <button
              id="notif-btn"
              onClick={handleToggleNotifMenu}
              className="relative p-2.5 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              title={t.navReminders}
            >
              <Bell className="w-4 h-4" />
              {unreadNotifs.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#BEF264] rounded-full ring-2 ring-[#050B1A] animate-pulse" />
              )}
            </button>

            {showNotifMenu && (
              <div
                className={`absolute mt-2 w-80 sm:w-96 rounded-3xl bg-[#070E20]/95 backdrop-blur-2xl border border-white/15 shadow-2xl p-4 z-50 animate-fade-in ${
                  language === 'ar' ? 'left-0' : 'right-0'
                }`}
              >
                <div className="flex items-center justify-between pb-3 border-b border-white/10 px-1">
                  <div className="flex items-center gap-2 font-bold text-sm text-white">
                    <Sparkles className="w-4 h-4 text-[#BEF264]" />
                    <span>{t.navReminders}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => markAllNotificationsRead()}
                      className="text-[10px] font-bold text-white/60 hover:text-[#BEF264] flex items-center gap-1 transition-colors px-2 py-0.5 rounded-lg hover:bg-white/5"
                      title={t.markAllRead}
                    >
                      <CheckCheck className="w-3.5 h-3.5 text-[#BEF264]" />
                      <span>{t.markAllRead}</span>
                    </button>
                    {unreadNotifs.length > 0 && (
                      <span className="text-[10px] font-bold bg-[#BEF264]/20 text-[#BEF264] px-2.5 py-0.5 rounded-full border border-[#BEF264]/30">
                        {unreadNotifs.length} new
                      </span>
                    )}
                  </div>
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-white/5 my-2">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-xs text-white/40">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.slice(0, 8).map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => markNotificationRead(notif.id)}
                        className={`p-3 rounded-2xl cursor-pointer transition-all ${
                          notif.isRead
                            ? 'opacity-60 hover:bg-white/5'
                            : 'bg-white/5 border border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <Clock className="w-3.5 h-3.5 text-[#BEF264] mt-0.5 shrink-0" />
                          <div className="flex-1">
                            <h4 className="text-xs font-bold text-white">
                              {language === 'ar' && notif.titleAr ? notif.titleAr : notif.title}
                            </h4>
                            <p className="text-[11px] text-white/60 mt-0.5 leading-relaxed">
                              {language === 'ar' && notif.messageAr ? notif.messageAr : notif.message}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Dark / Light Mode Toggle Button */}
          <button
            id="theme-toggle-btn"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="flex items-center gap-1.5 p-2.5 sm:px-3 sm:py-2 rounded-xl border border-white/10 bg-white/5 text-xs font-bold text-white/80 hover:text-white hover:border-[#BEF264]/40 hover:bg-white/10 transition-colors"
            title={theme === 'dark' ? t.themeLight : t.themeDark}
            aria-label="Toggle Dark/Light Mode"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-300 transition-transform duration-200 hover:rotate-45" />
            ) : (
              <Moon className="w-4 h-4 text-[#BEF264] transition-transform duration-200 hover:-rotate-12" />
            )}
            <span className="hidden sm:inline">
              {theme === 'dark' ? t.themeLight : t.themeDark}
            </span>
          </button>

          {/* Language Toggle (English / Arabic) */}
          <button
            id="lang-toggle-btn"
            onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-xs font-bold text-white/80 hover:text-white hover:border-[#BEF264]/40 hover:bg-white/10 transition-colors"
            title="Toggle Language (English / العربية)"
          >
            <Globe className="w-3.5 h-3.5 text-[#BEF264]" />
            <span>{language === 'en' ? 'AR' : 'EN'}</span>
          </button>

          {/* Auth Button (Login or Logout) */}
          {currentUser ? (
            <button
              id="logout-btn"
              onClick={logout}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-xs font-bold transition-colors"
              title={t.logout}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.logout}</span>
            </button>
          ) : (
            <button
              id="login-modal-open-btn"
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#BEF264] hover:bg-[#aee64a] text-[#050B1A] font-black text-xs shadow-lg shadow-[#BEF264]/20 transition-all"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>{t.login}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
