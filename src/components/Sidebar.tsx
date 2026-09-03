import React from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  Layers,
  Calendar,
  Users,
  GraduationCap,
  ClipboardCheck,
  Wallet,
  BellRing,
  UserCheck,
  ShieldAlert,
  LogOut,
  X,
  Database,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  onOpenDataManagement?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
  onOpenDataManagement,
}) => {
  const { role, t, language, coaches, notifications, logout } = useApp();
  const isAr = language === 'ar';

  const pendingCoachesCount = coaches.filter((c) => c.status === 'pending').length;
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const navItems = [
    {
      id: 'dashboard',
      label: role === 'student' ? (isAr ? 'لوحة تحكم الطالب' : 'Student Dashboard') : t.navDashboard,
      icon: LayoutDashboard,
      roles: ['admin', 'coach', 'student'],
    },
    {
      id: 'groups',
      label: t.navGroups,
      icon: Layers,
      roles: ['admin', 'coach'],
    },
    {
      id: 'calendar',
      label: t.navCalendar,
      icon: Calendar,
      roles: ['admin', 'coach', 'student'],
    },
    {
      id: 'coaches',
      label: t.navCoaches,
      icon: Users,
      roles: ['admin'], // Owner only
      badge: pendingCoachesCount > 0 ? pendingCoachesCount : undefined,
      badgeColor: 'bg-[#BEF264] text-[#050B1A] font-black',
    },
    {
      id: 'students',
      label: t.navStudents,
      icon: GraduationCap,
      roles: ['admin', 'coach'],
    },
    {
      id: 'attendance',
      label: t.navAttendance,
      icon: ClipboardCheck,
      roles: ['admin', 'coach'],
    },
    {
      id: 'payroll',
      label: t.navPayroll,
      icon: Wallet,
      roles: ['admin', 'coach'],
    },
    {
      id: 'reminders',
      label: t.navReminders,
      icon: BellRing,
      roles: ['admin', 'coach', 'student'],
      badge: unreadCount > 0 ? unreadCount : undefined,
      badgeColor: 'bg-[#BEF264] text-[#050B1A] font-black',
    },
  ];

  const visibleItems = navItems.filter(
    (item) => !role || item.roles.includes(role)
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-[#050B1A]/80 backdrop-blur-md z-40 md:hidden"
        />
      )}

      <aside
        id="main-sidebar"
        className={`w-full md:w-64 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-xl p-4 flex flex-col justify-between shrink-0 transition-all duration-300 ${
          isOpenMobile
            ? 'fixed top-20 left-4 right-4 z-50 shadow-2xl md:relative md:top-auto md:left-auto md:right-auto'
            : 'hidden md:flex'
        }`}
      >
        <div className="space-y-3">
          {/* Mobile close button & Role Identity */}
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className={`p-2 rounded-xl ${
                  role === 'admin'
                    ? 'bg-[#BEF264]/20 text-[#BEF264] border border-[#BEF264]/30'
                    : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                }`}
              >
                {role === 'admin' ? (
                  <ShieldAlert className="w-4 h-4" />
                ) : (
                  <UserCheck className="w-4 h-4" />
                )}
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold tracking-widest text-white/40">
                  {t.currentRole}
                </div>
                <div className="text-xs font-bold text-white">
                  {role === 'admin' ? t.roleOwner : t.roleCoach}
                </div>
              </div>
            </div>

            {isOpenMobile && (
              <button
                onClick={onCloseMobile}
                className="md:hidden p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1 py-1">
            {visibleItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs transition-all duration-150 ${
                    isActive
                      ? 'bg-[#BEF264]/10 text-[#BEF264] border border-[#BEF264]/20 font-bold shadow-sm'
                      : 'text-white/60 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive ? 'text-[#BEF264]' : 'text-white/40 group-hover:text-white'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== undefined && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] ${
                        isActive
                          ? 'bg-[#BEF264] text-[#050B1A] font-black'
                          : item.badgeColor
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer & Quick Logout */}
        <div className="pt-4 border-t border-white/10 space-y-2">
          {onOpenDataManagement && role === 'admin' && (
            <button
              onClick={onOpenDataManagement}
              className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 font-bold text-xs cursor-pointer transition-all"
            >
              <Database className="w-3.5 h-3.5 text-[#BEF264]" />
              <span>{isAr ? 'النسخ الاحتياطي والبيانات' : 'Backup & Data Manager'}</span>
            </button>
          )}

          <div className="flex items-center justify-between text-[10px] text-white/40 px-1 font-medium pt-1">
            <span>MMS Core v2.4</span>
            <span className="text-[#BEF264]/70">Auto-Saving</span>
          </div>

          <button
            onClick={logout}
            className="w-full bg-[#BEF264] text-[#050B1A] py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 font-black text-xs cursor-pointer hover:bg-[#aee64a] shadow-lg shadow-[#BEF264]/20 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>
              {role === 'admin'
                ? 'LOGOUT OWNER'
                : role === 'student'
                ? 'LOGOUT STUDENT'
                : 'LOGOUT COACH'}
            </span>
          </button>
        </div>
      </aside>
    </>
  );
};
