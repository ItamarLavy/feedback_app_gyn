import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Create as the authenticated user (not service role)
    const created = await base44.entities.Expert.create({
      name: 'DEBUG_USER_' + Date.now(),
      email: 'debuguser@example.com'
    });

    let readBack = null;
    let readError = null;
    try {
      readBack = await base44.entities.Expert.get(created.id);
    } catch (e) {
      readError = e.message;
    }

    const all = await base44.entities.Expert.list();

    return Response.json({
      user_email: user?.email,
      user_role: user?.role,
      created_id: created.id,
      readBack: readBack ? { id: readBack.id, name: readBack.name } : null,
      readError,
      list_count: all.length
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});