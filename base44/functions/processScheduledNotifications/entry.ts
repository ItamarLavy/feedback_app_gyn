import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const now = new Date();

    // שלוף את כל התזכורות הממתינות שהגיע זמנן ועדיין לא נשלחו
    const allPending = await base44.asServiceRole.entities.Notification.filter({
      is_read: false,
      email_sent: false
    });

    const due = allPending.filter(n =>
      n.scheduled_for && new Date(n.scheduled_for) <= now
    );

    console.log(`[processScheduledNotifications] Found ${due.length} due notifications`);

    let sent = 0;
    let skipped = 0;

    for (const notification of due) {
      // בדוק אם המשוב כבר הושלם - אם כן, סמן כנקרא ודלג
      if (notification.feedback_id) {
        const feedbacks = await base44.asServiceRole.entities.Feedback.filter({ id: notification.feedback_id });
        const feedback = feedbacks[0];
        if (feedback && feedback.status === 'completed') {
          await base44.asServiceRole.entities.Notification.update(notification.id, { is_read: true, email_sent: true });
          skipped++;
          continue;
        }
      }

      // מצא את כתובת המייל של הנמען
      let recipientEmail = null;

      if (notification.recipient_role === 'expert') {
        // חפש לפי Expert entity
        const experts = await base44.asServiceRole.entities.Expert.filter({ id: notification.recipient_user_id });
        if (experts.length > 0) {
          recipientEmail = experts[0].email;
        }
        // אם לא מצא - חפש לפי User
        if (!recipientEmail) {
          const users = await base44.asServiceRole.entities.User.filter({ id: notification.recipient_user_id });
          if (users.length > 0) recipientEmail = users[0].email;
        }
      } else {
        const users = await base44.asServiceRole.entities.User.filter({ id: notification.recipient_user_id });
        if (users.length > 0) recipientEmail = users[0].email;
      }

      if (recipientEmail) {
        try {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: recipientEmail,
            subject: 'תזכורת משוב - הדסה',
            body: notification.message
          });
          console.log(`[processScheduledNotifications] Sent email to ${recipientEmail} for notification ${notification.id}`);
          sent++;
        } catch (e) {
          console.warn(`[processScheduledNotifications] Failed to send email to ${recipientEmail}:`, e.message);
        }
      } else {
        console.warn(`[processScheduledNotifications] No email found for recipient ${notification.recipient_user_id}`);
      }

      await base44.asServiceRole.entities.Notification.update(notification.id, { email_sent: true });
    }

    return Response.json({ success: true, sent, skipped, total: due.length });
  } catch (error) {
    console.error('[processScheduledNotifications] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});