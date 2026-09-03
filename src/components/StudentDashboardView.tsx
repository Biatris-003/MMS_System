import React from 'react';
import { useApp } from '../context/AppContext';
import {
  GraduationCap,
  Layers,
  User,
  Calendar,
  Clock,
  MapPin,
  Mail,
  Phone,
  CheckCircle2,
  Award,
  BookOpen,
  Sparkles,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { MMSLogo } from './MMSLogo';
import { StudentPaymentSection } from './StudentPaymentSection';

interface StudentDashboardViewProps {
  onNavigateTab?: (tab: string) => void;
}

export const StudentDashboardView: React.FC<StudentDashboardViewProps> = ({ onNavigateTab }) => {
  const { currentUser, students, groups, coaches, sessions, attendance, t } = useApp();

  // Find student record corresponding to current logged in student
  const studentData = students.find((s) => s.id === currentUser?.id) || {
    id: currentUser?.id || 'std-unknown',
    name: currentUser?.name || 'Student',
    age: currentUser?.age || 12,
    email: currentUser?.email || '',
    level: currentUser?.level || 1,
    track: currentUser?.track || 'Arduino',
    parentName: currentUser?.parentName || 'Parent / Guardian',
    parentPhone: currentUser?.parentPhone || '+20 100 000 0000',
    parentEmail: currentUser?.parentEmail || '',
    grade: currentUser?.grade || 'Grade 6',
    school: currentUser?.school || 'School',
    emergencyContact: currentUser?.emergencyContact || '',
    learningGoals: currentUser?.learningGoals || 'Mastering robotics & programming',
    enrolledGroupIds: currentUser?.enrolledGroupIds || [],
  };

  // Find assigned groups
  const assignedGroupIds = studentData.enrolledGroupIds || [];
  const assignedGroups = groups.filter((g) => assignedGroupIds.includes(g.id));

  // Find all assigned coaches across enrolled groups
  const coachIds = Array.from(new Set(assignedGroups.flatMap((g) => g.assignedCoachIds || [])));
  const assignedCoaches = coaches.filter((c) => coachIds.includes(c.id));

  // Find sessions for enrolled groups
  const studentSessions = sessions
    .filter((s) => assignedGroupIds.includes(s.groupId))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Next upcoming session
  const todayStr = new Date().toISOString().split('T')[0];
  const upcomingSessions = studentSessions.filter((s) => s.date >= todayStr);
  const nextSession = upcomingSessions[0] || studentSessions[0];

  // Attendance stats for this student
  const studentAttendanceEntries = attendance.flatMap((a) =>
    a.studentAttendance.filter((sa) => sa.studentId === studentData.id)
  );
  const presentCount = studentAttendanceEntries.filter(
    (sa) => sa.status === 'present'
  ).length;
  const totalRecorded = studentAttendanceEntries.length;
  const attendanceRate =
    totalRecorded > 0 ? Math.round((presentCount / totalRecorded) * 100) : 100;

  const tracksMilestones = [
    { level: 1, title: 'Foundations & Safety', desc: 'Components, wiring, safety protocols & breadboards' },
    { level: 2, title: 'Sensors & Actuators', desc: 'Ultrasonic, IR sensors, servo motors & PWM' },
    { level: 3, title: 'Autonomous Logic', desc: 'Feedback loops, line tracking, obstacle avoidance' },
    { level: 4, title: 'Smart Systems & IoT', desc: 'Wireless communication, Bluetooth & final projects' },
  ];

  const currentLevelNum = studentData.level || 1;

  return (
    <div id="student-portal-dashboard" className="space-y-6 pb-8">
      {/* 1. HERO BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#070E20] via-[#0A1A3F] to-[#050B1A] border border-white/10 p-6 sm:p-8 text-white shadow-2xl">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-[#BEF264]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#BEF264]/15 border border-[#BEF264]/30 text-[#BEF264] text-xs font-black uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>MMS Student Portal • {studentData.track || 'Robotics'} Track</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
              Welcome back, {studentData.name}!
            </h1>
            <p className="text-xs sm:text-sm text-white/60 max-w-xl">
              Track your robotics progress, check upcoming lab sessions, meet your assigned coach, and review your curriculum level.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-center min-w-[100px]">
              <span className="block text-[10px] uppercase font-bold text-white/50 tracking-wider">Current Level</span>
              <span className="text-xl font-black text-[#BEF264]">Level {currentLevelNum}</span>
            </div>
            <div className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-center min-w-[100px]">
              <span className="block text-[10px] uppercase font-bold text-white/50 tracking-wider">Attendance</span>
              <span className="text-xl font-black text-emerald-400">{attendanceRate}%</span>
            </div>
            <div className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-center min-w-[100px]">
              <span className="block text-[10px] uppercase font-bold text-white/50 tracking-wider">Active Groups</span>
              <span className="text-xl font-black text-cyan-400">{assignedGroups.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. ASSIGNED GROUP & COACH BANNER (KEY USER REQUIREMENT) */}
      {assignedGroups.length === 0 ? (
        <div className="rounded-3xl p-6 bg-amber-500/10 border border-amber-500/30 text-white space-y-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-amber-300">
                Group & Coach Assignment Pending
              </h3>
              <p className="text-xs text-amber-100/80 leading-relaxed">
                Thank you for registering at MMS Academy! The Academy Director is reviewing your profile and will assign you to an age-appropriate robotics group and designated coach shortly. Once assigned, your schedule, classroom, and coach contact details will appear here automatically.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {assignedGroups.map((group) => {
            const groupCoaches = coaches.filter((c) => group.assignedCoachIds.includes(c.id));
            return (
              <div
                key={group.id}
                className="rounded-3xl p-6 bg-[#070E20]/90 border border-white/10 shadow-xl space-y-5 text-white relative overflow-hidden"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#BEF264]/20 border border-[#BEF264]/30 text-[#BEF264] text-[10px] font-bold uppercase tracking-wider">
                      Assigned Robotics Group
                    </span>
                    <h3 className="text-lg font-black text-white mt-1.5 flex items-center gap-2">
                      <Layers className="w-5 h-5 text-[#BEF264]" />
                      <span>{group.name}</span>
                    </h3>
                    <p className="text-xs text-white/50 mt-0.5">
                      {group.track} • Level {group.level} • {group.enrolledStudentIds?.length || 0} Students
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                    {group.status.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-2.5">
                    <Calendar className="w-4 h-4 text-[#BEF264] shrink-0" />
                    <div>
                      <span className="block text-[10px] text-white/40 uppercase font-bold">Meeting Day</span>
                      <span className="text-xs font-bold text-white">{group.dayOfWeek}</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
                    <div>
                      <span className="block text-[10px] text-white/40 uppercase font-bold">Session Time</span>
                      <span className="text-xs font-bold text-white">{group.startTime} - {group.endTime}</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-2.5">
                    <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <span className="block text-[10px] text-white/40 uppercase font-bold">Room / Lab</span>
                      <span className="text-xs font-bold text-white">{group.location || 'MMS Robotics Lab'}</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-2.5">
                    <BookOpen className="w-4 h-4 text-purple-400 shrink-0" />
                    <div>
                      <span className="block text-[10px] text-white/40 uppercase font-bold">Total Sessions</span>
                      <span className="text-xs font-bold text-white">{group.totalSessions || 4} Lab Sessions</span>
                    </div>
                  </div>
                </div>

                {/* Assigned Coach Details */}
                <div className="pt-3 border-t border-white/10 space-y-3">
                  <span className="text-xs font-bold text-white/70 uppercase tracking-wider block">
                    Your Assigned Coach
                  </span>
                  {groupCoaches.length > 0 ? (
                    groupCoaches.map((coach) => (
                      <div
                        key={coach.id}
                        className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-[#BEF264]/20 border border-[#BEF264]/40 text-[#BEF264] flex items-center justify-center font-black text-sm">
                            {coach.name.charAt(0)}
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-white">{coach.name}</h4>
                            <p className="text-[11px] text-white/50">
                              {coach.specialization?.join(', ') || 'Robotics Specialist'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-xs">
                          {coach.phone && (
                            <a
                              href={`tel:${coach.phone}`}
                              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold inline-flex items-center gap-1.5 transition-colors"
                            >
                              <Phone className="w-3 h-3 text-[#BEF264]" />
                              <span>{coach.phone}</span>
                            </a>
                          )}
                          {coach.email && (
                            <a
                              href={`mailto:${coach.email}`}
                              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors"
                              title={coach.email}
                            >
                              <Mail className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-xs text-white/50">
                      Coach assignment in progress by Academy Director.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. PERSONAL INFO FROM SIGN UP & PROGRESS CARD */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal Details Card */}
        <div className="lg:col-span-1 rounded-3xl p-6 bg-[#070E20]/90 border border-white/10 shadow-xl space-y-4 text-white">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="font-black text-sm text-white flex items-center gap-2">
              <User className="w-4 h-4 text-[#BEF264]" />
              <span>Personal Information</span>
            </h3>
            <span className="text-[10px] text-white/40 uppercase font-bold">From Registration</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="block text-[10px] text-white/40 uppercase font-bold">Full Name</span>
              <span className="font-bold text-white text-sm">{studentData.name}</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="block text-[10px] text-white/40 uppercase font-bold">Age</span>
                <span className="font-bold text-white">{studentData.age} years old</span>
              </div>
              <div>
                <span className="block text-[10px] text-white/40 uppercase font-bold">Grade</span>
                <span className="font-bold text-white">{studentData.grade || 'N/A'}</span>
              </div>
            </div>

            {studentData.email && (
              <div>
                <span className="block text-[10px] text-white/40 uppercase font-bold">Student Email</span>
                <span className="font-medium text-white/80">{studentData.email}</span>
              </div>
            )}

            {studentData.school && (
              <div>
                <span className="block text-[10px] text-white/40 uppercase font-bold">School</span>
                <span className="font-medium text-white/80">{studentData.school}</span>
              </div>
            )}

            <div className="pt-2 border-t border-white/10 space-y-2">
              <span className="block text-[10px] text-[#BEF264] uppercase font-bold tracking-wider">
                Parent / Guardian Contact
              </span>
              <div>
                <span className="block text-[10px] text-white/40 uppercase font-bold">Guardian Name</span>
                <span className="font-bold text-white">{studentData.parentName}</span>
              </div>
              <div>
                <span className="block text-[10px] text-white/40 uppercase font-bold">Guardian Phone</span>
                <span className="font-bold text-[#BEF264]">{studentData.parentPhone}</span>
              </div>
              {studentData.parentEmail && (
                <div>
                  <span className="block text-[10px] text-white/40 uppercase font-bold">Guardian Email</span>
                  <span className="font-medium text-white/80">{studentData.parentEmail}</span>
                </div>
              )}
            </div>

            {studentData.learningGoals && (
              <div className="pt-2 border-t border-white/10">
                <span className="block text-[10px] text-white/40 uppercase font-bold">Learning Goals</span>
                <p className="text-xs text-white/70 italic mt-0.5">"{studentData.learningGoals}"</p>
              </div>
            )}
          </div>
        </div>

        {/* Curriculum Track & Level Progress (2 Cols) */}
        <div className="lg:col-span-2 rounded-3xl p-6 bg-[#070E20]/90 border border-white/10 shadow-xl space-y-5 text-white flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <h3 className="font-black text-sm text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-[#BEF264]" />
                <span>{studentData.track || 'Robotics'} Track Curriculum Journey</span>
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-[#BEF264]/20 text-[#BEF264] text-[10px] font-bold">
                Level {currentLevelNum} Active
              </span>
            </div>

            <p className="text-xs text-white/60 mb-4 leading-relaxed">
              MMS Academy follows a rigorous project-based curriculum structured across 4 progressive levels. Students complete hands-on engineering challenges, hardware wiring, and algorithmic code at each stage.
            </p>

            {/* Milestones steps */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {tracksMilestones.map((m) => {
                const isCompleted = currentLevelNum > m.level;
                const isCurrent = currentLevelNum === m.level;
                return (
                  <div
                    key={m.level}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      isCurrent
                        ? 'bg-[#BEF264]/15 border-[#BEF264] shadow-md shadow-[#BEF264]/10'
                        : isCompleted
                        ? 'bg-emerald-500/10 border-emerald-500/30'
                        : 'bg-white/5 border-white/10 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                          isCurrent
                            ? 'bg-[#BEF264] text-[#050B1A]'
                            : isCompleted
                            ? 'bg-emerald-500 text-white'
                            : 'bg-white/10 text-white/60'
                        }`}
                      >
                        Level {m.level} {isCurrent ? '• In Progress' : isCompleted ? '• Completed' : ''}
                      </span>
                      {isCompleted && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                      {isCurrent && <Sparkles className="w-4 h-4 text-[#BEF264]" />}
                    </div>
                    <h4 className="text-xs font-bold text-white mt-1">{m.title}</h4>
                    <p className="text-[11px] text-white/60 mt-0.5 leading-snug">{m.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Upcoming Session Highlight */}
          {nextSession && (
            <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-cyan-500/15 via-blue-500/10 to-transparent border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-cyan-300 tracking-wider">
                    Next Lab Session
                  </span>
                  <h4 className="text-xs font-bold text-white">
                    {nextSession.date} • {nextSession.startTime} - {nextSession.endTime}
                  </h4>
                  <p className="text-[11px] text-white/60">
                    Topic: {nextSession.topic || 'Robotics Practical Workshop'}
                  </p>
                </div>
              </div>

              {onNavigateTab && (
                <button
                  onClick={() => onNavigateTab('calendar')}
                  className="px-3.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-200 text-xs font-bold inline-flex items-center gap-1.5 transition-colors self-start sm:self-auto"
                >
                  <span>View Calendar</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 4. UPCOMING SESSIONS LIST */}
      {studentSessions.length > 0 && (
        <div className="rounded-3xl p-6 bg-[#070E20]/90 border border-white/10 shadow-xl space-y-4 text-white">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="font-black text-sm text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#BEF264]" />
              <span>Lab Sessions & Attendance Schedule</span>
            </h3>
            <span className="text-xs text-white/50 font-medium">
              {studentSessions.length} total scheduled sessions
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {studentSessions.slice(0, 6).map((session, idx) => {
              const sessionRecord = attendance.find(
                (a) => a.sessionId === session.id
              );
              const sessionAtt = sessionRecord?.studentAttendance.find(
                (sa) => sa.studentId === studentData.id
              );
              const isPast = session.date < todayStr;
              return (
                <div
                  key={session.id}
                  className={`p-4 rounded-2xl border transition-colors space-y-2 ${
                    isPast
                      ? 'bg-white/5 border-white/10'
                      : 'bg-cyan-500/5 border-cyan-500/20'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#BEF264]">Session {session.sessionNumber || idx + 1}</span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                        sessionAtt?.status === 'present'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : sessionAtt?.status === 'absent'
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                          : isPast
                          ? 'bg-white/10 text-white/60'
                          : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      }`}
                    >
                      {sessionAtt?.status
                        ? sessionAtt.status.toUpperCase()
                        : isPast
                        ? 'COMPLETED'
                        : 'UPCOMING'}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-white">
                      {session.topic || `Robotics Lab Session #${session.sessionNumber || idx + 1}`}
                    </h4>
                    <div className="flex items-center gap-2 text-[11px] text-white/50 mt-1">
                      <Clock className="w-3 h-3" />
                      <span>{session.date} • {session.startTime}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. TUITION PAYMENTS & PAYMENT REPORTING (REQUIREMENT 7) */}
      <StudentPaymentSection mode="student" studentId={studentData.id} />
    </div>
  );
};
