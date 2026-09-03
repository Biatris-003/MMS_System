import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import {
  Coach,
  Group,
  GroupSession,
  Student,
  AttendanceRecord,
  CoachPaymentItem,
  NotificationItem,
  OwnerAccount,
  MakeupSessionItem,
  StudentPaymentRecord,
} from './src/types';

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(process.cwd(), 'public')));
app.use('/public', express.static(path.join(process.cwd(), 'public')));

// In-memory or file-backed database store
interface DBState {
  owners: OwnerAccount[];
  coaches: Coach[];
  students: Student[];
  groups: Group[];
  sessions: GroupSession[];
  attendance: AttendanceRecord[];
  payments: CoachPaymentItem[];
  studentPayments: StudentPaymentRecord[];
  notifications: NotificationItem[];
  makeups: MakeupSessionItem[];
  customTracks: string[];
}

const DB_FILE = path.join(process.cwd(), 'academy_data.json');

// Initial Seed Data - Clean and empty of examples
const getInitialData = (): DBState => {
  const owners: OwnerAccount[] = [
    {
      id: 'owner-1',
      name: 'Academy Director (Owner)',
      email: 'owner@mmsacademy.edu',
      createdAt: new Date().toISOString(),
      isPrimary: true,
    },
  ];

  return {
    owners,
    coaches: [],
    students: [],
    groups: [],
    sessions: [],
    attendance: [],
    payments: [],
    studentPayments: [],
    notifications: [],
    makeups: [],
    customTracks: ['Arduino', 'WeDo', 'Lego Essential', 'Lego Prime', 'Lego EV3', 'SolidWorks'],
  };
};

// Database persistence helper
let db: DBState;

function loadDB(): DBState {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      return {
        owners: Array.isArray(parsed.owners) ? parsed.owners : [],
        coaches: Array.isArray(parsed.coaches) ? parsed.coaches : [],
        students: Array.isArray(parsed.students) ? parsed.students : [],
        groups: Array.isArray(parsed.groups) ? parsed.groups : [],
        sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
        attendance: Array.isArray(parsed.attendance) ? parsed.attendance : [],
        payments: Array.isArray(parsed.payments) ? parsed.payments : [],
        studentPayments: Array.isArray(parsed.studentPayments) ? parsed.studentPayments : [],
        notifications: Array.isArray(parsed.notifications) ? parsed.notifications : [],
        makeups: Array.isArray(parsed.makeups) ? parsed.makeups : [],
        customTracks: Array.isArray(parsed.customTracks) ? parsed.customTracks : ['Arduino', 'WeDo', 'Lego Essential', 'Lego Prime', 'Lego EV3', 'SolidWorks'],
      };
    }
  } catch (err) {
    console.error('Error loading DB file, fallback to seed data:', err);
  }
  const initial = getInitialData();
  saveDB(initial);
  return initial;
}

function saveDB(state: DBState): void {
  db = state;
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write academy_data.json:', err);
  }
}

db = loadDB();

// Conflict Checker Helper
function checkCoachConflict(
  coachId: string,
  dayOfWeek: string,
  startTime: string,
  endTime: string,
  excludeGroupId?: string
): { hasConflict: boolean; conflictingGroup?: Group } {
  const matchingGroups = db.groups.filter((g) => {
    if (g.status === 'archived') return false;
    if (excludeGroupId && g.id === excludeGroupId) return false;
    if (g.dayOfWeek.toLowerCase() !== dayOfWeek.toLowerCase()) return false;
    if (!g.assignedCoachIds.includes(coachId)) return false;

    // Check time overlap: [startTime, endTime] overlaps if max(start1, start2) < min(end1, end2)
    return startTime < g.endTime && g.startTime < endTime;
  });

  if (matchingGroups.length > 0) {
    return { hasConflict: true, conflictingGroup: matchingGroups[0] };
  }
  return { hasConflict: false };
}

// ----------------------------------------------------
// AUTH API ENDPOINTS
// ----------------------------------------------------

// 1. Owner Login via fixed passcode
app.post('/api/auth/login-owner', (req: Request, res: Response) => {
  const { passcode } = req.body;
  // Fixed Master Password requirement: 12345@@@
  if (passcode === '12345@@@') {
    return res.json({
      success: true,
      role: 'admin',
      user: {
        id: 'owner-master',
        name: 'MMS Academy Director',
        role: 'admin',
        email: 'director@mmsacademy.edu',
      },
    });
  }
  return res.status(401).json({ success: false, message: 'Invalid Master Passcode' });
});

// 2. Coach Login
app.post('/api/auth/login-coach', (req: Request, res: Response) => {
  const { email, password } = req.body;
  const coach = db.coaches.find(
    (c) => c.email.toLowerCase() === (email || '').trim().toLowerCase()
  );

  if (!coach || coach.password !== password) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  if (coach.status === 'pending') {
    return res.status(403).json({
      success: false,
      status: 'pending',
      message: 'Account is pending Owner approval',
    });
  }

  if (coach.status === 'rejected') {
    return res.status(403).json({
      success: false,
      status: 'rejected',
      message: 'Account has been rejected by administration',
    });
  }

  return res.json({
    success: true,
    role: 'coach',
    user: {
      id: coach.id,
      name: coach.name,
      email: coach.email,
      role: 'coach',
      phone: coach.phone,
      age: coach.age,
      availableDays: coach.availableDays,
    },
  });
});

// 3. Coach Sign Up (Coaches only)
app.post('/api/auth/signup-coach', (req: Request, res: Response) => {
  const { name, email, password, age, phone, availableDays, specialization, notes } = req.body;

  if (!name || !email || !password || !phone) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const existing = db.coaches.find(
    (c) => c.email.toLowerCase() === email.trim().toLowerCase()
  );
  if (existing) {
    return res.status(409).json({ error: 'A coach with this email already exists' });
  }

  const newCoach: Coach = {
    id: `c-${Date.now()}`,
    name,
    email: email.trim().toLowerCase(),
    password,
    age: Number(age) || 24,
    phone,
    availableDays: Array.isArray(availableDays) ? availableDays : [],
    status: 'pending', // Account status is "Pending" until Owner approves it
    createdAt: new Date().toISOString(),
    hourlyRate: 120,
    specialization: specialization || [],
    notes: notes || '',
  };

  db.coaches.push(newCoach);

  // Notify Owner
  db.notifications.unshift({
    id: `notif-${Date.now()}`,
    targetRole: 'admin',
    title: `New Coach Application: ${newCoach.name}`,
    titleAr: `طلب انضمام مدرب جديد: ${newCoach.name}`,
    message: `${newCoach.name} (${newCoach.phone}) has signed up and is waiting for approval.`,
    messageAr: `سجل ${newCoach.name} (${newCoach.phone}) حسابه وهو بانتظار موافقتك.`,
    type: 'approval',
    createdAt: new Date().toISOString(),
    isRead: false,
    link: '/coaches',
  });

  saveDB(db);

  return res.json({
    success: true,
    message: 'Registered successfully. Awaiting Owner approval.',
    coach: { id: newCoach.id, name: newCoach.name, status: newCoach.status },
  });
});

// 4. Student Login
app.post('/api/auth/login-student', (req: Request, res: Response) => {
  const { email, password } = req.body;
  const normalizedEmail = (email || '').trim().toLowerCase();
  const student = db.students.find(
    (s) =>
      (s.email && s.email.toLowerCase() === normalizedEmail) ||
      (s.parentEmail && s.parentEmail.toLowerCase() === normalizedEmail)
  );

  if (!student || (student.password && student.password !== password)) {
    return res.status(401).json({ success: false, message: 'Invalid student email or password' });
  }

  return res.json({
    success: true,
    role: 'student',
    user: {
      id: student.id,
      name: student.name,
      email: student.email || student.parentEmail || '',
      role: 'student',
      age: student.age,
      level: student.level || 1,
      track: student.track || 'Arduino',
      grade: student.grade || '',
      school: student.school || '',
      phone: student.phone || student.parentPhone || '',
      parentName: student.parentName,
      parentPhone: student.parentPhone,
      parentEmail: student.parentEmail,
      emergencyContact: student.emergencyContact,
      learningGoals: student.learningGoals,
      enrolledGroupIds: student.enrolledGroupIds || [],
    },
  });
});

