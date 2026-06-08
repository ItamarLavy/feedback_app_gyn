import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Badge } from "@/components/ui/badge";
import { UserX } from 'lucide-react';
import { parseISO } from 'date-fns';

export default function UnassignedInterns({ interns, rotationPlans }) {
  const today = new Date();

  // מתמחים שיש להם רשומה בתוכנית ההתמחות עם תאריכים שמכסים את היום
  const assignedInternIds = new Set(
    (rotationPlans || [])
      .filter(p => {
        if (!p.start_date || !p.end_date) return false;
        const start = parseISO(p.start_date);
        const end = parseISO(p.end_date);
        return today >= start && today <= end;
      })
      .map(p => p.intern_id)
  );

  const unassigned = interns.filter(i => !assignedInternIds.has(i.id));

  if (unassigned.length === 0) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2 mb-3">
        <UserX className="w-4 h-4 text-slate-400" />
        <span className="font-semibold text-slate-600 text-sm">לא משובצים לאף מחלקה היום</span>
        <Badge className="bg-slate-200 text-slate-600 text-xs">{unassigned.length}</Badge>
      </div>
      <div className="flex flex-wrap gap-2">
        {unassigned.map(intern => (
          <Link
            key={intern.id}
            to={createPageUrl('InternDetails') + `?id=${intern.id}`}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-full border border-slate-200 hover:border-teal-300 transition-all text-sm text-slate-700 hover:text-teal-700"
          >
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center text-white font-semibold text-[10px]">
              {intern.name?.[0]}
            </div>
            {intern.name}
            {intern.stage && (
              <span className="text-xs text-slate-400">· {intern.stage}</span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}