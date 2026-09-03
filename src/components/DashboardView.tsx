import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Layers,
  Users,
  GraduationCap,
  Calendar,
  Wallet,
  Clock,
  MapPin,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  ChevronRight,
  TrendingUp,
  XCircle,
  AlertCircle,
  Send,
  RefreshCw,
} from 'lucide-react';
import { Group, CoachAssignmentInfo } from '../types';

interface DashboardViewProps {
  onNavigateTab: (tab: string) => void;
  onOpenCreateGroup: () => void;
  onOpenAddStudent: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateTab,
  onOpenCreateGroup,
  onOpenAddStudent,
}) => {
  const {
    currentUser,
    role,
    t,
    groups,
    coaches,
    students,
    sessions,
    payments,
    approveCoach,
    continueGroupLevel,
    respondToGroupAssignment,
  } = useApp();

  const isOwner = role === 'admin';

  // Decline Modal State on Dashboard
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineTargetGroup, setDeclineTargetGroup] = useState<Group | null>(null);
  const [declineReason, setDeclineReason] = useState('');
  const [declineSubmitting, setDeclineSubmitting] = useState(false);
  const [dashFeedback, setDashFeedback] = useState<string | null>(null);

  const showFeedbackMsg = (msg: string) => {
    setDashFeedback(msg);
    setTimeout(() => setDashFeedback(null), 4000);
  };

  const handleQuickAccept = async (groupId: string) => {
    try {
      await respondToGroupAssignment(groupId, 'accepted');
      showFeedbackMsg(t.assignmentAcceptedSuccess || 'Group assignment accepted!');
    } catch (err: any) {
      showFeedbackMsg(err.message || 'Error accepting assignment');
    }
  };

  const handleDeclineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!declineTargetGroup || !declineReason.trim()) return;
    setDeclineSubmitting(true);
    try {
      await respondToGroupAssignment(declineTargetGroup.id, 'rejected', declineReason.trim());
      setShowDeclineModal(false);
      setDeclineTargetGroup(null);
      setDeclineReason('');
      showFeedbackMsg(t.assignmentDeclinedSuccess || 'Decline response sent to owner.');
    } catch (err: any) {
      showFeedbackMsg(err.message || 'Error submitting decline');
    } finally {
      setDeclineSubmitting(false);
    }
  };

  // Metrics calculation
  const activeGroups = groups.filter((g) => g.status === 'active');
  const activeCoaches = coaches.filter((c) => c.status === 'active');
  const pendingCoaches = coaches.filter((c) => c.status === 'pending');
  const groupsNeedingDecision = groups.filter((g) => g.continueDecision === 'pending_decision');

  // Filter for coach if not owner
  const myCoachId = currentUser?.id;
  const myGroups = isOwner
    ? groups
    : groups.filter((g) => g.assignedCoachIds.includes(myCoachId || ''));

  // Coach Pending Assignments
  const pendingCoachGroups = !isOwner && myCoachId
    ? groups.filter(
        (g) =>
          g.assignedCoachIds.includes(myCoachId) &&
          g.coachAssignments?.[myCoachId]?.status === 'pending'
      )
    : [];

  // Owner Rejection Alerts
  const rejectedAssignments = isOwner
    ? groups.flatMap((g) =>
        (Object.entries(g.coachAssignments || {}) as [string, CoachAssignmentInfo][])
          .filter(([_, a]) => a && a.status === 'rejected')
          .map(([cid, a]) => ({ group: g, coachId: cid, info: a }))
      )
    : [];

  const mySessions = isOwner
    ? sessions
    : sessions.filter((s) => s.assignedCoachIds.includes(myCoachId || ''));

  const myUpcomingSessions = mySessions
    .filter((s) => !s.isCompleted)
    .sort((a, b) => a.date.localeCompare(b.date));

  const myCompletedSessions = mySessions.filter((s) => s.isCompleted);

  const myEarnings = payments
    .filter((p) => (isOwner ? true : p.coachId === myCoachId))
    .reduce((sum, p) => sum + p.amountOwed, 0);

  const myPendingEarnings = payments
    .filter((p) => (isOwner ? true : p.coachId === myCoachId) && p.paymentStatus === 'pending')
    .reduce((sum, p) => sum + p.amountOwed, 0);

  return (
    <div id="dashboard-view" className="space-y-6">
      {/* Toast Feedback */}
      {dashFeedback && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs font-bold flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>{dashFeedback}</span>
          </div>
          <button onClick={() => setDashFeedback(null)} className="text-white/60 hover:text-white">✕</button>
        </div>
      )}

      {/* Top Banner / Welcome with Frosted Glass Aesthetics */}
      <div className="rounded-3xl p-6 sm:p-8 bg-white/5 border border-white/10 backdrop-blur-xl text-white relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-[#BEF264]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#BEF264]/20 text-[#BEF264] text-xs font-bold tracking-wide border border-[#BEF264]/30 uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {isOwner ? 'MMS Master Command • Owner Mode' : 'Robotics Coach Portal'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {t.welcomeBack}, <span className="text-[#BEF264]">{currentUser?.name}</span>
            </h1>
            <p className="text-white/60 text-xs sm:text-sm max-w-xl leading-relaxed">
              {isOwner
                ? 'Internal management system for robotics tracks, 4-week student cycles, coach dispatching, and automated payroll.'
                : 'View your upcoming training sessions, track student attendance, and monitor your monthly earned payroll.'}
            </p>
          </div>

          {/* Quick Action Buttons for Owner */}
          {isOwner && (
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <button
                id="dash-create-group-btn"
                onClick={onOpenCreateGroup}
                className="px-4 py-2.5 rounded-xl bg-[#BEF264] hover:bg-[#aee64a] text-[#050B1A] font-black text-xs shadow-lg shadow-[#BEF264]/20 transition-all flex items-center gap-2"
              >
                <Layers className="w-4 h-4" />
                <span>{t.createGroup}</span>
              </button>
              <button
                id="dash-view-students-btn"
                onClick={() => onNavigateTab('students')}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/10 transition-all flex items-center gap-2"
              >
                <GraduationCap className="w-4 h-4" />
                <span>{t.studentsTitle}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* COACH VIEW: High-Priority Pending Group Assignments Banner */}
      {!isOwner && pendingCoachGroups.length > 0 && (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-[#BEF264]/20 via-[#BEF264]/10 to-transparent border border-[#BEF264]/30 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#BEF264] text-[#050B1A]">
                <Sparkles className="w-4 h-4 font-black" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">{t.pendingGroupAssignments} ({pendingCoachGroups.length})</h3>
                <p className="text-xs text-white/70">{t.assignedToGroupPrompt}</p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('groups')}
              className="text-xs font-bold text-[#BEF264] hover:underline flex items-center gap-1"
            >
              <span>{t.viewAll}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingCoachGroups.map((grp) => (
              <div
                key={grp.id}
                className="p-4 rounded-2xl bg-[#050B1A]/80 border border-[#BEF264]/30 flex flex-col justify-between gap-3 text-xs"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-md bg-[#BEF264]/20 text-[#BEF264] font-black text-[10px]">
                      {grp.track} • Level {grp.level}
                    </span>
                    <span className="text-[#BEF264] font-black">{grp.pricePerSession} EGP/sess</span>
                  </div>
                  <div className="font-bold text-white text-sm">{grp.name}</div>
                  <div className="text-white/60 text-[11px] flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#BEF264]" />
                      {t[grp.dayOfWeek as keyof typeof t] || grp.dayOfWeek} {grp.startTime}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-white/40" />
                      {grp.location}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-white/10">
                  <button
                    onClick={() => handleQuickAccept(grp.id)}
                    className="flex-1 py-2 rounded-xl bg-[#BEF264] hover:bg-[#aee64a] text-[#050B1A] font-black text-xs shadow-md transition-all flex items-center justify-center gap-1"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>{t.acceptAssignment}</span>
                  </button>
                  <button
                    onClick={() => {
                      setDeclineTargetGroup(grp);
                      setDeclineReason('');
                      setShowDeclineModal(true);
                    }}
                    className="px-3 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-200 font-bold text-xs transition-all flex items-center justify-center gap-1"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>{t.declineAssignment}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* OWNER VIEW: High-Priority Coach Declined Assignments Alert Banner */}
      {isOwner && rejectedAssignments.length > 0 && (
        <div className="p-5 rounded-3xl bg-red-500/10 border border-red-500/30 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-red-500 text-white">
                <AlertTriangle className="w-4 h-4 font-black" />
              </div>
              <div>
                <h3 className="text-sm font-black text-red-300">
                  {t.assignmentRejectionAlerts || 'Coach Assignment Rejections'} ({rejectedAssignments.length})
                </h3>
                <p className="text-xs text-white/70">
                  Coaches declined these group assignments. Immediate reassignment recommended.
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('groups')}
              className="text-xs font-bold text-red-300 hover:underline flex items-center gap-1"
            >
              <span>{t.viewAll}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            {rejectedAssignments.map(({ group, coachId, info }) => {
              const coach = coaches.find((c) => c.id === coachId);
              return (
                <div
                  key={`${group.id}-${coachId}`}
                  className="p-3.5 rounded-2xl bg-[#050B1A]/80 border border-red-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="font-bold text-white flex items-center gap-2">
                      <span className="text-red-400 font-black">{coach?.name || info.coachName || coachId}</span>
                      <span className="text-white/40">declined</span>
                      <span className="text-[#BEF264]">{group.name}</span>
                    </div>
                    <div className="text-white/70 text-[11px] italic">
                      "{t.rejectionReasonLabel}: {info.rejectionReason || t.noRejectionReason}"
                    </div>
                  </div>
                  <button
                    onClick={() => onNavigateTab('groups')}
                    className="px-3.5 py-1.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-black text-xs transition-all flex items-center gap-1.5 shrink-0 shadow-md"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>{t.reassignCoachBtn}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Metrics Row (3-4 columns) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white/5 border border-white/10 p-5 rounded-3xl backdrop-blur-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-white/40 text-xs font-medium uppercase tracking-wider">
              {isOwner ? t.activeGroupsCount : 'My Active Groups'}
            </span>
            <div className="p-2 rounded-xl bg-[#BEF264]/10 text-[#BEF264] border border-[#BEF264]/20">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white">
            {myGroups.length}
          </div>
          <div className="text-[11px] text-[#BEF264] flex items-center gap-1">
            <span>Across {isOwner ? '6 tracks' : 'assigned labs'}</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white/5 border border-white/10 p-5 rounded-3xl backdrop-blur-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-white/40 text-xs font-medium uppercase tracking-wider">
              {isOwner ? t.activeCoachesCount : 'Completed Sessions'}
            </span>
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              {isOwner ? <Users className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
            </div>
          </div>
          <div className="text-3xl font-bold text-white">
            {isOwner ? activeCoaches.length : myCompletedSessions.length}
          </div>
          <div className="text-[11px] text-white/40">
            {isOwner ? `${pendingCoaches.length} pending review` : 'Recorded attendance'}
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white/5 border border-white/10 p-5 rounded-3xl backdrop-blur-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-white/40 text-xs font-medium uppercase tracking-wider">
              {isOwner ? t.enrolledStudentsCount : 'Upcoming Sessions'}
            </span>
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              {isOwner ? <GraduationCap className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
            </div>
          </div>
          <div className="text-3xl font-bold text-white">
            {isOwner ? students.length : myUpcomingSessions.length}
          </div>
          <div className="text-[11px] text-white/40">
            {isOwner ? 'Across all academies' : 'In next 4 weeks'}
          </div>
        </div>

        {/* Metric 4: Payroll / Earnings */}
        <div className="bg-white/5 border border-white/10 p-5 rounded-3xl backdrop-blur-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-white/40 text-xs font-medium uppercase tracking-wider">
              {isOwner ? t.pendingAmount : 'My Pending Earnings'}
            </span>
            <div className="p-2 rounded-xl bg-[#BEF264]/20 text-[#BEF264] border border-[#BEF264]/30">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-[#BEF264]">
            {myPendingEarnings.toLocaleString()} <span className="text-xs font-bold text-white/40">EGP</span>
          </div>
          <div className="text-[11px] text-white/40">
            Total earned: {myEarnings.toLocaleString()} EGP
          </div>
        </div>
      </div>

      {/* Main Grid: Upcoming Sessions on Left, Approvals & Level Continuity on Right */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Column (8 cols on lg) */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {/* Sessions List Card */}
          <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-sm">
            <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#BEF264]" />
                <h3 className="font-semibold text-white">Today's & Upcoming Robotics Sessions</h3>
              </div>
              <button
                onClick={() => onNavigateTab('calendar')}
                className="text-xs text-[#BEF264] hover:underline flex items-center gap-1 font-bold"
              >
                <span>View Full Calendar</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-white/5">
              {myUpcomingSessions.length === 0 ? (
                <div className="p-8 text-center text-xs text-white/40">
                  No upcoming sessions scheduled.
                </div>
              ) : (
                myUpcomingSessions.slice(0, 5).map((session) => {
                  const assignedCoachesList = coaches.filter((c) =>
                    session.assignedCoachIds.includes(c.id)
                  );

                  return (
                    <div
                      key={session.id}
                      className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center">
                        <div className="w-16 text-center border-r border-white/10 mr-4 sm:mr-6 shrink-0">
                          <span className="block text-lg font-bold text-white">
                            {session.startTime}
                          </span>
                          <span className="text-[10px] text-white/40 uppercase">
                            {session.date}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-medium text-[#BEF264] text-sm">
                            {session.track} - Level {session.level}
                          </h4>
                          <p className="text-xs text-white/50 mt-0.5">
                            {session.groupName} • {session.location} • {assignedCoachesList.map((c) => c.name).join(', ') || 'No Coach'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-[10px] bg-white/10 px-2.5 py-1 rounded-lg text-white/70 border border-white/10 font-medium">
                          Week {session.sessionNumber} of 4
                        </span>
                        <button
                          onClick={() => onNavigateTab('attendance')}
                          className="text-xs bg-white/10 hover:bg-[#BEF264] hover:text-[#050B1A] text-white px-3.5 py-1.5 rounded-xl border border-white/10 font-bold transition-all"
                        >
                          Attendance
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column (4 cols on lg): Approvals and Level Continuity */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* Pending Approvals */}
          {isOwner && (
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-xs uppercase tracking-wider text-[#BEF264]">
                  Pending Coach Approvals
                </h3>
                <span className="text-xs font-bold text-white/40">
                  {pendingCoaches.length}
                </span>
              </div>

              {pendingCoaches.length === 0 ? (
                <div className="py-6 text-center text-xs text-white/40">
                  No applicants waiting for approval.
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingCoaches.map((c) => (
                    <div
                      key={c.id}
                      className="p-3.5 bg-white/5 rounded-2xl border border-white/5 space-y-2.5"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#BEF264]/20 text-[#BEF264] flex items-center justify-center text-xs font-black shrink-0 border border-[#BEF264]/30">
                          {c.name.charAt(0)}
                        </div>
                        <div className="truncate flex-1">
                          <p className="text-xs font-bold text-white truncate">{c.name}</p>
                          <p className="text-[10px] text-white/40 truncate">
                            {c.specialization?.join(', ') || 'Robotics'} • Age {c.age}
                          </p>
                        </div>
                      </div>

                      <p className="text-[10px] text-white/60 italic">
                        Available: {c.availableDays?.join(', ')}
                      </p>

                      <div className="flex gap-2">
                        <button
                          onClick={() => approveCoach(c.id)}
                          className="flex-1 py-1.5 bg-[#BEF264] text-[#050B1A] text-xs font-black rounded-xl hover:bg-[#aee64a] shadow-sm transition-all"
                        >
                          APPROVE
                        </button>
                        <button
                          onClick={() => onNavigateTab('coaches')}
                          className="px-3 py-1.5 bg-white/10 text-white/70 hover:text-white text-xs font-bold rounded-xl border border-white/10 transition-all"
                        >
                          VIEW
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Level Continuity Promotion Banner */}
          {isOwner && groupsNeedingDecision.length > 0 ? (
            <div className="bg-gradient-to-br from-[#BEF264]/20 to-transparent border border-[#BEF264]/20 rounded-3xl p-6 backdrop-blur-sm space-y-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#BEF264]" />
                <h3 className="font-bold text-sm text-white">Level Continuity</h3>
              </div>
              <p className="text-xs text-white/70 leading-relaxed">
                <span className="font-bold text-[#BEF264]">{groupsNeedingDecision[0].name}</span> (Level {groupsNeedingDecision[0].level}) completed its 4-week cycle. Transition to Level {groupsNeedingDecision[0].level + 1}?
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() =>
                    continueGroupLevel(groupsNeedingDecision[0].id, 'continue', {
                      nextLevel: groupsNeedingDecision[0].level + 1,
                    })
                  }
                  className="bg-[#BEF264] text-[#050B1A] px-4 py-2 rounded-xl text-xs font-black hover:bg-[#aee64a] shadow-md transition-all"
                >
                  CONTINUE LEVEL {groupsNeedingDecision[0].level + 1}
                </button>
                <button
                  onClick={() => continueGroupLevel(groupsNeedingDecision[0].id, 'finish')}
                  className="bg-white/10 text-white px-3 py-2 rounded-xl text-xs font-bold border border-white/10 hover:bg-white/15 transition-all"
                >
                  ARCHIVE
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm space-y-3">
              <h3 className="font-bold text-xs uppercase tracking-wider text-white/40">
                Robotics Tracks Overview
              </h3>
              <div className="space-y-2 text-xs">
                {[
                  { name: 'Arduino Microcontrollers', count: groups.filter((g) => g.track === 'Arduino').length },
                  { name: 'WeDo 2.0 Robotics', count: groups.filter((g) => g.track === 'WeDo').length },
                  { name: 'Lego EV3 Mindstorms', count: groups.filter((g) => g.track === 'Lego EV3').length },
                  { name: 'SolidWorks 3D CAD', count: groups.filter((g) => g.track === 'SolidWorks').length },
                  { name: 'Lego Prime Robotics', count: groups.filter((g) => g.track === 'Lego Prime').length },
                ].map((tr) => (
                  <div key={tr.name} className="flex items-center justify-between py-1 border-b border-white/5 last:border-0">
                    <span className="text-white/70">{tr.name}</span>
                    <span className="font-bold text-[#BEF264]">{tr.count} group(s)</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* DASHBOARD COACH DECLINE ASSIGNMENT MODAL */}
      {showDeclineModal && declineTargetGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050B1A]/85 backdrop-blur-xl animate-fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-[#070E20]/95 backdrop-blur-2xl border border-red-500/20 shadow-2xl overflow-hidden p-6 sm:p-8 text-white">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-red-500/20 border border-red-500/30 text-red-400">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    {t.declineAssignment}
                  </h3>
                  <p className="text-xs text-white/50">{declineTargetGroup.name}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowDeclineModal(false);
                  setDeclineTargetGroup(null);
                }}
                className="p-1 rounded-lg text-white/40 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleDeclineSubmit} className="space-y-4 pt-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1 text-white/80">
                <div className="font-bold text-white flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-[#BEF264]" />
                  <span>
                    {t[declineTargetGroup.dayOfWeek as keyof typeof t] || declineTargetGroup.dayOfWeek} {declineTargetGroup.startTime} - {declineTargetGroup.endTime}
                  </span>
                </div>
                <div className="text-white/50 text-[11px] flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-white/40" />
                  <span>{declineTargetGroup.location}</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-white/90 mb-1.5 flex items-center justify-between">
                  <span>{t.rejectionReasonLabel} <span className="text-red-400">*</span></span>
                  <span className="text-[10px] text-white/40">{t.reasonWillBeSentToOwner}</span>
                </label>

                {/* Quick reason suggestions */}
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {[
                    t.quickReasonTimeConflict,
                    t.quickReasonExam,
                    t.quickReasonLocation,
                    t.quickReasonEmergency,
                  ].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setDeclineReason(chip)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                        declineReason === chip
                          ? 'bg-red-500/20 border-red-500/50 text-red-200'
                          : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                      }`}
                    >
                      {chip}
                    </button>
                  ))}
                </div>

                <textarea
                  required
                  rows={3}
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  placeholder={t.rejectionReasonPlaceholder}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-white/10 bg-white/5 text-white placeholder-white/30 text-xs focus:outline-none focus:ring-1 focus:ring-red-400 leading-relaxed"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeclineModal(false);
                    setDeclineTargetGroup(null);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-white/10 text-white/70 text-xs font-semibold hover:bg-white/5"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={declineSubmitting}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-red-500 hover:bg-red-600 text-white font-black text-xs shadow-lg shadow-red-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{declineSubmitting ? '...' : t.sendDeclineReason}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
