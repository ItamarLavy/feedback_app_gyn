import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// מחזיר רשימת מנטורים (מומחים + תורן 1 מתקדם) למתמחים, ללא סיסמאות.
// משתמש ב-service role כדי לעקוף את ה-RLS של Expert (שאינו מאפשר למתמחה לקרוא).
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [experts, seniorInterns] = await Promise.all([
      base44.asServiceRole.entities.Expert.list(),
      base44.asServiceRole.entities.Intern.filter({ stage: 'תורן 1 מתקדם' }),
    ]);

    const safeExperts = experts.map(e => ({ id: e.id, name: e.name, email: e.email, email2: e.email2 || null }));
    const safeSeniors = seniorInterns.map(i => ({ id: i.id, name: i.name, email: i.email, email2: i.email2 || null }));

    return Response.json({ experts: safeExperts, seniorInterns: safeSeniors });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});