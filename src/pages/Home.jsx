import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import FeedbackForm from '../components/feedback/FeedbackForm';
import { Stethoscope } from 'lucide-react';

export default function Home() {
  const queryClient = useQueryClient();

  const { data: interns = [] } = useQuery({
    queryKey: ['interns'],
    queryFn: () => base44.entities.Intern.list()
  });

  const { data: experts = [] } = useQuery({
    queryKey: ['experts'],
    queryFn: () => base44.entities.Expert.list()
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-slate-100" dir="rtl">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-bl from-teal-500 to-teal-600 shadow-lg shadow-teal-500/30 mb-4">
            <Stethoscope className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            מערכת משוב אגף נשים
          </h1>
          <p className="text-lg text-teal-700 font-medium mb-1">הדסה הר הצופים</p>
          <p className="text-slate-500">
            הזנת משוב למתמחה לאחר ביצוע פרוצדורה
          </p>
        </div>

        {/* Form */}
        <FeedbackForm 
          interns={interns} 
          experts={experts}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['feedbacks'] })}
        />
      </div>
    </div>
  );
}