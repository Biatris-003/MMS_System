import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Group, GroupSession, CoachAssignmentInfo } from '../types';
import {
  Layers,
  Plus,
  Calendar,
  Clock,
  MapPin,
  Users,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  UserCheck,
  Sparkles,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Send,
  HelpCircle,
} from 'lucide-react';

export const GroupsView: React.FC = () => {
  const {
    currentUser,
    role,
    t,
    groups,
    sessions,
    coaches,
    students,
    customTracks,
    createGroup,
    deleteGroup,
    continueGroupLevel,
    updateSession,
    postponeSession,
    checkConflict,
    addCustomTrack,
    respondToGroupAssignment,
    reassignGroupCoach,
  } = useApp();

  const isOwner = role === 'admin';

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSessionEditModal, setShowSessionEditModal] = useState(false);
  const [selectedSessionForEdit, setSelectedSessionForEdit] = useState<GroupSession | null>(null);
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [selectedGroupForPromotion, setSelectedGroupForPromotion] = useState<Group | null>(null);
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(groups[0]?.id || null);

  // Session Postponement & Reschedule Modal
  const [showPostponeModal, setShowPostponeModal] = useState(false);
  const [selectedSessionForPostpone, setSelectedSessionForPostpone] = useState<GroupSession | null>(null);
  const [postponeNewDate, setPostponeNewDate] = useState('');
  const [postponeNewStartTime, setPostponeNewStartTime] = useState('');
  const [postponeNewEndTime, setPostponeNewEndTime] = useState('');
  const [postponeReason, setPostponeReason] = useState('');
  const [shiftSubsequent, setShiftSubsequent] = useState(true);
  const [postponeSubmitting, setPostponeSubmitting] = useState(false);

  // Coach Assignment Workflow States
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineTargetGroup, setDeclineTargetGroup] = useState<Group | null>(null);
  const [declineReason, setDeclineReason] = useState('');
  const [declineSubmitting, setDeclineSubmitting] = useState(false);

  // Owner Reassign Coach States
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [reassignTargetGroup, setReassignTargetGroup] = useState<Group | null>(null);
  const [reassignOldCoachId, setReassignOldCoachId] = useState('');
  const [reassignNewCoachId, setReassignNewCoachId] = useState('');
  const [reassignSubmitting, setReassignSubmitting] = useState(false);

  // Toast Notification Banner
  const [feedbackBanner, setFeedbackBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showFeedback = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedbackBanner({ type, message });
    setTimeout(() => setFeedbackBanner(null), 4000);
  };

  // Filter states
  const [trackFilter, setTrackFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // New Group Form State
  const [track, setTrack] = useState('Arduino');
  const [customTrackInput, setCustomTrackInput] = useState('');
  const [isAddingNewTrack, setIsAddingNewTrack] = useState(false);
  const [level, setLevel] = useState<number>(1);
  const [groupDurationType, setGroupDurationType] = useState<'standard' | 'intensive' | 'calendar'>('standard');
  const [customCalendarDates, setCustomCalendarDates] = useState<{ date: string; startTime: string; endTime: string }[]>([
    { date: new Date().toISOString().split('T')[0], startTime: '10:00', endTime: '12:00' },
    { date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0], startTime: '10:00', endTime: '12:00' },
  ]);
  const [newCalendarDateInput, setNewCalendarDateInput] = useState(new Date().toISOString().split('T')[0]);
  const [dayOfWeek, setDayOfWeek] = useState('Saturday');
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('12:00');
  const [location, setLocation] = useState('Robotics Lab A');
  const [pricePerSession, setPricePerSession] = useState<number>(200);
  const [payrollSplitMode, setPayrollSplitMode] = useState<'split' | 'full_per_coach'>('full_per_coach');
  const [assignedCoachIds, setAssignedCoachIds] = useState<string[]>([]);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [enrolledStudentIds, setEnrolledStudentIds] = useState<string[]>([]);

  // Conflict Warning State
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Single Session Edit (Emergency Substitution) State
  const [sessionEditCoaches, setSessionEditCoaches] = useState<string[]>([]);
  const [sessionEditLocation, setSessionEditLocation] = useState('');
  const [sessionEditDate, setSessionEditDate] = useState('');
  const [sessionEditStartTime, setSessionEditStartTime] = useState('');
  const [sessionEditEndTime, setSessionEditEndTime] = useState('');
  const [substituteNotes, setSubstituteNotes] = useState('');

  // Promotion Form State
  const [promotionNextLevel, setPromotionNextLevel] = useState<number>(2);
  const [promotionStartDate, setPromotionStartDate] = useState('');
  const [promotionPrice, setPromotionPrice] = useState<number>(200);

  const daysOfWeek = [
    'Saturday',
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
  ];

  // Conflict check whenever coach selection or time slot changes
  const runConflictCheck = async (
    targetCoachIds: string[],
    targetDay: string,
    targetStart: string,
    targetEnd: string
  ) => {
    if (targetCoachIds.length === 0) {
      setConflictWarning(null);
      return;
    }
    const result = await checkConflict(targetCoachIds, targetDay, targetStart, targetEnd);
    if (result.hasConflict && result.conflicts.length > 0) {
      const names = result.conflicts
        .map((c: any) => `${c.coachName} (Clashes with ${c.conflictingGroupName})`)
        .join('; ');
      setConflictWarning(`${t.conflictWarning} ${names}`);
    } else {
      setConflictWarning(null);
    }
  };

  const handleCoachToggle = (coachId: string) => {
    let nextList: string[];
    if (assignedCoachIds.includes(coachId)) {
      nextList = assignedCoachIds.filter((id) => id !== coachId);
    } else {
      nextList = [...assignedCoachIds, coachId];
    }
    setAssignedCoachIds(nextList);
    runConflictCheck(nextList, dayOfWeek, startTime, endTime);
  };

  const handleDayOrTimeChange = (newDay: string, newStart: string, newEnd: string) => {
    setDayOfWeek(newDay);
    setStartTime(newStart);
    setEndTime(newEnd);
    runConflictCheck(assignedCoachIds, newDay, newStart, newEnd);
  };

  const handleCreateGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    let chosenTrack = track;
    if (isAddingNewTrack && customTrackInput.trim()) {
      chosenTrack = customTrackInput.trim();
      await addCustomTrack(chosenTrack);
    }

    if (assignedCoachIds.length === 0) {
      setFormError('Please select at least one coach for this group.');
      return;
    }

    const payload: any = {
      track: chosenTrack,
      level,
      dayOfWeek,
      startTime,
      endTime,
      location,
      pricePerSession,
      payrollSplitMode,
      assignedCoachIds,
      startDate,
      enrolledStudentIds,
    };

    if (groupDurationType === 'intensive') {
      payload.isCourseIntensive = true;
      payload.totalSessions = 2;
    } else if (groupDurationType === 'calendar') {
      if (customCalendarDates.length === 0) {
        setFormError('Please add at least one session date from the calendar.');
        return;
      }
      payload.customSessionDates = customCalendarDates;
      payload.totalSessions = customCalendarDates.length;
      payload.startDate = customCalendarDates[0].date;
    } else {
      payload.isCourseIntensive = false;
      payload.totalSessions = 4;
    }

    const res = await createGroup(payload);

    if (res.success) {
      setShowCreateModal(false);
      // Reset form
      setAssignedCoachIds([]);
      setEnrolledStudentIds([]);
      setConflictWarning(null);
      showFeedback('Group created successfully with scheduled sessions!', 'success');
    } else {
      setFormError(res.error || 'Failed to create group');
    }
  };

  // Open session postponement modal
  const openSessionPostpone = (session: GroupSession) => {
    setSelectedSessionForPostpone(session);
    setPostponeNewDate(session.date);
    setPostponeNewStartTime(session.startTime);
    setPostponeNewEndTime(session.endTime);
    setPostponeReason(session.postponeReason || '');
    setShiftSubsequent(true);
    setShowPostponeModal(true);
  };

  const handlePostponeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSessionForPostpone || !postponeNewDate) return;

    setPostponeSubmitting(true);
    const res = await postponeSession(selectedSessionForPostpone.id, {
      newDate: postponeNewDate,
      newStartTime: postponeNewStartTime || undefined,
      newEndTime: postponeNewEndTime || undefined,
      reason: postponeReason.trim() || undefined,
      shiftSubsequentSessions: shiftSubsequent,
    });
    setPostponeSubmitting(false);

    if (res.success) {
      setShowPostponeModal(false);
      setSelectedSessionForPostpone(null);
      showFeedback(t.postponeSuccess, 'success');
    } else {
      alert(res.error || 'Failed to reschedule session');
    }
  };

  // Open single session edit modal (emergency substitution)
  const openSessionEdit = (session: GroupSession) => {
    setSelectedSessionForEdit(session);
    setSessionEditCoaches([...session.assignedCoachIds]);
    setSessionEditLocation(session.location);
    setSessionEditDate(session.date);
    setSessionEditStartTime(session.startTime);
    setSessionEditEndTime(session.endTime);
    setSubstituteNotes(session.substituteNotes || '');
    setShowSessionEditModal(true);
  };

  const handleSaveSessionModification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSessionForEdit) return;

    await updateSession(selectedSessionForEdit.id, {
      assignedCoachIds: sessionEditCoaches,
      location: sessionEditLocation,
      date: sessionEditDate,
      startTime: sessionEditStartTime,
      endTime: sessionEditEndTime,
      substituteNotes: substituteNotes.trim() || undefined,
    });

    setShowSessionEditModal(false);
    setSelectedSessionForEdit(null);
  };

  // Open level promotion modal
  const openPromotion = (group: Group) => {
    setSelectedGroupForPromotion(group);
    setPromotionNextLevel(group.level + 1);
    setPromotionPrice(group.pricePerSession);

    // Calculate default next start date (7 days after session 4)
    const grpSessions = sessions
      .filter((s) => s.groupId === group.id)
      .sort((a, b) => b.sessionNumber - a.sessionNumber);
    if (grpSessions.length > 0) {
      const d = new Date(grpSessions[0].date);
      d.setDate(d.getDate() + 7);
      setPromotionStartDate(d.toISOString().split('T')[0]);
    } else {
      setPromotionStartDate(new Date().toISOString().split('T')[0]);
    }

    setShowPromotionModal(true);
  };

  const handlePromotionSubmit = async (action: 'continue' | 'finish') => {
    if (!selectedGroupForPromotion) return;
    await continueGroupLevel(selectedGroupForPromotion.id, action, {
      nextLevel: promotionNextLevel,
      nextStartDate: promotionStartDate,
      pricePerSession: promotionPrice,
    });
    setShowPromotionModal(false);
    setSelectedGroupForPromotion(null);
  };

  // Coach Assignment Workflow Handlers
  const handleAcceptAssignment = async (groupId: string) => {
    try {
      await respondToGroupAssignment(groupId, 'accepted');
      showFeedback(t.assignmentAcceptedSuccess || 'Group assignment accepted successfully!');
    } catch (err: any) {
      showFeedback(err.message || 'Error accepting assignment', 'error');
    }
  };

  const openDeclineModal = (group: Group) => {
    setDeclineTargetGroup(group);
    setDeclineReason('');
    setShowDeclineModal(true);
  };

  const handleDeclineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!declineTargetGroup) return;
    if (!declineReason.trim()) {
      showFeedback(t.rejectionReasonRequired || 'Please provide a reason for declining', 'error');
      return;
    }
    setDeclineSubmitting(true);
    try {
      await respondToGroupAssignment(declineTargetGroup.id, 'rejected', declineReason.trim());
      setShowDeclineModal(false);
      setDeclineTargetGroup(null);
      setDeclineReason('');
      showFeedback(t.assignmentDeclinedSuccess || 'Decline response and reason sent to owner.');
    } catch (err: any) {
      showFeedback(err.message || 'Error submitting response', 'error');
    } finally {
      setDeclineSubmitting(false);
    }
  };

  const openReassignModal = (group: Group, oldCoachId?: string) => {
    setReassignTargetGroup(group);
    setReassignOldCoachId(oldCoachId || group.assignedCoachIds[0] || '');
    const availableCoaches = coaches.filter(
      (c) => c.status === 'active' && !group.assignedCoachIds.includes(c.id)
    );
    setReassignNewCoachId(availableCoaches[0]?.id || '');
    setShowReassignModal(true);
  };

  const handleReassignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reassignTargetGroup || !reassignNewCoachId) return;
    setReassignSubmitting(true);
    try {
      await reassignGroupCoach(reassignTargetGroup.id, reassignOldCoachId, reassignNewCoachId);
      setShowReassignModal(false);
      setReassignTargetGroup(null);
      showFeedback(t.coachReassignedSuccess || 'Coach reassigned and notified successfully!');
    } catch (err: any) {
      showFeedback(err.message || 'Error reassigning coach', 'error');
    } finally {
      setReassignSubmitting(false);
    }
  };

  // Filter groups
  const filteredGroups = groups.filter((g) => {
    // Coach can only see their own groups
    if (!isOwner && !g.assignedCoachIds.includes(currentUser?.id || '')) {
      return false;
    }
    if (trackFilter !== 'all' && g.track !== trackFilter) return false;
    if (
      searchQuery &&
      !g.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !g.track.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div id="groups-management-view" className="space-y-6">
      {/* Toast Feedback Banner */}
      {feedbackBanner && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between gap-3 animate-fade-in ${
            feedbackBanner.type === 'success'
              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200'
              : 'bg-red-500/20 border-red-500/40 text-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackBanner.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400" />
            )}
            <span>{feedbackBanner.message}</span>
          </div>
          <button
            onClick={() => setFeedbackBanner(null)}
            className="text-white/60 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header with Title and Create Group Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <Layers className="w-6 h-6 text-[#BEF264]" />
            <span>{isOwner ? 'Robotics Groups & 4-Week Cycles' : 'My Assigned Robotics Groups'}</span>
          </h2>
          <p className="text-xs sm:text-sm text-white/50 mt-1">
            {isOwner
              ? 'Manage group schedules, multiple coach assignments, emergency session substitutions, and level progressions.'
              : 'View your weekly group time slots, lab locations, and individual session schedules.'}
          </p>
        </div>

        {isOwner && (
          <button
            id="open-create-group-modal-btn"
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 rounded-xl bg-[#BEF264] hover:bg-[#aee64a] text-[#050B1A] font-black text-xs shadow-lg shadow-[#BEF264]/20 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>{t.createGroup}</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-sm">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-white/40">{t.filterByTrack}:</span>
          <select
            value={trackFilter}
            onChange={(e) => setTrackFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 text-xs font-semibold text-white focus:outline-none focus:ring-1 focus:ring-[#BEF264]"
          >
            <option value="all" className="bg-[#070E20]">{t.allTracks}</option>
            {customTracks.map((tr) => (
              <option key={tr} value={tr} className="bg-[#070E20]">
                {tr}
              </option>
            ))}
          </select>
        </div>

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search groups by track or name..."
          className="w-full sm:w-72 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 text-white placeholder-white/30 text-xs focus:outline-none focus:ring-1 focus:ring-[#BEF264]"
        />
      </div>

      {/* Groups List Accordions */}
      <div className="space-y-4">
        {filteredGroups.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md space-y-2">
            <Layers className="w-10 h-10 text-white/30 mx-auto opacity-50" />
            <p className="text-sm font-bold text-white/60">
              {t.noDataFound}
            </p>
            {isOwner && (
              <p className="text-xs text-white/40">
                Click "{t.createGroup}" to initialize your first 4-week robotics track group.
              </p>
            )}
          </div>
        ) : (
          filteredGroups.map((group) => {
            const isExpanded = expandedGroupId === group.id;
            const groupSessionsList = sessions
              .filter((s) => s.groupId === group.id)
              .sort((a, b) => a.sessionNumber - b.sessionNumber);

            const groupCoaches = coaches.filter((c) => group.assignedCoachIds.includes(c.id));
            const groupStudents = students.filter((s) => group.enrolledStudentIds.includes(s.id));
            const completedCount = groupSessionsList.filter((s) => s.isCompleted).length;
            const isAll4SessionsCompleted = completedCount === 4;

            return (
              <div
                key={group.id}
                className="rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md shadow-sm overflow-hidden transition-all duration-200"
              >
                {/* Group Header Row */}
                <div
                  onClick={() => setExpandedGroupId(isExpanded ? null : group.id)}
                  className="p-5 cursor-pointer hover:bg-white/5 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-1 rounded-xl bg-[#BEF264] text-[#050B1A] font-black text-xs">
                        {group.track} • Level {group.level}
                      </span>

                      <span className="px-2.5 py-1 rounded-xl bg-white/10 text-white/80 border border-white/10 font-bold text-xs flex items-center gap-1">
                        <Clock className="w-3 h-3 text-white/40" />
                        <span>
                          {t[group.dayOfWeek as keyof typeof t] || group.dayOfWeek} {group.startTime} - {group.endTime} (2 hrs)
                        </span>
                      </span>

                      <span className="px-2.5 py-1 rounded-xl bg-white/10 text-white/80 border border-white/10 font-bold text-xs flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-white/40" />
                        <span>{group.location}</span>
                      </span>

                      {group.status === 'completed' && (
                        <span className="px-2.5 py-1 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold text-xs">
                          {t.statusCompleted}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base sm:text-lg font-black text-white">
                      {group.name}
                    </h3>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-white/50">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-white/80">
                          {t.assignedCoaches}:{' '}
                        </span>
                        {groupCoaches.length === 0 ? (
                          <span className="text-white/40 italic">None assigned</span>
                        ) : (
                          groupCoaches.map((c) => {
                            const assignInfo = group.coachAssignments?.[c.id];
                            const status = assignInfo?.status || 'pending';
                            return (
                              <span
                                key={c.id}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold border ${
                                  status === 'accepted'
                                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                                    : status === 'rejected'
                                    ? 'bg-red-500/15 border-red-500/30 text-red-400'
                                    : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                                }`}
                              >
                                {status === 'accepted' && <CheckCircle className="w-3 h-3 text-emerald-400" />}
                                {status === 'rejected' && <XCircle className="w-3 h-3 text-red-400" />}
                                {status === 'pending' && <Clock className="w-3 h-3 text-amber-400" />}
                                <span>{c.name}</span>
                                <span className="text-[10px] opacity-75">
                                  ({status === 'accepted' ? t.coachStatusAccepted : status === 'rejected' ? t.coachStatusDeclined : t.coachStatusPending})
                                </span>
                              </span>
                            );
                          })
                        )}
                      </div>
                      <div>
                        <span className="font-bold text-white/80">
                          {t.enrolledStudents}:{' '}
                        </span>
                        {groupStudents.length} students
                      </div>
                      <div>
                        <span className="font-bold text-white/80">
                          {t.pricePerSession}:{' '}
                        </span>
                        <span className="text-[#BEF264] font-black">
                          {group.pricePerSession} EGP
                        </span>
                      </div>
                    </div>

                    {/* Alert if any coach rejected this group */}
                    {(Object.entries(group.coachAssignments || {}) as [string, CoachAssignmentInfo][]).some(([_, a]) => a.status === 'rejected') && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs text-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-2"
                      >
                        <div className="flex items-start gap-2.5">
                          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                          <div>
                            <div className="font-bold text-red-300">
                              {(Object.entries(group.coachAssignments || {}) as [string, CoachAssignmentInfo][])
                                .filter(([_, a]) => a && a.status === 'rejected')
                                .map(([cid, a]) => {
                                  const coach = coaches.find((c) => c.id === cid);
                                  const name = coach?.name || a.coachName || cid;
                                  const template = t.coachDeclinedAssignment || t.coachDeclinedAlert || 'Coach {coachName} declined this group:';
                                  return template.replace('{coachName}', name);
                                })
                                .join('; ')}
                            </div>
                            <div className="text-white/80 mt-0.5 text-[11px] italic">
                              "{t.rejectionReasonLabel}: {(Object.entries(group.coachAssignments || {}) as [string, CoachAssignmentInfo][])
                                .filter(([_, a]) => a.status === 'rejected')
                                .map(([_, a]) => a.rejectionReason || t.noRejectionReason)
                                .join('; ')}"
                            </div>
                          </div>
                        </div>

                        {isOwner && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const rejEntry = (Object.entries(group.coachAssignments || {}) as [string, CoachAssignmentInfo][]).find(([_, a]) => a.status === 'rejected');
                              openReassignModal(group, rejEntry ? rejEntry[0] : undefined);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-100 font-black text-xs flex items-center gap-1.5 shrink-0 transition-all shadow-sm"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>{t.reassignCoachBtn}</span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* If logged-in coach has a pending assignment for this group, show immediate action prompt */}
                    {!isOwner && currentUser && group.assignedCoachIds.includes(currentUser.id) && group.coachAssignments?.[currentUser.id]?.status === 'pending' && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="p-3.5 rounded-2xl bg-[#BEF264]/10 border border-[#BEF264]/30 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-2 shadow-md"
                      >
                        <div className="flex items-center gap-2.5 text-white">
                          <Sparkles className="w-4 h-4 text-[#BEF264] shrink-0" />
                          <div>
                            <div className="font-bold text-[#BEF264]">{t.groupAssignmentRequest}</div>
                            <div className="text-white/70 text-[11px]">{t.assignedToGroupPrompt}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAcceptAssignment(group.id);
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-[#BEF264] hover:bg-[#aee64a] text-[#050B1A] font-black text-xs shadow-md transition-all flex items-center gap-1"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>{t.acceptAssignment}</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openDeclineModal(group);
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-200 font-bold text-xs transition-all flex items-center gap-1"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>{t.declineAssignment}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Progress & Promotion Action */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right hidden sm:block">
                      <div className="text-xs font-bold text-white">
                        {completedCount} / 4 Sessions
                      </div>
                      <div className="w-24 h-2 rounded-full bg-white/10 mt-1 overflow-hidden">
                        <div
                          className="h-full bg-[#BEF264] rounded-full"
                          style={{ width: `${(completedCount / 4) * 100}%` }}
                        />
                      </div>
                    </div>

                    {isOwner && (
                      <div className="flex items-center gap-1.5">
                        {isAll4SessionsCompleted && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openPromotion(group);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-[#BEF264] hover:bg-[#aee64a] text-[#050B1A] text-xs font-black shadow-md flex items-center gap-1"
                            title="Decide whether to promote this group to next level"
                          >
                            <TrendingUp className="w-3.5 h-3.5" />
                            <span>Promote Level {group.level + 1}</span>
                          </button>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Delete group "${group.name}" and all its sessions?`)) {
                              deleteGroup(group.id);
                            }
                          }}
                          className="p-2 rounded-xl text-red-400 hover:bg-red-500/20 transition-colors"
                          title="Delete Group"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    <div className="p-1 text-white/40">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Section: 4-Week Sessions List & Emergency Substitution */}
                {isExpanded && (
                  <div className="border-t border-white/10 p-5 bg-white/[0.02] space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-black uppercase tracking-wider text-white/40 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[#BEF264]" />
                        <span>4-Week Session Breakdown (One Level Cycle)</span>
                      </div>
                      <span className="text-[11px] text-white/40 font-medium">
                        * Click "Edit Session" to assign substitute coach for emergency coverage.
                      </span>
                    </div>

                    {/* 4 Sessions Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {groupSessionsList.map((sess) => {
                        const sessCoaches = coaches.filter((c) =>
                          sess.assignedCoachIds.includes(c.id)
                        );
                        const isSubstituteUsed = sess.substituteNotes || sess.assignedCoachIds.some((id) => !group.assignedCoachIds.includes(id));

                        return (
                          <div
                            key={sess.id}
                            className={`p-4 rounded-2xl border transition-all ${
                              sess.isCompleted
                                ? 'bg-[#BEF264]/10 border-[#BEF264]/30'
                                : sess.isPostponed
                                ? 'bg-amber-500/10 border-amber-500/30'
                                : 'bg-white/5 border-white/10'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className="px-2 py-0.5 rounded-md bg-[#BEF264] text-[#050B1A] text-[11px] font-black">
                                    {t.sessionNum.replace('{num}', String(sess.sessionNumber))}
                                  </span>
                                  <span className="text-xs font-bold text-white">
                                    {sess.date}
                                  </span>
                                  {sess.isCompleted && (
                                    <span className="text-[10px] font-bold text-[#BEF264] flex items-center gap-0.5">
                                      <CheckCircle2 className="w-3 h-3" />
                                      {t.isCompleted}
                                    </span>
                                  )}
                                  {sess.isPostponed && (
                                    <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                                      {t.isPostponedBadge}
                                    </span>
                                  )}
                                </div>

                                <div className="text-xs text-white/70 font-medium">
                                  {sess.startTime} - {sess.endTime} ({sess.location})
                                </div>

                                <div className="text-xs text-white/80 pt-1">
                                  <span className="font-bold text-white/40">Coaches: </span>
                                  {sessCoaches.map((c) => c.name).join(', ')}
                                </div>

                                {sess.isPostponed && sess.postponeReason && (
                                  <div className="p-2 mt-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300">
                                    <span className="font-bold">{t.postponeReason}: </span>
                                    {sess.postponeReason}
                                    {sess.originalDate && (
                                      <div className="text-[10px] text-amber-300/70">
                                        Original date: {sess.originalDate}
                                      </div>
                                    )}
                                  </div>
                                )}

                                {isSubstituteUsed && (
                                  <div className="p-2 mt-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-300">
                                    <span className="font-bold">Substitute Note: </span>
                                    {sess.substituteNotes || 'Emergency substitution active'}
                                  </div>
                                )}
                              </div>

                              <div className="flex flex-col gap-1 shrink-0">
                                {!sess.isCompleted && (
                                  <button
                                    onClick={() => openSessionPostpone(sess)}
                                    className="px-2.5 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs font-bold hover:bg-amber-500/20 transition-colors flex items-center gap-1"
                                    title={t.postponeSession}
                                  >
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>{t.postponeSession}</span>
                                  </button>
                                )}

                                {isOwner && (
                                  <button
                                    onClick={() => openSessionEdit(sess)}
                                    className="px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/5 text-white text-xs font-bold hover:border-[#BEF264] transition-colors"
                                    title="Edit coach for this session only"
                                  >
                                    <Edit className="w-3.5 h-3.5 inline mr-1 text-[#BEF264]" />
                                    Edit
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Enrolled Students Chips */}
                    <div className="pt-2">
                      <div className="text-xs font-bold text-white/40 mb-2">
                        {t.enrolledStudents} ({groupStudents.length})
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {groupStudents.map((st) => (
                          <span
                            key={st.id}
                            className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white text-xs font-semibold"
                          >
                            {st.name} ({st.age} yrs)
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* MODAL 1: CREATE NEW GROUP */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050B1A]/85 backdrop-blur-xl animate-fade-in">
          <div className="relative w-full max-w-2xl rounded-3xl bg-[#070E20]/95 backdrop-blur-2xl border border-white/15 shadow-2xl overflow-hidden p-6 sm:p-8 max-h-[90vh] overflow-y-auto text-white">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#BEF264]" />
                <h3 className="text-lg font-black text-white">
                  {t.createGroup}
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-white/40 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateGroupSubmit} className="space-y-4 pt-4">
              {/* Conflict Warning Banner */}
              {conflictWarning && (
                <div className="p-3.5 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="font-semibold">{conflictWarning}</span>
                </div>
              )}

              {formError && (
                <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-semibold">
                  {formError}
                </div>
              )}

              {/* Track & Level */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-white/80 mb-1.5">
                    {t.track}
                  </label>
                  {!isAddingNewTrack ? (
                    <div className="space-y-1.5">
                      <select
                        value={track}
                        onChange={(e) => {
                          if (e.target.value === 'custom_new') {
                            setIsAddingNewTrack(true);
                          } else {
                            setTrack(e.target.value);
                          }
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-xs font-semibold text-white focus:outline-none focus:ring-1 focus:ring-[#BEF264]"
                      >
                        {customTracks.map((tr) => (
                          <option key={tr} value={tr} className="bg-[#070E20]">
                            {tr}
                          </option>
                        ))}
                        <option value="custom_new" className="bg-[#070E20]">+ Add Custom Track...</option>
                      </select>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customTrackInput}
                        onChange={(e) => setCustomTrackInput(e.target.value)}
                        placeholder="e.g. Raspberry Pi Robotics"
                        required
                        className="flex-1 px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white placeholder-white/30 text-xs focus:outline-none focus:ring-1 focus:ring-[#BEF264]"
                      />
                      <button
                        type="button"
                        onClick={() => setIsAddingNewTrack(false)}
                        className="px-2.5 py-1 rounded-xl bg-white/10 text-xs font-bold text-white"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/80 mb-1.5">
                    {t.level} (Manual Number)
                  </label>
                  <input
                    type="number"
                    value={level}
                    onChange={(e) => setLevel(Number(e.target.value))}
                    min="1"
                    max="20"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white text-xs font-bold focus:outline-none focus:ring-1 focus:ring-[#BEF264]"
                  />
                </div>
              </div>

              {/* Group Duration Type (Standard 4 sessions vs Intensive 2 sessions vs Interactive Calendar) */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-white/80">
                  {t.groupType}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setGroupDurationType('standard')}
                    className={`p-3 rounded-2xl border text-xs font-bold transition-all text-left flex flex-col justify-between gap-1 ${
                      groupDurationType === 'standard'
                        ? 'bg-[#BEF264]/20 border-[#BEF264] text-[#BEF264] shadow-md shadow-[#BEF264]/10'
                        : 'bg-white/5 border-white/10 text-white/70 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>{t.typeStandard}</span>
                      {groupDurationType === 'standard' && <CheckCircle2 className="w-3.5 h-3.5 text-[#BEF264]" />}
                    </div>
                    <span className="text-[10px] text-white/50 font-normal">4 Sessions • 1 Month</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGroupDurationType('intensive')}
                    className={`p-3 rounded-2xl border text-xs font-bold transition-all text-left flex flex-col justify-between gap-1 ${
                      groupDurationType === 'intensive'
                        ? 'bg-[#BEF264]/20 border-[#BEF264] text-[#BEF264] shadow-md shadow-[#BEF264]/10'
                        : 'bg-white/5 border-white/10 text-white/70 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>{t.typeIntensive}</span>
                      {groupDurationType === 'intensive' && <CheckCircle2 className="w-3.5 h-3.5 text-[#BEF264]" />}
                    </div>
                    <span className="text-[10px] text-white/50 font-normal">2 Sessions • Fast Track</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGroupDurationType('calendar')}
                    className={`p-3 rounded-2xl border text-xs font-bold transition-all text-left flex flex-col justify-between gap-1 ${
                      groupDurationType === 'calendar'
                        ? 'bg-[#BEF264]/20 border-[#BEF264] text-[#BEF264] shadow-md shadow-[#BEF264]/10'
                        : 'bg-white/5 border-white/10 text-white/70 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>{t.typeCustomDates}</span>
                      {groupDurationType === 'calendar' && <CheckCircle2 className="w-3.5 h-3.5 text-[#BEF264]" />}
                    </div>
                    <span className="text-[10px] text-white/50 font-normal">{t.pickDatesFromCalendar}</span>
                  </button>
                </div>
              </div>

              {/* If Interactive Calendar Picker is chosen, display session dates builder */}
              {groupDurationType === 'calendar' ? (
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-[#BEF264]" />
                      {t.pickDatesFromCalendar} ({customCalendarDates.length} sessions)
                    </span>
                  </div>

                  {/* Add date row */}
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="date"
                      value={newCalendarDateInput}
                      onChange={(e) => setNewCalendarDateInput(e.target.value)}
                      className="px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 text-white text-xs focus:outline-none focus:ring-1 focus:ring-[#BEF264]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!newCalendarDateInput) return;
                        if (customCalendarDates.some((d) => d.date === newCalendarDateInput)) return;
                        setCustomCalendarDates([
                          ...customCalendarDates,
                          { date: newCalendarDateInput, startTime, endTime },
                        ].sort((a, b) => a.date.localeCompare(b.date)));
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#BEF264] hover:bg-[#aee64a] text-[#050B1A] font-black text-xs flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Date
                    </button>
                  </div>

                  {/* List of chosen dates */}
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {customCalendarDates.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-[#BEF264] text-[#050B1A] font-black flex items-center justify-center text-[10px]">
                            {idx + 1}
                          </span>
                          <span className="font-bold text-white">{item.date}</span>
                          <span className="text-white/50 text-[11px]">({item.startTime} - {item.endTime})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setCustomCalendarDates(customCalendarDates.filter((_, i) => i !== idx))}
                          className="text-red-400 hover:text-red-300 p-1"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Weekly Time Slot for Standard / Intensive */
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-white/80 mb-1.5">
                      {t.weeklySlot}
                    </label>
                    <select
                      value={dayOfWeek}
                      onChange={(e) => handleDayOrTimeChange(e.target.value, startTime, endTime)}
                      className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-xs font-semibold text-white focus:outline-none focus:ring-1 focus:ring-[#BEF264]"
                    >
                      {daysOfWeek.map((day) => (
                        <option key={day} value={day} className="bg-[#070E20]">
                          {t[day as keyof typeof t] || day}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-white/80 mb-1.5">
                      {t.startTime}
                    </label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => handleDayOrTimeChange(dayOfWeek, e.target.value, endTime)}
                      required
                      className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white text-xs font-bold focus:outline-none focus:ring-1 focus:ring-[#BEF264]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-white/80 mb-1.5">
                      {t.endTime} (2 Hours)
                    </label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => handleDayOrTimeChange(dayOfWeek, startTime, e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white text-xs font-bold focus:outline-none focus:ring-1 focus:ring-[#BEF264]"
                    />
                  </div>
                </div>
              )}

              {/* Room Location & Price Per Session */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-white/80 mb-1.5">
                    {t.locationRoom}
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Lab A - Robotics Hub"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white placeholder-white/30 text-xs focus:outline-none focus:ring-1 focus:ring-[#BEF264]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/80 mb-1.5">
                    {t.pricePerSession}
                  </label>
                  <input
                    type="number"
                    value={pricePerSession}
                    onChange={(e) => setPricePerSession(Number(e.target.value))}
                    min="50"
                    step="10"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white text-xs font-bold focus:outline-none focus:ring-1 focus:ring-[#BEF264]"
                  />
                </div>
              </div>

              {/* Multi-Coach Assignment with Double-Booking Conflict Alert */}
              <div>
                <label className="block text-xs font-bold text-white/80 mb-1.5">
                  {t.assignedCoaches} <span className="text-white/40 font-normal">({t.selectCoaches})</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 rounded-2xl border border-white/10 bg-white/5">
                  {coaches
                    .filter((c) => c.status === 'active')
                    .map((coach) => {
                      const isSelected = assignedCoachIds.includes(coach.id);
                      return (
                        <div
                          key={coach.id}
                          onClick={() => handleCoachToggle(coach.id)}
                          className={`p-2.5 rounded-xl border cursor-pointer flex items-center justify-between text-xs transition-colors ${
                            isSelected
                              ? 'bg-[#BEF264]/20 border-[#BEF264] text-[#BEF264] font-bold'
                              : 'border-white/10 bg-white/5 text-white/70 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <UserCheck className="w-3.5 h-3.5 text-[#BEF264]" />
                            <span>{coach.name}</span>
                          </div>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-[#BEF264]" />}
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Start Date & 4-Week Progression Notice */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-white/80 mb-1.5">
                    {t.startDate}
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white text-xs focus:outline-none focus:ring-1 focus:ring-[#BEF264]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/80 mb-1.5">
                    {t.payrollSplitRule}
                  </label>
                  <select
                    value={payrollSplitMode}
                    onChange={(e) => setPayrollSplitMode(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#BEF264]"
                  >
                    <option value="full_per_coach" className="bg-[#070E20]">{t.payFullToEach}</option>
                    <option value="split" className="bg-[#070E20]">{t.paySplitEvenly}</option>
                  </select>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-[#BEF264]/10 border border-[#BEF264]/20 text-xs text-[#BEF264] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#BEF264] shrink-0" />
                <span>{t.cycleInfo}</span>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-white/10 text-xs font-semibold text-white/70 hover:text-white"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#BEF264] hover:bg-[#aee64a] text-[#050B1A] font-black text-xs shadow-lg shadow-[#BEF264]/20 transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t.createGroup}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: SINGLE SESSION EDIT */}
      {showSessionEditModal && selectedSessionForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050B1A]/85 backdrop-blur-xl animate-fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-[#070E20]/95 backdrop-blur-2xl border border-white/15 shadow-2xl overflow-hidden p-6 sm:p-8 text-white">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="space-y-0.5">
                <h3 className="text-base font-black text-white">
                  {t.emergencySubTitle}
                </h3>
                <p className="text-xs text-white/50">{t.emergencySubDesc}</p>
              </div>
              <button
                onClick={() => setShowSessionEditModal(false)}
                className="p-1 rounded-lg text-white/40 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSessionModification} className="space-y-4 pt-4">
              <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-xs space-y-1">
                <div className="font-bold text-[#BEF264]">
                  {selectedSessionForEdit.groupName}
                </div>
                <div className="text-white/50">
                  Editing: Session {selectedSessionForEdit.sessionNumber} on {selectedSessionForEdit.date}
                </div>
              </div>

              {/* Assigned Coaches for this specific session */}
              <div>
                <label className="block text-xs font-bold text-white/80 mb-1.5">
                  Assigned Coach(es) for this session only:
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 rounded-xl border border-white/10 bg-white/5">
                  {coaches
                    .filter((c) => c.status === 'active')
                    .map((coach) => {
                      const isSelected = sessionEditCoaches.includes(coach.id);
                      return (
                        <button
                          key={coach.id}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setSessionEditCoaches(sessionEditCoaches.filter((id) => id !== coach.id));
                            } else {
                              setSessionEditCoaches([...sessionEditCoaches, coach.id]);
                            }
                          }}
                          className={`p-2 rounded-xl border text-xs font-semibold text-left transition-colors ${
                            isSelected
                              ? 'bg-[#BEF264]/20 border-[#BEF264] text-[#BEF264]'
                              : 'border-white/10 bg-white/5 text-white/60 hover:text-white'
                          }`}
                        >
                          {coach.name}
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Location Override */}
              <div>
                <label className="block text-xs font-bold text-white/80 mb-1">
                  Location / Room
                </label>
                <input
                  type="text"
                  value={sessionEditLocation}
                  onChange={(e) => setSessionEditLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white text-xs focus:outline-none focus:ring-1 focus:ring-[#BEF264]"
                />
              </div>

              {/* Substitution Notes */}
              <div>
                <label className="block text-xs font-bold text-white/80 mb-1">
                  {t.substitutionNotes}
                </label>
                <textarea
                  value={substituteNotes}
                  onChange={(e) => setSubstituteNotes(e.target.value)}
                  placeholder="e.g. Lead coach emergency leave; substitute coach assigned for Session 2."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white placeholder-white/30 text-xs focus:outline-none focus:ring-1 focus:ring-[#BEF264]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSessionEditModal(false)}
                  className="px-4 py-2 rounded-xl border border-white/10 text-white/70 text-xs font-semibold"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 rounded-xl bg-[#BEF264] hover:bg-[#aee64a] text-[#050B1A] font-black text-xs shadow-lg shadow-[#BEF264]/20 transition-all"
                >
                  {t.saveSessionChanges}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: 4-WEEK LEVEL PROMOTION */}
      {showPromotionModal && selectedGroupForPromotion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050B1A]/85 backdrop-blur-xl animate-fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-[#070E20]/95 backdrop-blur-2xl border border-white/15 shadow-2xl overflow-hidden p-6 sm:p-8 text-white">
            <div className="flex items-center gap-3 pb-4 border-b border-white/10">
              <div className="p-2.5 rounded-2xl bg-[#BEF264] text-[#050B1A] font-black">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">
                  {t.groupPromotionTitle}
                </h3>
                <p className="text-xs text-white/50">{selectedGroupForPromotion.name}</p>
              </div>
            </div>

            <div className="space-y-4 pt-4 text-xs">
              <p className="text-white/80 leading-relaxed font-medium">
                {t.groupPromotionPrompt
                  .replace('{level}', String(selectedGroupForPromotion.level))
                  .replace('{nextLevel}', String(promotionNextLevel))}
              </p>

              <div className="p-3.5 rounded-2xl bg-[#BEF264]/10 border border-[#BEF264]/20 text-[#BEF264] space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#BEF264]" />
                  <span>Automatic Level Roll-over</span>
                </div>
                <p className="text-[11px] leading-relaxed text-white/80">
                  {t.keepStudentsAndCoaches.replace(
                    '{count}',
                    String(selectedGroupForPromotion.enrolledStudentIds.length)
                  )}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-white/80 mb-1">
                    Promote to Level:
                  </label>
                  <input
                    type="number"
                    value={promotionNextLevel}
                    onChange={(e) => setPromotionNextLevel(Number(e.target.value))}
                    min={selectedGroupForPromotion.level + 1}
                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white font-bold focus:outline-none focus:ring-1 focus:ring-[#BEF264]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-white/80 mb-1">
                    Next Cycle Start Date:
                  </label>
                  <input
                    type="date"
                    value={promotionStartDate}
                    onChange={(e) => setPromotionStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:ring-1 focus:ring-[#BEF264]"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={() => handlePromotionSubmit('continue')}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#BEF264] hover:bg-[#aee64a] text-[#050B1A] font-black text-xs shadow-lg shadow-[#BEF264]/20 transition-all flex items-center justify-center gap-2"
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>
                    {t.continueToNextLevel.replace('{nextLevel}', String(promotionNextLevel))}
                  </span>
                </button>

                <button
                  onClick={() => handlePromotionSubmit('finish')}
                  className="w-full py-2 px-4 rounded-xl border border-white/10 text-white/70 font-semibold text-xs hover:bg-white/10"
                >
                  {t.completeAndArchive}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: COACH DECLINE ASSIGNMENT WITH REASON */}
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

      {/* MODAL 5: OWNER REASSIGN REPLACEMENT COACH */}
      {showReassignModal && reassignTargetGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050B1A]/85 backdrop-blur-xl animate-fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-[#070E20]/95 backdrop-blur-2xl border border-white/15 shadow-2xl overflow-hidden p-6 sm:p-8 text-white">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-[#BEF264] text-[#050B1A] font-black">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    {t.reassignCoachTitle}
                  </h3>
                  <p className="text-xs text-white/50">{reassignTargetGroup.name}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowReassignModal(false);
                  setReassignTargetGroup(null);
                }}
                className="p-1 rounded-lg text-white/40 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleReassignSubmit} className="space-y-4 pt-4 text-xs">
              <p className="text-white/70 leading-relaxed">
                {(t.reassignCoachPrompt || 'Select an available replacement coach for {groupName}.').replace('{groupName}', reassignTargetGroup.name)}
              </p>

              {/* Show who declined and their reason if available */}
              {reassignTargetGroup.coachAssignments?.[reassignOldCoachId] && (
                <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 space-y-1">
                  <div className="font-bold text-red-300">
                    Declined by: {reassignTargetGroup.coachAssignments[reassignOldCoachId].coachName || reassignOldCoachId}
                  </div>
                  <div className="text-[11px] text-white/80 italic">
                    Reason: "{reassignTargetGroup.coachAssignments[reassignOldCoachId].rejectionReason || 'No specific reason provided'}"
                  </div>
                </div>
              )}

              {/* Choose New Coach */}
              <div>
                <label className="block font-bold text-white/80 mb-1.5">
                  {t.selectReplacementCoach}:
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {coaches
                    .filter((c) => c.status === 'active' && c.id !== reassignOldCoachId)
                    .map((coach) => {
                      const isSelected = reassignNewCoachId === coach.id;
                      const isAvailableOnDay = coach.availableDays?.includes(reassignTargetGroup.dayOfWeek);

                      return (
                        <div
                          key={coach.id}
                          onClick={() => setReassignNewCoachId(coach.id)}
                          className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                            isSelected
                              ? 'bg-[#BEF264]/15 border-[#BEF264] text-white'
                              : 'bg-white/5 border-white/10 text-white/70 hover:text-white'
                          }`}
                        >
                          <div className="space-y-0.5">
                            <div className="font-bold text-white flex items-center gap-2">
                              <span>{coach.name}</span>
                              {isAvailableOnDay && (
                                <span className="px-2 py-0.5 rounded-md bg-[#BEF264]/20 text-[#BEF264] text-[10px] font-bold">
                                  Available {reassignTargetGroup.dayOfWeek}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-white/50">
                              {coach.specialization?.join(', ') || 'Robotics Coach'} • Phone: {coach.phone}
                            </div>
                          </div>

                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                              isSelected
                                ? 'bg-[#BEF264] border-[#BEF264] text-[#050B1A]'
                                : 'border-white/20 bg-white/5'
                            }`}
                          >
                            {isSelected && <CheckCircle className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowReassignModal(false);
                    setReassignTargetGroup(null);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-white/10 text-white/70 text-xs font-semibold hover:bg-white/5"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={!reassignNewCoachId || reassignSubmitting}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#BEF264] hover:bg-[#aee64a] text-[#050B1A] font-black text-xs shadow-lg shadow-[#BEF264]/20 transition-all flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>{reassignSubmitting ? '...' : t.confirmReassign}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: CANCEL & POSTPONE SESSION (إلغاء وترحيل الجلسة) */}
      {showPostponeModal && selectedSessionForPostpone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050B1A]/85 backdrop-blur-xl animate-fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-[#070E20]/95 backdrop-blur-2xl border border-amber-500/30 shadow-2xl overflow-hidden p-6 sm:p-8 text-white">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-300">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    {t.postponeSession}
                  </h3>
                  <p className="text-xs text-white/50">{selectedSessionForPostpone.groupName} - Session {selectedSessionForPostpone.sessionNumber}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowPostponeModal(false);
                  setSelectedSessionForPostpone(null);
                }}
                className="p-1 rounded-lg text-white/40 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePostponeSubmit} className="space-y-4 pt-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <div className="text-white/50 text-[11px]">Current Scheduled Date:</div>
                <div className="font-bold text-white flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-amber-300" />
                  <span>{selectedSessionForPostpone.date} ({selectedSessionForPostpone.startTime} - {selectedSessionForPostpone.endTime})</span>
                </div>
              </div>

              {/* New Date & Times */}
              <div className="space-y-3">
                <div>
                  <label className="block font-bold text-white/90 mb-1">
                    {t.newDate} <span className="text-amber-300">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={postponeNewDate}
                    onChange={(e) => setPostponeNewDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white text-xs focus:outline-none focus:ring-1 focus:ring-amber-300"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-white/80 mb-1">{t.startTime}</label>
                    <input
                      type="time"
                      value={postponeNewStartTime}
                      onChange={(e) => setPostponeNewStartTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white text-xs focus:outline-none focus:ring-1 focus:ring-amber-300"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-white/80 mb-1">{t.endTime}</label>
                    <input
                      type="time"
                      value={postponeNewEndTime}
                      onChange={(e) => setPostponeNewEndTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white text-xs focus:outline-none focus:ring-1 focus:ring-amber-300"
                    />
                  </div>
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block font-bold text-white/80 mb-1">
                  {t.postponeReason} ({t.reasonOptional})
                </label>
                <input
                  type="text"
                  value={postponeReason}
                  onChange={(e) => setPostponeReason(e.target.value)}
                  placeholder="e.g. Official holiday / Maintenance / Coach requested"
                  className="w-full px-3.5 py-2 rounded-xl border border-white/10 bg-white/5 text-white placeholder-white/30 text-xs focus:outline-none focus:ring-1 focus:ring-amber-300"
                />
              </div>

              {/* Shift subsequent sessions checkbox */}
              <label className="flex items-start gap-2.5 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 cursor-pointer">
                <input
                  type="checkbox"
                  checked={shiftSubsequent}
                  onChange={(e) => setShiftSubsequent(e.target.checked)}
                  className="mt-0.5 rounded text-amber-400 focus:ring-amber-400"
                />
                <div className="space-y-0.5">
                  <div className="font-bold text-amber-200">{t.shiftSubsequentSessions}</div>
                  <div className="text-[11px] text-amber-200/70">{t.shiftSubsequentSessionsDesc}</div>
                </div>
              </label>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPostponeModal(false);
                    setSelectedSessionForPostpone(null);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-white/10 text-white/70 text-xs font-semibold hover:bg-white/5"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={postponeSubmitting}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#050B1A] font-black text-xs shadow-lg shadow-amber-400/20 transition-all flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  <Clock className="w-4 h-4" />
                  <span>{postponeSubmitting ? '...' : t.confirmPostpone}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