// 5. Student Sign Up (Students/Parents register themselves)
app.post('/api/auth/signup-student', (req: Request, res: Response) => {
  const {
    name,
    email,
    password,
    phone,
    age,
    parentName,
    parentPhone,
    parentEmail,
    track,
    grade,
    school,
    notes,
    emergencyContact,
    learningGoals,
  } = req.body;

  if (!name || !email || !password || !parentPhone) {
    return res.status(400).json({ error: 'Please provide all required fields (Name, Email, Password, Parent Phone)' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existing = db.students.find(
    (s) =>
      (s.email && s.email.toLowerCase() === normalizedEmail) ||
      (s.parentEmail && s.parentEmail.toLowerCase() === normalizedEmail)
  );
  if (existing) {
    return res.status(409).json({ error: 'A student with this email address is already registered' });
  }

  const newStudent: Student = {
    id: `s-${Date.now()}`,
    name,
    email: normalizedEmail,
    password,
    phone: phone || parentPhone || '',
    age: Number(age) || 10,
    grade: grade || '',
    school: school || '',
    parentName: parentName || '',
    parentPhone: parentPhone || '',
    parentEmail: (parentEmail || email || '').trim().toLowerCase(),
    level: 1, // Default initial level
    track: track || 'Arduino',
    enrolledGroupIds: [],
    notes: notes || '',
    status: 'active',
    emergencyContact: emergencyContact || '',
    learningGoals: learningGoals || '',
    createdAt: new Date().toISOString(),
  };

  db.students.push(newStudent);

  // Notify Owner of new student registration
  db.notifications.unshift({
    id: `notif-${Date.now()}`,
    targetRole: 'admin',
    title: `New Student Registration: ${newStudent.name}`,
    titleAr: `تسجيل طالب جديد: ${newStudent.name}`,
    message: `${newStudent.name} (Age: ${newStudent.age}, Track: ${newStudent.track}) registered online. Please assign to a group and coach.`,
    messageAr: `سجل الطالب الجديد ${newStudent.name} (العمر: ${newStudent.age}، المسار: ${newStudent.track}). يرجى تعيين المجموعة والمدرب له.`,
    type: 'general',
    createdAt: new Date().toISOString(),
    isRead: false,
    link: '/students',
  });

  saveDB(db);

  return res.json({
    success: true,
    message: 'Student account registered successfully! You can now log in.',
    student: newStudent,
  });
});

// 6. Forgot Password (Dispatches recovery info to registered email)
app.post('/api/auth/forgot-password', (req: Request, res: Response) => {
  const { role, email } = req.body;
  const normalizedEmail = (email || '').trim().toLowerCase();

  if (!normalizedEmail) {
    return res.status(400).json({ error: 'Please enter your registered email address' });
  }

  if (role === 'owner' || role === 'admin') {
    const isDirector =
      normalizedEmail === 'director@mmsacademy.edu' ||
      normalizedEmail === 'owner@mmsacademy.edu' ||
      db.owners.some((o) => o.email && o.email.toLowerCase() === normalizedEmail);

    if (!isDirector) {
      return res.status(404).json({
        error: 'No owner account found matching this registered email address.',
      });
    }

    const resetToken = `MMS-PASS-${Math.floor(100000 + Math.random() * 900000)}`;

    db.notifications.unshift({
      id: `notif-${Date.now()}`,
      targetRole: 'admin',
      title: 'Owner Passcode Reminder Dispatched',
      titleAr: 'تم إرسال تذكير كلمة مرور المالك',
      message: `Password reset requested for Owner email: ${normalizedEmail}. Master Passcode: 12345@@@ (Reset code: ${resetToken})`,
      messageAr: `تم إرسال تذكير كلمة مرور المالك للبريد: ${normalizedEmail}. كلمة المرور هي: 12345@@@`,
      type: 'general',
      createdAt: new Date().toISOString(),
      isRead: false,
    });
    saveDB(db);

    return res.json({
      success: true,
      message: `A passcode reminder has been sent to your registered email (${normalizedEmail}).`,
      sentToEmail: normalizedEmail,
      hint: 'Your Master Passcode is: 12345@@@',
      resetCode: resetToken,
    });
  }

  if (role === 'coach') {
    const coach = db.coaches.find((c) => c.email.toLowerCase() === normalizedEmail);
    if (!coach) {
      return res.status(404).json({
        error: 'No coach account found with this registered email address.',
      });
    }

    const resetToken = `MMS-COACH-${Math.floor(100000 + Math.random() * 900000)}`;

    db.notifications.unshift({
      id: `notif-${Date.now()}`,
      targetRole: 'coach',
      coachId: coach.id,
      title: 'Password Reset Request',
      titleAr: 'طلب استعادة كلمة المرور',
      message: `A password reset link was requested for coach account (${coach.email}). Recovery code: ${resetToken}`,
      messageAr: `تم إرسال تعليمات إعادة تعيين كلمة المرور لحساب المدرب (${coach.email}). كود الاستعادة: ${resetToken}`,
      type: 'general',
      createdAt: new Date().toISOString(),
      isRead: false,
    });
    saveDB(db);

    return res.json({
      success: true,
      message: `Password recovery instructions have been sent to registered email ${coach.email}.`,
      sentToEmail: coach.email,
      userName: coach.name,
      currentPassword: coach.password,
      resetCode: resetToken,
    });
  }

  if (role === 'student') {
    const student = db.students.find(
      (s) =>
        (s.email && s.email.toLowerCase() === normalizedEmail) ||
        (s.parentEmail && s.parentEmail.toLowerCase() === normalizedEmail)
    );
    if (!student) {
      return res.status(404).json({
        error: 'No student account found with this registered email address.',
      });
    }

    const targetEmail = student.email || student.parentEmail || normalizedEmail;
    const resetToken = `MMS-STU-${Math.floor(100000 + Math.random() * 900000)}`;

    db.notifications.unshift({
      id: `notif-${Date.now()}`,
      targetRole: 'admin',
      title: `Student Password Reset Request: ${student.name}`,
      titleAr: `طلب استعادة كلمة مرور الطالب: ${student.name}`,
      message: `Password reset instructions sent to student email ${targetEmail}. Recovery code: ${resetToken}`,
      messageAr: `تم إرسال كود الاستعادة لبريد الطالب/ولي الأمر: ${targetEmail}`,
      type: 'general',
      createdAt: new Date().toISOString(),
      isRead: false,
    });
    saveDB(db);

    return res.json({
      success: true,
      message: `Password recovery instructions have been sent to registered email ${targetEmail}.`,
      sentToEmail: targetEmail,
      userName: student.name,
      currentPassword: student.password,
      resetCode: resetToken,
    });
  }

  return res.status(400).json({ error: 'Please specify a valid account role.' });
});

// 7. Reset Password with new password
app.post('/api/auth/reset-password', (req: Request, res: Response) => {
  const { role, email, newPassword } = req.body;
  const normalizedEmail = (email || '').trim().toLowerCase();

  if (!newPassword || newPassword.length < 4) {
    return res.status(400).json({ error: 'New password must be at least 4 characters long.' });
  }

  if (role === 'coach') {
    const coach = db.coaches.find((c) => c.email.toLowerCase() === normalizedEmail);
    if (!coach) return res.status(404).json({ error: 'Coach account not found.' });
    coach.password = newPassword;
    saveDB(db);
    return res.json({ success: true, message: 'Password updated successfully! You can now log in.' });
  }

  if (role === 'student') {
    const student = db.students.find(
      (s) =>
        (s.email && s.email.toLowerCase() === normalizedEmail) ||
        (s.parentEmail && s.parentEmail.toLowerCase() === normalizedEmail)
    );
    if (!student) return res.status(404).json({ error: 'Student account not found.' });
    student.password = newPassword;
    saveDB(db);
    return res.json({ success: true, message: 'Password updated successfully! You can now log in.' });
  }

  return res.status(400).json({ error: 'Password reset is not applicable for this role.' });
});

// ----------------------------------------------------
// COACH MANAGEMENT API
// ----------------------------------------------------
app.get('/api/coaches', (req: Request, res: Response) => {
  res.json(db.coaches);
});

app.post('/api/coaches', (req: Request, res: Response) => {
  // Respect User Constraint: Admin/owner cannot create coach accounts directly.
  return res.status(403).json({
    error: 'Administrators cannot create coach accounts directly. Coaches must register through the Coach Sign Up page.',
  });
});

app.put('/api/coaches/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = db.coaches.findIndex((c) => c.id === id);
  if (index === -1) return res.status(404).json({ error: 'Coach not found' });

  db.coaches[index] = {
    ...db.coaches[index],
    ...req.body,
    id, // protect ID
  };
  saveDB(db);
  res.json(db.coaches[index]);
});

app.patch('/api/coaches/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body; // 'active' | 'rejected'
  const coach = db.coaches.find((c) => c.id === id);
  if (!coach) return res.status(404).json({ error: 'Coach not found' });

  coach.status = status;

  // Add notification for coach
  db.notifications.unshift({
    id: `notif-${Date.now()}`,
    targetRole: 'coach',
    coachId: coach.id,
    title: status === 'active' ? 'Account Approved!' : 'Account Update',
    titleAr: status === 'active' ? 'تمت الموافقة على حسابك!' : 'تحديث الحساب',
    message:
      status === 'active'
        ? 'Your coach account has been approved by the Owner. You can now access your schedule!'
        : 'Your account application was reviewed by the Owner.',
    messageAr:
      status === 'active'
        ? 'تم تفعيل حسابك كمدرب من قبل إدارة الأكاديمية. يمكنك الآن متابعة جدولك!'
        : 'تمت مراجعة طلب الحساب من قبل الإدارة.',
    type: 'approval',
    createdAt: new Date().toISOString(),
    isRead: false,
  });

  saveDB(db);
  res.json({ success: true, coach });
});

app.delete('/api/coaches/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  db.coaches = db.coaches.filter((c) => c.id !== id);
  // Also remove from groups
  db.groups.forEach((g) => {
    g.assignedCoachIds = g.assignedCoachIds.filter((cid) => cid !== id);
  });
  saveDB(db);
  res.json({ success: true });
});

