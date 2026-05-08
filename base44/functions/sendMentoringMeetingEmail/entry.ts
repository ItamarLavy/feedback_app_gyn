import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { title, meeting_date, location, notes, intern_names, expert_names, recipients } = await req.json();
    // recipients = [{ email, name }]

    if (!recipients || recipients.length === 0) {
      return Response.json({ success: true, sent: 0 });
    }

    const dateStr = new Date(meeting_date).toLocaleString('he-IL', { dateStyle: 'full', timeStyle: 'short', timeZone: 'Asia/Jerusalem' });

    const results = await Promise.allSettled(
      recipients.map(r =>
        base44.asServiceRole.integrations.Core.SendEmail({
          to: r.email,
          subject: `פגישת מנטורינג: ${title} - ${dateStr}`,
          body: `שלום ${r.name},\n\nנקבעה פגישת מנטורינג:\n\nנושא: ${title}\nתאריך: ${dateStr}${location ? `\nמיקום: ${location}` : ''}${notes ? `\nהערות: ${notes}` : ''}\n\nמשתתפים:\n${[...(intern_names || []), ...(expert_names || [])].join(', ')}\n\nתודה,\nצוות אגף נשים - הדסה`
        })
      )
    );

    const sent = results.filter(r => r.status === 'fulfilled').length;
    console.log(`[sendMentoringMeetingEmail] sent ${sent}/${recipients.length} emails`);
    return Response.json({ success: true, sent });
  } catch (error) {
    console.error('[sendMentoringMeetingEmail] error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});