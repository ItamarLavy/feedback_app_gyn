import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent } from "@/components/ui/card";
import { Clock, CheckCircle } from 'lucide-react';

export default function PendingAccess() {
  const { user } = useAuth();
  const [requested, setRequested] = useState(false);

  useEffect(() => {
    if (!user?.email) return;

    const sendRequest = async () => {
      // בדוק אם כבר שלח בקשה
      const existing = await base44.entities.AccessRequest.filter({ email: user.email });
      if (existing.length === 0) {
        await base44.entities.AccessRequest.create({
          email: user.email,
          full_name: user.full_name || user.email,
          status: 'pending'
        });
      }
      setRequested(true);
    };

    sendRequest().catch(console.warn);
  }, [user?.email]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-slate-100 flex items-center justify-center" dir="rtl">
      <Card className="w-full max-w-md border-0 shadow-xl">
        <CardContent className="p-10 text-center">
          <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-6">
            <Clock className="w-10 h-10 text-orange-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-3">ממתין לאישור</h2>
          <p className="text-slate-600 mb-4">
            שלום <strong>{user?.full_name || user?.email}</strong>,
          </p>
          <p className="text-slate-600 mb-6">
            המערכת שלחה בקשת גישה למנהל עם כתובת המייל שלך:{' '}
            <span className="font-mono text-teal-700">{user?.email}</span>
          </p>
          <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 text-sm text-teal-800">
            <CheckCircle className="w-4 h-4 inline ml-1" />
            לאחר אישור המנהל, תוכל להתחבר ולגשת למערכת.
          </div>
          <p className="text-xs text-slate-400 mt-6">
            אם הבעיה נמשכת, פנה למנהל המערכת ישירות.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}