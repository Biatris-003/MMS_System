/**
 * WhatsApp Messaging & Deep Linking Utility for MMS Academy
 * Normalizes Egyptian and international phone numbers and generates wa.me links
 */

export const normalizeWhatsAppPhone = (phone: string): string => {
  if (!phone) return '';
  // Remove all non-numeric characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');

  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }

  // Handle leading 00 (e.g. 002010...)
  if (cleaned.startsWith('00')) {
    cleaned = cleaned.substring(2);
  }

  // Handle Egyptian standard local numbers (010, 011, 012, 015)
  if (/^01[0125]\d{8}$/.test(cleaned)) {
    cleaned = '2' + cleaned;
  }

  return cleaned;
};

export const getWhatsAppLink = (phone: string, message?: string): string => {
  const normalized = normalizeWhatsAppPhone(phone);
  if (!normalized) return '';
  const baseUrl = `https://wa.me/${normalized}`;
  if (message && message.trim()) {
    return `${baseUrl}?text=${encodeURIComponent(message.trim())}`;
  }
  return baseUrl;
};

export const openWhatsApp = (phone: string, message?: string): boolean => {
  const link = getWhatsAppLink(phone, message);
  if (!link) {
    alert('Invalid phone number or no WhatsApp number provided.');
    return false;
  }
  window.open(link, '_blank', 'noopener,noreferrer');
  return true;
};

export const formatPaymentMethodLabel = (method: string): string => {
  switch (method) {
    case 'cash':
      return 'نقداً بالأكاديمية (Cash)';
    case 'instapay':
      return 'إنستاباي (InstaPay)';
    case 'orange_cash':
      return 'أورانج كاش (Orange Cash)';
    case 'vodafone_cash':
      return 'فودافون كاش (Vodafone Cash)';
    default:
      return method;
  }
};

// Ready-to-use message generators
export const buildCoachSessionReminderMsg = (params: {
  coachName: string;
  groupName: string;
  track: string;
  level: number;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  sessionNumber?: number;
}): string => {
  return `السلام عليكم كابتن ${params.coachName}،
تذكير بموعد جلستك القادمة في أكاديمية MMS للعلوم والتكنولوجيا:
🤖 المجموعة: ${params.groupName} (${params.track} - مستوى ${params.level})
📅 التاريخ: ${params.date}
⏰ الوقت: من ${params.startTime} إلى ${params.endTime}
📍 المكان: ${params.location}
${params.sessionNumber ? `📌 الجلسة رقم #${params.sessionNumber}` : ''}
يرجى الحضور قبل الموعد بـ 10 دقائق لتجهيز الأدوات والقاعة. نتمنى لك جلسة موفقة!`;
};

export const buildStudentPaymentReportedMsg = (params: {
  studentName: string;
  amount: number;
  method: string;
  groupName?: string;
  senderInfo?: string;
  date: string;
}): string => {
  return `السلام عليكم إدارة أكاديمية MMS،
قام الطالب ${params.studentName} بتسجيل سداد رسوم دراسية:
💰 المبلغ: ${params.amount} جنيه مصري
💳 طريقة الدفع: ${formatPaymentMethodLabel(params.method)}
${params.groupName ? `👥 المجموعة: ${params.groupName}` : ''}
${params.senderInfo ? `📱 رقم المحول / المرجع: ${params.senderInfo}` : ''}
📅 تاريخ الدفع: ${params.date}
برجاء مراجعة الدفعة في لوحة التحكم واعتمادها (YES HE ACTUALLY PAID). شكراً لكم!`;
};

export const buildPaymentApprovedMsg = (params: {
  studentName: string;
  amount: number;
  method: string;
  groupName?: string;
  approvedDate: string;
}): string => {
  return `مرحباً ${params.studentName} وأولياء الأمور الكرام 🌟
يسعدنا إبلاغكم بأنه تم مراجعة واعتماد دفعتكم بنجاح في أكاديمية MMS للعلوم والتكنولوجيا:
✅ حالة الاعتماد: معتمد رسمياً (YES HE ACTUALLY PAID)
💰 المبلغ: ${params.amount} جنيه مصري
💳 طريقة الدفع: ${formatPaymentMethodLabel(params.method)}
${params.groupName ? `🤖 المجموعة: ${params.groupName}` : ''}
📅 تاريخ الاعتماد: ${params.approvedDate}
شكراً لثقتكم بنا، ونتمنى لـ ${params.studentName} دوام التوفيق والتميز في مسار الروبوتكس والبرمجة! 🚀`;
};

export const buildStudentAbsentNoticeMsg = (params: {
  studentName: string;
  groupName: string;
  track: string;
  date: string;
  time: string;
}): string => {
  return `السلام عليكم ورحمة الله، ولي أمر الطالب ${params.studentName} الكرام،
نود إحاطتكم علماً بعدم حضور الطالب لجلسة اليوم في أكاديمية MMS للعلوم والتكنولوجيا:
🤖 المجموعة: ${params.groupName} (${params.track})
📅 التاريخ: ${params.date} (${params.time})
حرصاً منا على مسار الطالب التعليمي وعدم تفويت أي جزء من المنهج، يسعدنا تواصلكم لتنسيق موعد جلسة تعويضية (Makeup Session).
دمتم بخير، إدارة أكاديمية MMS.`;
};
