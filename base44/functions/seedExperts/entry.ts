import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const EXPERTS = [
  { name: 'אדלר חנה', email: 'chanadler@gmail.com' },
  { name: 'אמסלם חגי', email: 'hagai223@gmail.com' },
  { name: 'אש ברודר אפרת', email: 'esh.broder@gmail.com' },
  { name: 'בהריר עופר', email: 'oferbeharier@gmail.com' },
  { name: 'בנטוב יעקב', email: 'yaakov.bentov@gmail.com' },
  { name: 'גודין מירי', email: 'godinmiri@gmail.com' },
  { name: 'גלעד רונית', email: 'gilad.ronit@gmail.com' },
  { name: 'הרשקו ענת', email: 'anat.klement@gmail.com' },
  { name: 'ויזל אילנה' },
  { name: 'ולסקי דן', email: 'valskydan@gmail.com' },
  { name: 'יגל שמחה', email: 'simcha.yagel@gmail.com' },
  { name: 'יצחק רנית', email: 'ranithizk@gmail.com' },
  { name: 'כהן נעם', email: 'cohen.noam@gmail.com' },
  { name: 'לביא יובל', email: 'yuvallavy@gmail.com' },
  { name: 'לב שגיא אחינעם', email: 'levsagie@netvision.net.il' },
  { name: 'לויט לורין', email: 'lorinnel@gmail.com' },
  { name: 'לוריא מיכל', email: 'mijalluria@gmail.com' },
  { name: 'מיסמה הלן', email: 'helene_misme@hotmail.com' },
  { name: 'נובוסלסקי מיכל', email: 'Perskypersky@gmail.com' },
  { name: 'סמפולינסקי ישי', email: 'ysompo@gmail.com' },
  { name: 'קביסה מאור', email: 'maorkabessa@gmail.com' },
  { name: 'רוזנהק דני', email: 'danielrosenak@gmail.com' },
  { name: 'רוזנבלו עובדיה', email: 'ovadyar@gmail.com' },
  { name: 'שוורץ תומר', email: 'tomershwartz@gmail.com' },
  { name: 'שמעונוביץ צביקה', email: 'tzvika333@gmail.com' },
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

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