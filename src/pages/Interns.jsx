import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent } from "@/components/ui/card";
import { UserCircle2, ChevronLeft, Star } from 'lucide-react';

export default function Interns() {
  const { data: interns = [] } = useQuery({
    queryKey: ['interns'],
    queryFn: () => base44.entities.Intern.list()
  });

  const { data: feedbacks = [] } = useQuery({
    queryKey: ['feedbacks'],
    queryFn: () => base44.entities.Feedback.list()
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100" dir="rtl">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-bl from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
            <UserCircle2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">פאנל מתמחים</h1>
            <p className="text-slate-500 text-sm">כניסה לעמוד אישי</p>
          </div>
        </div>

        {/* Interns Grid */}
        <div className="grid md:grid-cols-2 gap-4">
          {interns.map(intern => {
            const internFeedbacks = feedbacks.filter(f => f.intern_id === intern.id);
            
            return (
              <Link
                key={intern.id}
                to={createPageUrl('InternProfile') + `?id=${intern.id}`}
              >
                <Card className="border-0 shadow-lg bg-white hover:shadow-xl transition-all hover:scale-[1.02]">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-xl">
                          {intern.name?.[0]}
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-800 text-lg">{intern.name}</h3>
                          <div className="flex items-center gap-1 text-sm text-slate-500">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span>{internFeedbacks.length} פרוצדורות</span>
                          </div>
                        </div>
                      </div>
                      <ChevronLeft className="w-5 h-5 text-slate-400" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}

          {interns.length === 0 && (
            <div className="col-span-2 text-center py-12 text-slate-500">
              אין מתמחים במערכת
            </div>
          )}
        </div>
      </div>
    </div>
  );
}