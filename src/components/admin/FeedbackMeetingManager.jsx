import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Clock, Users, Plus, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';

export default function FeedbackMeetingManager({ interns, experts }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    intern_id: '',
    meeting_date: '',
    location: '',
    notes: '',
    invited_experts: []
  });
  const queryClient = useQueryClient();

  const { data: meetings = [] } = useQuery({
    queryKey: ['feedback-meetings'],
    queryFn: () => base44.entities.FeedbackMeeting.list('-meeting_date')
  });

  const createMeetingMutation = useMutation({
    mutationFn: (data) => base44.entities.FeedbackMeeting.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback-meetings'] });
      setShowForm(false);
      setFormData({ intern_id: '', meeting_date: '', location: '', notes: '', invited_experts: [] });
    }
  });

  const deleteMeetingMutation = useMutation({
    mutationFn: (id) => base44.entities.FeedbackMeeting.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback-meetings'] });
    }
  });

  const updateMeetingMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.FeedbackMeeting.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback-meetings'] });
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const selectedIntern = interns.find(i => i.id === formData.intern_id);
    
    createMeetingMutation.mutate({
      intern_id: formData.intern_id,
      intern_name: selectedIntern?.name,
      meeting_date: formData.meeting_date,
      location: formData.location,
      notes: formData.notes,
      invited_experts: formData.invited_experts,
      status: 'מתוכנן'
    });
  };

  const toggleExpert = (expert) => {
    setFormData(prev => ({
      ...prev,
      invited_experts: prev.invited_experts.some(e => e.id === expert.id)
        ? prev.invited_experts.filter(e => e.id !== expert.id)
        : [...prev.invited_experts, { id: expert.id, name: expert.name }]
    }));
  };

  const handleDelete = (meetingId) => {
    if (window.confirm('האם למחוק פגישה זו?')) {
      deleteMeetingMutation.mutate(meetingId);
    }
  };

  const handleStatusChange = (meeting, newStatus) => {
    updateMeetingMutation.mutate({
      id: meeting.id,
      data: { ...meeting, status: newStatus }
    });
  };

  // Check for reminders needed
  const upcomingMeetings = meetings.filter(m => {
    const daysUntil = differenceInDays(parseISO(m.meeting_date), new Date());
    return m.status === 'מתוכנן' && daysUntil >= 0 && daysUntil <= 2;
  });

  // Check for 6-month reminders
  const internsWith6MonthReminder = interns.map(intern => {
    const internMeetings = meetings.filter(m => 
      m.intern_id === intern.id && m.status === 'התקיים'
    ).sort((a, b) => new Date(b.meeting_date) - new Date(a.meeting_date));
    
    const lastMeeting = internMeetings[0];
    let needsReminder = false;
    let daysUntilDue = 0;
    
    if (lastMeeting) {
      const monthsSince = differenceInDays(new Date(), parseISO(lastMeeting.meeting_date)) / 30;
      needsReminder = monthsSince >= 5; // חודש לפני (5 חודשים)
      daysUntilDue = 180 - differenceInDays(new Date(), parseISO(lastMeeting.meeting_date));
    } else {
      needsReminder = true; // אין פגישה קודמת
      daysUntilDue = 0;
    }
    
    return { intern, needsReminder, lastMeeting, daysUntilDue };
  }).filter(item => item.needsReminder);

  return (
    <div className="space-y-6">
      {/* 6-Month Reminders */}
      {internsWith6MonthReminder.length > 0 && (
        <Card className="border-2 border-amber-300 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-amber-800">
              <AlertCircle className="w-5 h-5" />
              תזכורות לפגישות משוב (כל 6 חודשים)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {internsWith6MonthReminder.map(({ intern, lastMeeting, daysUntilDue }) => (
                <div key={intern.id} className="p-3 bg-white rounded-lg border border-amber-200">
                  <p className="font-medium text-slate-800">{intern.name}</p>
                  <p className="text-sm text-slate-600">
                    {lastMeeting 
                      ? `פגישה אחרונה: ${format(parseISO(lastMeeting.meeting_date), 'dd/MM/yyyy')} - יש לתאם פגישה חדשה`
                      : 'לא נקבעה פגישה עדיין - יש לתאם פגישת משוב ראשונה'}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Meeting Reminders */}
      {upcomingMeetings.length > 0 && (
        <Card className="border-2 border-blue-300 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-blue-800">
              <Clock className="w-5 h-5" />
              תזכורות לפגישות קרובות
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {upcomingMeetings.map(meeting => {
                const daysUntil = differenceInDays(parseISO(meeting.meeting_date), new Date());
                return (
                  <div key={meeting.id} className="p-3 bg-white rounded-lg border border-blue-200">
                    <p className="font-medium text-slate-800">{meeting.intern_name}</p>
                    <p className="text-sm text-slate-600">
                      {format(parseISO(meeting.meeting_date), 'dd/MM/yyyy HH:mm')}
                      {' • '}
                      {daysUntil === 0 ? 'היום!' : daysUntil === 1 ? 'מחר' : `עוד ${daysUntil} ימים`}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Meeting Manager */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-teal-600" />
              ניהול פגישות משוב
            </span>
            <Button
              size="sm"
              onClick={() => setShowForm(!showForm)}
              className="bg-teal-600 hover:bg-teal-700"
            >
              <Plus className="w-4 h-4 ml-1" />
              קבע פגישה
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {showForm && (
            <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-slate-50 rounded-lg">
              <div className="space-y-2">
                <Label>מתמחה</Label>
                <Select
                  value={formData.intern_id}
                  onValueChange={(value) => setFormData({ ...formData, intern_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="בחר מתמחה" />
                  </SelectTrigger>
                  <SelectContent>
                    {interns.map(intern => (
                      <SelectItem key={intern.id} value={intern.id}>
                        {intern.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>תאריך ושעה</Label>
                  <Input
                    type="datetime-local"
                    value={formData.meeting_date}
                    onChange={(e) => setFormData({ ...formData, meeting_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>מיקום</Label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="לדוגמה: חדר ישיבות 3"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>מומחים מוזמנים</Label>
                <div className="space-y-2 max-h-40 overflow-y-auto p-2 bg-white rounded border">
                  {experts.map(expert => (
                    <div key={expert.id} className="flex items-center gap-2">
                      <Checkbox
                        checked={formData.invited_experts.some(e => e.id === expert.id)}
                        onCheckedChange={() => toggleExpert(expert)}
                      />
                      <label className="text-sm">{expert.name}</label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>הערות</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="הערות נוספות לגבי הפגישה..."
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={!formData.intern_id || !formData.meeting_date}>
                  קבע פגישה ושלח הזמנות
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  ביטול
                </Button>
              </div>
            </form>
          )}

          <div className="space-y-3">
            {meetings.length === 0 ? (
              <p className="text-slate-500 text-center py-4">לא נקבעו פגישות עדיין</p>
            ) : (
              meetings.map(meeting => (
                <div
                  key={meeting.id}
                  className={`rounded-lg border-2 ${
                    meeting.status === 'התקיים'
                      ? 'bg-green-50 border-green-200 p-2'
                      : meeting.status === 'בוטל'
                      ? 'bg-slate-100 border-slate-300 p-4'
                      : 'bg-blue-50 border-blue-300 p-4'
                  }`}
                >
                  <div className={`flex items-center justify-between ${meeting.status === 'התקיים' ? 'mb-0' : 'mb-3'}`}>
                    <div className="flex items-center gap-2 flex-1">
                      <h4 className={`font-semibold ${meeting.status === 'התקיים' ? 'text-sm text-green-700' : 'text-slate-800'}`}>
                        {meeting.intern_name}
                      </h4>
                      {meeting.status === 'התקיים' && (
                        <>
                          <span className="text-slate-400">•</span>
                          <div className="flex items-center gap-1 text-xs text-slate-600">
                            <Calendar className="w-3 h-3" />
                            <span>{format(parseISO(meeting.meeting_date), 'dd/MM/yyyy')}</span>
                          </div>
                        </>
                      )}
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(meeting.id)}
                      className={`text-slate-400 hover:text-red-600 ${meeting.status === 'התקיים' ? 'h-6 w-6' : ''}`}
                    >
                      <Trash2 className={meeting.status === 'התקיים' ? 'w-3 h-3' : 'w-4 h-4'} />
                    </Button>
                  </div>

                  {meeting.status !== 'התקיים' && (
                    <>
                      <div className="flex items-center gap-2 text-sm text-slate-600 mt-1">
                        <Calendar className="w-3 h-3" />
                        <span>{format(parseISO(meeting.meeting_date), 'dd/MM/yyyy HH:mm')}</span>
                      </div>
                      {meeting.location && (
                        <p className="text-sm text-slate-600 mt-1">📍 {meeting.location}</p>
                      )}

                      {meeting.invited_experts && meeting.invited_experts.length > 0 && (
                        <div className="flex items-center gap-2 mb-2 mt-2">
                          <Users className="w-4 h-4 text-slate-500" />
                          <span className="text-sm text-slate-600">
                            {meeting.invited_experts.map(e => e.name).join(', ')}
                          </span>
                        </div>
                      )}

                      {meeting.notes && (
                        <p className="text-sm text-slate-600 mb-2 border-t pt-2">{meeting.notes}</p>
                      )}

                      <div className="flex gap-2">
                        {meeting.status === 'מתוכנן' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusChange(meeting, 'התקיים')}
                              className="text-green-600 border-green-600 hover:bg-green-50"
                            >
                              <CheckCircle className="w-3 h-3 ml-1" />
                              סמן כהתקיים
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusChange(meeting, 'בוטל')}
                            >
                              ביטול פגישה
                            </Button>
                          </>
                        )}
                        {meeting.status === 'בוטל' && (
                          <span className="text-sm font-medium text-slate-600">
                            סטטוס: {meeting.status}
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}