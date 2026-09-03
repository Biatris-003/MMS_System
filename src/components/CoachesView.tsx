import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Coach } from '../types';
import {
  Users,
  UserCheck,
  UserX,
  Plus,
  Edit,
  Trash2,
  Mail,
  Phone,
  Calendar,
  Clock,
  Shield,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

export const CoachesView: React.FC = () => {
  const { role, t, coaches, approveCoach, rejectCoach, saveCoach, deleteCoach } = useApp();

  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCoach, setSelectedCoach] = useState<Partial<Coach> | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState<number | ''>(25);
  const [hourlyRate, setHourlyRate] = useState<number | ''>(120);
  const [availableDays, setAvailableDays] = useState<string[]>([]);
  const [specialization, setSpecialization] = useState<string[]>([]);
  const [status, setStatus] = useState<'active' | 'pending' | 'rejected'>('active');
  const [notes, setNotes] = useState('');

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

  const openEditModal = (coach: Coach) => {
    setSelectedCoach(coach);
    setName(coach.name);
    setEmail(coach.email);
    setPhone(coach.phone);
    setAge(coach.age);
    setHourlyRate(coach.hourlyRate || 120);
    setAvailableDays(coach.availableDays || []);
    setSpecialization(coach.specialization || []);
    setStatus(coach.status);
    setNotes(coach.notes || '');
    setShowEditModal(true);
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveCoach({
      id: selectedCoach?.id,
      name,
      email,
      phone,
      age: Number(age) || 24,
      hourlyRate: Number(hourlyRate) || 120,
      availableDays,
      specialization,
      status,
      notes,
    });
    setShowEditModal(false);
  };

  const pendingCoaches = coaches.filter((c) => c.status === 'pending');
  const activeCoaches = coaches.filter((c) => c.status === 'active');
  const rejectedCoaches = coaches.filter((c) => c.status === 'rejected');

  return (
    <div id="coaches-management-view" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-[#BEF264]" />
            <span>{t.coachesTitle}</span>
          </h2>
          <p className="text-xs sm:text-sm text-white/50 mt-1">
            Review incoming coach registrations, manage active instructors, set hourly rates, and schedule availability.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/5 border border-white/10 text-xs text-white/70">
          <Shield className="w-4 h-4 text-[#BEF264] shrink-0" />
          <span>Self-Registration Active (Coaches register their own accounts)</span>
        </div>
      </div>

      {/* SECTION 1: PENDING APPROVALS QUEUE */}
      {pendingCoaches.length > 0 && (
        <div className="rounded-3xl p-5 sm:p-6 bg-amber-500/10 border border-amber-500/30 backdrop-blur-md space-y-4">
          <div className="flex items-center gap-2 text-amber-300">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            <h3 className="font-bold text-base">
              {t.pendingApprovals} ({pendingCoaches.length})
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingCoaches.map((coach) => (
              <div
                key={coach.id}
                className="p-4 rounded-2xl bg-white/5 border border-amber-500/30 shadow-sm space-y-3 backdrop-blur-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-sm text-white">
                      {coach.name} ({coach.age} yrs)
                    </h4>
                    <div className="text-xs text-white/50 flex items-center gap-1.5 mt-0.5">
                      <Mail className="w-3.5 h-3.5" />
                      <span>{coach.email}</span>
                    </div>
                    <div className="text-xs text-white/50 flex items-center gap-1.5 mt-0.5">
                      <Phone className="w-3.5 h-3.5" />
                      <span>{coach.phone}</span>
                    </div>
                  </div>

                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                    Pending
                  </span>
                </div>

                {/* Available Days */}
                <div>
                  <div className="text-[11px] font-bold text-white/40 mb-1">
                    Requested Available Days:
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(coach.availableDays || []).map((d) => (
                      <span
                        key={d}
                        className="px-2 py-0.5 rounded-lg bg-white/10 text-white text-[10px] font-semibold border border-white/10"
                      >
                        {t[d as keyof typeof t] || d}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                  <button
                    onClick={() => approveCoach(coach.id)}
                    className="flex-1 py-1.5 px-3 rounded-xl bg-[#BEF264] hover:bg-[#aee64a] text-[#050B1A] text-xs font-black shadow-sm transition-all flex items-center justify-center gap-1.5"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>{t.approveCoach}</span>
                  </button>
                  <button
                    onClick={() => rejectCoach(coach.id)}
                    className="py-1.5 px-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-xs font-semibold"
                  >
                    <UserX className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 2: ACTIVE COACHES ROSTER */}
      <div className="space-y-4">
        <div className="text-xs font-bold uppercase tracking-wider text-white/40">
          {t.activeCoaches} ({activeCoaches.length})
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeCoaches.map((coach) => (
            <div
              key={coach.id}
              className="p-5 rounded-3xl bg-white/5 border border-white/10 shadow-sm space-y-3 flex flex-col justify-between hover:border-[#BEF264]/40 transition-all backdrop-blur-md"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-[#BEF264]/20 text-[#BEF264] font-black flex items-center justify-center text-sm border border-[#BEF264]/30">
                      {coach.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white">
                        {coach.name}
                      </h4>
                      <span className="text-[11px] text-white/40">{coach.age} years old</span>
                    </div>
                  </div>

                  <span className="px-2.5 py-0.5 rounded-full bg-[#BEF264]/20 text-[#BEF264] border border-[#BEF264]/30 text-[10px] font-bold">
                    Active
                  </span>
                </div>

                <div className="space-y-1 text-xs text-white/60 pt-1">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-white/40" />
                    <span>{coach.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-white/40" />
                    <span>{coach.phone}</span>
                  </div>
                </div>

                {/* Specialties */}
                {coach.specialization && coach.specialization.length > 0 && (
                  <div>
                    <div className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">
                      {t.specialties}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {coach.specialization.map((sp) => (
                        <span
                          key={sp}
                          className="px-2 py-0.5 rounded-md bg-[#BEF264]/10 text-[#BEF264] text-[10px] font-bold border border-[#BEF264]/20"
                        >
                          {sp}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Availability */}
                <div>
                  <div className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">
                    {t.availability}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(coach.availableDays || []).map((d) => (
                      <span
                        key={d}
                        className="px-2 py-0.5 rounded-md bg-white/10 text-white text-[10px] font-medium border border-white/10"
                      >
                        {t[d as keyof typeof t] || d}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Edit / Delete Buttons */}
              <div className="flex items-center gap-2 pt-3 border-t border-white/10">
                <button
                  onClick={() => openEditModal(coach)}
                  className="flex-1 py-1.5 px-3 rounded-xl border border-white/10 bg-white/5 text-white text-xs font-bold hover:border-[#BEF264] flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Edit className="w-3.5 h-3.5 text-[#BEF264]" />
                  <span>{t.edit}</span>
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Remove coach ${coach.name} from directory?`)) {
                      deleteCoach(coach.id);
                    }
                  }}
                  className="p-2 rounded-xl text-red-400 hover:bg-red-500/20"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* EDIT / CREATE COACH MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050B1A]/85 backdrop-blur-xl animate-fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-[#070E20]/95 backdrop-blur-2xl border border-white/15 shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto text-white">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <h3 className="text-base font-black text-white">
                {selectedCoach ? t.editCoach : 'Create Coach Account'}
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1 text-white/40 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 pt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-white/80 mb-1">
                    {t.fullName}
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white text-xs focus:outline-none focus:ring-1 focus:ring-[#BEF264]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-white/80 mb-1">
                    {t.age}
                  </label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    min="10"
                    max="75"
                    placeholder="e.g. 17"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white text-xs focus:outline-none focus:ring-1 focus:ring-[#BEF264]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-white/80 mb-1">
                    {t.email}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white text-xs focus:outline-none focus:ring-1 focus:ring-[#BEF264]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-white/80 mb-1">
                    {t.phoneNumber}
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white text-xs focus:outline-none focus:ring-1 focus:ring-[#BEF264]"
                  />
                </div>
              </div>

              {/* Status and Hourly Rate */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-white/80 mb-1">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#BEF264]"
                  >
                    <option value="active" className="bg-[#070E20]">Active</option>
                    <option value="pending" className="bg-[#070E20]">Pending</option>
                    <option value="rejected" className="bg-[#070E20]">Rejected</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/80 mb-1">
                    {t.hourlyRate} (EGP)
                  </label>
                  <input
                    type="number"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white text-xs font-bold focus:outline-none focus:ring-1 focus:ring-[#BEF264]"
                  />
                </div>
              </div>

              {/* Available Days */}
              <div>
                <label className="block text-xs font-bold text-white/80 mb-1.5">
                  {t.availableDays}
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {daysOfWeek.map((day) => {
                    const isSelected = availableDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => handleToggleDay(day)}
                        className={`px-2 py-1 rounded-xl text-xs font-semibold border transition-colors ${
                          isSelected
                            ? 'bg-[#BEF264] text-[#050B1A] border-[#BEF264] font-black'
                            : 'border-white/10 bg-white/5 text-white/60 hover:text-white'
                        }`}
                      >
                        {t[day as keyof typeof t] || day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tracks */}
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
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${
                          isSelected
                            ? 'bg-[#BEF264] text-[#050B1A] border-[#BEF264] font-black'
                            : 'border-white/10 bg-white/5 text-white/60 hover:text-white'
                        }`}
                      >
                        {tr}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl border border-white/10 text-white/70 text-xs font-semibold hover:text-white"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 rounded-xl bg-[#BEF264] hover:bg-[#aee64a] text-[#050B1A] font-black text-xs shadow-lg shadow-[#BEF264]/20 transition-all"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
