import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { to, expertName, expertId, internName, procedureType, procedureCategory, procedureDate, feedbackId, appOrigin } = await req.json();

    if (!to || !feedbackId) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const feedbackUrl = `${appOrigin}/ExpertFeedbackDetailWithAuth?id=${expertId}`;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to,
      subject: `בקשת משוב מ-${internName} - ${procedureType}`,
      body: `שלום ${expertName},\n\n${internName} ביקש/ה את משובך על: ${procedureType} (${procedureCategory})\nתאריך ביצוע: ${procedureDate || 'לא צוין'}\n\nאנא מלא/י את המשוב בקישור הבא:\n${feedbackUrl}\n\nתודה על שיתוף הפעולה!\nצוות אגף נשים - הדסה`
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});