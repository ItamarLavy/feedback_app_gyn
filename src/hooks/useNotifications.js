import { useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { differenceInHours, differenceInDays, startOfWeek, endOfWeek, isThisWeek, getDay, getHours } from 'date-fns';

// מנהלים קבועים שמקבלים התראות על עיכוב
const MANAGER_NAMES = ['יובל לביא', 'רונית גלעד', 'צביקה שמעונוביץ'];

// יוצר/מוצא רשומת נקודות למשתמש
export async function getOrCreateUserPoints(userId, userName, userRole) {
  const existing = await base44.entities.UserPoints.filter({ user_id: userId });
  if (existing.length > 0) return existing[0];
  return await base44.entities.UserPoints.create({
    user_id: userId,
    user_name: userName,
    user_role: userRole,
    total_points: 0,
    weekly_record: 0
  });
}

// הוסף נקודות למשתמש (יוצר רשומה אם לא קיימת)
export async function addPoints(userId, userName, userRole, points) {
  const record = await getOrCreateUserPoints(userId, userName, userRole);
  await base44.entities.UserPoints.update(record.id, {
    total_points: (record.total_points || 0) + points
  });
}

// צור התראה + שלח אימייל
async function createNotification({ recipientUserId, recipientRole, type, message, feedbackId, internName, expertName, email }) {
  // שמור ב-DB
  await base44.entities.Notification.create({
    recipient_user_id: recipientUserId,
    recipient_role: recipientRole,
    type,
    message,
    feedback_id: feedbackId,
    intern_name: internName,
    expert_name: expertName,
    is_read: false,
    email_sent: false,
    sent_at: new Date().toISOString()
  });

  // שלח אימייל אם יש כתובת
  if (email) {
    try {
      await base44.integrations.Core.SendEmail({
        to: email,
        subject: 'משוב רפואי - הדסה',
        body: message
      });
    } catch (e) {
      console.warn('Email send failed', e);
    }
  }
}

// ---- פונקציות ציבוריות ----

// כשמתמחה שולח בקשת משוב: שלח תזכורת למומחה + תזמן תזכורות עתידיות
export async function onFeedbackRequested({ feedbackId, internId, internName, expertId, expertName, expertEmail }) {
  const now = new Date();

  // התראה מיידית למומחה
  await createNotification({
    recipientUserId: expertId,
    recipientRole: 'expert',
    type: 'feedback_request',
    message: `📋 ${internName} ביקש את משובך על פרוצדורה חדשה. אנא מלא את המשוב בהקדם.`,
    feedbackId,
    internName,
    email: expertEmail
  });

  // תזמון תזכורת 24 שעות
  await base44.entities.Notification.create({
    recipient_user_id: expertId,
    recipient_role: 'expert',
    type: 'reminder_24h',
    message: `⏰ עדיין לא ענית למשוב של ${internName}. הם מחכים לך!`,
    feedback_id: feedbackId,
    intern_name: internName,
    is_read: false,
    email_sent: false,
    scheduled_for: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()
  });

  // 48 שעות
  await base44.entities.Notification.create({
    recipient_user_id: expertId,
    recipient_role: 'expert',
    type: 'reminder_48h',
    message: `⚠️ שים לב, עדיין לא ענית למשוב של ${internName}. אנא השלם בהקדם.`,
    feedback_id: feedbackId,
    intern_name: internName,
    is_read: false,
    email_sent: false,
    scheduled_for: new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString()
  });

  // שבוע - בשעה 7:00
  const oneWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  oneWeek.setHours(7, 0, 0, 0);
  await base44.entities.Notification.create({
    recipient_user_id: expertId,
    recipient_role: 'expert',
    type: 'reminder_1week',
    message: `🌅 בוקר טוב, ${internName} מאוד ישמח לקבל משוב ממך!`,
    feedback_id: feedbackId,
    intern_name: internName,
    is_read: false,
    email_sent: false,
    scheduled_for: oneWeek.toISOString()
  });
}

// כשמומחה מסיים למלא משוב: +5 נקודות לשניהם + שלח לאימייל מנהלים אם הייתה עיכוב
export async function onFeedbackCompleted({ feedbackId, internId, internName, expertId, expertName, internEmail, expertEmail, requestedAt, internUserId, expertUserId }) {
  // נקודות - קודם כל וודא שיש רשומת נקודות, ואז הוסף
  try {
    // מתמחה - לפי userId אם יש, אחרת לפי email
    if (internUserId) {
      await addPoints(internUserId, internName, 'intern', 5);
    } else if (internEmail) {
      const allUsers = await base44.entities.User.list();
      const internUser = allUsers.find(u => u.email === internEmail);
      if (internUser) await addPoints(internUser.id, internName, 'intern', 5);
    }

    // מומחה - משתמש ב-Expert entity id ישירות (לא User id, כי מומחים הם לאו דווקא users)
    if (expertId) {
      await addPoints(expertId, expertName, 'expert', 5);
      console.log('[onFeedbackCompleted] added 5 points to expert:', expertName, expertId);
    }
  } catch(e) { console.warn('points error', e); }

  // סמן תזכורות הקשורות כנקראות
  const pendingReminders = await base44.entities.Notification.filter({ feedback_id: feedbackId, is_read: false });
  for (const r of pendingReminders) {
    await base44.entities.Notification.update(r.id, { is_read: true });
  }

  // בדוק אם עבר שבוע - אם כן שלח התראה למנהלים
  if (requestedAt) {
    const hoursPassed = differenceInHours(new Date(), new Date(requestedAt));
    if (hoursPassed > 168) { // שבוע
      const managers = await base44.entities.User.list();
      const managerUsers = managers.filter(u => MANAGER_NAMES.some(name => u.full_name?.includes(name)));
      for (const manager of managerUsers) {
        await createNotification({
          recipientUserId: manager.id,
          recipientRole: 'manager',
          type: 'manager_alert_overdue',
          message: `🚨 התראה: משוב של ${internName} מהמומחה ${expertName} לא מולא במשך למעלה משבוע (${Math.round(hoursPassed / 24)} ימים).`,
          feedbackId,
          internName,
          expertName,
          email: manager.email
        });
      }
    }
  }
}

// בדיקת התראות ממתינות שהגיע זמנן (קרא בכל פתיחת אפליקציה)
export async function processPendingNotifications(currentUserId, currentUserEmail) {
  const now = new Date();
  const pending = await base44.entities.Notification.filter({
    recipient_user_id: currentUserId,
    is_read: false
  });

  const due = pending.filter(n => n.scheduled_for && new Date(n.scheduled_for) <= now && !n.email_sent);

  for (const notification of due) {
    // שלח אימייל
    if (currentUserEmail) {
      try {
        await base44.integrations.Core.SendEmail({
          to: currentUserEmail,
          subject: 'תזכורת משוב - הדסה',
          body: notification.message
        });
      } catch (e) {
        console.warn('Email send failed', e);
      }
    }
    await base44.entities.Notification.update(notification.id, { email_sent: true });
  }
}

// בדוק אם מומחה לא מילא כלל השבוע - שלח תזכורת שני
export async function checkExpertWeeklyReminder(expertId, expertName, expertEmail) {
  const now = new Date();
  // רק ביום ראשון בין 7:00-8:00
  if (getDay(now) !== 0 || getHours(now) < 7 || getHours(now) > 8) return;

  const weekStart = startOfWeek(now, { weekStartsOn: 0 });
  const completedThisWeek = await base44.entities.Feedback.filter({ expert_id: expertId, status: 'completed' });
  const thisWeek = completedThisWeek.filter(f => f.expert_submitted_date && new Date(f.expert_submitted_date) >= weekStart);

  if (thisWeek.length === 0) {
    await createNotification({
      recipientUserId: expertId,
      recipientRole: 'expert',
      type: 'new_week_expert_reminder',
      message: `👋 המתמחים שלך מחכים למשוב ממך. מזכיר לך שגם אתה יכול להציע להם לפתוח ארוע משוב.`,
      expertName,
      email: expertEmail
    });
  }
}

// סיכום שבועי למתמחה - ביום חמישי 15:00
export async function sendInternWeeklySummary(internId, internName, internEmail) {
  const now = new Date();
  if (getDay(now) !== 4 || getHours(now) < 15 || getHours(now) > 16) return;

  const weekStart = startOfWeek(now, { weekStartsOn: 0 });
  const allFeedbacks = await base44.entities.Feedback.filter({ intern_id: internId });
  const thisWeek = allFeedbacks.filter(f => f.intern_submitted_date && new Date(f.intern_submitted_date) >= weekStart);
  const count = thisWeek.length;

  // בדוק שיא
  const points = await base44.entities.UserPoints.filter({ user_id: internId });
  const record = points[0]?.weekly_record || 0;

  let message = `📊 השבוע ביקשת ${count} משובים`;
  if (count === 0) {
    message += ` 😢 חבל שלא ניצלת את השבוע להתקדם עוד יותר. שבוע הבא מצפה למלא ארועי משוב 💪`;
  } else if (count > record) {
    message = `👑 הגעת לשיא חדש! השבוע ביקשת **${count}** משובים! 🎉`;
    if (points[0]) {
      await base44.entities.UserPoints.update(points[0].id, { weekly_record: count });
    }
  }

  await createNotification({
    recipientUserId: internId,
    recipientRole: 'intern',
    type: count > record ? 'weekly_record_intern' : 'weekly_summary_intern',
    message,
    internName,
    email: internEmail
  });
}

// סיכום שישי בוקר למנהלים + הודעת אלוף לכולם
export async function sendFridayManagerSummary(managerId, managerEmail) {
  const now = new Date();
  // רק ביום שישי (5) בין 8:00-9:00
  if (getDay(now) !== 5 || getHours(now) < 8 || getHours(now) > 9) return;

  // בדוק שלא שלחנו היום
  const todayStart = new Date(); todayStart.setHours(0,0,0,0);
  const existing = await base44.entities.Notification.filter({ recipient_user_id: managerId, type: 'weekly_summary_expert' });
  const sentToday = existing.filter(n => n.sent_at && new Date(n.sent_at) >= todayStart);
  if (sentToday.length > 0) return;

  const weekStart = startOfWeek(now, { weekStartsOn: 0 });

  // כל הפידבקים השבוע
  const allFeedbacks = await base44.entities.Feedback.list();
  const thisWeek = allFeedbacks.filter(f => f.intern_submitted_date && new Date(f.intern_submitted_date) >= weekStart);
  const completedThisWeek = allFeedbacks.filter(f => f.expert_submitted_date && new Date(f.expert_submitted_date) >= weekStart && f.status === 'completed');

  // כמה ביקש כל מתמחה
  const internCounts = {};
  thisWeek.forEach(f => {
    if (!internCounts[f.intern_name]) internCounts[f.intern_name] = 0;
    internCounts[f.intern_name]++;
  });

  // כמה מילא כל מומחה
  const expertCounts = {};
  completedThisWeek.forEach(f => {
    if (!expertCounts[f.expert_name]) expertCounts[f.expert_name] = 0;
    expertCounts[f.expert_name]++;
  });

  // אלופים
  const topIntern = Object.entries(internCounts).sort((a, b) => b[1] - a[1])[0];
  const topExpert = Object.entries(expertCounts).sort((a, b) => b[1] - a[1])[0];

  // בנה הודעה מפורטת
  const internLines = Object.entries(internCounts).map(([name, count]) => `• ${name}: ${count} בקשות`).join('\n');
  const expertLines = Object.entries(expertCounts).map(([name, count]) => `• ${name}: ${count} משובים`).join('\n');

  const message = `📋 סיכום שבועי - ${new Date().toLocaleDateString('he-IL')}\n\n` +
    `🎓 בקשות משוב של מתמחים:\n${internLines || 'אין נתונים'}\n\n` +
    `⭐ משובים שהושלמו על ידי מומחים:\n${expertLines || 'אין נתונים'}\n\n` +
    (topIntern ? `🏆 מתמחה מצטיין: ${topIntern[0]} (${topIntern[1]} בקשות)\n` : '') +
    (topExpert ? `🥇 ממשב מצטיין: ${topExpert[0]} (${topExpert[1]} משובים)` : '');

  await createNotification({
    recipientUserId: managerId,
    recipientRole: 'manager',
    type: 'weekly_summary_expert',
    message,
    email: managerEmail
  });
}

// שלח הודעת אלוף לכולם ביום שישי 8:00
export async function sendFridayChampionMessage(currentUserId, currentUserEmail) {
  const now = new Date();
  if (getDay(now) !== 5 || getHours(now) < 8 || getHours(now) > 9) return;

  const todayStart = new Date(); todayStart.setHours(0,0,0,0);
  const existing = await base44.entities.Notification.filter({ recipient_user_id: currentUserId, type: 'bravo_double' });
  const sentToday = existing.filter(n => n.sent_at && new Date(n.sent_at) >= todayStart);
  if (sentToday.length > 0) return;

  const weekStart = startOfWeek(now, { weekStartsOn: 0 });
  const allFeedbacks = await base44.entities.Feedback.list();
  const thisWeek = allFeedbacks.filter(f => f.intern_submitted_date && new Date(f.intern_submitted_date) >= weekStart);
  const completedThisWeek = allFeedbacks.filter(f => f.expert_submitted_date && new Date(f.expert_submitted_date) >= weekStart && f.status === 'completed');

  const internCounts = {};
  thisWeek.forEach(f => { internCounts[f.intern_name] = (internCounts[f.intern_name] || 0) + 1; });
  const expertCounts = {};
  completedThisWeek.forEach(f => { expertCounts[f.expert_name] = (expertCounts[f.expert_name] || 0) + 1; });

  const topIntern = Object.entries(internCounts).sort((a, b) => b[1] - a[1])[0];
  const topExpert = Object.entries(expertCounts).sort((a, b) => b[1] - a[1])[0];

  if (!topIntern && !topExpert) return;

  const message = `🏆 שבוע נהדר! ` +
    (topIntern ? `${topIntern[0]} הוא/היא אלוף/ת המשובים השבוע! 🥇 ` : '') +
    (topExpert ? `ו-${topExpert[0]} הוא/היא אלוף/ת הממשבים! 🥇` : '');

  await createNotification({
    recipientUserId: currentUserId,
    recipientRole: 'intern',
    type: 'bravo_double',
    message,
    email: currentUserEmail
  });
}

// סיכום שבועי למומחה - ביום חמישי 15:00
export async function sendExpertWeeklySummary(expertId, expertName, expertEmail) {
  const now = new Date();
  if (getDay(now) !== 4 || getHours(now) < 15 || getHours(now) > 16) return;

  const weekStart = startOfWeek(now, { weekStartsOn: 0 });
  const completedThisWeek = await base44.entities.Feedback.filter({ expert_id: expertId, status: 'completed' });
  const thisWeek = completedThisWeek.filter(f => f.expert_submitted_date && new Date(f.expert_submitted_date) >= weekStart);
  const count = thisWeek.length;

  let message = count === 0
    ? `💙 מזמן לא משבת את המתמחים שלך, הם תמיד ישמחו להדרכה ממך.`
    : `✅ השבוע השלמת ${count} משובים, כל הכבוד! 🌟`;

  await createNotification({
    recipientUserId: expertId,
    recipientRole: 'expert',
    type: 'weekly_summary_expert',
    message,
    expertName,
    email: expertEmail
  });
}