// ----------------------------------------------------
// STUDENT MANAGEMENT API
// ----------------------------------------------------
app.get('/api/students', (req: Request, res: Response) => {
  res.json(db.students);
});

app.post('/api/students', (req: Request, res: Response) => {
  // Respect User Constraint: Admin/owner cannot create student accounts directly.
  return res.status(403).json({
    error: 'Administrators cannot create student accounts directly. Students/parents must register through the Student Sign Up page.',
  });
});

app.put('/api/students/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = db.students.findIndex((s) => s.id === id);
  if (index === -1) return res.status(404).json({ error: 'Student not found' });

  const oldEnrollments = db.students[index].enrolledGroupIds || [];
  const updatedStudent: Student = {
    ...db.students[index],
    ...req.body,
    id,
  };

  db.students[index] = updatedStudent;

  // Sync group enrollments
  const newEnrollments = updatedStudent.enrolledGroupIds || [];
  db.groups.forEach((grp) => {
    if (newEnrollments.includes(grp.id) && !grp.enrolledStudentIds.includes(id)) {
      grp.enrolledStudentIds.push(id);
    } else if (!newEnrollments.includes(grp.id) && grp.enrolledStudentIds.includes(id)) {
      grp.enrolledStudentIds = grp.enrolledStudentIds.filter((sid) => sid !== id);
    }
  });

  saveDB(db);
  res.json(updatedStudent);
});

app.delete('/api/students/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  db.students = db.students.filter((s) => s.id !== id);
  db.groups.forEach((g) => {
    g.enrolledStudentIds = g.enrolledStudentIds.filter((sid) => sid !== id);
  });
  saveDB(db);
  res.json({ success: true });
});

// ----------------------------------------------------
// GROUP & 4-WEEK PROGRESSION MANAGEMENT API
// ----------------------------------------------------
app.get('/api/groups', (req: Request, res: Response) => {
  res.json(db.groups);
});

// Conflict checker endpoint
app.post('/api/groups/check-conflict', (req: Request, res: Response) => {
  const { coachIds, dayOfWeek, startTime, endTime, excludeGroupId } = req.body;
  const conflicts: { coachId: string; coachName: string; conflictingGroupName: string }[] = [];

  (coachIds || []).forEach((cid: string) => {
    const conflictResult = checkCoachConflict(cid, dayOfWeek, startTime, endTime, excludeGroupId);
    if (conflictResult.hasConflict && conflictResult.conflictingGroup) {
      const coach = db.coaches.find((c) => c.id === cid);
      conflicts.push({
        coachId: cid,
        coachName: coach ? coach.name : cid,
        conflictingGroupName: conflictResult.conflictingGroup.name,
      });
    }
  });

  res.json({ hasConflict: conflicts.length > 0, conflicts });
});

app.post('/api/groups', (req: Request, res: Response) => {
  const {
    track,
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
    isCourseIntensive,
    totalSessions,
    customSessionDates,
  } = req.body;

  const countSessions = Number(totalSessions) || (isCourseIntensive ? 2 : 4);
  const groupId = `grp-${Date.now()}`;
  const intensiveTag = isCourseIntensive || countSessions === 2 ? ' (Intensive)' : '';
  const groupName = `${track} - Level ${level}${intensiveTag} (${dayOfWeek} ${startTime})`;

  const newGroup: Group = {
    id: groupId,
    name: groupName,
    track,
    level: Number(level) || 1,
    dayOfWeek,
    startTime: startTime || '10:00',
    endTime: endTime || '12:00',
    location: location || 'Robotics Lab',
    pricePerSession: Number(pricePerSession) || 200,
    payrollSplitMode: payrollSplitMode || 'full_per_coach',
    status: 'active',
    isCourseIntensive: !!isCourseIntensive || countSessions === 2,
    totalSessions: countSessions,
    assignedCoachIds: assignedCoachIds || [],
    coachAssignments: {},
    startDate: startDate || new Date().toISOString().split('T')[0],
    customSessionDates: customSessionDates || undefined,
    enrolledStudentIds: enrolledStudentIds || [],
    createdAt: new Date().toISOString(),
  };

  // Initialize coach assignments and notify coaches
  if (Array.isArray(assignedCoachIds)) {
    assignedCoachIds.forEach((cid: string) => {
      const coach = db.coaches.find((c) => c.id === cid);
      if (newGroup.coachAssignments) {
        newGroup.coachAssignments[cid] = {
          coachId: cid,
          coachName: coach?.name || cid,
          status: 'pending',
        };
      }
      db.notifications.unshift({
        id: `notif-${Date.now()}-${cid}`,
        targetRole: 'coach',
        coachId: cid,
        coachName: coach?.name,
        groupId: newGroup.id,
        groupName: newGroup.name,
        title: `New Group Assignment: ${newGroup.name}`,
        titleAr: `تكليف مجموعة جديدة: ${newGroup.name}`,
        message: `You have been assigned to teach "${newGroup.name}" on ${dayOfWeek} at ${newGroup.startTime} in ${newGroup.location}. Total ${countSessions} sessions. Please accept or decline this assignment.`,
        messageAr: `تم تعيينك لتدريس مجموعة "${newGroup.name}" يوم ${dayOfWeek} الساعة ${newGroup.startTime} في ${newGroup.location} (إجمالي ${countSessions} جلسات). يرجى تأكيد القبول أو الاعتذار.`,
        type: 'group_assignment',
        createdAt: new Date().toISOString(),
        isRead: false,
        link: '/groups',
      });
    });
  }

  db.groups.push(newGroup);

  // Generate sessions either from interactive custom calendar dates OR repeating weekly
  if (Array.isArray(customSessionDates) && customSessionDates.length > 0) {
    customSessionDates.forEach((csd: any, idx: number) => {
      const sessionNum = csd.sessionNumber || (idx + 1);
      const session: GroupSession = {
        id: `sess-${groupId}-${sessionNum}`,
        groupId: newGroup.id,
        groupName: newGroup.name,
        track: newGroup.track,
        level: newGroup.level,
        sessionNumber: sessionNum,
        date: csd.date,
        startTime: csd.startTime || newGroup.startTime,
        endTime: csd.endTime || newGroup.endTime,
        location: newGroup.location,
        assignedCoachIds: [...newGroup.assignedCoachIds],
        originalCoachIds: [...newGroup.assignedCoachIds],
        isCompleted: false,
        topic: `Session ${sessionNum}: Core hands-on module for Level ${newGroup.level}`,
      };
      db.sessions.push(session);
    });
  } else {
    // Generate weekly recurring sessions for countSessions count (e.g. 2 for intensive, 4 for standard)
    const baseDate = new Date(newGroup.startDate);
    for (let i = 1; i <= countSessions; i++) {
      const sessionDate = new Date(baseDate);
      sessionDate.setDate(baseDate.getDate() + (i - 1) * 7);
      const dateStr = sessionDate.toISOString().split('T')[0];

      const session: GroupSession = {
        id: `sess-${groupId}-${i}`,
        groupId: newGroup.id,
        groupName: newGroup.name,
        track: newGroup.track,
        level: newGroup.level,
        sessionNumber: i,
        date: dateStr,
        startTime: newGroup.startTime,
        endTime: newGroup.endTime,
        location: newGroup.location,
        assignedCoachIds: [...newGroup.assignedCoachIds],
        originalCoachIds: [...newGroup.assignedCoachIds],
        isCompleted: false,
        topic: `Session ${i}: Core hands-on module for Level ${newGroup.level}`,
      };
      db.sessions.push(session);
    }
  }

  // Update students enrollment
  if (Array.isArray(enrolledStudentIds)) {
    enrolledStudentIds.forEach((sid) => {
      const student = db.students.find((s) => s.id === sid);
      if (student && !student.enrolledGroupIds.includes(groupId)) {
        student.enrolledGroupIds.push(groupId);
      }
    });
  }

  saveDB(db);
  res.json(newGroup);
});

