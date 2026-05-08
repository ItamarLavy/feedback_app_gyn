import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Plus, Trash2, ChevronDown, ChevronUp, MapPin, Clock, Users } from 'lucide-react';
import { format } from 'date-fns';

export default function MentoringMeetingManager({ interns = [], experts = [] }) {
  const [open, setOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', date: '', time: '', location: '', intern_ids: [], expert_ids: [], notes: '' });
  const queryClient = useQueryClient();

  const { data: meetings = [] } = useQuery({
    queryKey: ['mentoring-meetings'],
    queryFn: () => base44.entities.MentoringMeeting.list('-meeting_date'),
    enabled: open
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const meeting = await base44.entities.MentoringMeeting.create(data);
      // שלח מיילים לכל המוזמנים
      const appOrigin = window.location.origin;
      const dateStr = new Date(data.meeting_date).toLocaleString('he-IL', { dateStyle: 'full', timeStyle: 'short' });
      const allRecipients = [
        ...interns.filter(i => data.intern_ids.includes(i.id)).map(i => ({ email: i.email, name: i.name, role: 'intern' })),
        ...experts.filter(e => data.expert_ids.includes(e.id)).map(e => ({ email: e.email, name: e.name, role: 'expert' }))
      ].filter(r => r.email);
      await Promise.all(allRecipients.map(r =>
        base44.integrations.Core.SendEmail({
          to: r.email,
          subject: `פגישת מנטורינג: ${data.title} - ${dateStr}`,
          body: `שלום ${r.name},\n\nנקבעה פגישת מנטורינג:\n\nנושא: ${data.title}\nתאריך: ${dateStr}${data.location ? `\nמיקום: ${data.location}` : ''}${data.notes ? `\nהערות: ${data.notes}` : ''}\n\nמשתתפים:\n${data.intern_names?.join(', ') || ''}, ${data.expert_names?.join(', ') || ''}\n\nתודה,\nצוות אגף נשים - הדסה`
        }).catch(() => {})
      ));
      return meeting;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentoring-meetings'] });
      setShowForm(false);
      setForm({ title: '', date: '', time: '', location: '', intern_ids: [], expert_ids: [], notes: '' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.MentoringMeeting.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mentoring-meetings'] })
  });

  const handleSubmit = () => {
    if (!form.date || !form.title) return;
    const dateTime = form.time ? `${form.date}T${form.time}:00` : `${form.date}T00:00:00`;
    const internNames = interns.filter(i => form.intern_ids.includes(i.id)).map(i => i.name);
    const expertNames = experts.filter(e => form.expert_ids.includes(e.id)).map(e => e.name);
    createMutation.mutate({
      title: form.title,
      meeting_date: dateTime,
      location: form.location,
      intern_ids: form.intern_ids,
      intern_names: internNames,
      expert_ids: form.expert_ids,
      expert_names: expertNames,
      notes: form.notes
    });
  };

  const toggleId = (list, id) =>
    list.includes(id) ? list.filter(x => x !== id) : [...list, id];

  const upcoming = meetings.filter(m => new Date(m.meeting_date) >= new Date());
  const past = meetings.filter(m => new Date(m.meeting_date) < new Date());

  return (
    <Card className="border-0 shadow-lg mb-8">
      <CardHeader
        className="cursor-pointer select-none hover:bg-slate-50 transition-colors rounded-xl"
        onClick={() => setOpen(o => !o)}
      >
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-indigo-600" />
            פגישות מנטורינג
            {upcoming.length > 0 && (
              <Badge className="bg-indigo-600 text-white text-xs">{upcoming.length} קרובות</Badge>
            )}
          </div>
          {open ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </CardTitle>
      </CardHeader>

      {open && (
        <CardContent className="space-y-4 pt-0">
          {/* Add button */}
          {!showForm && (
            <Button onClick={() => setShowForm(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
              <Plus className="w-4 h-4" /> קבע פגישה חדשה
            </Button>
          )}

          {/* Form */}
          {showForm && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 space-y-3">
              <p className="font-semibold text-indigo-800">פגישת מנטורינג חדשה</p>

              <Input
                placeholder="נושא / כותרת הפגישה *"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">תאריך *</label>
                  <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">שעה</label>
                  <Input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-500 mb-1 block flex items-center gap-1"><MapPin className="w-3 h-3" /> מיקום</label>
                <Input placeholder="חדר ישיבות, קליניקה..." value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
              </div>

              {/* Interns selector */}
              <div>
                <label className="text-xs text-slate-600 font-medium mb-2 block flex items-center gap-1"><Users className="w-3 h-3" /> מתמחים מוזמנים</label>
                <div className="flex flex-wrap gap-2">
                  {interns.map(intern => (
                    <button key={intern.id} type="button"
                      onClick={() => setForm(f => ({ ...f, intern_ids: toggleId(f.intern_ids, intern.id) }))}
                      className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                        form.intern_ids.includes(intern.id)
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-slate-600 border-slate-300 hover:border-indigo-400'
                      }`}
                    >{intern.name}</button>
                  ))}
                </div>
              </div>

              {/* Experts selector */}
              <div>
                <label className="text-xs text-slate-600 font-medium mb-2 block">מומחים מוזמנים</label>
                <div className="flex flex-wrap gap-2">
                  {experts.map(expert => (
                    <button key={expert.id} type="button"
                      onClick={() => setForm(f => ({ ...f, expert_ids: toggleId(f.expert_ids, expert.id) }))}
                      className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                        form.expert_ids.includes(expert.id)
                          ? 'bg-teal-600 text-white border-teal-600'
                          : 'bg-white text-slate-600 border-slate-300 hover:border-teal-400'
                      }`}
                    >{expert.name}</button>
                  ))}
                </div>
              </div>

              <Input
                placeholder="הערות (אופציונלי)"
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              />

              <div className="flex gap-2 pt-1">
                <Button onClick={handleSubmit} disabled={!form.title || !form.date || createMutation.isPending}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  {createMutation.isPending ? 'שומר...' : 'שמור פגישה'}
                </Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>ביטול</Button>
              </div>
            </div>
          )}

          {/* Upcoming meetings */}
          {upcoming.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase mb-2">קרובות</p>
              <div className="space-y-2">
                {upcoming.map(m => <MeetingCard key={m.id} meeting={m} onDelete={() => deleteMutation.mutate(m.id)} />)}
              </div>
            </div>
          )}

          {/* Past meetings */}
          {past.length > 0 && (
            <details className="mt-2">
              <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-600">
                {past.length} פגישות שעברו
              </summary>
              <div className="space-y-2 mt-2">
                {past.map(m => <MeetingCard key={m.id} meeting={m} onDelete={() => deleteMutation.mutate(m.id)} past />)}
              </div>
            </details>
          )}

          {meetings.length === 0 && !showForm && (
            <p className="text-center text-slate-400 py-6 text-sm">לא נקבעו פגישות עדיין</p>
          )}
        </CardContent>
      )}
    </Card>
  );
}

function MeetingCard({ meeting, onDelete, past = false }) {
  const dateObj = new Date(meeting.meeting_date);
  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border ${past ? 'bg-slate-50 border-slate-200 opacity-70' : 'bg-white border-indigo-100 shadow-sm'}`}>
      <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex flex-col items-center justify-center text-xs font-bold ${past ? 'bg-slate-200 text-slate-600' : 'bg-indigo-100 text-indigo-700'}`}>
        <span className="text-lg leading-none">{format(dateObj, 'd')}</span>
        <span className="uppercase">{format(dateObj, 'MMM')}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-800 text-sm">{meeting.title}</p>
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-slate-500">
          {meeting.meeting_date && (
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{format(dateObj, 'HH:mm')}</span>
          )}
          {meeting.location && (
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{meeting.location}</span>
          )}
        </div>
        <div className="flex flex-wrap gap-1 mt-1.5">
          {(meeting.intern_names || []).map(n => (
            <Badge key={n} className="text-[10px] bg-indigo-100 text-indigo-700 border-0 py-0">{n}</Badge>
          ))}
          {(meeting.expert_names || []).map(n => (
            <Badge key={n} className="text-[10px] bg-teal-100 text-teal-700 border-0 py-0">{n}</Badge>
          ))}
        </div>
        {meeting.notes && <p className="text-xs text-slate-500 mt-1 italic">{meeting.notes}</p>}
      </div>
      <Button variant="ghost" size="icon" onClick={onDelete} className="text-red-400 hover:text-red-600 hover:bg-red-50 h-7 w-7 flex-shrink-0">
        <Trash2 className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}