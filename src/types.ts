export type UserRole = 'admin' | 'coach' | 'student';
export type UserStatus = 'active' | 'pending' | 'rejected';

export interface Coach {
  id: string;
  name: string;
  email: string;
  password?: string;
  age: number;
  phone: string;
  availableDays: string[]; // e.g. ['Saturday', 'Monday', 'Wednesday']
  status: UserStatus;
  createdAt: string;
  hourlyRate?: number;
  specialization?: string[];
  notes?: string;
}

export interface OwnerAccount {
  id: string;
  name: string;
  email?: string;
  createdAt: string;
  isPrimary?: boolean;
}

export type DefaultTrack =
  | 'Arduino'
  | 'WeDo'
  | 'Lego Essential'
  | 'Lego Prime'
  | 'Lego EV3'
  | 'SolidWorks';

export interface CoachAssignmentInfo {
  coachId: string;
  coachName?: string;
  status: 'pending' | 'accepted' | 'rejected';
  respondedAt?: string;
  rejectionReason?: string;
}

export interface Group {
  id: string;
  name: string;
  track: string;
  level: number;
  dayOfWeek: string; // 'Saturday', 'Sunday', etc. (or 'Custom Calendar')
  startTime: string; // '10:00'
  endTime: string;   // '12:00'
  location: string;  // e.g. 'Lab A - Robotics Hub'
  pricePerSession: number; // e.g. 250 EGP
  payrollSplitMode: 'split' | 'full_per_coach'; // how price is calculated when multiple coaches work
  status: 'active' | 'completed' | 'archived';
  isCourseIntensive?: boolean; // Intensive 2-session group
  totalSessions?: number; // default 4, or 2 for intensive, or custom
  assignedCoachIds: string[]; // Junction: multi-coach support
  coachAssignments?: Record<string, CoachAssignmentInfo>; // Status of coach acceptance/rejection
  startDate: string; // YYYY-MM-DD
  customSessionDates?: { sessionNumber: number; date: string; startTime?: string; endTime?: string }[];
  continueDecision?: 'pending_decision' | 'continued' | 'completed_closed';
  continuedGroupId?: string;
  enrolledStudentIds: string[];
  createdAt: string;
}

export interface GroupSession {
  id: string;
  groupId: string;
  groupName: string;
  track: string;
  level: number;
  sessionNumber: number;
  date: string; // YYYY-MM-DD
  startTime: string;
  endTime: string;
  location: string;
  assignedCoachIds: string[]; // specific coaches for this session (handles 1-time emergency substitutions)
  originalCoachIds: string[];
  substituteNotes?: string;
  isCompleted: boolean;
  topic?: string;
  // Postponement & cancellation fields
  isPostponed?: boolean;
  postponedToDate?: string;
  postponeReason?: string;
  originalDate?: string;
  // Makeup session fields
  isMakeup?: boolean;
  makeupStudentId?: string;
  makeupStudentName?: string;
  originalSessionId?: string;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  password?: string;
  phone?: string; // Student mobile / WhatsApp number
  age: number;
  grade?: string;
  school?: string;
  parentName: string;
  parentPhone: string;
  parentEmail?: string;
  level?: number;
  track?: string;
  enrolledGroupIds: string[];
  notes?: string;
  status?: 'active' | 'pending' | 'inactive';
  emergencyContact?: string;
  learningGoals?: string;
  createdAt: string;
}

export type PaymentMethod = 'cash' | 'instapay' | 'orange_cash' | 'vodafone_cash';
export type StudentPaymentStatus = 'pending_approval' | 'approved' | 'rejected';

export interface StudentPaymentRecord {
  id: string;
  studentId: string;
  studentName: string;
  studentPhone?: string;
  parentPhone?: string;
  groupId?: string;
  groupName?: string;
  track?: string;
  amount: number;
  paymentMethod: PaymentMethod;
  senderPhoneOrAccount?: string;
  transactionReference?: string;
  note?: string;
  paymentDate: string; // YYYY-MM-DD
  status: StudentPaymentStatus;
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectionReason?: string;
}

export interface StudentAttendanceEntry {
  studentId: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes?: string;
  makeupScheduled?: boolean;
  makeupSessionId?: string;
}

export interface CoachAttendanceEntry {
  coachId: string;
  status: 'present' | 'absent' | 'substitute';
  attendedHours: number;
  notes?: string;
}

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  groupId: string;
  date: string;
  studentAttendance: StudentAttendanceEntry[];
  coachAttendance: CoachAttendanceEntry[];
  recordedBy: string;
  recordedAt: string;
}

export interface CoachPaymentItem {
  id: string;
  coachId: string;
  coachName: string;
  sessionId?: string;
  groupId?: string;
  groupName?: string;
  track?: string;
  level?: number;
  sessionNumber?: number;
  sessionDate: string;
  amountOwed: number;
  paymentStatus: 'pending' | 'paid';
  paidAt?: string;
  paymentMethod?: string;
  isSubstitute?: boolean;
  isBonus?: boolean;
  type?: 'session' | 'bonus';
  notes?: string;
}

export interface MakeupSessionItem {
  id: string;
  studentId: string;
  studentName: string;
  coachId: string;
  coachName: string;
  originalSessionId?: string;
  originalGroupId?: string;
  groupName?: string;
  track: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  topic?: string;
  notes?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  targetRole: 'admin' | 'coach' | 'all';
  coachId?: string;
  coachName?: string;
  groupId?: string;
  groupName?: string;
  rejectionReason?: string;
  title: string;
  titleAr?: string;
  message: string;
  messageAr?: string;
  type: 'session_reminder' | 'substitution' | 'approval' | 'system' | 'group_assignment' | 'assignment_rejected' | 'assignment_accepted' | 'session_postponed' | 'bonus_awarded' | 'makeup_scheduled' | 'general';
  createdAt: string;
  isRead: boolean;
  link?: string;
}

export type Language = 'en' | 'ar';
export type ThemeMode = 'dark' | 'light';

