import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { StudentPaymentRecord, PaymentMethod } from '../types';
import {
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Send,
  Check,
  X,
  ShieldCheck,
  Smartphone,
  Banknote,
  DollarSign,
  MessageCircle,
  Calendar,
  Layers,
  Search,
  ExternalLink,
} from 'lucide-react';
import {
  openWhatsApp,
  formatPaymentMethodLabel,
  buildStudentPaymentReportedMsg,
  buildPaymentApprovedMsg,
} from '../utils/whatsapp';

interface StudentPaymentSectionProps {
  mode?: 'student' | 'admin';
  studentId?: string;
}

export const StudentPaymentSection: React.FC<StudentPaymentSectionProps> = ({
  mode = 'student',
  studentId,
}) => {
  const {
    currentUser,
    role,
    students,
    groups,
    studentPayments,
    submitStudentPayment,
    approveStudentPayment,
    rejectStudentPayment,
  } = useApp();

  const isOwner = role === 'admin' || mode === 'admin';

  // Filter payments
  const currentStudentId = studentId || currentUser?.id;
  const currentStudent = students.find((s) => s.id === currentStudentId);

  const displayedPayments = isOwner
    ? studentPayments
    : studentPayments.filter((p) => p.studentId === currentStudentId);

  // Status filter for admin
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Form states for reporting payment
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [amount, setAmount] = useState<string>('1200');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('instapay');
  const [senderPhoneOrAccount, setSenderPhoneOrAccount] = useState<string>('');
  const [transactionReference, setTransactionReference] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedGroupId, setSelectedGroupId] = useState<string>(
    currentStudent?.enrolledGroupIds?.[0] || ''
  );
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [justSubmittedPayment, setJustSubmittedPayment] = useState<StudentPaymentRecord | null>(null);

  // Rejection modal
  const [rejectModalId, setRejectModalId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');

  // Admin action states
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string>('');

  const targetGroup = groups.find((g) => g.id === selectedGroupId);

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStudentId || !amount || !paymentMethod) return;

    setIsSubmitting(true);
    const res = await submitStudentPayment({
      studentId: currentStudentId,
      studentName: currentStudent?.name || currentUser?.name || 'Student',
      studentPhone: currentStudent?.phone || currentUser?.phone || '',
      parentPhone: currentStudent?.parentPhone || currentUser?.parentPhone || '',
      groupId: selectedGroupId || undefined,
      groupName: targetGroup?.name || undefined,
      track: targetGroup?.track || currentStudent?.track || 'Robotics',
      amount: Number(amount),
      paymentMethod,
      senderPhoneOrAccount,
      transactionReference,
      paymentDate,
      note,
    });

    setIsSubmitting(false);

    if (res.success && res.payment) {
      setJustSubmittedPayment(res.payment);
      setSubmitSuccess(true);
      // reset fields
      setSenderPhoneOrAccount('');
      setTransactionReference('');
      setNote('');
    }
  };

  const handleApprove = async (payment: StudentPaymentRecord) => {
    const res = await approveStudentPayment(payment.id);
    if (res.success) {
      setActionSuccessMsg(`Approved payment of ${payment.amount} EGP for ${payment.studentName}! (YES HE ACTUALLY PAID)`);
      setTimeout(() => setActionSuccessMsg(''), 4000);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectModalId) return;
    const res = await rejectStudentPayment(rejectModalId, rejectReason);
    if (res.success) {
      setRejectModalId(null);
      setRejectReason('');
      setActionSuccessMsg('Payment marked as rejected.');
      setTimeout(() => setActionSuccessMsg(''), 4000);
    }
  };

  const handleSendWhatsAppConfirmationToAdmin = (payment: StudentPaymentRecord) => {
    const msg = buildStudentPaymentReportedMsg({
      studentName: payment.studentName,
      amount: payment.amount,
      method: payment.paymentMethod,
      groupName: payment.groupName,
      senderInfo: payment.senderPhoneOrAccount || payment.transactionReference,
      date: payment.paymentDate,
    });
    // Academy Owner WhatsApp contact (or prompt if international)
    openWhatsApp('+201000000000', msg);
  };

  const handleSendWhatsAppReceiptToStudent = (payment: StudentPaymentRecord) => {
    const targetPhone = payment.parentPhone || payment.studentPhone;
    if (!targetPhone) {
      alert('No phone number on record for this student or parent.');
      return;
    }
    const msg = buildPaymentApprovedMsg({
      studentName: payment.studentName,
      amount: payment.amount,
      method: payment.paymentMethod,
      groupName: payment.groupName,
      approvedDate: payment.approvedAt ? new Date(payment.approvedAt).toLocaleDateString('ar-EG') : new Date().toLocaleDateString('ar-EG'),
    });
    openWhatsApp(targetPhone, msg);
  };

  // Filtered payments list
  const filteredList = displayedPayments.filter((p) => {
    if (filterStatus !== 'all' && p.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        p.studentName.toLowerCase().includes(q) ||
        (p.groupName && p.groupName.toLowerCase().includes(q)) ||
        p.paymentMethod.toLowerCase().includes(q) ||
        (p.transactionReference && p.transactionReference.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const pendingCount = displayedPayments.filter((p) => p.status === 'pending_approval').length;
  const approvedTotal = displayedPayments
    .filter((p) => p.status === 'approved')
    .reduce((acc, curr) => acc + (curr.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* HEADER & ACTION BAR */}
      <div className="rounded-3xl p-6 bg-[#070E20]/90 border border-white/10 shadow-xl text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#BEF264]/20 border border-[#BEF264]/30 text-[#BEF264] text-[10px] font-black uppercase tracking-wider">
              <CreditCard className="w-3.5 h-3.5" />
              <span>{isOwner ? 'MMS Tuition & Payment Approvals' : 'Tuition & Payment Tracking'}</span>
            </div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <span>{isOwner ? 'Student Payments & Owner Approvals' : 'Tuition Fees & Payments'}</span>
              {pendingCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 text-xs font-bold animate-pulse">
                  {pendingCount} Pending Approval
                </span>
              )}
            </h2>
            <p className="text-xs text-white/60">
              {isOwner
                ? 'Review reported student tuition payments and verify "YES HE ACTUALLY PAID" with instant WhatsApp receipt notifications.'
                : 'Report your course payment to Academy Admin via Cash, InstaPay, Vodafone Cash, or Orange Cash.'}
            </p>
          </div>

          {!isOwner && (
            <button
              id="report-payment-btn"
              type="button"
              onClick={() => {
                setShowReportModal(true);
                setSubmitSuccess(false);
              }}
              className="px-5 py-3 rounded-2xl bg-[#BEF264] hover:bg-[#aee64a] text-[#050B1A] font-black text-xs shadow-lg shadow-[#BEF264]/20 transition-all flex items-center gap-2 self-start sm:self-auto shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Report Payment to Admin (سداد الرسوم)</span>
            </button>
          )}
        </div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4">
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5">
            <span className="block text-[10px] uppercase font-bold text-white/40">Total Verified Paid</span>
            <span className="text-lg font-black text-[#BEF264]">{approvedTotal.toLocaleString()} EGP</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5">
            <span className="block text-[10px] uppercase font-bold text-white/40">Pending Verification</span>
            <span className="text-lg font-black text-amber-400">{pendingCount} Records</span>
          </div>
          <div className="col-span-2 sm:col-span-1 p-3.5 rounded-2xl bg-white/5 border border-white/5">
            <span className="block text-[10px] uppercase font-bold text-white/40">Total Submitted</span>
            <span className="text-lg font-black text-cyan-400">{displayedPayments.length} Payments</span>
          </div>
        </div>
      </div>

      {/* ACTION SUCCESS BANNER */}
      {actionSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* FILTER CONTROLS FOR ADMIN */}
      {isOwner && (
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student name, group, or payment reference..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#070E20] border border-white/10 text-xs text-white placeholder-white/40 focus:border-[#BEF264] focus:ring-1 focus:ring-[#BEF264]"
            />
          </div>

          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#070E20] border border-white/10 text-xs font-bold w-full sm:w-auto overflow-x-auto">
            {(['all', 'pending_approval', 'approved', 'rejected'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-xl capitalize transition-all whitespace-nowrap ${
                  filterStatus === st
                    ? 'bg-[#BEF264] text-[#050B1A] font-black'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {st === 'all'
                  ? 'All Records'
                  : st === 'pending_approval'
                  ? `Pending (${pendingCount})`
                  : st}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* PAYMENTS LIST */}
      <div className="rounded-3xl p-6 bg-[#070E20]/90 border border-white/10 shadow-xl text-white space-y-4">
        <h3 className="font-bold text-sm text-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#BEF264]" />
          <span>Payment History & Approval Logs</span>
        </h3>

        {filteredList.length === 0 ? (
          <div className="text-center py-10 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-white/30">
              <CreditCard className="w-6 h-6" />
            </div>
            <p className="text-xs text-white/50">No payments found in this category.</p>
            {!isOwner && (
              <button
                type="button"
                onClick={() => setShowReportModal(true)}
                className="px-4 py-2 rounded-xl bg-[#BEF264]/20 border border-[#BEF264]/40 text-[#BEF264] text-xs font-bold hover:bg-[#BEF264]/30 transition-all inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Report your first payment</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredList.map((payment) => {
              const isApproved = payment.status === 'approved';
              const isPending = payment.status === 'pending_approval';
              const isRejected = payment.status === 'rejected';

              return (
                <div
                  key={payment.id}
                  className={`p-5 rounded-2xl border transition-all space-y-3 relative overflow-hidden ${
                    isApproved
                      ? 'bg-emerald-500/5 border-emerald-500/30'
                      : isPending
                      ? 'bg-amber-500/5 border-amber-500/30'
                      : 'bg-red-500/5 border-red-500/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-black text-white">
                          {payment.amount.toLocaleString()} EGP
                        </span>
                        <span className="px-2 py-0.5 rounded-lg bg-white/10 text-white/80 text-[10px] font-bold">
                          {formatPaymentMethodLabel(payment.paymentMethod)}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-white/90 mt-1">
                        {payment.studentName} {payment.groupName && `• ${payment.groupName}`}
                      </h4>
                    </div>

                    {/* STATUS BADGE */}
                    <div>
                      {isApproved && (
                        <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-black inline-flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>YES HE ACTUALLY PAID</span>
                        </span>
                      )}
                      {isPending && (
                        <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold inline-flex items-center gap-1 animate-pulse">
                          <Clock className="w-3 h-3" />
                          <span>Pending Approval</span>
                        </span>
                      )}
                      {isRejected && (
                        <span className="px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 text-[10px] font-bold">
                          Rejected
                        </span>
                      )}
                    </div>
                  </div>

                  {/* DETAILS GRID */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-white/70 pt-1">
                    <div>
                      <span className="block text-[10px] text-white/40 uppercase font-bold">Payment Date</span>
                      <span className="font-medium text-white">{payment.paymentDate}</span>
                    </div>
                    {payment.senderPhoneOrAccount && (
                      <div>
                        <span className="block text-[10px] text-white/40 uppercase font-bold">Sender Account / Phone</span>
                        <span className="font-medium text-white">{payment.senderPhoneOrAccount}</span>
                      </div>
                    )}
                    {payment.transactionReference && (
                      <div className="col-span-2">
                        <span className="block text-[10px] text-white/40 uppercase font-bold">Transaction Ref / Note</span>
                        <span className="font-mono text-white/90 bg-white/5 px-2 py-0.5 rounded text-[11px]">
                          {payment.transactionReference}
                        </span>
                      </div>
                    )}
                    {payment.note && (
                      <div className="col-span-2">
                        <span className="block text-[10px] text-white/40 uppercase font-bold">Note</span>
                        <span className="text-white/80 italic text-[11px]">{payment.note}</span>
                      </div>
                    )}
                  </div>

                  {/* APPROVAL FOOTER */}
                  {isApproved && (
                    <div className="pt-2 border-t border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-emerald-300/80">
                      <span>Approved by: {payment.approvedBy || 'Academy Admin'}</span>
                      {/* WhatsApp Receipt Button */}
                      <button
                        type="button"
                        onClick={() => handleSendWhatsAppReceiptToStudent(payment)}
                        className="px-2.5 py-1 rounded-lg bg-[#25D366]/20 hover:bg-[#25D366]/30 border border-[#25D366]/40 text-[#25D366] font-bold text-xs inline-flex items-center gap-1.5 transition-colors self-start"
                        title="Send Official WhatsApp Receipt to Student/Parent"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Send WhatsApp Receipt</span>
                      </button>
                    </div>
                  )}

                  {/* REJECTION REASON */}
                  {isRejected && payment.rejectionReason && (
                    <div className="pt-2 border-t border-red-500/20 text-[11px] text-red-300/90">
                      <span className="font-bold">Reason: </span>
                      <span>{payment.rejectionReason}</span>
                    </div>
                  )}

                  {/* ADMIN ACTION CONTROLS FOR PENDING PAYMENTS */}
                  {isOwner && isPending && (
                    <div className="pt-3 border-t border-white/10 flex flex-wrap items-center gap-2">
                      <button
                        id={`approve-payment-${payment.id}`}
                        type="button"
                        onClick={() => handleApprove(payment)}
                        className="flex-1 py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        <span>YES HE ACTUALLY PAID</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setRejectModalId(payment.id);
                          setRejectReason('');
                        }}
                        className="py-2 px-3 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 font-bold text-xs transition-colors"
                      >
                        Decline
                      </button>

                      {/* Direct WhatsApp chat with Student/Parent */}
                      {(payment.parentPhone || payment.studentPhone) && (
                        <button
                          type="button"
                          onClick={() => {
                            const p = payment.parentPhone || payment.studentPhone || '';
                            openWhatsApp(
                              p,
                              `السلام عليكم إدارة MMS بخصوص استلام سداد مبلغ ${payment.amount} ج.م للطالب ${payment.studentName}...`
                            );
                          }}
                          className="p-2 rounded-xl bg-[#25D366]/20 hover:bg-[#25D366]/30 border border-[#25D366]/40 text-[#25D366] transition-colors"
                          title="WhatsApp Student/Parent"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL 1: REPORT PAYMENT FORM (STUDENT) */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050B1A]/85 backdrop-blur-xl animate-fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-[#070E20]/95 backdrop-blur-2xl border border-white/15 shadow-2xl p-6 sm:p-7 space-y-5 text-white max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-white/10">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-[#BEF264]/20 border border-[#BEF264]/30 text-[#BEF264] text-[10px] font-black uppercase tracking-wider">
                  MMS Academy Tuition
                </span>
                <h3 className="text-lg font-black text-white mt-1">
                  Report Payment to Admin (سداد المصروفات)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {submitSuccess && justSubmittedPayment ? (
              <div className="space-y-4 py-3 text-center">
                <div className="w-14 h-14 rounded-3xl bg-[#BEF264]/20 border border-[#BEF264]/40 text-[#BEF264] flex items-center justify-center mx-auto shadow-lg shadow-[#BEF264]/10">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-base font-black text-white">
                    Payment Reported Successfully!
                  </h4>
                  <p className="text-xs text-white/70 mt-1 max-w-sm mx-auto leading-relaxed">
                    Your payment of <strong className="text-[#BEF264]">{justSubmittedPayment.amount} EGP</strong> has been submitted. The Academy Owner has been notified to verify and approve it (YES HE ACTUALLY PAID).
                  </p>
                </div>

                {/* WHATSAPP CONFIRMATION BUTTON */}
                <div className="p-4 rounded-2xl bg-[#25D366]/10 border border-[#25D366]/30 text-left space-y-2">
                  <div className="flex items-center gap-2 text-[#25D366] font-bold text-xs">
                    <MessageCircle className="w-4 h-4" />
                    <span>WhatsApp Instant Notification</span>
                  </div>
                  <p className="text-[11px] text-white/70">
                    You can also send your payment receipt details directly to MMS Academy management via WhatsApp now:
                  </p>
                  <button
                    type="button"
                    onClick={() => handleSendWhatsAppConfirmationToAdmin(justSubmittedPayment)}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-black text-xs shadow-md shadow-[#25D366]/20 transition-all flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Send Receipt via WhatsApp to Admin</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowReportModal(false);
                    setSubmitSuccess(false);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitPayment} className="space-y-4">
                {/* 1. PAYMENT METHOD SELECTION */}
                <div>
                  <label className="block text-xs font-bold text-white/80 mb-2 uppercase tracking-wider">
                    Select Payment Method (طريقة السداد) *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'cash', label: 'Cash (نقدي)', sub: 'Pay in academy lab', icon: Banknote },
                      { id: 'instapay', label: 'InstaPay (إنستاباي)', sub: 'Instant bank transfer', icon: Smartphone },
                      { id: 'vodafone_cash', label: 'Vodafone Cash', sub: 'فودافون كاش', icon: Smartphone },
                      { id: 'orange_cash', label: 'Orange Cash', sub: 'أورانج كاش', icon: Smartphone },
                    ].map((m) => {
                      const Icon = m.icon;
                      const isSelected = paymentMethod === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setPaymentMethod(m.id as PaymentMethod)}
                          className={`p-3 rounded-2xl border text-left transition-all ${
                            isSelected
                              ? 'bg-[#BEF264]/20 border-[#BEF264] text-white shadow-md shadow-[#BEF264]/10'
                              : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <Icon className={`w-4 h-4 ${isSelected ? 'text-[#BEF264]' : 'text-white/40'}`} />
                            {isSelected && <Check className="w-3.5 h-3.5 text-[#BEF264]" />}
                          </div>
                          <span className="block text-xs font-bold">{m.label}</span>
                          <span className="block text-[10px] text-white/50">{m.sub}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. AMOUNT & DATE */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-white/80 mb-1">
                      Amount Paid (EGP) *
                    </label>
                    <div className="relative">
                      <DollarSign className="w-4 h-4 text-white/40 absolute left-3 top-3" />
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="e.g. 1200"
                        min="50"
                        max="50000"
                        required
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-white/10 bg-white/5 text-xs text-white placeholder-white/30 focus:border-[#BEF264] focus:ring-1 focus:ring-[#BEF264]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-white/80 mb-1">
                      Payment Date *
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-white/40 absolute left-3 top-3" />
                      <input
                        type="date"
                        value={paymentDate}
                        onChange={(e) => setPaymentDate(e.target.value)}
                        required
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-white/10 bg-white/5 text-xs text-white focus:border-[#BEF264] focus:ring-1 focus:ring-[#BEF264]"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. GROUP / TRACK SELECTION */}
                {groups.length > 0 && (
                  <div>
                    <label className="block text-xs font-bold text-white/80 mb-1">
                      Robotics Group / Track
                    </label>
                    <div className="relative">
                      <Layers className="w-4 h-4 text-white/40 absolute left-3 top-3" />
                      <select
                        value={selectedGroupId}
                        onChange={(e) => setSelectedGroupId(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-white/10 bg-white/5 text-xs text-white focus:border-[#BEF264] focus:ring-1 focus:ring-[#BEF264]"
                      >
                        <option value="" className="bg-[#070E20]">General Tuition / Not Group Specific</option>
                        {groups.map((g) => (
                          <option key={g.id} value={g.id} className="bg-[#070E20]">
                            {g.name} ({g.track} - Level {g.level})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* 4. SENDER PHONE / ACCOUNT */}
                {paymentMethod !== 'cash' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-white/80 mb-1">
                        {paymentMethod === 'instapay'
                          ? 'InstaPay Handle / Sender Phone'
                          : `${formatPaymentMethodLabel(paymentMethod)} Wallet Number`}
                      </label>
                      <input
                        type="text"
                        value={senderPhoneOrAccount}
                        onChange={(e) => setSenderPhoneOrAccount(e.target.value)}
                        placeholder="e.g. 01012345678 or username@instapay"
                        className="w-full px-3 py-2.5 rounded-xl border border-white/10 bg-white/5 text-xs text-white placeholder-white/30 focus:border-[#BEF264] focus:ring-1 focus:ring-[#BEF264]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-white/80 mb-1">
                        Transaction Reference # (Optional)
                      </label>
                      <input
                        type="text"
                        value={transactionReference}
                        onChange={(e) => setTransactionReference(e.target.value)}
                        placeholder="e.g. TRX-9823472"
                        className="w-full px-3 py-2.5 rounded-xl border border-white/10 bg-white/5 text-xs text-white placeholder-white/30 focus:border-[#BEF264] focus:ring-1 focus:ring-[#BEF264]"
                      />
                    </div>
                  </div>
                )}

                {/* 5. NOTES */}
                <div>
                  <label className="block text-xs font-bold text-white/80 mb-1">
                    Notes / Description (Optional)
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={2}
                    placeholder="e.g. Payment for Level 1 Arduino Robot Kit and 4 sessions..."
                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-xs text-white placeholder-white/30 focus:border-[#BEF264] focus:ring-1 focus:ring-[#BEF264]"
                  />
                </div>

                <div className="pt-2">
                  <button
                    id="submit-payment-report-btn"
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 rounded-xl bg-[#BEF264] hover:bg-[#aee64a] text-[#050B1A] font-black text-xs shadow-lg shadow-[#BEF264]/20 transition-all flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isSubmitting ? 'Submitting Payment...' : 'Submit Payment for Admin Approval'}</span>
                  </button>
                  <p className="text-center text-[10px] text-white/40 mt-2">
                    Once submitted, the Owner will inspect the transaction and mark "YES HE ACTUALLY PAID".
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: REJECT REASON MODAL (ADMIN) */}
      {rejectModalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050B1A]/85 backdrop-blur-xl animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-[#070E20] border border-white/15 p-6 space-y-4 text-white shadow-2xl">
            <h3 className="text-sm font-bold text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span>Decline Payment Record</span>
            </h3>
            <p className="text-xs text-white/60">
              Provide a reason why this payment cannot be approved (e.g. transaction not received, incorrect amount):
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="e.g. Amount does not match transaction statement or funds not received..."
              className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-xs text-white placeholder-white/30 focus:border-red-400 focus:ring-1 focus:ring-red-400"
            />
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setRejectModalId(null)}
                className="flex-1 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="flex-1 py-2 px-3 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-black"
              >
                Confirm Decline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