app.put('/api/groups/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = db.groups.findIndex((g) => g.id === id);
  if (index === -1) return res.status(404).json({ error: 'Group not found' });

  const currentGroup = db.groups[index];
  const oldCoachIds = currentGroup.assignedCoachIds || [];
  const updatedData = req.body;
  const newCoachIds: string[] = updatedData.assignedCoachIds || oldCoachIds;

  const coachAssignments = { ...(currentGroup.coachAssignments || {}) };

  // Notify newly added coaches
  newCoachIds.forEach((cid) => {
    if (!oldCoachIds.includes(cid)) {
      const coach = db.coaches.find((c) => c.id === cid);
      coachAssignments[cid] = {
        coachId: cid,
        coachName: coach?.name || cid,
        status: 'pending',
      };
      db.notifications.unshift({
        id: `notif-${Date.now()}-${cid}`,
        targetRole: 'coach',
        coachId: cid,
        coachName: coach?.name,
        groupId: currentGroup.id,
        groupName: updatedData.name || currentGroup.name,
        title: `New Group Assignment: ${updatedData.name || currentGroup.name}`,
        titleAr: `تكليف مجموعة جديدة: ${updatedData.name || currentGroup.name}`,
        message: `You have been assigned to teach "${updatedData.name || currentGroup.name}". Please accept or decline this assignment.`,
        messageAr: `تم تعيينك لتدريس مجموعة "${updatedData.name || currentGroup.name}". يرجى تأكيد القبول أو الاعتذار مع ذكر السبب.`,
        type: 'group_assignment',
        createdAt: new Date().toISOString(),
        isRead: false,
        link: '/groups',
      });
    }
  });

  db.groups[index] = {
    ...currentGroup,
    ...updatedData,
    coachAssignments,
    id,
  };
  saveDB(db);
  res.json(db.groups[index]);
});

// Coach Response to Group Assignment (Accept or Decline with Reason)
app.post('/api/groups/:id/respond-assignment', (req: Request, res: Response) => {
  const { id } = req.params;
  const { coachId, response: respStatus, reason } = req.body;
  const group = db.groups.find((g) => g.id === id);
  if (!group) return res.status(404).json({ error: 'Group not found' });

  const coach = db.coaches.find((c) => c.id === coachId);
  const coachName = coach ? coach.name : coachId;

  if (!group.coachAssignments) {
    group.coachAssignments = {};
  }

  const statusValue = respStatus === 'rejected' ? 'rejected' : 'accepted';
  const cleanReason = (reason || '').trim();

  group.coachAssignments[coachId] = {
    coachId,
    coachName,
    status: statusValue,
    respondedAt: new Date().toISOString(),
    rejectionReason: statusValue === 'rejected' ? (cleanReason || 'No specific reason provided') : undefined,
  };

  // Create real-time notification targeted to Owner (Admin)
  if (statusValue === 'rejected') {
    db.notifications.unshift({
      id: `notif-${Date.now()}-admin-rej`,
      targetRole: 'admin',
      coachId,
      coachName,
      groupId: group.id,
      groupName: group.name,
      rejectionReason: cleanReason || 'No specific reason provided',
      title: `Coach ${coachName} Declined Assignment: ${group.name}`,
      titleAr: `اعتذر المدرب ${coachName} عن استلام مجموعة: ${group.name}`,
      message: `Coach ${coachName} has declined the assignment for "${group.name}". Reason provided: "${cleanReason || 'No specific reason provided'}". Please reassign a replacement coach.`,
      messageAr: `اعتذر المدرب ${coachName} عن تدريس مجموعة "${group.name}". السبب: "${cleanReason || 'لم يتم ذكر سبب محدد'}". يرجى مراجعة الجدول وتعيين مدرب بديل.`,
      type: 'assignment_rejected',
      createdAt: new Date().toISOString(),
      isRead: false,
      link: '/groups',
    });
  } else {
    db.notifications.unshift({
      id: `notif-${Date.now()}-admin-acc`,
      targetRole: 'admin',
      coachId,
      coachName,
      groupId: group.id,
      groupName: group.name,
      title: `Coach ${coachName} Accepted Group: ${group.name}`,
      titleAr: `أكد المدرب ${coachName} استلام المجموعة: ${group.name}`,
      message: `Coach ${coachName} has accepted and confirmed the schedule for "${group.name}".`,
      messageAr: `أكد المدرب ${coachName} استلامه وموافقته على جدول مجموعة "${group.name}".`,
      type: 'assignment_accepted',
      createdAt: new Date().toISOString(),
      isRead: false,
      link: '/groups',
    });
  }

  saveDB(db);
  res.json({ success: true, group });
});

// Owner Reassign Coach Endpoint
app.post('/api/groups/:id/reassign-coach', (req: Request, res: Response) => {
  const { id } = req.params;
  const { oldCoachId, newCoachId } = req.body;
  const group = db.groups.find((g) => g.id === id);
  if (!group) return res.status(404).json({ error: 'Group not found' });

  const newCoach = db.coaches.find((c) => c.id === newCoachId);
  if (!newCoach) return res.status(404).json({ error: 'New coach not found' });

  // Replace oldCoachId with newCoachId in assignedCoachIds
  group.assignedCoachIds = group.assignedCoachIds.map((cid) => (cid === oldCoachId ? newCoachId : cid));
  if (!group.assignedCoachIds.includes(newCoachId)) {
    group.assignedCoachIds.push(newCoachId);
  }

  // Update future sessions
  db.sessions.forEach((s) => {
    if (s.groupId === id && !s.isCompleted) {
      s.assignedCoachIds = s.assignedCoachIds.map((cid) => (cid === oldCoachId ? newCoachId : cid));
      if (!s.assignedCoachIds.includes(newCoachId)) {
        s.assignedCoachIds.push(newCoachId);
      }
    }
  });

  if (!group.coachAssignments) group.coachAssignments = {};
  delete group.coachAssignments[oldCoachId];
  group.coachAssignments[newCoachId] = {
    coachId: newCoachId,
    coachName: newCoach.name,
    status: 'pending',
  };

  // Notify the replacement coach
  db.notifications.unshift({
    id: `notif-${Date.now()}-${newCoachId}`,
    targetRole: 'coach',
    coachId: newCoachId,
    coachName: newCoach.name,
    groupId: group.id,
    groupName: group.name,
    title: `New Group Assignment: ${group.name}`,
    titleAr: `تكليف مجموعة جديدة: ${group.name}`,
    message: `You have been assigned to teach "${group.name}" on ${group.dayOfWeek} at ${group.startTime} in ${group.location}. Please accept or decline this assignment.`,
    messageAr: `تم تعيينك لتدريس مجموعة "${group.name}" يوم ${group.dayOfWeek} الساعة ${group.startTime} في ${group.location}. يرجى تأكيد القبول أو الاعتذار مع ذكر السبب.`,
    type: 'group_assignment',
    createdAt: new Date().toISOString(),
    isRead: false,
    link: '/groups',
  });

  saveDB(db);
  res.json({ success: true, group });
});

