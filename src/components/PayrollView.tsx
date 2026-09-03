import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Wallet,
  CheckCircle2,
  Clock,
  Filter,
  Plus,
  Gift,
  Award,
  Sparkles,
  X,
} from 'lucide-react';

export const PayrollView: React.FC = () => {
  const { role, currentUser, t, payments, coaches, updatePaymentStatus, addCoachBonus } = useApp();

  const isOwner = role === 'admin';

  const [selectedCoachId, setSelectedCoachId] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Bonus modal state
  const [showBonusModal, setShowBonusModal] = useState(false);
  const [bonusCoachId, setBonusCoachId] = useState(coaches[0]?.id || '');
  const [bonusAmount, setBonusAmount] = useState<number>(300);
  const [bonusReason, setBonusReason] = useState('');
  const [bonusSubmitting, setBonusSubmitting] = useState(false);

  // Filter payments
  const filteredPayments = payments.filter((p) => {
    if (!isOwner && p.coachId !== currentUser?.id) {
      return false;
    }
    if (selectedCoachId !== 'all' && p.coachId !== selectedCoachId) return false;
    if (selectedStatus !== 'all' && p.paymentStatus !== selectedStatus) return false;
    return true;
  });

  const totalOwed = filteredPayments.reduce((sum, p) => sum + p.amountOwed, 0);
  const totalPending = filteredPayments
    .filter((p) => p.paymentStatus === 'pending')
    .reduce((sum, p) => sum + p.amountOwed, 0);
  const totalPaid = filteredPayments
    .filter((p) => p.paymentStatus === 'paid')
    .reduce((sum, p) => sum + p.amountOwed, 0);

  const handleBonusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bonusCoachId || bonusAmount <= 0) return;

    setBonusSubmitting(true);
    const res = await addCoachBonus({
      coachId: bonusCoachId,
      amount: Number(bonusAmount),
      reason: bonusReason.trim() || 'Performance bonus from Owner',
    });
    setBonusSubmitting(false);

    if (res.success) {
      setShowBonusModal(false);
      setBonusReason('');
      alert(t.bonusAddedSuccess);
    } else {
      alert(res.error || 'Failed to award bonus');
    }
  };

  return (
    <div id="payroll-view" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Wallet className="w-6 h-6 text-[#BEF264]" />
            <span>{isOwner ? t.payrollTitle : t.coachEarningsTitle}</span>
          </h2>
          <p className="text-xs sm:text-sm text-white/50 mt-1">
            {isOwner
              ? 'Calculate amounts owed based on completed robotics sessions, multi-coach split rules, bonuses, and mark payroll disbursements.'
              : 'Review your attended robotics sessions and earned compensation.'}
          </p>
        </div>

        {isOwner && (
          <button
            onClick={() => {
              if (coaches.length > 0 && !bonusCoachId) {
                setBonusCoachId(coaches[0].id);
              }
              setShowBonusModal(true);
            }}
            className="px-4 py-2.5 rounded-2xl bg-[#BEF264] hover:bg-[#aee64a] text-[#050B1A] font-black text-xs shadow-lg shadow-[#BEF264]/20 transition-all flex items-center gap-2 self-start sm:self-auto"
          >
            <Gift className="w-4 h-4" />
            <span>{t.addBonus}</span>
          </button>
        )}
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm shadow-sm space-y-2">
          <div className="text-xs font-bold text-white/40 uppercase tracking-wider">
            {t.totalOwed}
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            {totalOwed.toLocaleString()}{' '}
            <span className="text-xs font-bold text-white/40">EGP</span>
          </div>
          <div className="text-[11px] text-white/50">
            {filteredPayments.length} attended session & bonus payouts
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-amber-500/10 border border-amber-500/30 backdrop-blur-sm shadow-sm space-y-2">
          <div className="text-xs font-bold text-amber-300 uppercase tracking-wider">
            {t.pendingAmount}
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-300">
            {totalPending.toLocaleString()}{' '}
            <span className="text-xs font-bold text-amber-400/80">EGP</span>
          </div>
          <div className="text-[11px] text-amber-200/60">
            Pending Owner clearance
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-[#BEF264]/10 border border-[#BEF264]/30 backdrop-blur-sm shadow-sm space-y-2">
          <div className="text-xs font-bold text-[#BEF264] uppercase tracking-wider">
            {t.paidAmount}
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#BEF264]">
            {totalPaid.toLocaleString()}{' '}
            <span className="text-xs font-bold text-[#BEF264]/80">EGP</span>
          </div>
          <div className="text-[11px] text-[#BEF264]/70">
            Disbursed and reconciled
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-sm text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold text-white/40">
            <Filter className="w-3.5 h-3.5 text-[#BEF264]" />
            <span>Filters:</span>
          </div>

          {isOwner && (
            <select
              value={selectedCoachId}
              onChange={(e) => setSelectedCoachId(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 text-white font-semibold focus:outline-none focus:ring-1 focus:ring-[#BEF264]"
            >
              <option value="all" className="bg-[#070E20]">All Coaches</option>
              {coaches.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#070E20]">
                  {c.name}
                </option>
              ))}
            </select>
          )}

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 text-white font-semibold focus:outline-none focus:ring-1 focus:ring-[#BEF264]"
          >
            <option value="all" className="bg-[#070E20]">All Statuses</option>
            <option value="pending" className="bg-[#070E20]">Pending Only</option>
            <option value="paid" className="bg-[#070E20]">Paid Only</option>
          </select>
        </div>
      </div>

      {/* Payroll Table */}
      <div className="rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/5 border-b border-white/10 text-white/40 uppercase font-black tracking-wider text-[10px]">
              <tr>
                <th className="p-4">{t.coach}</th>
                <th className="p-4">{t.group}</th>
                <th className="p-4">{t.date}</th>
                <th className="p-4">{t.sessionsAttended}</th>
                <th className="p-4">{t.amountOwed}</th>
                <th className="p-4">{t.paymentStatus}</th>
                {isOwner && <th className="p-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-medium">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-white/40">
                    No payroll entries found. Record session attendance or award bonuses to generate payouts.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((item) => {
                  const isBonus = item.groupId === 'BONUS' || item.amountOwed === 0 || item.sessionNumber === 0;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className="p-4 font-bold text-white">
                        <div className="flex items-center gap-2">
                          <span>{item.coachName}</span>
                          {isBonus && (
                            <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold inline-flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-purple-300" />
                              Bonus
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-white/80">
                        {item.groupName}
                      </td>
                      <td className="p-4 text-white/50">
                        {item.sessionDate}
                      </td>
                      <td className="p-4 text-white/80">
                        {isBonus ? (
                          <span className="text-purple-300 italic font-semibold">Special Award</span>
                        ) : (
                          `Session #${item.sessionNumber}`
                        )}
                      </td>
                      <td className="p-4 font-black text-[#BEF264]">
                        {item.amountOwed} EGP
                      </td>
                      <td className="p-4">
                        {item.paymentStatus === 'paid' ? (
                          <span className="px-2.5 py-1 rounded-full bg-[#BEF264]/20 text-[#BEF264] border border-[#BEF264]/30 text-[10px] font-bold inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            {t.paid}
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {t.pending}
                          </span>
                        )}
                      </td>
                      {isOwner && (
                        <td className="p-4 text-right">
                          {item.paymentStatus === 'pending' ? (
                            <button
                              onClick={() =>
                                updatePaymentStatus(
                                  [item.id],
                                  'paid',
                                  {
                                    paymentMethod: 'Bank Transfer / Cash',
                                    paymentRef: `PAY-${new Date().getFullYear()}-${Math.floor(Math.random() * 90000 + 10000)}`
                                  }
                                )
                              }
                              className="px-3.5 py-1.5 rounded-xl bg-[#BEF264] hover:bg-[#aee64a] text-[#050B1A] text-xs font-black shadow-sm transition-all"
                            >
                              Mark Paid
                            </button>
                          ) : (
                            <button
                              onClick={() => updatePaymentStatus([item.id], 'pending')}
                              className="px-3.5 py-1.5 rounded-xl border border-white/10 bg-white/5 text-white/60 text-xs font-bold hover:bg-white/10 hover:text-white"
                            >
                              Revert
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* AWARD COACH BONUS MODAL */}
      {showBonusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050B1A]/85 backdrop-blur-xl animate-fade-in">
          <div className="relative w-full max-w-md rounded-3xl bg-[#070E20]/95 backdrop-blur-2xl border border-white/15 shadow-2xl overflow-hidden p-6 sm:p-8 text-white">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#BEF264]/20 border border-[#BEF264]/30 text-[#BEF264]">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    {t.addBonus}
                  </h3>
                  <p className="text-xs text-white/50">Award extra bonus to any coach</p>
                </div>
              </div>
              <button
                onClick={() => setShowBonusModal(false)}
                className="p-1 rounded-lg text-white/40 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBonusSubmit} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block font-bold text-white/90 mb-1">
                  {t.selectCoach} <span className="text-[#BEF264]">*</span>
                </label>
                <select
                  value={bonusCoachId}
                  onChange={(e) => setBonusCoachId(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#BEF264]"
                >
                  {coaches.map((c) => (
                    <option key={c.id} value={c.id} className="bg-[#070E20]">
                      {c.name} ({c.hourlyRate || 120} EGP/hr)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-white/90 mb-1">
                  {t.bonusAmount} (EGP) <span className="text-[#BEF264]">*</span>
                </label>
                <input
                  type="number"
                  min="10"
                  step="10"
                  required
                  value={bonusAmount}
                  onChange={(e) => setBonusAmount(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white text-xs font-black focus:outline-none focus:ring-1 focus:ring-[#BEF264]"
                />
              </div>

              <div>
                <label className="block font-bold text-white/80 mb-1">
                  {t.bonusReason}
                </label>
                <input
                  type="text"
                  value={bonusReason}
                  onChange={(e) => setBonusReason(e.target.value)}
                  placeholder="e.g. Exceptional workshop leadership / Overtime"
                  className="w-full px-3.5 py-2 rounded-xl border border-white/10 bg-white/5 text-white placeholder-white/30 text-xs focus:outline-none focus:ring-1 focus:ring-[#BEF264]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBonusModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-white/10 text-white/70 text-xs font-semibold hover:bg-white/5"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={bonusSubmitting || !bonusCoachId || bonusAmount <= 0}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#BEF264] hover:bg-[#aee64a] text-[#050B1A] font-black text-xs shadow-lg shadow-[#BEF264]/20 transition-all flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  <Award className="w-4 h-4" />
                  <span>{bonusSubmitting ? '...' : t.addBonus}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
