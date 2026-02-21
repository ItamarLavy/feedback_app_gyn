import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Users, MapPin, FileText } from 'lucide-react';
import { format, parseISO, isPast } from 'date-fns';

export default function MyFeedbackMeetings({ meetings }) {
  const sortedMeetings = [...meetings].sort((a, b) => 
    new Date(b.meeting_date) - new Date(a.meeting_date)
  );

  const upcomingMeetings = sortedMeetings.filter(m => 
    m.status === 'מתוכנן' && !isPast(parseISO(m.meeting_date))
  );
  
  const pastMeetings = sortedMeetings.filter(m => 
    m.status === 'התקיים' || (m.status === 'מתוכנן' && isPast(parseISO(m.meeting_date)))
  );

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="w-5 h-5 text-teal-600" />
          פגישות משוב שלי
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upcoming Meetings */}
        {upcomingMeetings.length > 0 && (
          <div>
            <h3 className="font-semibold text-slate-700 mb-3">פגישות מתוכננות</h3>
            <div className="space-y-3">
              {upcomingMeetings.map(meeting => (
                <div key={meeting.id} className="p-4 bg-blue-50 border-2 border-blue-300 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-blue-600" />
                      <span className="font-semibold text-slate-800">
                        {format(parseISO(meeting.meeting_date), 'dd/MM/yyyy')}
                      </span>
                      <span className="text-slate-600">
                        {format(parseISO(meeting.meeting_date), 'HH:mm')}
                      </span>
                    </div>
                    <Badge className="bg-blue-600">מתוכנן</Badge>
                  </div>

                  {meeting.location && (
                    <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                      <MapPin className="w-4 h-4" />
                      <span>{meeting.location}</span>
                    </div>
                  )}

                  {meeting.invited_experts && meeting.invited_experts.length > 0 && (
                    <div className="flex items-start gap-2 text-sm text-slate-600 mb-2">
                      <Users className="w-4 h-4 mt-0.5" />
                      <div>
                        <p className="font-medium">משתתפים:</p>
                        <p>{meeting.invited_experts.map(e => e.name).join(', ')}</p>
                      </div>
                    </div>
                  )}

                  {meeting.notes && (
                    <div className="flex items-start gap-2 text-sm text-slate-600 mt-2 pt-2 border-t border-blue-200">
                      <FileText className="w-4 h-4 mt-0.5" />
                      <p>{meeting.notes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Past Meetings */}
        {pastMeetings.length > 0 && (
          <div>
            <h3 className="font-semibold text-slate-700 mb-3">פגישות קודמות</h3>
            <div className="space-y-2">
              {pastMeetings.map(meeting => (
                <div key={meeting.id} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-slate-800">
                        {format(parseISO(meeting.meeting_date), 'dd/MM/yyyy HH:mm')}
                      </span>
                    </div>
                    <Badge className="bg-green-600 text-xs">התקיים</Badge>
                  </div>
                  {meeting.location && (
                    <p className="text-xs text-slate-600 mr-6">📍 {meeting.location}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {meetings.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p>לא נקבעו פגישות משוב עדיין</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}