app.delete('/api/groups/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  db.groups = db.groups.filter((g) => g.id !== id);
  db.sessions = db.sessions.filter((s) => s.groupId !== id);
  db.attendance = db.attendance.filter((a) => a.groupId !== id);
  db.payments = db.payments.filter((p) => p.groupId !== id);
  db.students.forEach((s) => {
    s.enrolledGroupIds = s.enrolledGroupIds.filter((gid) => gid !== id);
  });
  saveDB(db);
  res.json({ success: true });
});

// Group Level Advancement / Promotion ("Should this group continue to a new level or not?")
app.post('/api/groups/:id/continue', (req: Request, res: Response) => {
  const { id } = req.params;
  const { action, nextLevel, nextStartDate, pricePerSession } = req.body; // action: 'continue' | 'finish'
  const oldGroup = db.groups.find((g) => g.id === id);
  if (!oldGroup) return res.status(404).json({ error: 'Group not found' });

  if (action === 'finish') {
    oldGroup.status = 'completed';
    oldGroup.continueDecision = 'completed_closed';
    saveDB(db);
    return res.json({ success: true, message: 'Group completed and closed.' });
  }

  // Create new continued group for Level N+1
  const targetLevel = Number(nextLevel) || oldGroup.level + 1;
  const newGroupId = `grp-${Date.now()}`;
  const newGroupName = `${oldGroup.track} - Level ${targetLevel} (${oldGroup.dayOfWeek} ${oldGroup.startTime})`;

  // Calculate start date: 7 days after previous group's 4th session, or user specified
  const lastSession = db.sessions
    .filter((s) => s.groupId === id)
    .sort((a, b) => b.sessionNumber - a.sessionNumber)[0];

  let calculatedStartDate = nextStartDate;
  if (!calculatedStartDate) {
    if (lastSession) {
      const d = new Date(lastSession.date);
      d.setDate(d.getDate() + 7);
      calculatedStartDate = d.toISOString().split('T')[0];
    } else {
      calculatedStartDate = new Date().toISOString().split('T')[0];
    }
  }

  const newGroup: Group = {
    id: newGroupId,
    name: newGroupName,
    track: oldGroup.track,
    level: targetLevel,
    dayOfWeek: oldGroup.dayOfWeek,
    startTime: oldGroup.startTime,
    endTime: oldGroup.endTime,
    location: oldGroup.location,
    pricePerSession: Number(pricePerSession) || oldGroup.pricePerSession,
    payrollSplitMode: oldGroup.payrollSplitMode,
    status: 'active',
    assignedCoachIds: [...oldGroup.assignedCoachIds],
    startDate: calculatedStartDate,
    enrolledStudentIds: [...oldGroup.enrolledStudentIds],
    createdAt: new Date().toISOString(),
  };

  // Mark old group as continued
  oldGroup.status = 'completed';
  oldGroup.continueDecision = 'continued';
  oldGroup.continuedGroupId = newGroupId;

  db.groups.push(newGroup);

  // Generate 4 sessions for the promoted level
  const baseDate = new Date(newGroup.startDate);
  for (let i = 1; i <= 4; i++) {
    const sessionDate = new Date(baseDate);
    sessionDate.setDate(baseDate.getDate() + (i - 1) * 7);
    const dateStr = sessionDate.toISOString().split('T')[0];

    const session: GroupSession = {
      id: `sess-${newGroupId}-${i}`,
      groupId: newGroup.id,
      groupName: newGroup.name,
      track: newGroup.track,
      level: newGroup.level,
      sessionNumber: i as 1 | 2 | 3 | 4,
      date: dateStr,
      startTime: newGroup.startTime,
      endTime: newGroup.endTime,
      location: newGroup.location,
      assignedCoachIds: [...newGroup.assignedCoachIds],
      originalCoachIds: [...newGroup.assignedCoachIds],
      isCompleted: false,
      topic: `Session ${i}: Advanced modules for Level ${newGroup.level}`,
    };
    db.sessions.push(session);
  }

  // Update student enrollments
  newGroup.enrolledStudentIds.forEach((sid) => {
    const student = db.students.find((s) => s.id === sid);
    if (student && !student.enrolledGroupIds.includes(newGroupId)) {
      student.enrolledGroupIds.push(newGroupId);
    }
  });

  saveDB(db);
  res.json({ success: true, newGroup, oldGroup });
});

// ----------------------------------------------------
// SESSIONS & EMERGENCY COACH SUBSTITUTION API
// ----------------------------------------------------
app.get('/api/sessions', (req: Request, res: Response) => {
  res.json(db.sessions);
});

// Edit single session (e.g., Coach has emergency substitute for one session only)
app.put('/api/sessions/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { assignedCoachIds, location, date, startTime, endTime, substituteNotes, topic } = req.body;
  const sessionIndex = db.sessions.findIndex((s) => s.id === id);
  if (sessionIndex === -1) return res.status(404).json({ error: 'Session not found' });

  const session = db.sessions[sessionIndex];

  if (assignedCoachIds) {
    session.assignedCoachIds = assignedCoachIds;
  }
  if (location) session.location = location;
  if (date) session.date = date;
  if (startTime) session.startTime = startTime;
  if (endTime) session.endTime = endTime;
  if (substituteNotes !== undefined) session.substituteNotes = substituteNotes;
  if (topic !== undefined) session.topic = topic;

  // Add notification to newly assigned / substitute coaches
  (session.assignedCoachIds || []).forEach((cid) => {
    if (!session.originalCoachIds.includes(cid)) {
      db.notifications.unshift({
        id: `notif-${Date.now()}-${cid}`,
        targetRole: 'coach',
        coachId: cid,
        title: `Assigned as Substitute Coach: ${session.groupName}`,
        titleAr: `تم تعيينك كمدرب بديل: ${session.groupName}`,
        message: `You were assigned for Session ${session.sessionNumber} on ${session.date} at ${session.location}. Reason: ${substituteNotes || 'Emergency coverage'}`,
        messageAr: `تم تكليفك بالجلسة ${session.sessionNumber} بتاريخ ${session.date} في ${session.location}.`,
        type: 'substitution',
        createdAt: new Date().toISOString(),
        isRead: false,
      });
    }
  });

  saveDB(db);
  res.json(session);
});

