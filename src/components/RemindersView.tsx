import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  BellRing,
  Send,
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

export const RemindersView: React.FC = () => {
  const {
    role,
    currentUser,
    t,
    language,
    sessions,
    groups,
    coaches,
    students,
    notifications,
    sendSessionReminder,
    sendCustomNotification,
  } = useApp();

  const isOwner = role === 'admin';

  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [customMsg, setCustomMsg] = useState('');
  const [targetAudience, setTargetAudience] = useState<'all' | 'coaches' | 'students'>('all');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Upcoming sessions within next 7 days
  const upcomingSessions = sessions
    .filter((s) => {
      if (!isOwner && !s.assignedCoachIds.includes(currentUser?.id || '')) {
        return false;
      }
      return !s.isCompleted;
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  const handleSendSessionReminder = (sessionId: string) => {
    sendSessionReminder(sessionId);
    setActionSuccess('Session reminder broadcast sent successfully to Coaches & Parents via in-app & WhatsApp template!');
    setTimeout(() => setActionSuccess(null), 4000);
  };

  const handleSendCustomBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle || !customMsg) return;

    sendCustomNotification({
      title: customTitle,
      message: customMsg,
      type: 'general',
      targetRoles: targetAudience === 'all' ? ['admin', 'coach'] : [targetAudience as any],
    });

    setCustomTitle('');
    setCustomMsg('');
    setActionSuccess('Academy broadcast published to all selected recipients!');
    setTimeout(() => setActionSuccess(null), 4000);
  };

  return (
    <div id="reminders-view" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <BellRing className="w-6 h-6 text-[#BEF264]" />
            <span>{t.navReminders} & Broadcasts</span>
          </h2>
          <p className="text-xs sm:text-sm text-white/50 mt-1">
            Automated session reminders for coaches and parents, 4-week cycle completion alerts, and academy-wide broadcasts.
          </p>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-[#BEF264]/15 border border-[#BEF264]/30 text-[#BEF264] text-xs font-bold flex items-center gap-2 animate-fade-in backdrop-blur-md">
          <Sparkles className="w-4 h-4 text-[#BEF264]" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Grid: Session Reminders (Left) + Broadcast Composer (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Upcoming Sessions that can be reminded */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#BEF264]" />
              <span>Upcoming Robotics Sessions</span>
            </h3>
            <span className="text-xs font-bold text-white/40">
              {upcomingSessions.length} sessions
            </span>
          </div>

          <div className="space-y-3">
            {upcomingSessions.length === 0 ? (
              <div className="p-8 text-center text-xs text-white/40 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md">
                No upcoming sessions requiring reminders.
              </div>
            ) : (
              upcomingSessions.map((session) => {
                const assignedCoachesList = coaches.filter((c) =>
                  session.assignedCoachIds.includes(c.id)
                );
                const targetGroup = groups.find((g) => g.id === session.groupId);
                const enrolledCount = targetGroup?.enrolledStudentIds.length || 0;

                return (
                  <div
                    key={session.id}
                    className="p-5 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md shadow-sm space-y-3 hover:bg-white/[0.07] transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-xl bg-[#BEF264] text-[#050B1A] font-black text-xs">
                          {session.track}
                        </span>
                        <h4 className="font-bold text-sm text-white">
                          {session.groupName} • Level {session.level}
                        </h4>
                      </div>
                      <div className="text-xs font-bold text-[#BEF264] flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          {session.date} ({session.startTime} - {session.endTime})
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-white/60 flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-white/40" />
                        <span>{session.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-white/40" />
                        <span>{assignedCoachesList.map((c) => c.name).join(', ') || 'Unassigned'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-white/80">{enrolledCount}</span>
                        <span>students enrolled</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
                      <span className="text-[11px] text-white/40">
                        Session #{session.sessionNumber} of 4-week cycle
                      </span>

                      <button
                        onClick={() => handleSendSessionReminder(session.id)}
                        className="px-4 py-2 rounded-xl bg-[#BEF264] hover:bg-[#aee64a] text-[#050B1A] font-black text-xs shadow-md shadow-[#BEF264]/20 transition-all flex items-center gap-2"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{t.sendSessionReminder}</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right side: Broadcast Announcement Composer & Live Feed */}
        <div className="lg:col-span-5 space-y-6">
          {/* Composer (Owner only or authorized) */}
          {isOwner && (
            <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md shadow-sm space-y-4">
              <div className="flex items-center gap-2 font-bold text-sm text-white">
                <MessageSquare className="w-4 h-4 text-[#BEF264]" />
                <span>Send Academy Broadcast</span>
              </div>

              <form onSubmit={handleSendCustomBroadcast} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-white/40 uppercase tracking-wider mb-1">
                    Audience
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'all', label: 'All Users' },
                      { id: 'coaches', label: 'Coaches Only' },
                      { id: 'students', label: 'Students' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setTargetAudience(item.id as any)}
                        className={`py-2 px-1 rounded-xl font-bold border transition-colors ${
                          targetAudience === item.id
                            ? 'bg-[#BEF264] text-[#050B1A] border-[#BEF264]'
                            : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-white/40 uppercase tracking-wider mb-1">
                    Announcement Title
                  </label>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="e.g. Next Week Ramadan Schedule Adjustment"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white placeholder-white/30 text-xs focus:outline-none focus:ring-1 focus:ring-[#BEF264]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-white/40 uppercase tracking-wider mb-1">
                    Message Body
                  </label>
                  <textarea
                    rows={3}
                    value={customMsg}
                    onChange={(e) => setCustomMsg(e.target.value)}
                    placeholder="Provide details about robotics lab timings, competition preparation, or holiday announcements..."
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white placeholder-white/30 text-xs focus:outline-none focus:ring-1 focus:ring-[#BEF264]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl bg-[#BEF264] hover:bg-[#aee64a] text-[#050B1A] font-black text-xs shadow-lg shadow-[#BEF264]/20 transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Broadcast to Academy</span>
                </button>
              </form>
            </div>
          )}

          {/* Activity / Notification History */}
          <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#BEF264]" />
              <span>Recent Academy Logs & Alerts</span>
            </h3>

            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {notifications.slice(0, 8).map((notif) => (
                <div
                  key={notif.id}
                  className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white">
                      {language === 'ar' && notif.titleAr ? notif.titleAr : notif.title}
                    </span>
                    <span className="text-[10px] text-white/40">
                      {new Date(notif.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-[11px] text-white/60 leading-relaxed">
                    {language === 'ar' && notif.messageAr ? notif.messageAr : notif.message}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
