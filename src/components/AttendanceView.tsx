import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { StudentAttendanceEntry, CoachAttendanceEntry, MakeupSessionItem } from '../types';
import {
  CheckCircle2,
  Calendar,
  Users,
  GraduationCap,
  Sparkles,
  Save,
  CheckCheck,
  Plus,
  Clock,
  MapPin,
  UserCheck,
  AlertCircle,
  X,
} from 'lucide-react';

export const AttendanceView: React.FC = () => {
  const {
    role,
    currentUser,
    t,
    groups,
    sessions,
    coaches,
    students,
    attendance,
    makeups,
    saveAttendance,
    createMakeupSession,
    completeMakeupSession,
  } = useApp();

  const isOwner = role === 'admin';

  // Filter available sessions for this user
  const availableSessions = sessions
    .filter((s) => (isOwner ? true : s.assignedCoachIds.includes(currentUser?.id || '')))
    .sort((a, b) => a.date.localeCompare(b.date));

  const [selectedSessionId, setSelectedSessionId] = useState<string>(
    availableSessions[0]?.id || ''
  );
  const [saveSuccessMessage, setSaveSuccessMessage] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'attendance' | 'makeups'>('attendance');

  // Makeup scheduling modal state
  const [showMakeupModal, setShowMakeupModal] = useState(false);
  const [makeupStudentId, setMakeupStudentId] = useState('');
  const [makeupSessionDate, setMakeupSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [makeupStartTime, setMakeupStartTime] = useState('14:00');
  const [makeupEndTime, setMakeupEndTime] = useState('16:00');
  const [makeupCoachId, setMakeupCoachId] = useState(coaches[0]?.id || '');
  const [makeupLocation, setMakeupLocation] = useState('Lab A - Robotics Hub');
  const [makeupNotes, setMakeupNotes] = useState('');
  const [makeupSubmitting, setMakeupSubmitting] = useState(false);

  const selectedSession = sessions.find((s) => s.id === selectedSessionId);
  const targetGroup = groups.find((g) => g.id === selectedSession?.groupId);
  const enrolledStudents = students.filter((st) =>
    targetGroup?.enrolledStudentIds.includes(st.id)
  );
  const assignedCoaches = coaches.filter((c) =>
    selectedSession?.assignedCoachIds.includes(c.id)
  );

  // Local student attendance state
  const [studentStates, setStudentStates] = useState<
    Record<string, { status: 'present' | 'absent' | 'late' | 'excused'; notes?: string }>
  >({});

  // Local coach attendance state
  const [coachStates, setCoachStates] = useState<
    Record<string, { status: 'present' | 'absent' | 'substitute'; hours: number; notes?: string }>
  >({});

  // When session changes, initialize local states from existing record or defaults
  useEffect(() => {
    if (!selectedSessionId) return;
    const currentRec = attendance.find((r) => r.sessionId === selectedSessionId);

    const initialStudents: Record<string, any> = {};
    enrolledStudents.forEach((st) => {
      const match = currentRec?.studentAttendance?.find((sr) => sr.studentId === st.id);
      initialStudents[st.id] = {
        status: match ? match.status : 'present',
        notes: match?.notes || '',
      };
    });
    setStudentStates(initialStudents);

    const initialCoaches: Record<string, any> = {};
    assignedCoaches.forEach((c) => {
      const match = currentRec?.coachAttendance?.find((cr) => cr.coachId === c.id);
      initialCoaches[c.id] = {
        status: match ? match.status : 'present',
        hours: match ? match.attendedHours : 2,
        notes: match?.notes || '',
      };
    });
    setCoachStates(initialCoaches);
    setSaveSuccessMessage(false);
  }, [selectedSessionId, attendance]);

  const handleStudentStatusChange = (
    studentId: string,
    status: 'present' | 'absent' | 'late' | 'excused'
  ) => {
    setStudentStates((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }));
  };

  const handleCoachStatusChange = (
    coachId: string,
    status: 'present' | 'absent' | 'substitute'
  ) => {
    setCoachStates((prev) => ({
      ...prev,
      [coachId]: {
        ...prev[coachId],
        status,
      },
    }));
  };

  const openScheduleMakeup = (studentId: string) => {
    setMakeupStudentId(studentId);
    setMakeupCoachId(assignedCoaches[0]?.id || coaches[0]?.id || '');
    setMakeupLocation(selectedSession?.location || 'Lab A - Robotics Hub');
    setMakeupStartTime(selectedSession?.startTime || '14:00');
    setMakeupEndTime(selectedSession?.endTime || '16:00');
    setMakeupNotes(`Makeup for ${selectedSession?.groupName || 'session'} on ${selectedSession?.date || 'previous session'}`);
    setShowMakeupModal(true);
  };

  const handleSaveAttendance = async () => {
    if (!selectedSession || !targetGroup) return;

    const studentRecordsPayload: StudentAttendanceEntry[] = enrolledStudents.map((st) => ({
      studentId: st.id,
      status: studentStates[st.id]?.status || 'present',
      notes: studentStates[st.id]?.notes,
    }));

    const coachRecordsPayload: CoachAttendanceEntry[] = assignedCoaches.map((c) => ({
      coachId: c.id,
      status: coachStates[c.id]?.status || 'present',
      attendedHours: coachStates[c.id]?.hours || 2,
      notes: coachStates[c.id]?.notes,
    }));

    await saveAttendance({
      sessionId: selectedSession.id,
      groupId: selectedSession.groupId,
      date: selectedSession.date,
      studentAttendance: studentRecordsPayload,
      coachAttendance: coachRecordsPayload,
    });

    setSaveSuccessMessage(true);
    setTimeout(() => setSaveSuccessMessage(false), 4000);
  };

  const handleCreateMakeupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!makeupStudentId || !makeupSessionDate) return;

    setMakeupSubmitting(true);
    const res = await createMakeupSession({
      studentId: makeupStudentId,
      coachId: makeupCoachId,
      originalSessionId: selectedSession?.id || undefined,
      originalGroupId: selectedSession?.groupId || undefined,
      date: makeupSessionDate,
      startTime: makeupStartTime,
      endTime: makeupEndTime,
      location: makeupLocation,
      notes: makeupNotes.trim() || undefined,
    });
    setMakeupSubmitting(false);

    if (res.success) {
      setShowMakeupModal(false);
      alert(t.makeupCreatedSuccess);
    } else {
      alert(res.error || 'Failed to schedule makeup');
    }
  };

  return (
    <div id="attendance-view" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <CheckCheck className="w-6 h-6 text-[#BEF264]" />
            <span>{t.takeAttendance}</span>
          </h2>
          <p className="text-xs sm:text-sm text-white/50 mt-1">
            Record student attendance status and verify coach attendance. Completed sessions automatically sync with the payroll engine.
          </p>
        </div>

        {/* Sub-tabs: Attendance vs Compensatory Makeups */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/5 border border-white/10 self-start sm:self-auto">
          <button
            onClick={() => setActiveSubTab('attendance')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'attendance'
                ? 'bg-[#BEF264] text-[#050B1A] shadow-md shadow-[#BEF264]/20'
                : 'text-white/60 hover:text-white'
            }`}
          >
            {t.takeAttendance}
          </button>
          <button
            onClick={() => setActiveSubTab('makeups')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'makeups'
                ? 'bg-[#BEF264] text-[#050B1A] shadow-md shadow-[#BEF264]/20'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <span>{t.compensatorySessions}</span>
            {makeups.filter((m) => m.status !== 'completed').length > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-400 text-[#050B1A] text-[10px] font-black flex items-center justify-center">
                {makeups.filter((m) => m.status !== 'completed').length}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeSubTab === 'makeups' ? (
        /* Compensatory Sessions List & Management */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#BEF264]" />
              <span>{t.compensatorySessions} ({makeups.length})</span>
            </h3>
            <button
              onClick={() => {
                setMakeupStudentId(students[0]?.id || '');
                setShowMakeupModal(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-[#BEF264] hover:bg-[#aee64a] text-[#050B1A] text-xs font-black flex items-center gap-1 shadow-md shadow-[#BEF264]/20 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t.scheduleMakeup}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {makeups.length === 0 ? (
              <div className="col-span-2 p-12 text-center text-white/40 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md">
                No compensatory makeup sessions scheduled yet.
              </div>
            ) : (
              makeups.map((m) => {
                const student = students.find((s) => s.id === m.studentId);
                const coach = coaches.find((c) => c.id === m.coachId);
                const isDone = m.status === 'completed';

                return (
                  <div
                    key={m.id}
                    className={`p-4 rounded-3xl border transition-all ${
                      isDone
                        ? 'bg-[#BEF264]/10 border-[#BEF264]/30'
                        : 'bg-white/5 border-white/10'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm text-white">{student?.name || m.studentName || 'Student'}</span>
                          {isDone ? (
                            <span className="px-2 py-0.5 rounded-md bg-[#BEF264] text-[#050B1A] text-[10px] font-black flex items-center gap-0.5">
                              <CheckCircle2 className="w-3 h-3" />
                              {t.isCompleted}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                              Scheduled
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-white/70 flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-[#BEF264]" />
                          <span>{m.date} ({m.startTime} - {m.endTime})</span>
                        </div>

                        <div className="text-xs text-white/60 flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-white/40" />
                          <span>{m.location}</span>
                        </div>

                        <div className="text-xs text-white/80">
                          <span className="text-white/40 font-bold">Coach: </span>
                          <span>{coach?.name || m.coachName || 'Assigned Coach'}</span>
                        </div>

                        {m.notes && (
                          <div className="p-2 rounded-xl bg-white/5 border border-white/5 text-[11px] text-white/60 italic">
                            "{m.notes}"
                          </div>
                        )}
                      </div>

                      {!isDone && (
                        <button
                          onClick={async () => {
                            await completeMakeupSession(m.id);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-[#BEF264] hover:bg-[#aee64a] text-[#050B1A] font-black text-xs shrink-0 flex items-center gap-1 shadow-md shadow-[#BEF264]/20 transition-all"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Mark Done</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        /* Regular Session Attendance Flow */
        <>
          {/* Session Selector Bar */}
          <div className="p-4 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-[#BEF264] shrink-0" />
              <div>
                <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest">
                  {t.selectSession}
                </label>
                <select
                  value={selectedSessionId}
                  onChange={(e) => setSelectedSessionId(e.target.value)}
                  className="mt-1 px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-[#BEF264]"
                >
                  {availableSessions.map((s) => (
                    <option key={s.id} value={s.id} className="bg-[#070E20] text-white">
                      {s.date} • {s.groupName} (Sess {s.sessionNumber}) • {s.startTime}-{s.endTime}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedSession && (
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="px-3 py-1 rounded-xl bg-[#BEF264] text-[#050B1A] font-black">
                  {selectedSession.track} L{selectedSession.level}
                </span>
                <span className="px-3 py-1 rounded-xl bg-white/10 text-white/80 border border-white/10 font-bold">
                  {selectedSession.location}
                </span>
                {selectedSession.isCompleted && (
                  <span className="px-3 py-1 rounded-xl bg-[#BEF264]/20 text-[#BEF264] border border-[#BEF264]/30 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{t.isCompleted}</span>
                  </span>
                )}
                {selectedSession.isPostponed && (
                  <span className="px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                    {t.isPostponedBadge}
                  </span>
                )}
              </div>
            )}
          </div>

          {saveSuccessMessage && (
            <div className="p-4 rounded-2xl bg-[#BEF264]/15 border border-[#BEF264]/30 text-[#BEF264] text-xs font-bold flex items-center gap-2 animate-fade-in backdrop-blur-md">
              <Sparkles className="w-4 h-4 text-[#BEF264]" />
              <span>{t.attendanceSaved}</span>
            </div>
          )}

          {selectedSession ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Students Attendance Sheet */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-[#BEF264]" />
                    <span>Student Roster ({enrolledStudents.length})</span>
                  </h3>
                  <div className="text-xs text-white/50 font-medium">
                    {enrolledStudents.filter((st) => studentStates[st.id]?.status === 'present').length} Present
                  </div>
                </div>

                <div className="rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md shadow-sm overflow-hidden divide-y divide-white/5">
                  {enrolledStudents.length === 0 ? (
                    <div className="p-8 text-center text-xs text-white/40">
                      No students currently enrolled in this group.
                    </div>
                  ) : (
                    enrolledStudents.map((st) => {
                      const state = studentStates[st.id] || { status: 'present' };

                      return (
                        <div
                          key={st.id}
                          className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/5 transition-colors"
                        >
                          <div>
                            <div className="font-bold text-sm text-white">
                              {st.name}
                            </div>
                            <div className="text-xs text-white/40">
                              {st.age} years old • Parent: {st.parentPhone}
                            </div>
                          </div>

                          {/* Status Buttons + Schedule Makeup if Absent */}
                          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleStudentStatusChange(st.id, 'present')}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                state.status === 'present'
                                  ? 'bg-[#BEF264] text-[#050B1A] shadow-md shadow-[#BEF264]/20'
                                  : 'bg-white/5 border border-white/10 text-white/60 hover:text-white'
                              }`}
                            >
                              {t.present}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleStudentStatusChange(st.id, 'absent')}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                state.status === 'absent'
                                  ? 'bg-red-500 text-white shadow-md shadow-red-500/20'
                                  : 'bg-white/5 border border-white/10 text-white/60 hover:text-white'
                              }`}
                            >
                              {t.absent}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleStudentStatusChange(st.id, 'late')}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                state.status === 'late'
                                  ? 'bg-amber-500 text-[#050B1A] shadow-md shadow-amber-500/20'
                                  : 'bg-white/5 border border-white/10 text-white/60 hover:text-white'
                              }`}
                            >
                              {t.late}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleStudentStatusChange(st.id, 'excused')}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                state.status === 'excused'
                                  ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                                  : 'bg-white/5 border border-white/10 text-white/60 hover:text-white'
                              }`}
                            >
                              {t.excused}
                            </button>

                            {state.status === 'absent' && (
                              <button
                                type="button"
                                onClick={() => openScheduleMakeup(st.id)}
                                className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center gap-1 transition-all"
                                title={t.scheduleMakeup}
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>{t.scheduleMakeup}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right 1 Col: Coach Verification & Save Panel */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#BEF264]" />
                  <span>Coach Attendance & Payroll Sync</span>
                </h3>

                <div className="p-5 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md shadow-sm space-y-4">
                  <div className="space-y-3">
                    {assignedCoaches.map((c) => {
                      const state = coachStates[c.id] || { status: 'present', hours: 2 };

                      return (
                        <div
                          key={c.id}
                          className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-2.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-white">
                              {c.name}
                            </span>
                            <span className="text-[11px] font-bold text-[#BEF264]">
                              {c.hourlyRate || 120} EGP/hr
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleCoachStatusChange(c.id, 'present')}
                              className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all ${
                                state.status === 'present'
                                  ? 'bg-[#BEF264] text-[#050B1A]'
                                  : 'bg-white/5 border border-white/10 text-white/60'
                              }`}
                            >
                              {t.present}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleCoachStatusChange(c.id, 'absent')}
                              className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all ${
                                state.status === 'absent'
                                  ? 'bg-red-500 text-white'
                                  : 'bg-white/5 border border-white/10 text-white/60'
                              }`}
                            >
                              {t.absent}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    onClick={handleSaveAttendance}
                    className="w-full py-3 px-4 rounded-2xl bg-[#BEF264] hover:bg-[#aee64a] text-[#050B1A] font-black text-xs shadow-lg shadow-[#BEF264]/25 transition-all flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Attendance & Complete Session</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-white/40 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md">
              No sessions available.
            </div>
          )}
        </>
      )}

      {/* SCHEDULE MAKEUP MODAL */}
      {showMakeupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050B1A]/85 backdrop-blur-xl animate-fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-[#070E20]/95 backdrop-blur-2xl border border-white/15 shadow-2xl overflow-hidden p-6 sm:p-8 text-white">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#BEF264]" />
                <h3 className="text-base font-black text-white">
                  {t.scheduleMakeup}
                </h3>
              </div>
              <button
                onClick={() => setShowMakeupModal(false)}
                className="p-1 rounded-lg text-white/40 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateMakeupSubmit} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block font-bold text-white/90 mb-1">
                  {t.selectStudent} <span className="text-[#BEF264]">*</span>
                </label>
                <select
                  value={makeupStudentId}
                  onChange={(e) => setMakeupStudentId(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#BEF264]"
                >
                  <option value="" disabled className="bg-[#070E20]">Select student...</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id} className="bg-[#070E20]">
                      {s.name} ({s.age} yrs)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-white/80 mb-1">{t.makeupDate}</label>
                  <input
                    type="date"
                    required
                    value={makeupSessionDate}
                    onChange={(e) => setMakeupSessionDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white text-xs focus:outline-none focus:ring-1 focus:ring-[#BEF264]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-white/80 mb-1">{t.startTime}</label>
                  <input
                    type="time"
                    required
                    value={makeupStartTime}
                    onChange={(e) => setMakeupStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white text-xs focus:outline-none focus:ring-1 focus:ring-[#BEF264]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-white/80 mb-1">{t.endTime}</label>
                  <input
                    type="time"
                    required
                    value={makeupEndTime}
                    onChange={(e) => setMakeupEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white text-xs focus:outline-none focus:ring-1 focus:ring-[#BEF264]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-white/80 mb-1">{t.assignedCoaches}</label>
                  <select
                    value={makeupCoachId}
                    onChange={(e) => setMakeupCoachId(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#BEF264]"
                  >
                    {coaches.map((c) => (
                      <option key={c.id} value={c.id} className="bg-[#070E20]">
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-white/80 mb-1">{t.locationRoom}</label>
                  <input
                    type="text"
                    required
                    value={makeupLocation}
                    onChange={(e) => setMakeupLocation(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white text-xs focus:outline-none focus:ring-1 focus:ring-[#BEF264]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-white/80 mb-1">{t.notes}</label>
                <input
                  type="text"
                  value={makeupNotes}
                  onChange={(e) => setMakeupNotes(e.target.value)}
                  placeholder="e.g. Missed session 2 due to illness"
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white placeholder-white/30 text-xs focus:outline-none focus:ring-1 focus:ring-[#BEF264]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMakeupModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-white/10 text-white/70 text-xs font-semibold hover:bg-white/5"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={makeupSubmitting}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#BEF264] hover:bg-[#aee64a] text-[#050B1A] font-black text-xs shadow-lg shadow-[#BEF264]/20 transition-all flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  <Plus className="w-4 h-4" />
                  <span>{makeupSubmitting ? '...' : t.scheduleMakeup}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
