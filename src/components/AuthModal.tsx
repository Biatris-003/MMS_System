import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MMSLogo } from './MMSLogo';
import {
  Shield,
  UserCheck,
  GraduationCap,
  Lock,
  Mail,
  User,
  Phone,
  AlertCircle,
  CheckCircle2,
  X,
  Sparkles,
  ArrowLeft,
  KeyRound,
  Send,
  HelpCircle,
} from 'lucide-react';

export type AuthMode =
  | 'owner'
  | 'coach_login'
  | 'coach_signup'
  | 'student_login'
  | 'student_signup'
  | 'forgot_password';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: AuthMode;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'student_login',
}) => {
  const {
    currentUser,
    language,
    setLanguage,
    t,
    loginAsOwner,
    loginAsCoach,
    loginAsStudent,
    signUpCoach,
    signUpStudent,
    forgotPassword,
    resetPassword,
  } = useApp();

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [returnMode, setReturnMode] = useState<AuthMode>('student_login');

  // Login form states
  const [ownerPasscode, setOwnerPasscode] = useState('');
  const [coachEmail, setCoachEmail] = useState('');
  const [coachPassword, setCoachPassword] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPassword, setStudentPassword] = useState('');

  // Coach Sign up fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [age, setAge] = useState<number | ''>(24);
  const [phone, setPhone] = useState('');
  const [availableDays, setAvailableDays] = useState<string[]>([
    'Saturday',
    'Sunday',
    'Wednesday',
  ]);
  const [specialization, setSpecialization] = useState<string[]>(['Arduino', 'WeDo']);

  // Student Sign up fields
  const [studentName, setStudentName] = useState('');
  const [studentAge, setStudentAge] = useState<number | ''>(11);
  const [studentPhone, setStudentPhone] = useState('');
  const [studentRegEmail, setStudentRegEmail] = useState('');
  const [studentRegPassword, setStudentRegPassword] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [studentGrade, setStudentGrade] = useState('Grade 6');
  const [studentSchool, setStudentSchool] = useState('');
  const [studentTrack, setStudentTrack] = useState('Arduino');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [learningGoals, setLearningGoals] = useState('');

  // Forgot Password fields
  const [forgotRole, setForgotRole] = useState<'owner' | 'coach' | 'student'>('student');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotResult, setForgotResult] = useState<{
    message?: string;
    hint?: string;
    resetCode?: string;
    currentPassword?: string;
  } | null>(null);
  const [newResetPassword, setNewResetPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isPendingApproval, setIsPendingApproval] = useState(false);

  if (!isOpen) return null;

  const daysOfWeek = [
    'Saturday',
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
  ];

  const tracksList = [
    'Arduino',
    'WeDo',
    'Lego Essential',
    'Lego Prime',
    'Lego EV3',
    'SolidWorks',
  ];

  const handleToggleDay = (day: string) => {
    if (availableDays.includes(day)) {
      setAvailableDays(availableDays.filter((d) => d !== day));
    } else {
      setAvailableDays([...availableDays, day]);
    }
  };

  const handleToggleTrack = (track: string) => {
    if (specialization.includes(track)) {
      setSpecialization(specialization.filter((tr) => tr !== track));
    } else {
      setSpecialization([...specialization, track]);
    }
  };

  const triggerForgotPassword = (role: 'owner' | 'coach' | 'student', prefillEmail = '') => {
    setForgotRole(role);
    setForgotEmail(prefillEmail);
    setForgotResult(null);
    setResetSuccess(false);
    setErrorMsg('');
    setSuccessMsg('');
    setReturnMode(mode);
    setMode('forgot_password');
  };

  const handleOwnerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    const res = await loginAsOwner(ownerPasscode);
    setLoading(false);
    if (res.success) {
      onClose();
    } else {
      setErrorMsg(t.invalidOwnerPass || 'Invalid owner passcode');
    }
  };

  const handleCoachLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsPendingApproval(false);
    setLoading(true);
    const res = await loginAsCoach(coachEmail, coachPassword);
    setLoading(false);
    if (res.success) {
      onClose();
    } else {
      if (res.status === 'pending') {
        setIsPendingApproval(true);
      } else if (res.status === 'rejected') {
        setErrorMsg(t.rejectedAccountMsg || 'Account was rejected by admin');
      } else {
        setErrorMsg(t.invalidCredentials || 'Invalid email or password');
      }
    }
  };

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    const res = await loginAsStudent(studentEmail, studentPassword);
    setLoading(false);
    if (res.success) {
      onClose();
    } else {
      setErrorMsg(res.error || t.invalidCredentials || 'Invalid student credentials');
    }
  };

  const handleCoachSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);
    const res = await signUpCoach({
      name,
      email,
      password,
      age,
      phone,
      availableDays,
      specialization,
    });
    setLoading(false);
    if (res.success) {
      setSuccessMsg(t.pendingApprovalMsg);
      setIsPendingApproval(true);
    } else {
      setErrorMsg(res.error || 'Registration failed');
    }
  };

  const handleStudentSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);
    const res = await signUpStudent({
      name: studentName,
      age: studentAge,
      phone: studentPhone || parentPhone,
      email: studentRegEmail,
      password: studentRegPassword,
      parentName,
      parentPhone,
      parentEmail,
      grade: studentGrade,
      school: studentSchool,
      track: studentTrack,
      emergencyContact,
      learningGoals,
    });
    setLoading(false);
    if (res.success) {
      setSuccessMsg(t.studentSignupSuccess || 'Student account created successfully! You can now log in.');
      // Switch to login tab and prefill
      setStudentEmail(studentRegEmail);
      setStudentPassword(studentRegPassword);
      setMode('student_login');
    } else {
      setErrorMsg(res.error || 'Student registration failed');
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);
    const res = await forgotPassword(forgotRole, forgotEmail);
    setLoading(false);
    if (res.success) {
      setForgotResult({
        message: res.message,
        hint: res.hint,
        resetCode: res.resetCode,
        currentPassword: res.currentPassword,
      });
      setSuccessMsg(res.message || 'Password reset details dispatched to registered email.');
    } else {
      setErrorMsg(res.error || 'Password recovery failed');
    }
  };

  const handleDirectPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResetPassword || newResetPassword.length < 4) {
      setErrorMsg('New password must be at least 4 characters');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    const res = await resetPassword(
      forgotRole as 'coach' | 'student',
      forgotEmail,
      newResetPassword
    );
    setLoading(false);
    if (res.success) {
      setResetSuccess(true);
      setSuccessMsg(res.message || 'Password updated successfully!');
    } else {
      setErrorMsg(res.error || 'Could not reset password');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050B1A]/85 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-xl rounded-3xl bg-[#070E20]/95 backdrop-blur-2xl border border-white/15 shadow-2xl overflow-hidden p-6 sm:p-8 text-white max-h-[92vh] overflow-y-auto">
        {/* Language switch and Close Button */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
            className="px-2.5 py-1 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 transition-colors"
          >
            {language === 'en' ? 'العربية' : 'English'}
          </button>
          {currentUser && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Modal Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <MMSLogo size="xl" variant="badge" showSubtitle={true} />
          <p className="text-[11px] text-[#BEF264]/80 mt-2 font-medium tracking-wide">
            {t.specialty}
          </p>
        </div>

        {/* Role Navigation Tabs (when not in forgot password mode) */}
        {mode !== 'forgot_password' && (
          <div className="space-y-3 mb-6">
            {/* Primary Category Selector: Student | Coach | Owner */}
            <div className="grid grid-cols-3 p-1.5 rounded-2xl bg-white/5 border border-white/10 text-xs font-bold">
              <button
                id="tab-student"
                onClick={() => {
                  setMode('student_login');
                  setErrorMsg('');
                  setIsPendingApproval(false);
                }}
                className={`py-2 px-2 rounded-xl transition-all ${
                  mode === 'student_login' || mode === 'student_signup'
                    ? 'bg-[#BEF264] text-[#050B1A] shadow-md shadow-[#BEF264]/20 font-black'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>{t.navStudents || 'Student'}</span>
                </div>
              </button>

              <button
                id="tab-coach"
                onClick={() => {
                  setMode('coach_login');
                  setErrorMsg('');
                  setIsPendingApproval(false);
                }}
                className={`py-2 px-2 rounded-xl transition-all ${
                  mode === 'coach_login' || mode === 'coach_signup'
                    ? 'bg-[#BEF264] text-[#050B1A] shadow-md shadow-[#BEF264]/20 font-black'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>{t.coachTitle || 'Coach'}</span>
                </div>
              </button>

              <button
                id="tab-owner"
                onClick={() => {
                  setMode('owner');
                  setErrorMsg('');
                  setIsPendingApproval(false);
                }}
                className={`py-2 px-2 rounded-xl transition-all ${
                  mode === 'owner'
                    ? 'bg-[#BEF264] text-[#050B1A] shadow-md shadow-[#BEF264]/20 font-black'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  <span>{t.ownerLogin || 'Director'}</span>
                </div>
              </button>
            </div>

            {/* Sub-toggle for Student: Login vs Sign Up */}
            {(mode === 'student_login' || mode === 'student_signup') && (
              <div className="flex items-center justify-center gap-2 p-1 rounded-xl bg-white/5 border border-white/5 text-xs">
                <button
                  type="button"
                  onClick={() => setMode('student_login')}
                  className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
                    mode === 'student_login'
                      ? 'bg-white/15 text-[#BEF264]'
                      : 'text-white/50 hover:text-white'
                  }`}
                >
                  {t.studentLogin || 'Student Log In'}
                </button>
                <button
                  type="button"
                  onClick={() => setMode('student_signup')}
                  className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
                    mode === 'student_signup'
                      ? 'bg-white/15 text-[#BEF264]'
                      : 'text-white/50 hover:text-white'
                  }`}
                >
                  {t.studentSignUp || 'New Student Sign Up'}
                </button>
              </div>
            )}

            {/* Sub-toggle for Coach: Login vs Sign Up */}
            {(mode === 'coach_login' || mode === 'coach_signup') && (
              <div className="flex items-center justify-center gap-2 p-1 rounded-xl bg-white/5 border border-white/5 text-xs">
                <button
                  type="button"
                  onClick={() => setMode('coach_login')}
                  className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
                    mode === 'coach_login'
                      ? 'bg-white/15 text-[#BEF264]'
                      : 'text-white/50 hover:text-white'
                  }`}
                >
                  {t.coachLogin || 'Coach Log In'}
                </button>
                <button
                  type="button"
                  onClick={() => setMode('coach_signup')}
                  className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
                    mode === 'coach_signup'
                      ? 'bg-white/15 text-[#BEF264]'
                      : 'text-white/50 hover:text-white'
                  }`}
                >
                  {t.coachSignUp || 'Coach Application'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Error / Alert Messages */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {isPendingApproval && (
          <div className="mb-4 p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs space-y-1">
            <div className="flex items-center gap-2 font-bold text-sm text-amber-300">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <span>{t.pendingApprovalTitle}</span>
            </div>
            <p className="leading-relaxed">{t.pendingApprovalMsg}</p>
          </div>
        )}

        {/* MODE 1: STUDENT LOGIN */}
        {mode === 'student_login' && (
          <form onSubmit={handleStudentLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-white/80 mb-1.5 uppercase tracking-wider">
                {t.email} / Registered Contact
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-white/40 absolute left-3.5 top-3.5" />
                <input
                  id="student-email-input"
                  type="text"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  placeholder="student@mmsacademy.edu"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-white/10 bg-white/5 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#BEF264] focus:ring-1 focus:ring-[#BEF264]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-white/80 uppercase tracking-wider">
                  {t.password}
                </label>
                <button
                  type="button"
                  onClick={() => triggerForgotPassword('student', studentEmail)}
                  className="text-xs font-bold text-[#BEF264] hover:underline"
                >
                  {t.forgotPassword || 'Forgot your password?'}
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-white/40 absolute left-3.5 top-3.5" />
                <input
                  id="student-password-input"
                  type="password"
                  value={studentPassword}
                  onChange={(e) => setStudentPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-white/10 bg-white/5 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#BEF264] focus:ring-1 focus:ring-[#BEF264]"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                id="student-login-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-[#BEF264] hover:bg-[#aee64a] text-[#050B1A] font-black text-xs shadow-lg shadow-[#BEF264]/20 transition-all flex items-center justify-center gap-2"
              >
                <GraduationCap className="w-4 h-4" />
                <span>{loading ? 'Authenticating...' : t.studentLogin || 'Log In as Student'}</span>
              </button>
            </div>

            <p className="text-center text-xs text-white/50 pt-2">
              New to MMS Academy?{' '}
              <button
                type="button"
                onClick={() => setMode('student_signup')}
                className="text-[#BEF264] font-bold hover:underline"
              >
                Sign up as a student
              </button>
            </p>
          </form>
        )}

        {/* MODE 2: STUDENT SIGN UP */}
        {mode === 'student_signup' && (
          <form onSubmit={handleStudentSignup} className="space-y-3.5">
            <div className="p-3 rounded-2xl bg-[#BEF264]/10 border border-[#BEF264]/20 text-xs text-white/80 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#BEF264] block">Student Registration</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/30">
                  WhatsApp Enabled
                </span>
              </div>
              <p className="text-[11px] text-white/70 leading-relaxed">
                Provide your WhatsApp-enabled mobile number. All schedule reminders, attendance alerts, and payment approval confirmations will be sent directly to your WhatsApp!
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-white/80 mb-1">
                  Student Full Name
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-white/40 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="e.g. Youssef Karim"
                    required
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-white/10 bg-white/5 text-xs text-white placeholder-white/30 focus:border-[#BEF264] focus:ring-1 focus:ring-[#BEF264]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-white/80 mb-1">
                  Age
                </label>
                <input
                  type="number"
                  value={studentAge}
                  onChange={(e) => setStudentAge(Number(e.target.value))}
                  placeholder="e.g. 12"
                  min="5"
                  max="20"
                  required
                  className="w-full px-3 py-2.5 rounded-xl border border-white/10 bg-white/5 text-xs text-white placeholder-white/30 focus:border-[#BEF264] focus:ring-1 focus:ring-[#BEF264]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-white/80 mb-1">
                  Student Email / Account
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-white/40 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={studentRegEmail}
                    onChange={(e) => setStudentRegEmail(e.target.value)}
                    placeholder="student@gmail.com"
                    required
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-white/10 bg-white/5 text-xs text-white placeholder-white/30 focus:border-[#BEF264] focus:ring-1 focus:ring-[#BEF264]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-white/80 mb-1">
                  Account Password
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-white/40 absolute left-3 top-3" />
                  <input
                    type="password"
                    value={studentRegPassword}
                    onChange={(e) => setStudentRegPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-white/10 bg-white/5 text-xs text-white placeholder-white/30 focus:border-[#BEF264] focus:ring-1 focus:ring-[#BEF264]"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-white/80 mb-1">
                  Parent / Guardian Name
                </label>
                <input
                  type="text"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  placeholder="e.g. Dr. Karim Nabil"
                  required
                  className="w-full px-3 py-2.5 rounded-xl border border-white/10 bg-white/5 text-xs text-white placeholder-white/30 focus:border-[#BEF264] focus:ring-1 focus:ring-[#BEF264]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white/80 mb-1 flex items-center justify-between">
                  <span>Parent Phone (WhatsApp)</span>
                  <span className="text-[10px] font-semibold text-[#25D366]">WhatsApp</span>
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-white/40 absolute left-3 top-3" />
                  <input
                    type="tel"
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    placeholder="+20 100 123 4567"
                    required
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-white/10 bg-white/5 text-xs text-white placeholder-white/30 focus:border-[#BEF264] focus:ring-1 focus:ring-[#BEF264]"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-white/80 mb-1 flex items-center justify-between">
                  <span>Student Mobile (WhatsApp - Optional)</span>
                  <span className="text-[10px] font-semibold text-[#25D366]">WhatsApp</span>
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-white/40 absolute left-3 top-3" />
                  <input
                    type="tel"
                    value={studentPhone}
                    onChange={(e) => setStudentPhone(e.target.value)}
                    placeholder="+20 111 234 5678 (if student has phone)"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-white/10 bg-white/5 text-xs text-white placeholder-white/30 focus:border-[#BEF264] focus:ring-1 focus:ring-[#BEF264]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-white/80 mb-1">
                  Parent Email
                </label>
                <input
                  type="email"
                  value={parentEmail}
                  onChange={(e) => setParentEmail(e.target.value)}
                  placeholder="parent@gmail.com"
                  className="w-full px-3 py-2.5 rounded-xl border border-white/10 bg-white/5 text-xs text-white placeholder-white/30 focus:border-[#BEF264] focus:ring-1 focus:ring-[#BEF264]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-white/80 mb-1">
                  School Grade
                </label>
                <input
                  type="text"
                  value={studentGrade}
                  onChange={(e) => setStudentGrade(e.target.value)}
                  placeholder="e.g. Grade 6"
                  className="w-full px-3 py-2.5 rounded-xl border border-white/10 bg-white/5 text-xs text-white placeholder-white/30 focus:border-[#BEF264] focus:ring-1 focus:ring-[#BEF264]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white/80 mb-1">
                  Robotics Track
                </label>
                <select
                  value={studentTrack}
                  onChange={(e) => setStudentTrack(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-white/10 bg-white/5 text-xs text-white font-semibold focus:border-[#BEF264] focus:ring-1 focus:ring-[#BEF264]"
                >
                  {tracksList.map((tr) => (
                    <option key={tr} value={tr} className="bg-[#070E20]">
                      {tr}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-white/80 mb-1">
                  School Name (Optional)
                </label>
                <input
                  type="text"
                  value={studentSchool}
                  onChange={(e) => setStudentSchool(e.target.value)}
                  placeholder="e.g. Cairo International School"
                  className="w-full px-3 py-2.5 rounded-xl border border-white/10 bg-white/5 text-xs text-white placeholder-white/30 focus:border-[#BEF264] focus:ring-1 focus:ring-[#BEF264]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white/80 mb-1">
                  Emergency Contact Phone
                </label>
                <input
                  type="tel"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  placeholder="+20 111 222 3333"
                  className="w-full px-3 py-2.5 rounded-xl border border-white/10 bg-white/5 text-xs text-white placeholder-white/30 focus:border-[#BEF264] focus:ring-1 focus:ring-[#BEF264]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-white/80 mb-1">
                Learning Goals & Interests (Optional)
              </label>
              <textarea
                value={learningGoals}
                onChange={(e) => setLearningGoals(e.target.value)}
                placeholder="What does the student want to build or learn? (e.g. Robot arm, maze solver, IoT smart home)"
                rows={2}
                className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-xs text-white placeholder-white/30 focus:border-[#BEF264] focus:ring-1 focus:ring-[#BEF264]"
              />
            </div>

            <button
              id="student-signup-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-[#BEF264] hover:bg-[#aee64a] text-[#050B1A] font-black text-xs shadow-lg shadow-[#BEF264]/20 transition-all flex items-center justify-center gap-2 mt-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{loading ? 'Creating Student Profile...' : 'Complete Student Registration'}</span>
            </button>
          </form>
        )}

        {/* MODE 3: COACH LOGIN */}
        {mode === 'coach_login' && (
          <form onSubmit={handleCoachLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-white/80 mb-1.5 uppercase tracking-wider">
                {t.email}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-white/40 absolute left-3.5 top-3.5" />
                <input
                  id="coach-email-input"
                  type="email"
                  value={coachEmail}
                  onChange={(e) => setCoachEmail(e.target.value)}
                  placeholder="coach@mmsacademy.edu"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-white/10 bg-white/5 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#BEF264] focus:ring-1 focus:ring-[#BEF264]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-white/80 uppercase tracking-wider">
                  {t.password}
                </label>
                <button
                  type="button"
                  onClick={() => triggerForgotPassword('coach', coachEmail)}
                  className="text-xs font-bold text-[#BEF264] hover:underline"
                >
                  {t.forgotPassword || 'Forgot your password?'}
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-white/40 absolute left-3.5 top-3.5" />
                <input
                  id="coach-password-input"
                  type="password"
                  value={coachPassword}
                  onChange={(e) => setCoachPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-white/10 bg-white/5 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#BEF264] focus:ring-1 focus:ring-[#BEF264]"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                id="coach-login-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-[#BEF264] hover:bg-[#aee64a] text-[#050B1A] font-black text-xs shadow-lg shadow-[#BEF264]/20 transition-all flex items-center justify-center gap-2"
              >
                <UserCheck className="w-4 h-4" />
                <span>{loading ? 'Logging in...' : t.coachLogin}</span>
              </button>
            </div>
          </form>
        )}

        {/* MODE 4: COACH SIGN UP */}
        {mode === 'coach_signup' && (
          <form onSubmit={handleCoachSignup} className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-white/80 mb-1">
                  {t.fullName}
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-white/40 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Eng. Ahmed Hassan"
                    required
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-white/10 bg-white/5 text-xs text-white placeholder-white/30 focus:border-[#BEF264] focus:ring-1 focus:ring-[#BEF264]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-white/80 mb-1">
                  {t.age}
                </label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  placeholder="Age (e.g. 24)"
                  min="16"
                  max="75"
                  required
                  className="w-full px-3 py-2.5 rounded-xl border border-white/10 bg-white/5 text-xs text-white placeholder-white/30 focus:border-[#BEF264] focus:ring-1 focus:ring-[#BEF264]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-white/80 mb-1">
                  {t.email}
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-white/40 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="coach@mmsacademy.edu"
                    required
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-white/10 bg-white/5 text-xs text-white placeholder-white/30 focus:border-[#BEF264] focus:ring-1 focus:ring-[#BEF264]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-white/80 mb-1 flex items-center justify-between">
                  <span>{t.phoneNumber}</span>
                  <span className="text-[10px] font-semibold text-[#25D366]">WhatsApp</span>
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-white/40 absolute left-3 top-3" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+20 100 123 4567"
                    required
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-white/10 bg-white/5 text-xs text-white placeholder-white/30 focus:border-[#BEF264] focus:ring-1 focus:ring-[#BEF264]"
                  />
                </div>
                <p className="text-[10px] text-white/40 mt-1">Admin session reminders and updates will be sent to this WhatsApp.</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-white/80 mb-1">
                {t.password}
              </label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-white/40 absolute left-3 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create secure password"
                  required
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-white/10 bg-white/5 text-xs text-white placeholder-white/30 focus:border-[#BEF264] focus:ring-1 focus:ring-[#BEF264]"
                />
              </div>
            </div>

            {/* Available Days Checkboxes */}
            <div>
              <label className="block text-xs font-bold text-white/80 mb-1.5">
                {t.availableDays} <span className="text-white/40 font-normal">({t.selectAvailableDays})</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {daysOfWeek.map((day) => {
                  const isSelected = availableDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleToggleDay(day)}
                      className={`px-2.5 py-2 rounded-xl text-xs font-bold border transition-colors ${
                        isSelected
                          ? 'bg-[#BEF264]/20 border-[#BEF264] text-[#BEF264]'
                          : 'border-white/10 bg-white/5 text-white/60 hover:text-white'
                      }`}
                    >
                      {t[day as keyof typeof t] || day}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Track Specializations */}
            <div>
              <label className="block text-xs font-bold text-white/80 mb-1.5">
                {t.specialties}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {tracksList.map((tr) => {
                  const isSelected = specialization.includes(tr);
                  return (
                    <button
                      key={tr}
                      type="button"
                      onClick={() => handleToggleTrack(tr)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                        isSelected
                          ? 'bg-[#BEF264] text-[#050B1A] border-[#BEF264]'
                          : 'border-white/10 bg-white/5 text-white/60 hover:text-white'
                      }`}
                    >
                      {tr}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              id="coach-signup-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-[#BEF264] hover:bg-[#aee64a] text-[#050B1A] font-black text-xs shadow-lg shadow-[#BEF264]/20 transition-all flex items-center justify-center gap-2 mt-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{loading ? 'Submitting Application...' : t.registerSubmit}</span>
            </button>
          </form>
        )}

        {/* MODE 5: OWNER / DIRECTOR LOGIN */}
        {mode === 'owner' && (
          <form onSubmit={handleOwnerSubmit} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-white/80 uppercase tracking-wider">
                  {t.ownerPasscodeLabel}
                </label>
                <button
                  type="button"
                  onClick={() => triggerForgotPassword('owner', 'director@mmsacademy.edu')}
                  className="text-xs font-bold text-[#BEF264] hover:underline"
                >
                  {t.forgotPassword || 'Forgot passcode?'}
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-white/40 absolute left-3.5 top-3.5" />
                <input
                  id="owner-passcode-input"
                  type="password"
                  value={ownerPasscode}
                  onChange={(e) => setOwnerPasscode(e.target.value)}
                  placeholder={t.ownerPasscodePlaceholder}
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-white/10 bg-white/5 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#BEF264] focus:ring-1 focus:ring-[#BEF264]"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                id="owner-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-[#BEF264] hover:bg-[#aee64a] text-[#050B1A] font-black text-xs shadow-lg shadow-[#BEF264]/20 transition-all flex items-center justify-center gap-2"
              >
                <Shield className="w-4 h-4" />
                <span>{loading ? 'Authenticating...' : t.ownerLogin}</span>
              </button>
            </div>
          </form>
        )}

        {/* MODE 6: FORGOT PASSWORD FLOW (REQUIREMENT 2) */}
        {mode === 'forgot_password' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <button
                type="button"
                onClick={() => {
                  setMode(returnMode);
                  setErrorMsg('');
                  setSuccessMsg('');
                  setForgotResult(null);
                }}
                className="text-xs font-bold text-white/60 hover:text-white flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Login</span>
              </button>
              <span className="text-xs font-black text-[#BEF264]">
                {t.passwordRecovery || 'Password Recovery'}
              </span>
            </div>

            {/* Role selector for recovery */}
            <div className="p-1 rounded-xl bg-white/5 border border-white/10 grid grid-cols-3 text-xs font-bold">
              {(['student', 'coach', 'owner'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    setForgotRole(r);
                    setForgotResult(null);
                    setResetSuccess(false);
                  }}
                  className={`py-1.5 rounded-lg capitalize transition-all ${
                    forgotRole === r
                      ? 'bg-[#BEF264] text-[#050B1A]'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            {!forgotResult ? (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-white/80 mb-1.5 uppercase tracking-wider">
                    Registered Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-white/40 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder={
                        forgotRole === 'owner'
                          ? 'director@mmsacademy.edu'
                          : forgotRole === 'coach'
                          ? 'coach@mmsacademy.edu'
                          : 'student@gmail.com'
                      }
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-2xl border border-white/10 bg-white/5 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#BEF264] focus:ring-1 focus:ring-[#BEF264]"
                    />
                  </div>
                  <p className="text-[11px] text-white/50 mt-1.5">
                    We will send password reset and security recovery instructions to this registered address.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl bg-[#BEF264] hover:bg-[#aee64a] text-[#050B1A] font-black text-xs shadow-lg shadow-[#BEF264]/20 transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>{loading ? 'Sending Recovery Email...' : 'Send Recovery to Registered Email'}</span>
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-white/5 border border-[#BEF264]/30 space-y-3">
                  <div className="flex items-center gap-2 text-[#BEF264]">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-xs font-bold">Email Dispatched to {forgotEmail}</span>
                  </div>
                  <p className="text-xs text-white/80 leading-relaxed">
                    {forgotResult.message}
                  </p>
                  {forgotResult.hint && (
                    <div className="p-3 rounded-xl bg-black/40 border border-white/10 text-xs space-y-1">
                      <span className="text-[10px] uppercase font-bold text-white/40 block">
                        Direct Account Recovery
                      </span>
                      <p className="text-[#BEF264] font-medium">{forgotResult.hint}</p>
                      {forgotResult.resetCode && (
                        <p className="text-white/80 text-[11px]">
                          Reset Code: <code className="bg-white/10 px-1.5 py-0.5 rounded font-mono font-bold text-white">{forgotResult.resetCode}</code>
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Direct Password Reset Form for coach or student */}
                {forgotRole !== 'owner' && !resetSuccess && (
                  <form onSubmit={handleDirectPasswordReset} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                    <span className="text-xs font-bold text-white block">
                      Set New Password Now:
                    </span>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-white/40 absolute left-3.5 top-3.5" />
                      <input
                        type="password"
                        value={newResetPassword}
                        onChange={(e) => setNewResetPassword(e.target.value)}
                        placeholder="Enter new password (min 4 chars)"
                        required
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-xs text-white placeholder-white/30 focus:border-[#BEF264] focus:ring-1 focus:ring-[#BEF264]"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2.5 rounded-xl bg-[#BEF264] text-[#050B1A] font-black text-xs hover:bg-[#aee64a] transition-all"
                    >
                      {loading ? 'Updating...' : 'Update Password & Return to Login'}
                    </button>
                  </form>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setMode(forgotRole === 'student' ? 'student_login' : forgotRole === 'coach' ? 'coach_login' : 'owner');
                    setErrorMsg('');
                    setSuccessMsg('');
                    setForgotResult(null);
                  }}
                  className="w-full py-2.5 rounded-xl border border-white/10 text-white/70 hover:text-white font-bold text-xs"
                >
                  Return to Sign In
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
