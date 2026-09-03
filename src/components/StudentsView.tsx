import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Student } from '../types';
import {
  GraduationCap,
  Plus,
  Edit,
  Trash2,
  Phone,
  Mail,
  Search,
  Filter,
  CheckCircle2,
  Sparkles,
  CreditCard,
  ShieldCheck,
} from 'lucide-react';
import { StudentPaymentSection } from './StudentPaymentSection';

export const StudentsView: React.FC = () => {
  const { role, t, students, groups, studentPayments, saveStudent, deleteStudent } = useApp();

  const isOwner = role === 'admin';

  const [activeSubTab, setActiveSubTab] = useState<'roster' | 'payments'>('roster');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const pendingPaymentsCount = studentPayments.filter(
    (p) => p.status === 'pending_approval'
  ).length;

  // Form states
  const [name, setName] = useState('');
  const [age, setAge] = useState<number>(10);
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [level, setLevel] = useState<number>(1);
  const [track, setTrack] = useState<string>('Arduino');
  const [notes, setNotes] = useState('');
  const [enrolledGroupIds, setEnrolledGroupIds] = useState<string[]>([]);

  const openEditModal = (student: Student) => {
    setSelectedStudent(student);
    setName(student.name);
    setAge(student.age);
    setParentName(student.parentName);
    setParentPhone(student.parentPhone);
    setParentEmail(student.parentEmail || '');
    setLevel(student.level || 1);
    setTrack(student.track || 'Arduino');
    setNotes(student.notes || '');
    setEnrolledGroupIds(student.enrolledGroupIds || []);
    setShowModal(true);
  };

  const handleGroupToggle = (groupId: string) => {
    if (enrolledGroupIds.includes(groupId)) {
      setEnrolledGroupIds(enrolledGroupIds.filter((id) => id !== groupId));
    } else {
      setEnrolledGroupIds([...enrolledGroupIds, groupId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent?.id) return;
    await saveStudent({
      id: selectedStudent.id,
      name,
      age: Number(age),
      parentName,
      parentPhone,
      parentEmail: parentEmail || undefined,
      level: Number(level) || 1,
      track,
      notes: notes || undefined,
      enrolledGroupIds,
    });
    setShowModal(false);
  };

  // Filter students
  const filteredStudents = students.filter((s) => {
    if (
      searchQuery &&
      !s.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !s.parentName.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !s.parentPhone.includes(searchQuery)
    ) {
      return false;
    }
    if (selectedGroupFilter !== 'all' && !s.enrolledGroupIds.includes(selectedGroupFilter)) {
      return false;
    }
    return true;
  });

  return (
    <div id="students-directory-view" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-[#BEF264]" />
            <span>{t.studentsTitle}</span>
          </h2>
          <p className="text-xs sm:text-sm text-white/50 mt-1">
            Student roster, parent contacts, group enrollments, and track progress records.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/5 border border-white/10 text-xs text-white/70">
          <GraduationCap className="w-4 h-4 text-[#BEF264] shrink-0" />
          <span>Self-Registration Active (Students register themselves)</span>
        </div>
      </div>

      {/* Sub-tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3">
        <button
          type="button"
          onClick={() => setActiveSubTab('roster')}
          className={`px-4 py-2 rounded-xl font-black text-xs transition-all flex items-center gap-2 ${
            activeSubTab === 'roster'
              ? 'bg-[#BEF264] text-[#050B1A] shadow-md shadow-[#BEF264]/20'
              : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Student Directory ({students.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('payments')}
          className={`px-4 py-2 rounded-xl font-black text-xs transition-all flex items-center gap-2 ${
            activeSubTab === 'payments'
              ? 'bg-[#BEF264] text-[#050B1A] shadow-md shadow-[#BEF264]/20'
              : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Tuition Approvals (YES HE ACTUALLY PAID)</span>
          {pendingPaymentsCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black animate-pulse">
              {pendingPaymentsCount}
            </span>
          )}
        </button>
      </div>

      {activeSubTab === 'payments' ? (
        <StudentPaymentSection mode="admin" />
      ) : (
        <>
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search students, parents, phone numbers..."
            className="w-full pl-9 pr-4 py-1.5 rounded-xl border border-white/10 bg-white/5 text-white placeholder-white/30 text-xs focus:outline-none focus:ring-1 focus:ring-[#BEF264]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-[#BEF264]" />
          <select
            value={selectedGroupFilter}
            onChange={(e) => setSelectedGroupFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 text-xs font-semibold text-white focus:outline-none focus:ring-1 focus:ring-[#BEF264]"
          >
            <option value="all" className="bg-[#070E20]">{t.allGroups}</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id} className="bg-[#070E20]">
                {g.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Students Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStudents.length === 0 ? (
          <div className="col-span-full p-12 text-center rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md">
            <p className="text-sm font-bold text-white/50">{t.noStudents}</p>
          </div>
        ) : (
          filteredStudents.map((student) => {
            const studentGroups = groups.filter((g) =>
              student.enrolledGroupIds.includes(g.id)
            );

            return (
              <div
                key={student.id}
                className="p-5 rounded-3xl bg-white/5 border border-white/10 shadow-sm flex flex-col justify-between space-y-3 hover:border-[#BEF264]/40 transition-all backdrop-blur-md"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-2xl bg-[#BEF264]/20 text-[#BEF264] font-black flex items-center justify-center text-sm border border-[#BEF264]/30">
                        {student.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-white">
                          {student.name}
                        </h4>
                        <span className="text-[11px] text-white/40">{student.age} years old</span>
                      </div>
                    </div>
                  </div>

                  {/* Parent Info */}
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/5 space-y-1 text-xs">
                    <div className="font-bold text-white/90">
                      Parent: {student.parentName}
                    </div>
                    <div className="flex items-center gap-2 text-white/50">
                      <Phone className="w-3.5 h-3.5 text-[#BEF264]" />
                      <span className="font-semibold text-white">
                        {student.parentPhone}
                      </span>
                    </div>
                    {student.parentEmail && (
                      <div className="flex items-center gap-2 text-white/50">
                        <Mail className="w-3.5 h-3.5 text-white/40" />
                        <span>{student.parentEmail}</span>
                      </div>
                    )}
                  </div>

                  {/* Enrolled Tracks/Levels */}
                  <div>
                    <div className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">
                      {t.enrolledGroups}:
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {studentGroups.length === 0 ? (
                        <span className="text-[11px] text-white/40 italic">Not enrolled in any group</span>
                      ) : (
                        studentGroups.map((g) => (
                          <span
                            key={g.id}
                            className="px-2 py-0.5 rounded-lg bg-[#BEF264]/15 text-[#BEF264] border border-[#BEF264]/25 text-[10px] font-bold"
                          >
                            {g.track} L{g.level}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  {student.notes && (
                    <p className="text-[11px] text-white/60 italic bg-white/5 p-2 rounded-xl border border-white/5">
                      "{student.notes}"
                    </p>
                  )}
                </div>

                {isOwner && (
                  <div className="flex items-center gap-2 pt-3 border-t border-white/10">
                    <button
                      onClick={() => openEditModal(student)}
                      className="flex-1 py-1.5 px-3 rounded-xl border border-white/10 bg-white/5 text-white text-xs font-bold hover:border-[#BEF264] flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5 text-[#BEF264]" />
                      <span>{t.edit}</span>
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Remove student ${student.name}?`)) {
                          deleteStudent(student.id);
                        }
                      }}
                      className="p-2 rounded-xl text-red-400 hover:bg-red-500/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
        </>
      )}

      {/* CREATE / EDIT STUDENT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050B1A]/85 backdrop-blur-xl animate-fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-[#070E20]/95 backdrop-blur-2xl border border-white/15 shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto text-white">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <h3 className="text-base font-black text-white">
                {selectedStudent ? t.editStudent : t.addStudent}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-white/40 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 pt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-white/80 mb-1">
                    {t.studentName}
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
                    {t.studentAge}
                  </label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    min="5"
                    max="18"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white text-xs font-bold focus:outline-none focus:ring-1 focus:ring-[#BEF264]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-white/80 mb-1">
                    {t.parentName}
                  </label>
                  <input
                    type="text"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white text-xs focus:outline-none focus:ring-1 focus:ring-[#BEF264]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-white/80 mb-1">
                    {t.parentPhone}
                  </label>
                  <input
                    type="tel"
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white text-xs focus:outline-none focus:ring-1 focus:ring-[#BEF264]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-white/80 mb-1">
                  {t.parentEmail} (Optional)
                </label>
                <input
                  type="email"
                  value={parentEmail}
                  onChange={(e) => setParentEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white text-xs focus:outline-none focus:ring-1 focus:ring-[#BEF264]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-white/80 mb-1">
                    Current Level
                  </label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white text-xs font-bold focus:outline-none focus:ring-1 focus:ring-[#BEF264]"
                  >
                    {[1, 2, 3, 4, 5, 6].map((lvl) => (
                      <option key={lvl} value={lvl} className="bg-[#070E20]">
                        Level {lvl}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-white/80 mb-1">
                    Robotics Track
                  </label>
                  <select
                    value={track}
                    onChange={(e) => setTrack(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white text-xs font-bold focus:outline-none focus:ring-1 focus:ring-[#BEF264]"
                  >
                    {['Arduino', 'WeDo', 'Lego Essential', 'Lego Prime', 'Lego EV3', 'SolidWorks'].map((tr) => (
                      <option key={tr} value={tr} className="bg-[#070E20]">
                        {tr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Group Enrollment Selection */}
              <div>
                <label className="block text-xs font-bold text-white/80 mb-1.5">
                  Enroll in Robotics Groups:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-36 overflow-y-auto p-2 rounded-2xl border border-white/10 bg-white/5">
                  {groups.map((g) => {
                    const isSelected = enrolledGroupIds.includes(g.id);
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => handleGroupToggle(g.id)}
                        className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition-colors flex items-center justify-between ${
                          isSelected
                            ? 'bg-[#BEF264]/20 border-[#BEF264] text-[#BEF264] font-bold'
                            : 'border-white/10 bg-white/5 text-white/60 hover:text-white'
                        }`}
                      >
                        <span className="truncate">{g.name}</span>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#BEF264] shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-white/80 mb-1">
                  Student Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white placeholder-white/30 text-xs focus:outline-none focus:ring-1 focus:ring-[#BEF264]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
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
