import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Create one record
    const created = await base44.asServiceRole.entities.Expert.create({
      name: 'DEBUG_TEST_' + Date.now(),
      email: 'debugtest@example.com'
    });

    // Immediately read it back by id
    let readBack = null;
    let readError = null;
    try {
      readBack = await base44.asServiceRole.entities.Expert.get(created.id);
    } catch (e) {
      readError = e.message;
    }

    // List all
    const all = await base44.asServiceRole.entities.Expert.list();

    return Response.json({
      created_id: created.id,
      created,
      readBack,
      readError,
      list_count: all.length,
      list: all.map(e => ({ id: e.id, name: e.name, is_deleted: e.is_deleted, environment: e.environment }))
    });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});