// Cancel & Postpone session (with optional shifting of all remaining uncompleted sessions)
app.post('/api/sessions/:id/postpone', (req: Request, res: Response) => {
  const { id } = req.params;
  const { newDate, newStartTime, newEndTime, reason, shiftSubsequentSessions } = req.body;
  const sessionIndex = db.sessions.findIndex((s) => s.id === id);
  if (sessionIndex === -1) return res.status(404).json({ error: 'Session not found' });

  const session = db.sessions[sessionIndex];
  const oldDate = session.date;

  session.originalDate = session.originalDate || oldDate;
  session.date = newDate;
  session.isPostponed = true;
  session.postponedToDate = newDate;
  session.postponeReason = reason || 'Postponed / Rescheduled by Admin';
  if (newStartTime) session.startTime = newStartTime;
  if (newEndTime) session.endTime = newEndTime;

  // If user requested shifting subsequent uncompleted sessions of the same group forward
  if (shiftSubsequentSessions && session.groupId) {
    const groupSessions = db.sessions
      .filter((s) => s.groupId === session.groupId && s.id !== id && !s.isCompleted && s.sessionNumber > session.sessionNumber)
      .sort((a, b) => a.sessionNumber - b.sessionNumber);

    const oldDateObj = new Date(oldDate);
    const newDateObj = new Date(newDate);
    const dayDiff = Math.round((newDateObj.getTime() - oldDateObj.getTime()) / (1000 * 60 * 60 * 24));

    groupSessions.forEach((subSess) => {
      const subDateObj = new Date(subSess.date);
      subDateObj.setDate(subDateObj.getDate() + (dayDiff > 0 ? dayDiff : 7));
      subSess.originalDate = subSess.originalDate || subSess.date;
      subSess.date = subDateObj.toISOString().split('T')[0];
      subSess.isPostponed = true;
      subSess.postponeReason = `Shifted due to postponement of Session ${session.sessionNumber}`;
    });
  }

  // Notify assigned coaches
  (session.assignedCoachIds || []).forEach((cid) => {
    db.notifications.unshift({
      id: `notif-postpone-${Date.now()}-${cid}`,
      targetRole: 'coach',
      coachId: cid,
      title: `Session Postponed: ${session.groupName}`,
      titleAr: `تم ترحيل موعد الجلسة: ${session.groupName}`,
      message: `Session ${session.sessionNumber} was rescheduled from ${oldDate} to ${newDate} (${session.startTime} - ${session.endTime}). Reason: ${reason || 'Schedule update'}`,
      messageAr: `تم ترحيل الجلسة ${session.sessionNumber} من ${oldDate} إلى ${newDate} (${session.startTime} - ${session.endTime}). السبب: ${reason || 'تعديل الجدول'}.`,
      type: 'session_postponed',
      createdAt: new Date().toISOString(),
      isRead: false,
    });
  });

  saveDB(db);
  res.json({ success: true, session, sessions: db.sessions });
});

// ----------------------------------------------------
// ATTENDANCE API
// ----------------------------------------------------
app.get('/api/attendance', (req: Request, res: Response) => {
  res.json(db.attendance);
});

app.get('/api/attendance/:sessionId', (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const record = db.attendance.find((a) => a.sessionId === sessionId);
  res.json(record || null);
});

app.post('/api/attendance', (req: Request, res: Response) => {
  const { sessionId, groupId, date, studentAttendance, coachAttendance, recordedBy } = req.body;
  const session = db.sessions.find((s) => s.id === sessionId);
  if (!session) return res.status(404).json({ error: 'Session not found' });

  const group = db.groups.find((g) => g.id === groupId);

  const recordIndex = db.attendance.findIndex((a) => a.sessionId === sessionId);
  const newRecord: AttendanceRecord = {
    id: recordIndex >= 0 ? db.attendance[recordIndex].id : `att-${Date.now()}`,
    sessionId,
    groupId,
    date: date || session.date,
    studentAttendance: studentAttendance || [],
    coachAttendance: coachAttendance || [],
    recordedBy: recordedBy || 'Admin',
    recordedAt: new Date().toISOString(),
  };

  if (recordIndex >= 0) {
    db.attendance[recordIndex] = newRecord;
  } else {
    db.attendance.push(newRecord);
  }

  session.isCompleted = true;

  // Check if all 4 sessions of group are completed
  const groupSessions = db.sessions.filter((s) => s.groupId === groupId);
  const allCompleted = groupSessions.every((s) => s.isCompleted || s.id === sessionId);
  if (allCompleted && group) {
    group.status = 'completed';
    if (!group.continueDecision) {
      group.continueDecision = 'pending_decision';
    }
  }

  // Generate Coach Payroll entries for attended coaches automatically
  const sessionPrice = group ? group.pricePerSession : 200;
  const attendedCoaches = (coachAttendance || []).filter(
    (ca: any) => ca.status === 'present' || ca.status === 'substitute'
  );

  attendedCoaches.forEach((ca: any) => {
    const coach = db.coaches.find((c) => c.id === ca.coachId);
    const existingPayment = db.payments.find(
      (p) => p.sessionId === sessionId && p.coachId === ca.coachId
    );

    let amount = sessionPrice;
    if (group?.payrollSplitMode === 'split' && attendedCoaches.length > 1) {
      amount = Math.round(sessionPrice / attendedCoaches.length);
    }

    if (!existingPayment) {
      db.payments.push({
        id: `pay-${Date.now()}-${ca.coachId}`,
        coachId: ca.coachId,
        coachName: coach ? coach.name : 'Unknown Coach',
        sessionId: session.id,
        groupId: group ? group.id : '',
        groupName: group ? group.name : session.groupName,
        track: session.track,
        level: session.level,
        sessionNumber: session.sessionNumber,
        sessionDate: session.date,
        amountOwed: amount,
        paymentStatus: 'pending',
        isSubstitute: ca.status === 'substitute',
        notes: ca.notes || (ca.status === 'substitute' ? 'Substitute attendance' : 'Primary session'),
      });
    }
  });

  saveDB(db);
  res.json({ success: true, attendance: newRecord });
});

// ----------------------------------------------------
// PAYROLL API
// ----------------------------------------------------
app.get('/api/payroll', (req: Request, res: Response) => {
  const { coachId, startDate, endDate, status } = req.query;

  let filtered = db.payments;
  if (coachId) {
    filtered = filtered.filter((p) => p.coachId === coachId);
  }
  if (startDate) {
    filtered = filtered.filter((p) => p.sessionDate >= (startDate as string));
  }
  if (endDate) {
    filtered = filtered.filter((p) => p.sessionDate <= (endDate as string));
  }
  if (status && status !== 'all') {
    filtered = filtered.filter((p) => p.paymentStatus === status);
  }

  // Calculate per coach summary
  const summaryPerCoach: Record<
    string,
    {
      coachId: string;
      coachName: string;
      totalSessions: number;
      totalEarned: number;
      totalPaid: number;
      totalPending: number;
      items: CoachPaymentItem[];
    }
  > = {};

  filtered.forEach((p) => {
    if (!summaryPerCoach[p.coachId]) {
      summaryPerCoach[p.coachId] = {
        coachId: p.coachId,
        coachName: p.coachName,
        totalSessions: 0,
        totalEarned: 0,
        totalPaid: 0,
        totalPending: 0,
        items: [],
      };
    }
    summaryPerCoach[p.coachId].totalSessions += 1;
    summaryPerCoach[p.coachId].totalEarned += p.amountOwed;
    if (p.paymentStatus === 'paid') {
      summaryPerCoach[p.coachId].totalPaid += p.amountOwed;
    } else {
      summaryPerCoach[p.coachId].totalPending += p.amountOwed;
    }
    summaryPerCoach[p.coachId].items.push(p);
  });

  res.json({
    items: filtered,
    summary: Object.values(summaryPerCoach),
  });
});

app.post('/api/payroll/mark-status', (req: Request, res: Response) => {
  const { paymentIds, status, paymentMethod, notes } = req.body; // status: 'paid' | 'pending'
  if (!Array.isArray(paymentIds)) {
    return res.status(400).json({ error: 'paymentIds must be an array' });
  }

  db.payments.forEach((p) => {
    if (paymentIds.includes(p.id)) {
      p.paymentStatus = status;
      if (status === 'paid') {
        p.paidAt = new Date().toISOString();
        if (paymentMethod) p.paymentMethod = paymentMethod;
      } else {
        p.paidAt = undefined;
      }
      if (notes) p.notes = notes;
    }
  });

  saveDB(db);
  res.json({ success: true, updatedCount: paymentIds.length });
});

// Add custom bonus for coach by Owner
app.post('/api/payroll/bonus', (req: Request, res: Response) => {
  const { coachId, amount, reason, date } = req.body;
  if (!coachId || !amount) {
    return res.status(400).json({ error: 'Coach and amount are required' });
  }

  const coach = db.coaches.find((c) => c.id === coachId);
  if (!coach) return res.status(404).json({ error: 'Coach not found' });

  const bonusPayment: CoachPaymentItem = {
    id: `pay-bonus-${Date.now()}`,
    coachId,
    coachName: coach.name,
    sessionDate: date || new Date().toISOString().split('T')[0],
    amountOwed: Number(amount),
    paymentStatus: 'pending',
    isBonus: true,
    type: 'bonus',
    notes: reason || 'Owner performance bonus',
  };

  db.payments.unshift(bonusPayment);

  // Notify coach
  db.notifications.unshift({
    id: `notif-bonus-${Date.now()}-${coachId}`,
    targetRole: 'coach',
    coachId,
    coachName: coach.name,
    title: `Bonus Awarded: ${amount} EGP`,
    titleAr: `تم منحك مكافأة بونص: ${amount} ج.م`,
    message: `You have been awarded a special bonus of ${amount} EGP. Reason: ${reason || 'Exceptional contribution'}`,
    messageAr: `تم منحك مكافأة خاصة بقيمة ${amount} ج.م. السبب: ${reason || 'مكافأة تميز وأداء استثنائي'}.`,
    type: 'bonus_awarded',
    createdAt: new Date().toISOString(),
    isRead: false,
    link: '/payroll',
  });

  saveDB(db);
  res.json({ success: true, payment: bonusPayment });
});

