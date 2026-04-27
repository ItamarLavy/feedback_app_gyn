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

// הוסף נקודות למשתמש
export async function addPoints(userId, points) {
  const existing = await base44.entities.UserPoints.filter({ user_id: userId });
  if (existing.length > 0) {
    await base44.entities.UserPoints.update(existing[0].id, {
      total_points: (existing[0].total_points || 0) + points
    });
  }
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
export async function onFeedbackCompleted({ feedbackId, internId, internName, expertId, expertName, internEmail, expertEmail, requestedAt }) {
  // נקודות
  await addPoints(expertId, 5);
  await addPoints(internId, 5);

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