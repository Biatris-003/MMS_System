import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { GroupSession, StudentAttendanceEntry, CoachAttendanceEntry } from '../types';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Users,
  Filter,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Check,
  X,
  MessageCircle,
  GraduationCap,
  Phone,
  UserCheck,
  UserX,
  CheckSquare,
  Square,
} from 'lucide-react';
import {
  openWhatsApp,
  buildCoachSessionReminderMsg,
  buildStudentAbsentNoticeMsg,
} from '../utils/whatsapp';

export const CalendarView: React.FC<{ onNavigateTab?: (tab: string) => void }> = ({
  onNavigateTab,
}) => {
  const {
    role,
    currentUser,
    t,
    sessions,
    groups,
    coaches,
    students,
    attendance,
    saveAttendance,
    sendSessionReminder,
    customTracks,
  } = useApp();

  const isOwner = role === 'admin';

  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTrack, setSelectedTrack] = useState('all');
  const [selectedCoachId, setSelectedCoachId] = useState('all');
  const [selectedSession, setSelectedSession] = useState<GroupSession | null>(null);
  const [reminderSent, setReminderSent] = useState(false);
  const [attendanceNotice, setAttendanceNotice] = useState<string | null>(null);

  // Navigate calendar dates
  const handlePrev = () => {
    const d = new Date(currentDate);
    if (viewMode === 'month') {
      d.setMonth(d.getMonth() - 1);
    } else {
      d.setDate(d.getDate() - 7);
    }
    setCurrentDate(d);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    if (viewMode === 'month') {
      d.setMonth(d.getMonth() + 1);
    } else {
      d.setDate(d.getDate() + 7);
    }
    setCurrentDate(d);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Filter sessions
  const filteredSessions = sessions.filter((s) => {
    if (!isOwner && !s.assignedCoachIds.includes(currentUser?.id || '')) {
      return false;
    }
    if (selectedTrack !== 'all' && s.track !== selectedTrack) return false;
    if (selectedCoachId !== 'all' && !s.assignedCoachIds.includes(selectedCoachId)) return false;
    return true;
  });

  // Track color coding for Frosted Glass
  const getTrackColor = (track: string) => {
    switch (track) {
      case 'Arduino':
        return 'bg-[#BEF264]/20 text-[#BEF264] border-[#BEF264]/40';
      case 'WeDo':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'Lego EV3':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'SolidWorks':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'Lego Prime':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      default:
        return 'bg-white/10 text-white/90 border-white/20';
    }
  };

  // Generate Month Days
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday, 6 = Saturday
  const totalDays = lastDayOfMonth.getDate();

  const daysArray: (number | null)[] = [];
  for (let i = 0; i < startDayOfWeek; i++) {
    daysArray.push(null);
  }
  for (let day = 1; day <= totalDays; day++) {
    daysArray.push(day);
  }

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const daysOfWeekLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div id="calendar-view" className="space-y-6">
      {/* Calendar Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-[#BEF264]" />
            <span>{t.navCalendar}</span>
          </h2>
          <p className="text-xs sm:text-sm text-white/50 mt-1">
            Weekly and monthly timetable for all robotics lab rooms, time slots, and coach schedules.
          </p>
        </div>

        {/* View mode toggle & date navigation */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-2xl bg-white/5 border border-white/10 p-1 shadow-sm">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'month'
                  ? 'bg-[#BEF264] text-[#050B1A] shadow-md shadow-[#BEF264]/20'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              {t.monthlyView}
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'week'
                  ? 'bg-[#BEF264] text-[#050B1A] shadow-md shadow-[#BEF264]/20'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              {t.weeklyView}
            </button>
          </div>

          <div className="flex items-center gap-1 bg-white/5 border border-white/10 p-1 rounded-2xl shadow-sm">
            <button
              onClick={handlePrev}
              className="p-1.5 rounded-xl hover:bg-white/10 text-white/70 hover:text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-2.5 py-1 text-xs font-bold text-white hover:bg-white/10 rounded-xl"
            >
              Today
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 rounded-xl hover:bg-white/10 text-white/70 hover:text-white"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-sm text-xs">
        <div className="flex items-center gap-1.5 text-white/40 font-bold">
          <Filter className="w-3.5 h-3.5 text-[#BEF264]" />
          <span>Filters:</span>
        </div>

        <select
          value={selectedTrack}
          onChange={(e) => setSelectedTrack(e.target.value)}
          className="px-2.5 py-1.5 rounded-xl border border-white/10 bg-white/5 text-white font-medium focus:outline-none focus:ring-1 focus:ring-[#BEF264]"
        >
          <option value="all" className="bg-[#070E20]">{t.allTracks}</option>
          {customTracks.map((tr) => (
            <option key={tr} value={tr} className="bg-[#070E20]">
              {tr}
            </option>
          ))}
        </select>

        {isOwner && (
          <select
            value={selectedCoachId}
            onChange={(e) => setSelectedCoachId(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl border border-white/10 bg-white/5 text-white font-medium focus:outline-none focus:ring-1 focus:ring-[#BEF264]"
          >
            <option value="all" className="bg-[#070E20]">{t.allCoaches}</option>
            {coaches
              .filter((c) => c.status === 'active')
              .map((c) => (
                <option key={c.id} value={c.id} className="bg-[#070E20]">
                  {c.name}
                </option>
              ))}
          </select>
        )}

        <div className="ml-auto font-black text-sm text-[#BEF264]">
          {monthNames[month]} {year}
        </div>
      </div>

      {/* Monthly Calendar Grid */}
      {viewMode === 'month' && (
        <div className="rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md shadow-sm overflow-hidden p-4 sm:p-6">
          <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold text-white/40 uppercase tracking-wider">
            {daysOfWeekLabels.map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {daysArray.map((day, idx) => {
              if (day === null) {
                return (
                  <div
                    key={`empty-${idx}`}
                    className="min-h-[100px] rounded-2xl bg-white/[0.02] opacity-30 border border-transparent"
                  />
                );
              }

              // Format date: YYYY-MM-DD
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const daySessions = filteredSessions.filter((s) => s.date === dateStr);
              const isToday =
                new Date().toISOString().split('T')[0] === dateStr;

              return (
                <div
                  key={day}
                  className={`min-h-[110px] p-2 rounded-2xl border transition-all flex flex-col justify-between ${
                    isToday
                      ? 'bg-[#BEF264]/10 border-[#BEF264]/40 shadow-sm'
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        isToday
                          ? 'bg-[#BEF264] text-[#050B1A] font-black'
                          : 'text-white/80'
                      }`}
                    >
                      {day}
                    </span>
                    {daySessions.length > 0 && (
                      <span className="text-[10px] font-bold text-[#BEF264]">
                        {daySessions.length} {daySessions.length === 1 ? 'session' : 'sessions'}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 my-1 overflow-y-auto max-h-24">
                    {daySessions.map((sess) => {
                      const colorClass = getTrackColor(sess.track);
                      return (
                        <div
                          key={sess.id}
                          onClick={() => setSelectedSession(sess)}
                          className={`p-1.5 rounded-xl border text-[11px] font-semibold cursor-pointer truncate transition-transform hover:scale-[1.02] ${colorClass}`}
                          title={`${sess.groupName} (${sess.startTime}-${sess.endTime}) in ${sess.location}`}
                        >
                          <div className="font-bold truncate">{sess.track} L{sess.level}</div>
                          <div className="text-[9px] opacity-80 truncate">{sess.startTime} • {sess.location.split('-')[0]}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Weekly View */}
      {viewMode === 'week' && (
        <div className="rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md shadow-sm p-5 space-y-4">
          <div className="text-xs font-bold text-white/40 uppercase tracking-wider">
            7-Day Schedule Roster
          </div>

          <div className="space-y-3">
            {filteredSessions.slice(0, 10).map((sess) => {
              const assignedCoachesList = coaches.filter((c) =>
                sess.assignedCoachIds.includes(c.id)
              );

              return (
                <div
                  key={sess.id}
                  onClick={() => setSelectedSession(sess)}
                  className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-[#BEF264]/50 cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-xl bg-[#BEF264] text-[#050B1A] font-black text-xs">
                        {sess.track} • Level {sess.level}
                      </span>
                      <span className="text-xs font-bold text-white">
                        {sess.date} ({sess.startTime} - {sess.endTime})
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-white">
                      {sess.groupName} - Session {sess.sessionNumber}
                    </h4>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-white/50">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {sess.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        Coaches: {assignedCoachesList.map((c) => c.name).join(', ')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSession(sess);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 text-white text-xs font-bold hover:border-[#BEF264]"
                    >
                      Session Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Session Details & Interactive Attendance Modal */}
      {selectedSession && (() => {
        const targetGroup = groups.find((g) => g.id === selectedSession.groupId);
        const enrolledStudents = students.filter((st) =>
          targetGroup?.enrolledStudentIds?.includes(st.id)
        );
        const sessionCoaches = coaches.filter((c) =>
          selectedSession.assignedCoachIds.includes(c.id)
        );
        const currentRec = attendance.find((r) => r.sessionId === selectedSession.id);

        const getStudentStatus = (studentId: string): 'present' | 'absent' => {
          const match = currentRec?.studentAttendance?.find((sa) => sa.studentId === studentId);
          return match ? (match.status as 'present' | 'absent') : 'present';
        };

        const presentCount = enrolledStudents.filter(
          (st) => getStudentStatus(st.id) === 'present'
        ).length;

        const handleToggleStudentAttendance = async (studentId: string) => {
          const currentStatus = getStudentStatus(studentId);
          const newStatus: 'present' | 'absent' = currentStatus === 'present' ? 'absent' : 'present';

          const updatedStudentAttendance: StudentAttendanceEntry[] = enrolledStudents.map((st) => {
            if (st.id === studentId) {
              return { studentId: st.id, status: newStatus };
            }
            const existing = currentRec?.studentAttendance?.find((sa) => sa.studentId === st.id);
            return {
              studentId: st.id,
              status: existing ? existing.status : 'present',
            };
          });

          const updatedCoachAttendance: CoachAttendanceEntry[] = sessionCoaches.map((c) => {
            const existing = currentRec?.coachAttendance?.find((ca) => ca.coachId === c.id);
            return {
              coachId: c.id,
              status: existing ? existing.status : 'present',
              attendedHours: existing ? existing.attendedHours : 2,
            };
          });

          await saveAttendance({
            sessionId: selectedSession.id,
            groupId: selectedSession.groupId,
            date: selectedSession.date,
            studentAttendance: updatedStudentAttendance,
            coachAttendance: updatedCoachAttendance,
          });

          const studentObj = enrolledStudents.find((s) => s.id === studentId);
          setAttendanceNotice(
            newStatus === 'present'
              ? `Marked ${studentObj?.name || 'Student'} as Attended ✓`
              : `Marked ${studentObj?.name || 'Student'} as Absent ✗`
          );
          setTimeout(() => setAttendanceNotice(null), 2500);
        };

        const handleSetAllAttendance = async (status: 'present' | 'absent') => {
          const updatedStudentAttendance: StudentAttendanceEntry[] = enrolledStudents.map((st) => ({
            studentId: st.id,
            status,
          }));

          const updatedCoachAttendance: CoachAttendanceEntry[] = sessionCoaches.map((c) => ({
            coachId: c.id,
            status: 'present',
            attendedHours: 2,
          }));

          await saveAttendance({
            sessionId: selectedSession.id,
            groupId: selectedSession.groupId,
            date: selectedSession.date,
            studentAttendance: updatedStudentAttendance,
            coachAttendance: updatedCoachAttendance,
          });

          setAttendanceNotice(
            status === 'present'
              ? `All ${enrolledStudents.length} students marked as Attended ✓`
              : `All ${enrolledStudents.length} students marked as Absent ✗`
          );
          setTimeout(() => setAttendanceNotice(null), 2500);
        };

        const handleRemindCoachViaWhatsApp = (coach: any) => {
          if (!coach.phone) {
            alert(`Coach ${coach.name} has no mobile number on record.`);
            return;
          }
          const msg = buildCoachSessionReminderMsg({
            coachName: coach.name,
            groupName: selectedSession.groupName,
            track: selectedSession.track,
            level: selectedSession.level,
            date: selectedSession.date,
            startTime: selectedSession.startTime,
            endTime: selectedSession.endTime,
            location: selectedSession.location,
            sessionNumber: selectedSession.sessionNumber,
          });
          openWhatsApp(coach.phone, msg);
        };

        const handleNotifyParentOfAbsence = (student: any) => {
          const targetPhone = student.parentPhone || student.phone;
          if (!targetPhone) {
            alert(`No parent or student phone on record for ${student.name}.`);
            return;
          }
          const msg = buildStudentAbsentNoticeMsg({
            studentName: student.name,
            groupName: selectedSession.groupName,
            track: selectedSession.track,
            date: selectedSession.date,
            time: `${selectedSession.startTime} - ${selectedSession.endTime}`,
          });
          openWhatsApp(targetPhone, msg);
        };

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050B1A]/85 backdrop-blur-xl animate-fade-in">
            <div className="relative w-full max-w-2xl rounded-3xl bg-[#070E20]/95 backdrop-blur-2xl border border-white/15 shadow-2xl p-6 sm:p-7 space-y-5 text-white max-h-[92vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-start justify-between pb-3 border-b border-white/10">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg bg-[#BEF264] text-[#050B1A] font-black text-xs">
                      {selectedSession.track} • Level {selectedSession.level}
                    </span>
                    {selectedSession.sessionNumber && (
                      <span className="px-2 py-0.5 rounded-lg bg-white/10 text-white/80 font-bold text-xs">
                        Session #{selectedSession.sessionNumber}
                      </span>
                    )}
                  </div>
                  <h3 className="font-black text-lg text-white mt-1">
                    {selectedSession.groupName}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSession(null);
                    setReminderSent(false);
                    setAttendanceNotice(null);
                  }}
                  className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Session Core Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-[#BEF264] shrink-0" />
                  <div>
                    <span className="block text-[10px] text-white/40 uppercase font-bold">Date & Time</span>
                    <span className="font-bold text-white">
                      {selectedSession.date} • {selectedSession.startTime} - {selectedSession.endTime}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
                  <div>
                    <span className="block text-[10px] text-white/40 uppercase font-bold">Lab Location</span>
                    <span className="font-bold text-white">{selectedSession.location}</span>
                  </div>
                </div>
              </div>

              {selectedSession.topic && (
                <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-xs text-white/80">
                  <span className="font-bold text-[#BEF264]">Session Topic: </span>
                  <span>{selectedSession.topic}</span>
                </div>
              )}

              {/* ASSIGNED COACHES & WHATSAPP REMINDERS (USER REQUIREMENT) */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white/70 uppercase tracking-wider flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-[#BEF264]" />
                    <span>Assigned Coach(es)</span>
                  </span>
                  <span className="text-[10px] text-white/40 font-semibold">WhatsApp Reminders</span>
                </div>

                {sessionCoaches.length > 0 ? (
                  <div className="space-y-2">
                    {sessionCoaches.map((coach) => (
                      <div
                        key={coach.id}
                        className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-[#BEF264]/20 border border-[#BEF264]/40 text-[#BEF264] flex items-center justify-center font-black text-xs">
                            {coach.name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-white block">{coach.name}</span>
                            <span className="text-[11px] text-white/50">{coach.phone || 'No phone'}</span>
                          </div>
                        </div>

                        {/* Remind Coach via WhatsApp Button */}
                        {coach.phone && (
                          <button
                            type="button"
                            onClick={() => handleRemindCoachViaWhatsApp(coach)}
                            className="px-3 py-1.5 rounded-xl bg-[#25D366]/20 hover:bg-[#25D366]/30 border border-[#25D366]/40 text-[#25D366] text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
                            title={`Send WhatsApp session reminder to ${coach.name}`}
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>Remind Coach via WhatsApp</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-white/50">No coaches assigned yet.</p>
                )}
              </div>

              {/* STUDENT ATTENDANCE CHECKBOXES SECTION (KEY USER REQUIREMENT) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#050B1A]/80 border border-white/15 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-[#BEF264]" />
                      <h4 className="font-black text-sm text-white">
                        Group Students Attendance Check (كشف الحضور)
                      </h4>
                    </div>
                    <p className="text-[11px] text-white/50 mt-0.5">
                      1-Click Checkbox: Press any student's checkbox to toggle attended / absent.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className="px-2.5 py-1 rounded-xl bg-white/10 text-xs font-bold text-white">
                      <strong className="text-[#BEF264]">{presentCount}</strong> / {enrolledStudents.length} Attended
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSetAllAttendance('present')}
                      className="px-2.5 py-1 rounded-lg bg-[#BEF264]/20 hover:bg-[#BEF264]/30 text-[#BEF264] text-[11px] font-bold border border-[#BEF264]/30 transition-colors"
                    >
                      All Present
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetAllAttendance('absent')}
                      className="px-2.5 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 text-[11px] font-bold border border-red-500/30 transition-colors"
                    >
                      All Absent
                    </button>
                  </div>
                </div>

                {/* ATTENDANCE NOTICE TOAST */}
                {attendanceNotice && (
                  <div className="p-2.5 rounded-xl bg-[#BEF264]/20 border border-[#BEF264]/40 text-[#BEF264] text-xs font-bold flex items-center gap-2 animate-fade-in">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{attendanceNotice}</span>
                  </div>
                )}

                {/* STUDENTS ROSTER LIST WITH 1-CLICK CHECKBOXES */}
                {enrolledStudents.length === 0 ? (
                  <div className="text-center py-6 text-xs text-white/50">
                    No students currently enrolled in this group.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {enrolledStudents.map((st) => {
                      const isPresent = getStudentStatus(st.id) === 'present';
                      return (
                        <div
                          key={st.id}
                          className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                            isPresent
                              ? 'bg-emerald-500/10 border-emerald-500/30'
                              : 'bg-red-500/10 border-red-500/30'
                          }`}
                        >
                          {/* 1-CLICK CHECKBOX & STUDENT NAME */}
                          <div className="flex items-center gap-3 min-w-0">
                            <button
                              type="button"
                              onClick={() => handleToggleStudentAttendance(st.id)}
                              className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all shrink-0 shadow-sm ${
                                isPresent
                                  ? 'bg-emerald-500 text-white shadow-emerald-500/30 ring-2 ring-emerald-400/40'
                                  : 'bg-white/10 border border-white/20 text-transparent hover:border-red-400'
                              }`}
                              title={isPresent ? 'Click to mark Absent' : 'Click to mark Attended'}
                            >
                              <Check className={`w-4 h-4 stroke-[3] ${isPresent ? 'opacity-100' : 'opacity-0'}`} />
                            </button>

                            <div
                              onClick={() => handleToggleStudentAttendance(st.id)}
                              className="cursor-pointer select-none min-w-0"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-white truncate">{st.name}</span>
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                                    isPresent
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                      : 'bg-red-500/20 text-red-300 border border-red-500/40'
                                  }`}
                                >
                                  {isPresent ? 'Attended (حاضر)' : 'Absent (غائب)'}
                                </span>
                              </div>
                              <span className="text-[10px] text-white/40 block">
                                {st.grade || 'Student'} • Parent: {st.parentName || 'Parent'} ({st.parentPhone || 'No phone'})
                              </span>
                            </div>
                          </div>

                          {/* ACTION BUTTONS (WHATSAPP IF ABSENT) */}
                          <div className="flex items-center gap-2 shrink-0">
                            {!isPresent && (st.parentPhone || st.phone) && (
                              <button
                                type="button"
                                onClick={() => handleNotifyParentOfAbsence(st)}
                                className="px-2.5 py-1.5 rounded-xl bg-[#25D366]/20 hover:bg-[#25D366]/30 border border-[#25D366]/40 text-[#25D366] text-[11px] font-bold flex items-center gap-1.5 transition-colors"
                                title="Send WhatsApp absence alert & makeup scheduling invitation to parent"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">WhatsApp Parent</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleToggleStudentAttendance(st.id)}
                              className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 text-[10px] font-semibold"
                            >
                              Toggle
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* REMINDER ALERT & FOOTER ACTIONS */}
              {reminderSent && (
                <div className="p-3 rounded-2xl bg-[#BEF264]/15 border border-[#BEF264]/30 text-[#BEF264] text-xs font-semibold flex items-center gap-2 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{t.reminderSentAlert}</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={async () => {
                    await sendSessionReminder(selectedSession.id);
                    setReminderSent(true);
                    if (sessionCoaches[0]?.phone) {
                      handleRemindCoachViaWhatsApp(sessionCoaches[0]);
                    }
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-white/10 text-white text-xs font-bold hover:bg-white/15 transition-colors border border-white/10 flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4 text-[#25D366]" />
                  <span>Send Notification & WhatsApp Reminder</span>
                </button>

                {onNavigateTab && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSession(null);
                      onNavigateTab('attendance');
                    }}
                    className="py-2.5 px-4 rounded-xl bg-[#BEF264] hover:bg-[#aee64a] text-[#050B1A] font-black text-xs shadow-lg shadow-[#BEF264]/20 transition-all"
                  >
                    Full Attendance Hub
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
