import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, Shield, Check, Pencil } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

const MANAGER_EMAILS_AUTH = ['yuval.lavie@hadassah.org.il', 'ronit.gilad@hadassah.org.il', 'zvika@hadassah.org.il'];

const DEFAULT_MANAGERS = [
  { name: 'יובל לביא', email: 'yuval.lavie@hadassah.org.il' },
  { name: 'רונית גלעד', email: 'ronit.gilad@hadassah.org.il' },
  { name: 'צביקה שמעונוביץ', email: 'zvika@hadassah.org.il' },
];

export default function ManagerEmails() {
  const { user, isAuthenticated: isLoggedIn } = useAuth();
  const isAuthenticated = isLoggedIn && (MANAGER_EMAILS_AUTH.includes(user?.email) || user?.role === 'admin');
  const [editingIndex, setEditingIndex] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [managers, setManagers] = useState(DEFAULT_MANAGERS);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-slate-100 flex items-center justify-center" dir="rtl">
        <div className="text-center p-8">
          <Shield className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600 text-lg font-medium">אין לך הרשאה לצפות בדף זה</p>
        </div>
      </div>
    );
  }

  const handleSave = (index) => {
    const updated = [...managers];
    updated[index] = { ...updated[index], email: editValue };
    setManagers(updated);
    setEditingIndex(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-slate-100" dir="rtl">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-bl from-teal-500 to-teal-600 flex items-center justify-center shadow-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">מיילים מנהלים</h1>
              <p className="text-slate-500 text-sm">כתובות מייל של מנהלי המערכת</p>
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

        <Card className="border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-teal-500" />
              רשימת מנהלים
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500 mb-4">
              המיילים הבאים מוגדרים כמנהלי מערכת. לשינוי הרשאות מנהל, יש לפנות לתמיכה הטכנית.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-slate-200">
                    <th className="text-right py-3 px-4 font-semibold text-slate-700">#</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-700">שם המנהל</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-700">כתובת מייל</th>
                  </tr>
                </thead>
                <tbody>
                  {managers.map((manager, index) => (
                    <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 text-slate-500">{index + 1}</td>
                      <td className="py-3 px-4 font-medium text-slate-800">{manager.name}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Mail className="w-3 h-3 text-teal-400 flex-shrink-0" />
                          <span className="text-slate-600 text-sm">{manager.email}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}