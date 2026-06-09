import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/lib/AuthContext';

const MANAGER_EMAILS = ['yuval.lavie@hadassah.org.il', 'ronit.gilad@hadassah.org.il', 'zvika@hadassah.org.il'];

const ROLE_LABELS = {
  intern: 'מתמחה',
  expert: 'מומחה',
  manager: 'מנהל',
  unknown: 'לא ידוע',
};

const ROLE_COLORS = {
  intern: 'bg-blue-100 text-blue-700',
  expert: 'bg-purple-100 text-purple-700',
  manager: 'bg-teal-100 text-teal-700',
  unknown: 'bg-slate-100 text-slate-500',
};

export default function Suggestions() {
  const { user } = useAuth();
  const isAdmin = MANAGER_EMAILS.includes(user?.email) || user?.role === 'admin';

  const { data: suggestions = [], isLoading } = useQuery({
    queryKey: ['suggestions'],
    queryFn: () => base44.entities.ImprovementSuggestion.list('-created_date'),
    enabled: isAdmin,
  });

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <p className="text-slate-500">אין הרשאה לצפות בדף זה</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-teal-50/50 to-cyan-100" dir="rtl">
      <div className="max-w-3xl mx-auto px-4 py-8 pb-32">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-lg">
            <Lightbulb className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">הצעות לשיפור</h1>
            <p className="text-slate-500 text-sm">{suggestions.length} הצעות בסך הכל</p>
          </div>
        </div>

        {isLoading && (
          <div className="text-center py-12 text-slate-400">טוען...</div>
        )}

        {!isLoading && suggestions.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <Lightbulb className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>אין הצעות עדיין</p>
          </div>
        )}

        <div className="space-y-3">
          {suggestions.map(s => (
            <Card key={s.id} className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-800 text-sm">{s.user_name || 'אנונימי'}</span>
                    {s.user_role && (
                      <Badge className={`text-xs ${ROLE_COLORS[s.user_role] || ROLE_COLORS.unknown}`}>
                        {ROLE_LABELS[s.user_role] || s.user_role}
                      </Badge>
                    )}
                  </div>
                  {s.created_date && (
                    <span className="text-xs text-slate-400 flex-shrink-0">
                      {format(new Date(s.created_date), 'dd/MM/yyyy')}
                    </span>
                  )}
                </div>
                <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{s.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}