// ----------------------------------------------------
// STUDENT PAYMENTS & TUITION APPROVAL API
// ----------------------------------------------------
app.get('/api/student-payments', (req: Request, res: Response) => {
  const { studentId, status } = req.query;
  let list = db.studentPayments || [];
  if (studentId) {
    list = list.filter((p) => p.studentId === studentId);
  }
  if (status && status !== 'all') {
    list = list.filter((p) => p.status === status);
  }
  // Sort descending by date
  list = [...list].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  return res.json(list);
});

app.post('/api/student-payments', (req: Request, res: Response) => {
  const {
    studentId,
    studentName,
    studentPhone,
    parentPhone,
    groupId,
    groupName,
    track,
    amount,
    paymentMethod,
    senderPhoneOrAccount,
    transactionReference,
    note,
    paymentDate,
  } = req.body;

  if (!studentId || !amount || !paymentMethod) {
    return res.status(400).json({ error: 'Missing required payment details (studentId, amount, paymentMethod)' });
  }

  const student = db.students.find((s) => s.id === studentId);
  const targetGroup = db.groups.find((g) => g.id === groupId);

  const newPayment: StudentPaymentRecord = {
    id: `spay-${Date.now()}`,
    studentId,
    studentName: studentName || student?.name || 'Student',
    studentPhone: studentPhone || student?.phone || '',
    parentPhone: parentPhone || student?.parentPhone || '',
    groupId: groupId || undefined,
    groupName: groupName || targetGroup?.name || undefined,
    track: track || targetGroup?.track || undefined,
    amount: Number(amount) || 0,
    paymentMethod,
    senderPhoneOrAccount: senderPhoneOrAccount || '',
    transactionReference: transactionReference || '',
    note: note || '',
    paymentDate: paymentDate || new Date().toISOString().split('T')[0],
    status: 'pending_approval',
    createdAt: new Date().toISOString(),
  };

  if (!db.studentPayments) {
    db.studentPayments = [];
  }
  db.studentPayments.unshift(newPayment);

  // Notify Owner of payment waiting for approval: "YES HE ACTUALLY PAID"
  db.notifications.unshift({
    id: `notif-${Date.now()}`,
    targetRole: 'admin',
    title: `Student Payment: ${newPayment.studentName} paid ${newPayment.amount} EGP`,
    titleAr: `سداد رسوم: ${newPayment.studentName} دفع ${newPayment.amount} ج.م`,
    message: `${newPayment.studentName} reported paying ${newPayment.amount} EGP via ${newPayment.paymentMethod}. Awaiting approval: "YES HE ACTUALLY PAID".`,
    messageAr: `سجل الطالب ${newPayment.studentName} سداد ${newPayment.amount} ج.م عبر ${newPayment.paymentMethod}. بانتظار الاعتماد.`,
    type: 'approval',
    createdAt: new Date().toISOString(),
    isRead: false,
    link: '/students',
  });

  saveDB(db);
  return res.json({ success: true, payment: newPayment });
});

app.post('/api/student-payments/:id/approve', (req: Request, res: Response) => {
  const { id } = req.params;
  const payment = (db.studentPayments || []).find((p) => p.id === id);
  if (!payment) {
    return res.status(404).json({ error: 'Payment record not found' });
  }

  payment.status = 'approved';
  payment.approvedAt = new Date().toISOString();
  payment.approvedBy = 'Academy Admin (YES HE ACTUALLY PAID)';

  // Notify Student
  db.notifications.unshift({
    id: `notif-${Date.now()}`,
    targetRole: 'all',
    title: `Payment Approved: ${payment.amount} EGP Verified!`,
    titleAr: `تم اعتماد سدادك: ${payment.amount} ج.م بنجاح!`,
    message: `Payment of ${payment.amount} EGP via ${payment.paymentMethod} has been approved by Academy Owner (YES HE ACTUALLY PAID).`,
    messageAr: `تمت مراجعة واعتماد دفعتك بمبلغ ${payment.amount} ج.م بنجاح من إدارة الأكاديمية (YES HE ACTUALLY PAID).`,
    type: 'general',
    createdAt: new Date().toISOString(),
    isRead: false,
  });

  saveDB(db);
  return res.json({ success: true, payment });
});

app.post('/api/student-payments/:id/reject', (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;
  const payment = (db.studentPayments || []).find((p) => p.id === id);
  if (!payment) {
    return res.status(404).json({ error: 'Payment record not found' });
  }

  payment.status = 'rejected';
  payment.rejectionReason = reason || 'Payment could not be verified by Admin';

  saveDB(db);
  return res.json({ success: true, payment });
});

// ----------------------------------------------------
// MAKEUP SESSIONS API (For Absent Students)
// ----------------------------------------------------
app.get('/api/makeups', (req: Request, res: Response) => {
  res.json(db.makeups || []);
});

app.post('/api/makeups', (req: Request, res: Response) => {
  const {
    studentId,
    coachId,
    originalSessionId,
    originalGroupId,
    track,
    date,
    startTime,
    endTime,
    location,
    topic,
    notes,
  } = req.body;

  const student = db.students.find((s) => s.id === studentId);
  if (!student) return res.status(404).json({ error: 'Student not found' });

  const coach = db.coaches.find((c) => c.id === coachId);
  if (!coach) return res.status(404).json({ error: 'Coach not found' });

  const makeupId = `makeup-${Date.now()}`;
  const origGroup = db.groups.find((g) => g.id === originalGroupId);

  const makeupItem: MakeupSessionItem = {
    id: makeupId,
    studentId,
    studentName: student.name,
    coachId,
    coachName: coach.name,
    originalSessionId,
    originalGroupId,
    groupName: origGroup?.name || `${track || 'Robotics'} Makeup`,
    track: track || origGroup?.track || 'Robotics',
    date: date || new Date().toISOString().split('T')[0],
    startTime: startTime || '16:00',
    endTime: endTime || '17:30',
    location: location || 'Robotics Lab Makeup Room',
    topic: topic || `Compensatory makeup session for ${student.name}`,
    notes,
    status: 'scheduled',
    createdAt: new Date().toISOString(),
  };

  db.makeups.unshift(makeupItem);

  // Also create a session record so it shows in the Master Calendar & Schedule
  const makeupSession: GroupSession = {
    id: `sess-makeup-${makeupId}`,
    groupId: originalGroupId || `grp-makeup-${makeupId}`,
    groupName: `[Makeup] ${student.name} - ${makeupItem.track}`,
    track: makeupItem.track,
    level: origGroup?.level || 1,
    sessionNumber: 1,
    date: makeupItem.date,
    startTime: makeupItem.startTime,
    endTime: makeupItem.endTime,
    location: makeupItem.location,
    assignedCoachIds: [coachId],
    originalCoachIds: [coachId],
    isCompleted: false,
    topic: makeupItem.topic,
    isMakeup: true,
    makeupStudentId: studentId,
    makeupStudentName: student.name,
    originalSessionId,
  };
  db.sessions.push(makeupSession);

  // Update student's attendance record if original session exists
  if (originalSessionId) {
    const attRec = db.attendance.find((a) => a.sessionId === originalSessionId);
    if (attRec) {
      const studentEntry = attRec.studentAttendance.find((sa) => sa.studentId === studentId);
      if (studentEntry) {
        studentEntry.makeupScheduled = true;
        studentEntry.makeupSessionId = makeupId;
      }
    }
  }

  // Notify coach
  db.notifications.unshift({
    id: `notif-makeup-${Date.now()}-${coachId}`,
    targetRole: 'coach',
    coachId,
    coachName: coach.name,
    title: `Makeup Session Assigned: ${student.name}`,
    titleAr: `تم تكليفك بجلسة تعويضية: ${student.name}`,
    message: `You are scheduled for a compensatory session with ${student.name} on ${makeupItem.date} from ${makeupItem.startTime} to ${makeupItem.endTime} at ${makeupItem.location}.`,
    messageAr: `تم تحديد موعد جلسة تعويضية للطالب ${student.name} بتاريخ ${makeupItem.date} من ${makeupItem.startTime} إلى ${makeupItem.endTime} في ${makeupItem.location}.`,
    type: 'makeup_scheduled',
    createdAt: new Date().toISOString(),
    isRead: false,
    link: '/calendar',
  });

  saveDB(db);
  res.json({ success: true, makeup: makeupItem, session: makeupSession });
});

