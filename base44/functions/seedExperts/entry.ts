import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const EXPERTS = [
  { name: 'ד"ר חמרני' },
  { name: 'ד"ר פרנקל' },
  { name: 'ד"ר פרץ' },
  { name: 'ד"ר מיסמה הבר' },
  { name: 'ד"ר סומפולינסקי' },
  { name: 'ד"ר אמסלם' },
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check existing
    const existing = await base44.asServiceRole.entities.Expert.list();
    if (existing && existing.length > 0) {
      return Response.json({ message: 'Already seeded', count: existing.length, experts: existing });
    }

    const created = [];
    for (const expert of EXPERTS) {
      const result = await base44.asServiceRole.entities.Expert.create(expert);
      created.push(result);
    }

    return Response.json({ success: true, created });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});