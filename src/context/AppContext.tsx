import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  Coach,
  Group,
  GroupSession,
  Student,
  AttendanceRecord,
  CoachPaymentItem,
  NotificationItem,
  MakeupSessionItem,
  StudentPaymentRecord,
  Language,
  ThemeMode,
  UserRole,
} from '../types';
import { translations } from '../i18n/translations';

interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  age?: number;
  availableDays?: string[];
  level?: number;
  track?: string;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  grade?: string;
  school?: string;
  emergencyContact?: string;
  learningGoals?: string;
  enrolledGroupIds?: string[];
}

interface AppContextType {
  currentUser: CurrentUser | null;
  role: UserRole | null;
  language: Language;
  theme: ThemeMode;
  t: typeof translations.en;
  setLanguage: (lang: Language) => void;
  setTheme: (theme: ThemeMode) => void;
  loginAsOwner: (passcode: string) => Promise<{ success: boolean; error?: string }>;
  loginAsCoach: (email: string, password: string) => Promise<{ success: boolean; error?: string; status?: string }>;
  loginAsStudent: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUpCoach: (data: any) => Promise<{ success: boolean; error?: string }>;
  signUpStudent: (data: any) => Promise<{ success: boolean; error?: string }>;
  forgotPassword: (role: 'owner' | 'coach' | 'student', email: string) => Promise<{ success: boolean; message?: string; hint?: string; resetCode?: string; currentPassword?: string; error?: string }>;
  resetPassword: (role: 'coach' | 'student', email: string, newPassword: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  logout: () => void;
  switchRolePersona: (role: UserRole, targetId?: string) => void;
  
  // Data
  coaches: Coach[];
  students: Student[];
  groups: Group[];
  sessions: GroupSession[];
  attendance: AttendanceRecord[];
  payments: CoachPaymentItem[];
  studentPayments: StudentPaymentRecord[];
  notifications: NotificationItem[];
  makeups: MakeupSessionItem[];
  customTracks: string[];
  stats: any;
  loading: boolean;
  
  // Actions
  refreshAllData: () => Promise<void>;
  approveCoach: (id: string) => Promise<void>;
  rejectCoach: (id: string) => Promise<void>;
  saveCoach: (coachData: Partial<Coach>) => Promise<void>;
  deleteCoach: (id: string) => Promise<void>;
  saveStudent: (studentData: Partial<Student>) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
  createGroup: (groupData: any) => Promise<{ success: boolean; error?: string }>;
  updateGroup: (id: string, groupData: Partial<Group>) => Promise<void>;
  deleteGroup: (id: string) => Promise<void>;
  continueGroupLevel: (id: string, action: 'continue' | 'finish', options?: any) => Promise<void>;
  updateSession: (id: string, sessionData: Partial<GroupSession>) => Promise<void>;
  postponeSession: (id: string, data: { newDate: string; newStartTime?: string; newEndTime?: string; reason?: string; shiftSubsequentSessions?: boolean }) => Promise<{ success: boolean; error?: string }>;
  addCoachBonus: (data: { coachId: string; amount: number; reason?: string; date?: string }) => Promise<{ success: boolean; error?: string }>;
  createMakeupSession: (data: { studentId: string; coachId: string; originalSessionId?: string; originalGroupId?: string; track?: string; date: string; startTime: string; endTime: string; location?: string; topic?: string; notes?: string }) => Promise<{ success: boolean; error?: string }>;
  completeMakeupSession: (id: string) => Promise<void>;
  saveAttendance: (attendanceData: any) => Promise<void>;
  updatePaymentStatus: (paymentIds: string[], status: 'paid' | 'pending', meta?: any) => Promise<void>;
  submitStudentPayment: (paymentData: Partial<StudentPaymentRecord>) => Promise<{ success: boolean; error?: string; payment?: StudentPaymentRecord }>;
  approveStudentPayment: (id: string) => Promise<{ success: boolean; error?: string }>;
  rejectStudentPayment: (id: string, reason?: string) => Promise<{ success: boolean; error?: string }>;
  sendSessionReminder: (sessionId: string) => Promise<void>;
  sendCustomNotification: (data: any) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  addCustomTrack: (name: string) => Promise<void>;
  checkConflict: (coachIds: string[], dayOfWeek: string, startTime: string, endTime: string, excludeGroupId?: string) => Promise<any>;
  respondToGroupAssignment: (groupId: string, response: 'accepted' | 'rejected', reason?: string) => Promise<void>;
  reassignGroupCoach: (groupId: string, oldCoachId: string, newCoachId: string) => Promise<void>;
  exportBackupData: () => Promise<void>;
  restoreBackupData: (jsonData: any) => Promise<{ success: boolean; error?: string }>;
  resetAllData: () => Promise<{ success: boolean; error?: string }>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Default to null so user must authenticate via Login or Sign Up on first launch
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(() => {
    const saved = localStorage.getItem('mms_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return null;
  });

  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('mms_lang') as Language) || 'en';
  });

  const [theme, setThemeState] = useState<ThemeMode>(() => {
    return (localStorage.getItem('mms_theme') as ThemeMode) || 'dark';
  });

  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [sessions, setSessions] = useState<GroupSession[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [payments, setPayments] = useState<CoachPaymentItem[]>([]);
  const [studentPayments, setStudentPayments] = useState<StudentPaymentRecord[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [makeups, setMakeups] = useState<MakeupSessionItem[]>([]);
  const [customTracks, setCustomTracks] = useState<string[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState<boolean>(true);

  // Sync Language and Direction
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('mms_lang', lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  };

  // Sync Theme
  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode);
    localStorage.setItem('mms_theme', mode);
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      document.documentElement.setAttribute('data-theme', 'light');
    }
  };

  useEffect(() => {
    setLanguage(language);
    setTheme(theme);
  }, []);

  const refreshAllData = async () => {
    try {
      setLoading(true);
      const [
        coachesRes,
        studentsRes,
        groupsRes,
        sessionsRes,
        attendanceRes,
        payrollRes,
        studentPaymentsRes,
        notifRes,
        makeupsRes,
        tracksRes,
        statsRes,
      ] = await Promise.all([
        fetch('/api/coaches').then((r) => r.json()).catch(() => []),
        fetch('/api/students').then((r) => r.json()).catch(() => []),
        fetch('/api/groups').then((r) => r.json()).catch(() => []),
        fetch('/api/sessions').then((r) => r.json()).catch(() => []),
        fetch('/api/attendance').then((r) => r.json()).catch(() => []),
        fetch('/api/payroll').then((r) => r.json()).catch(() => ({ items: [] })),
        fetch('/api/student-payments').then((r) => r.json()).catch(() => []),
        fetch('/api/notifications').then((r) => r.json()).catch(() => []),
        fetch('/api/makeups').then((r) => r.json()).catch(() => []),
        fetch('/api/tracks').then((r) => r.json()).catch(() => []),
        fetch('/api/stats').then((r) => r.json()).catch(() => ({})),
      ]);

      setCoaches(coachesRes || []);
      setStudents(studentsRes || []);
      setGroups(groupsRes || []);
      setSessions(sessionsRes || []);
      setAttendance(attendanceRes || []);
      setPayments(payrollRes.items || []);
      setStudentPayments(studentPaymentsRes || []);
      setNotifications(notifRes || []);
      setMakeups(makeupsRes || []);
      setCustomTracks(tracksRes || []);
      setStats(statsRes || {});
    } catch (err) {
      console.error('Failed to load academy data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAllData();
  }, []);

  const loginAsOwner = async (passcode: string) => {
    try {
      const res = await fetch('/api/auth/login-owner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCurrentUser(data.user);
        localStorage.setItem('mms_user', JSON.stringify(data.user));
        return { success: true };
      }
      return { success: false, error: data.message || 'Authentication failed' };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const loginAsCoach = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCurrentUser(data.user);
        localStorage.setItem('mms_user', JSON.stringify(data.user));
        return { success: true };
      }
      return {
        success: false,
        error: data.message || 'Login failed',
        status: data.status,
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const signUpCoach = async (formData: any) => {
    try {
      const res = await fetch('/api/auth/signup-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await refreshAllData();
        return { success: true };
      }
      return { success: false, error: data.error || 'Sign up failed' };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const loginAsStudent = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCurrentUser(data.user);
        localStorage.setItem('mms_user', JSON.stringify(data.user));
        return { success: true };
      }
      return {
        success: false,
        error: data.message || 'Student login failed',
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const signUpStudent = async (formData: any) => {
    try {
      const res = await fetch('/api/auth/signup-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await refreshAllData();
        return { success: true };
      }
      return { success: false, error: data.error || 'Student registration failed' };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const forgotPassword = async (role: 'owner' | 'coach' | 'student', email: string) => {
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, email }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        return {
          success: true,
          message: data.message,
          hint: data.hint,
          resetCode: data.resetCode,
          currentPassword: data.currentPassword,
        };
      }
      return { success: false, error: data.error || 'Could not process password recovery.' };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const resetPassword = async (role: 'coach' | 'student', email: string, newPassword: string) => {
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, email, newPassword }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        return { success: true, message: data.message };
      }
      return { success: false, error: data.error || 'Failed to update password.' };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('mms_user');
  };

  const switchRolePersona = (targetRole: UserRole, targetId?: string) => {
    if (targetRole === 'admin') {
      const ownerUser: CurrentUser = {
        id: 'owner-master',
        name: 'Academy Director (Owner)',
        email: 'director@mmsacademy.edu',
        role: 'admin',
      };
      setCurrentUser(ownerUser);
      localStorage.setItem('mms_user', JSON.stringify(ownerUser));
    } else if (targetRole === 'student') {
      const targetStudent = targetId
        ? students.find((s) => s.id === targetId)
        : students[0];

      if (targetStudent) {
        const studentUser: CurrentUser = {
          id: targetStudent.id,
          name: targetStudent.name,
          email: targetStudent.email || targetStudent.parentEmail || '',
          role: 'student',
          age: targetStudent.age,
          level: targetStudent.level || 1,
          track: targetStudent.track || 'Arduino',
          parentName: targetStudent.parentName,
          parentPhone: targetStudent.parentPhone,
          parentEmail: targetStudent.parentEmail,
          grade: targetStudent.grade,
          school: targetStudent.school,
          emergencyContact: targetStudent.emergencyContact,
          learningGoals: targetStudent.learningGoals,
          enrolledGroupIds: targetStudent.enrolledGroupIds,
        };
        setCurrentUser(studentUser);
        localStorage.setItem('mms_user', JSON.stringify(studentUser));
      }
    } else {
      const targetCoach = targetId
        ? coaches.find((c) => c.id === targetId)
        : coaches.find((c) => c.status === 'active') || coaches[0];

      if (targetCoach) {
        const coachUser: CurrentUser = {
          id: targetCoach.id,
          name: targetCoach.name,
          email: targetCoach.email,
          role: 'coach',
          phone: targetCoach.phone,
          age: targetCoach.age,
          availableDays: targetCoach.availableDays,
        };
        setCurrentUser(coachUser);
        localStorage.setItem('mms_user', JSON.stringify(coachUser));
      }
    }
  };

  const approveCoach = async (id: string) => {
    await fetch(`/api/coaches/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'active' }),
    });
    await refreshAllData();
  };

  const rejectCoach = async (id: string) => {
    await fetch(`/api/coaches/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'rejected' }),
    });
    await refreshAllData();
  };

  const saveCoach = async (coachData: Partial<Coach>) => {
    if (coachData.id) {
      await fetch(`/api/coaches/${coachData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(coachData),
      });
    } else {
      await fetch('/api/coaches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(coachData),
      });
    }
    await refreshAllData();
  };

  const deleteCoach = async (id: string) => {
    await fetch(`/api/coaches/${id}`, { method: 'DELETE' });
    await refreshAllData();
  };

  const saveStudent = async (studentData: Partial<Student>) => {
    if (studentData.id) {
      await fetch(`/api/students/${studentData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentData),
      });
    } else {
      await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentData),
      });
    }
    await refreshAllData();
  };

  const deleteStudent = async (id: string) => {
    await fetch(`/api/students/${id}`, { method: 'DELETE' });
    await refreshAllData();
  };

  const checkConflict = async (
    coachIds: string[],
    dayOfWeek: string,
    startTime: string,
    endTime: string,
    excludeGroupId?: string
  ) => {
    const res = await fetch('/api/groups/check-conflict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ coachIds, dayOfWeek, startTime, endTime, excludeGroupId }),
    });
    return res.json();
  };

  const createGroup = async (groupData: any) => {
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(groupData),
      });
      if (res.ok) {
        await refreshAllData();
        return { success: true };
      }
      const data = await res.json();
      return { success: false, error: data.error };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const updateGroup = async (id: string, groupData: Partial<Group>) => {
    await fetch(`/api/groups/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(groupData),
    });
    await refreshAllData();
  };

  const deleteGroup = async (id: string) => {
    await fetch(`/api/groups/${id}`, { method: 'DELETE' });
    await refreshAllData();
  };

  const continueGroupLevel = async (id: string, action: 'continue' | 'finish', options?: any) => {
    await fetch(`/api/groups/${id}/continue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...options }),
    });
    await refreshAllData();
  };

  const updateSession = async (id: string, sessionData: Partial<GroupSession>) => {
    await fetch(`/api/sessions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sessionData),
    });
    await refreshAllData();
  };

  const postponeSession = async (
    id: string,
    data: { newDate: string; newStartTime?: string; newEndTime?: string; reason?: string; shiftSubsequentSessions?: boolean }
  ) => {
    try {
      const res = await fetch(`/api/sessions/${id}/postpone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        await refreshAllData();
        return { success: true };
      }
      return { success: false, error: result.error || 'Failed to postpone session' };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const addCoachBonus = async (data: { coachId: string; amount: number; reason?: string; date?: string }) => {
    try {
      const res = await fetch('/api/payroll/bonus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        await refreshAllData();
        return { success: true };
      }
      return { success: false, error: result.error || 'Failed to add bonus' };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const createMakeupSession = async (data: {
    studentId: string;
    coachId: string;
    originalSessionId?: string;
    originalGroupId?: string;
    track?: string;
    date: string;
    startTime: string;
    endTime: string;
    location?: string;
    topic?: string;
    notes?: string;
  }) => {
    try {
      const res = await fetch('/api/makeups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        await refreshAllData();
        return { success: true };
      }
      return { success: false, error: result.error || 'Failed to create makeup session' };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const completeMakeupSession = async (id: string) => {
    await fetch(`/api/makeups/${id}/complete`, { method: 'POST' });
    await refreshAllData();
  };

  const saveAttendance = async (attendanceData: any) => {
    await fetch('/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(attendanceData),
    });
    await refreshAllData();
  };

  const updatePaymentStatus = async (
    paymentIds: string[],
    status: 'paid' | 'pending',
    meta?: any
  ) => {
    await fetch('/api/payroll/mark-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentIds, status, ...meta }),
    });
    await refreshAllData();
  };

  const submitStudentPayment = async (
    paymentData: Partial<StudentPaymentRecord>
  ): Promise<{ success: boolean; error?: string; payment?: StudentPaymentRecord }> => {
    try {
      const res = await fetch('/api/student-payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await refreshAllData();
        return { success: true, payment: data.payment };
      }
      return { success: false, error: data.error || 'Failed to submit payment' };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const approveStudentPayment = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`/api/student-payments/${id}/approve`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await refreshAllData();
        return { success: true };
      }
      return { success: false, error: data.error || 'Failed to approve payment' };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const rejectStudentPayment = async (id: string, reason?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`/api/student-payments/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await refreshAllData();
        return { success: true };
      }
      return { success: false, error: data.error || 'Failed to reject payment' };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const sendSessionReminder = async (sessionId: string) => {
    await fetch('/api/notifications/send-reminder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    });
    await refreshAllData();
  };

  const sendCustomNotification = async (data: any) => {
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    await refreshAllData();
  };

  const markNotificationRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
  };

  const markAllNotificationsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    await fetch('/api/notifications/mark-all-read', { method: 'POST' }).catch(() => {});
  };

  const addCustomTrack = async (name: string) => {
    await fetch('/api/tracks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trackName: name }),
    });
    await refreshAllData();
  };

  const respondToGroupAssignment = async (groupId: string, response: 'accepted' | 'rejected', reason?: string) => {
    if (!currentUser) return;
    await fetch(`/api/groups/${groupId}/respond-assignment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        coachId: currentUser.id,
        response,
        reason,
      }),
    });
    await refreshAllData();
  };

  const reassignGroupCoach = async (groupId: string, oldCoachId: string, newCoachId: string) => {
    await fetch(`/api/groups/${groupId}/reassign-coach`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oldCoachId, newCoachId }),
    });
    await refreshAllData();
  };

  const exportBackupData = async () => {
    try {
      const res = await fetch('/api/backup');
      const data = await res.json();
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `mms_academy_backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      console.error('Failed to export backup data:', err);
    }
  };

  const restoreBackupData = async (jsonData: any): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jsonData),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        await refreshAllData();
        return { success: true };
      }
      return { success: false, error: result.error || 'Failed to restore database' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error uploading backup file' };
    }
  };

  const resetAllData = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/reset-data', {
        method: 'POST',
      });
      const result = await res.json();
      if (res.ok && result.success) {
        await refreshAllData();
        return { success: true };
      }
      return { success: false, error: result.error || 'Failed to reset database' };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const t = translations[language];

  return (
    <AppContext.Provider
      value={{
        currentUser,
        role: currentUser?.role || null,
        language,
        theme,
        t,
        setLanguage,
        setTheme,
        loginAsOwner,
        loginAsCoach,
        loginAsStudent,
        signUpCoach,
        signUpStudent,
        forgotPassword,
        resetPassword,
        logout,
        switchRolePersona,
        coaches,
        students,
        groups,
        sessions,
        attendance,
        payments,
        studentPayments,
        notifications,
        makeups,
        customTracks,
        stats,
        loading,
        refreshAllData,
        approveCoach,
        rejectCoach,
        saveCoach,
        deleteCoach,
        saveStudent,
        deleteStudent,
        createGroup,
        updateGroup,
        deleteGroup,
        continueGroupLevel,
        updateSession,
        postponeSession,
        addCoachBonus,
        createMakeupSession,
        completeMakeupSession,
        saveAttendance,
        updatePaymentStatus,
        submitStudentPayment,
        approveStudentPayment,
        rejectStudentPayment,
        sendSessionReminder,
        sendCustomNotification,
        markNotificationRead,
        markAllNotificationsRead,
        addCustomTrack,
        checkConflict,
        respondToGroupAssignment,
        reassignGroupCoach,
        exportBackupData,
        restoreBackupData,
        resetAllData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