app.post('/api/makeups/:id/complete', (req: Request, res: Response) => {
  const { id } = req.params;
  const makeup = db.makeups.find((m) => m.id === id);
  if (!makeup) return res.status(404).json({ error: 'Makeup session not found' });

  makeup.status = 'completed';

  const sess = db.sessions.find((s) => s.id === `sess-makeup-${id}`);
  if (sess) sess.isCompleted = true;

  // Add payout for the coach who delivered the makeup
  const coach = db.coaches.find((c) => c.id === makeup.coachId);
  if (coach) {
    const paymentItem: CoachPaymentItem = {
      id: `pay-makeup-${id}`,
      coachId: makeup.coachId,
      coachName: coach.name,
      sessionId: sess?.id || id,
      groupId: makeup.originalGroupId,
      groupName: makeup.groupName,
      track: makeup.track,
      sessionDate: makeup.date,
      amountOwed: (coach.hourlyRate || 120) * 1.5, // 1.5 hrs makeup rate
      paymentStatus: 'pending',
      notes: `Compensatory makeup session delivered for ${makeup.studentName}`,
    };
    db.payments.unshift(paymentItem);
  }

  saveDB(db);
  res.json({ success: true, makeup });
});

// ----------------------------------------------------
// NOTIFICATIONS & REMINDERS API
// ----------------------------------------------------
app.get('/api/notifications', (req: Request, res: Response) => {
  const { role, coachId } = req.query;
  let list = db.notifications;
  if (role === 'admin') {
    list = list.filter((n) => n.targetRole === 'admin' || n.targetRole === 'all');
  } else if (role === 'coach' && coachId) {
    list = list.filter(
      (n) => (n.targetRole === 'coach' && n.coachId === coachId) || n.targetRole === 'all'
    );
  }
  res.json(list);
});

app.post('/api/notifications/send-reminder', (req: Request, res: Response) => {
  const { sessionId } = req.body;
  const session = db.sessions.find((s) => s.id === sessionId);
  if (!session) return res.status(404).json({ error: 'Session not found' });

  (session.assignedCoachIds || []).forEach((cid) => {
    db.notifications.unshift({
      id: `notif-remind-${Date.now()}-${cid}`,
      targetRole: 'coach',
      coachId: cid,
      title: `Session Reminder: ${session.groupName}`,
      titleAr: `تذكير بموعد الجلسة: ${session.groupName}`,
      message: `Friendly reminder for Session ${session.sessionNumber} on ${session.date} from ${session.startTime} to ${session.endTime} at ${session.location}.`,
      messageAr: `تذكير بموعد الجلسة ${session.sessionNumber} بتاريخ ${session.date} من ${session.startTime} حتى ${session.endTime} في ${session.location}.`,
      type: 'session_reminder',
      createdAt: new Date().toISOString(),
      isRead: false,
    });
  });

  saveDB(db);
  res.json({ success: true, count: session.assignedCoachIds.length });
});

app.post('/api/notifications', (req: Request, res: Response) => {
  const { title, titleAr, message, messageAr, type, targetRoles, targetRole, coachId, groupId } = req.body;
  const newNotif = {
    id: `notif-broadcast-${Date.now()}`,
    targetRole: targetRole || (Array.isArray(targetRoles) && targetRoles.includes('admin') ? 'all' : 'coach'),
    coachId,
    groupId,
    title: title || 'Academy Broadcast',
    titleAr: titleAr || title || 'إشعار من الإدارة',
    message: message || '',
    messageAr: messageAr || message || '',
    type: type || 'general',
    createdAt: new Date().toISOString(),
    isRead: false,
  };
  db.notifications.unshift(newNotif);
  saveDB(db);
  res.json({ success: true, notification: newNotif });
});

app.patch('/api/notifications/:id/read', (req: Request, res: Response) => {
  const { id } = req.params;
  const notif = db.notifications.find((n) => n.id === id);
  if (notif) notif.isRead = true;
  saveDB(db);
  res.json({ success: true });
});

app.post('/api/notifications/mark-all-read', (req: Request, res: Response) => {
  db.notifications.forEach((n) => {
    n.isRead = true;
  });
  saveDB(db);
  res.json({ success: true });
});

// Custom Tracks
app.get('/api/tracks', (req: Request, res: Response) => {
  res.json(db.customTracks);
});

app.post('/api/tracks', (req: Request, res: Response) => {
  const { trackName } = req.body;
  if (trackName && !db.customTracks.includes(trackName.trim())) {
    db.customTracks.push(trackName.trim());
    saveDB(db);
  }
  res.json(db.customTracks);
});

// Database Backup, Restore, and Reset Endpoints
app.get('/api/backup', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="mms_academy_backup_${new Date().toISOString().split('T')[0]}.json"`);
  res.json(db);
});

app.post('/api/restore', (req: Request, res: Response) => {
  try {
    const data = req.body;
    if (data && typeof data === 'object') {
      db = {
        owners: Array.isArray(data.owners) ? data.owners : db.owners,
        coaches: Array.isArray(data.coaches) ? data.coaches : [],
        students: Array.isArray(data.students) ? data.students : [],
        groups: Array.isArray(data.groups) ? data.groups : [],
        sessions: Array.isArray(data.sessions) ? data.sessions : [],
        attendance: Array.isArray(data.attendance) ? data.attendance : [],
        payments: Array.isArray(data.payments) ? data.payments : [],
        notifications: Array.isArray(data.notifications) ? data.notifications : [],
        makeups: Array.isArray(data.makeups) ? data.makeups : [],
        customTracks: Array.isArray(data.customTracks) ? data.customTracks : ['Arduino', 'WeDo', 'Lego Essential', 'Lego Prime', 'Lego EV3', 'SolidWorks'],
        studentPayments: Array.isArray(data.studentPayments) ? data.studentPayments : [],
      };
      saveDB(db);
      return res.json({ success: true, message: 'Database restored successfully' });
    }
    res.status(400).json({ error: 'Invalid backup file payload' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to restore database' });
  }
});

app.post('/api/reset-data', (req: Request, res: Response) => {
  const clean = getInitialData();
  saveDB(clean);
  res.json({ success: true, message: 'All example and stored data has been cleared.' });
});

// Overall stats
app.get('/api/stats', (req: Request, res: Response) => {
  const activeGroups = db.groups.filter((g) => g.status === 'active').length;
  const activeCoaches = db.coaches.filter((c) => c.status === 'active').length;
  const pendingCoaches = db.coaches.filter((c) => c.status === 'pending').length;
  const totalStudents = db.students.length;
  const totalSessions = db.sessions.length;
  const completedSessions = db.sessions.filter((s) => s.isCompleted).length;

  const totalOwed = db.payments
    .filter((p) => p.paymentStatus === 'pending')
    .reduce((sum, p) => sum + p.amountOwed, 0);

  const totalPaid = db.payments
    .filter((p) => p.paymentStatus === 'paid')
    .reduce((sum, p) => sum + p.amountOwed, 0);

  res.json({
    activeGroups,
    activeCoaches,
    pendingCoaches,
    totalStudents,
    totalSessions,
    completedSessions,
    totalOwed,
    totalPaid,
  });
});

// ----------------------------------------------------
// VITE / SPA MIDDLEWARE
// ----------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MMS Academy Backend Server running on http://localhost:${PORT}`);
  });
}

startServer();
