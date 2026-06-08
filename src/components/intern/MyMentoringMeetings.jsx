import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, MapPin, Users } from 'lucide-react';
import { format, isPast } from 'date-fns';

export default function MyMentoringMeetings({ internId }) {
  const { data: myMeetings = [] } = useQuery({
    queryKey: ['feedback-meetings-intern', internId],
    queryFn: async () => {
      const all = await base44.entities.FeedbackMeeting.list('-meeting_date', 200);
      return all.filter(m => m.intern_id === internId);
    },
    enabled: !!internId
  });

  const upcoming = myMeetings.filter(m => !isPast(new Date(m.meeting_date)));
  const past = myMeetings.filter(m => isPast(new Date(m.meeting_date)));

  if (myMeetings.length === 0) return null;

  return (
    <Card className="border-0 shadow-lg mb-8">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-indigo-600" />
          שיחות משוב שלי
          {upcoming.length > 0 && (
            <Badge className="bg-indigo-600 text-white text-xs">{upcoming.length} קרובות</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {upcoming.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase mb-2">מתוכננות</p>
            <div className="space-y-2">
              {upcoming.map(m => <MeetingItem key={m.id} meeting={m} />)}
            </div>
          </div>
        )}
        {past.length > 0 && (
          <details>
            <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-600">
              {past.length} פגישות שעברו
            </summary>
            <div className="space-y-2 mt-2">
              {past.map(m => <MeetingItem key={m.id} meeting={m} past />)}
            </div>
          </details>
        )}
      </CardContent>
    </Card>
  );
}

function MeetingItem({ meeting, past = false }) {
  const dateObj = new Date(meeting.meeting_date);
  const expertNames = meeting.invited_experts?.map(e => e.name).join(', ') || '';
  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border ${past ? 'bg-slate-50 border-slate-200 opacity-70' : 'bg-indigo-50 border-indigo-200'}`}>
      <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex flex-col items-center justify-center text-xs font-bold ${past ? 'bg-slate-200 text-slate-600' : 'bg-indigo-100 text-indigo-700'}`}>
        <span className="text-lg leading-none">{format(dateObj, 'd')}</span>
        <span className="uppercase text-[10px]">{format(dateObj, 'MMM')}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-800 text-sm">שיחת משוב</p>
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-slate-500">
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{format(dateObj, 'HH:mm')}</span>
          {meeting.location && (
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{meeting.location}</span>
          )}
        </div>
        {expertNames && (
          <div className="flex items-center gap-1 mt-1.5 text-xs text-slate-500">
            <Users className="w-3 h-3" />
            <span>{expertNames}</span>
          </div>
        )}
        {meeting.notes && <p className="text-xs text-slate-500 mt-1 italic">{meeting.notes}</p>}
      </div>
    </div>
  );
}