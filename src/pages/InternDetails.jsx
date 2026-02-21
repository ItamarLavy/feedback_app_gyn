import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import PasswordModal from '../components/admin/PasswordModal';
import FeedbackCardDetailed from '../components/feedback/FeedbackCardDetailed';
import InternStats from '../components/admin/InternStats';
import RotationManager from '../components/admin/RotationManager';
import RotationMap from '../components/intern/RotationMap';
import MyFeedbackMeetings from '../components/intern/MyFeedbackMeetings';
import ManagerNotes from '../components/admin/ManagerNotes';
import { User, ArrowLeft, ClipboardList } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function InternDetails() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(true);
  const queryClient = useQueryClient();
  
  const urlParams = new URLSearchParams(window.location.search);
  const internId = urlParams.get('id');

  const { data: intern } = useQuery({
    queryKey: ['intern', internId],
    queryFn: async () => {
      const interns = await base44.entities.Intern.filter({ id: internId });
      return interns[0];
    },
    enabled: isAuthenticated && !!internId
  });

  const { data: feedbacks = [] } = useQuery({
    queryKey: ['feedbacks', internId],
    queryFn: async () => {
      return base44.entities.Feedback.filter({ intern_id: internId }, '-created_date');
    },
    enabled: isAuthenticated && !!internId
  });

  const { data: rotations = [] } = useQuery({
    queryKey: ['rotations', internId],
    queryFn: async () => {
      return base44.entities.Rotation.filter({ intern_id: internId }, 'start_date');
    },
    enabled: isAuthenticated && !!internId
  });

  const { data: meetings = [] } = useQuery({
    queryKey: ['meetings', internId],
    queryFn: async () => {
      return base44.entities.FeedbackMeeting.filter({ intern_id: internId }, '-meeting_date');
    },
    enabled: isAuthenticated && !!internId
  });

  const handleDeleteFeedback = async (feedbackId) => {
    await base44.entities.Feedback.delete(feedbackId);
    queryClient.invalidateQueries({ queryKey: ['feedbacks', internId] });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-slate-100 flex items-center justify-center" dir="rtl">
        <PasswordModal
          open={showPasswordModal}
          onSuccess={() => {
            setIsAuthenticated(true);
            setShowPasswordModal(false);
          }}
          onClose={() => window.history.back()}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-slate-100" dir="rtl">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-bl from-teal-500 to-teal-600 flex items-center justify-center shadow-lg text-white text-2xl font-bold">
              {intern?.name?.[0] || '?'}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">{intern?.name || 'טוען...'}</h1>
              <p className="text-slate-500">פרופיל מתמחה</p>
            </div>
          </div>
          <Link 
            to={createPageUrl('Admin')}
            className="flex items-center gap-2 text-teal-600 hover:text-teal-700 font-medium"
          >
            חזרה לניהול
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>

        {/* Stats */}
        <div className="mb-8">
          <InternStats feedbacks={feedbacks} internName={intern?.name} />
        </div>

        {/* Rotation Management & Map */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <RotationManager intern={intern} rotations={rotations} />
          <RotationMap rotations={rotations} />
        </div>

        {/* Feedback Meetings */}
        <div className="mb-8">
          <MyFeedbackMeetings meetings={meetings} />
        </div>

        {/* Manager Notes */}
        <div className="mb-8">
          <ManagerNotes intern={intern} />
        </div>

        {/* Feedbacks */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ClipboardList className="w-5 h-5 text-teal-600" />
              משובים ({feedbacks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {feedbacks.map(feedback => (
                <FeedbackCardDetailed 
                  key={feedback.id} 
                  feedback={feedback} 
                  showDelete={true}
                  onDelete={handleDeleteFeedback}
                />
              ))}
              {feedbacks.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                  אין משובים עדיין למתמחה זה
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}