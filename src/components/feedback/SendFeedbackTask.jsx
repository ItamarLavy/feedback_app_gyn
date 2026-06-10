import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PROCEDURE_CATEGORIES } from '@/lib/procedureConstants';
import { format } from 'date-fns';
import { Send, ClipboardList, CheckCircle, Clock } from 'lucide-react';

const CATEGORIES = Object.keys(PROCEDURE_CATEGORIES);

export default function SendFeedbackTask({ expertId, expertName }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    intern_id: '',
    procedure_category: 'OB',
    procedure_type: '',
    procedure_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const { data: interns = [] } = useQuery({
    queryKey: ['interns-for-task'],
    queryFn: () => base44.entities.Intern.list()
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['feedback-tasks-expert', expertId],
    queryFn: () => base44.entities.FeedbackTask.filter({ expert_id: expertId }, '-created_date'),
    enabled: !!expertId
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const intern = interns.find(i => i.id === data.intern_id);
      const task = await base44.entities.FeedbackTask.create({
        expert_id: expertId,
        expert_name: expertName,
        intern_id: data.intern_id,
        intern_name: intern?.name || '',
        intern_email: intern?.email || '',
        procedure_category: data.procedure_category,
        procedure_type: data.procedure_type,
        procedure_date: data.procedure_date,
        notes: data.notes,
        status: 'pending'
      });

      // שלח התראה + אימייל למתמחה
      try {
        const allUsers = await base44.entities.User.list();
        const internUser = allUsers.find(u => u.email === intern?.email || u.email === intern?.email2);
        if (internUser?.id) {
          await base44.entities.Notification.create({
            recipient_user_id: internUser.id,
            recipient_role: 'intern',
            type: 'feedback_request',
            intern_name: intern?.name,
            expert_name: expertName,
            message: `${expertName} ביקש ממך למלא משוב על: ${data.procedure_type} (${data.procedure_date})`
          });
        }
        if (intern?.email) {
          await base44.integrations.Core.SendEmail({
            to: intern.email,
            subject: `בקשת משוב מ${expertName}`,
            body: `שלום ${intern?.name},\n\n${expertName} ביקש ממך למלא משוב על הפרוצדורה:\n${data.procedure_category} — ${data.procedure_type}\nתאריך: ${data.procedure_date}\n${data.notes ? `הערות: ${data.notes}` : ''}\n\nנא היכנס לאפליקציה ומלא את המשוב.`
          });
        }
      } catch (e) { console.warn('notification error', e); }

      return task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback-tasks-expert', expertId] });
      setShowForm(false);
      setForm({ intern_id: '', procedure_category: 'OB', procedure_type: '', procedure_date: new Date().toISOString().split('T')[0], notes: '' });
    }
  });

  const procedures = PROCEDURE_CATEGORIES[form.procedure_category] || [];

  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  return (
    <div className="space-y-4">
      {/* כפתור שלח משימה */}
      {!showForm ? (
        <Button
          onClick={() => setShowForm(true)}
          className="w-full bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 text-white font-semibold"
        >
          <Send className="w-4 h-4 ml-2" />
          שלח בקשת משוב למתמחה
        </Button>
      ) : (
        <div className="bg-white rounded-xl border-2 border-purple-200 p-4 space-y-3 shadow-sm">
          <h3 className="font-semibold text-slate-800 text-sm">בקשת משוב חדשה</h3>

          {/* בחר מתמחה */}
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">מתמחה</label>
            <select
              value={form.intern_id}
              onChange={e => setForm(f => ({ ...f, intern_id: e.target.value }))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
            >
              <option value="">בחר מתמחה...</option>
              {interns.map(i => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </select>
          </div>

          {/* קטגוריה */}
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">קטגוריה</label>
            <select
              value={form.procedure_category}
              onChange={e => setForm(f => ({ ...f, procedure_category: e.target.value, procedure_type: '' }))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* פרוצדורה */}
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">פרוצדורה</label>
            <select
              value={form.procedure_type}
              onChange={e => setForm(f => ({ ...f, procedure_type: e.target.value }))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
            >
              <option value="">בחר פרוצדורה...</option>
              {procedures.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          {/* תאריך */}
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">תאריך</label>
            <input
              type="date"
              value={form.procedure_date}
              onChange={e => setForm(f => ({ ...f, procedure_date: e.target.value }))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          {/* הערות */}
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">הערות (אופציונלי)</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="הוסף הוראות או הערות למתמחה..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm min-h-[70px] resize-none"
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => createMutation.mutate(form)}
              disabled={!form.intern_id || !form.procedure_type || createMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700 text-white flex-1"
            >
              {createMutation.isPending ? 'שולח...' : 'שלח בקשה'}
            </Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>ביטול</Button>
          </div>
        </div>
      )}

      {/* מעקב בקשות */}
      {tasks.length > 0 && (
        <details className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <summary className="px-4 py-3 cursor-pointer font-medium text-slate-700 flex items-center gap-2 hover:bg-slate-50 transition-colors list-none">
            <ClipboardList className="w-4 h-4" />
            מעקב בקשות שנשלחו ({tasks.length})
          </summary>
          <div className="px-4 pb-4 pt-2 space-y-2">
            {pendingTasks.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-amber-600 mb-1.5 flex items-center gap-1"><Clock className="w-3 h-3" /> ממתין ({pendingTasks.length})</p>
                {pendingTasks.map(t => (
                  <div key={t.id} className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm flex items-center justify-between gap-2 mb-1">
                    <div className="min-w-0">
                      <span className="font-medium text-slate-800">{t.intern_name}</span>
                      <span className="text-slate-400 mx-1.5">•</span>
                      <span className="text-slate-600 truncate">{t.procedure_type}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-slate-400">{t.procedure_date}</span>
                      <Badge className="bg-amber-500 text-xs">ממתין</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {completedTasks.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-green-600 mb-1.5 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> בוצע ({completedTasks.length})</p>
                {completedTasks.map(t => (
                  <div key={t.id} className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm flex items-center justify-between gap-2 mb-1">
                    <div className="min-w-0">
                      <span className="font-medium text-slate-800">{t.intern_name}</span>
                      <span className="text-slate-400 mx-1.5">•</span>
                      <span className="text-slate-600 truncate">{t.procedure_type}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-slate-400">{t.procedure_date}</span>
                      <Badge className="bg-green-600 text-xs">בוצע</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </details>
      )}
    </div>
  );
}