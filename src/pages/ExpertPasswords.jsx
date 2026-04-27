import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Mail, Check, Shield, Users, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

const MANAGER_EMAILS = ['yuval.lavie@hadassah.org.il', 'ronit.gilad@hadassah.org.il', 'zvika@hadassah.org.il'];

export default function ExpertPasswords() {
  const { user, isAuthenticated: isLoggedIn } = useAuth();
  const isAuthenticated = isLoggedIn && (MANAGER_EMAILS.includes(user?.email) || user?.role === 'admin');
  const [editingEmail, setEditingEmail] = useState(null);
  const [emailValue, setEmailValue] = useState('');
  const [savingEmail, setSavingEmail] = useState(null);
  const queryClient = useQueryClient();

  const { data: experts = [] } = useQuery({
    queryKey: ['experts'],
    queryFn: () => base44.entities.Expert.list(),
    enabled: isAuthenticated
  });

  const { data: accessRequests = [] } = useQuery({
    queryKey: ['accessRequests'],
    queryFn: () => base44.entities.AccessRequest.list(),
    enabled: isAuthenticated
  });

  const handleSaveEmail = async (expertId) => {
    setSavingEmail(expertId);
    await base44.entities.Expert.update(expertId, { email: emailValue });
    queryClient.invalidateQueries({ queryKey: ['experts'] });
    setEditingEmail(null);
    setSavingEmail(null);
  };

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

  const expertEmails = new Set(experts.map(e => e.email).filter(Boolean));
  const pendingRequests = accessRequests.filter(r => !expertEmails.has(r.email));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-slate-100" dir="rtl">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-bl from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">מיילים מומחים</h1>
              <p className="text-slate-500 text-sm">רשימת כתובות מייל של מומחים</p>
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

        {/* Experts email list */}
        <Card className="border-0 shadow-xl mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-purple-500" />
              רשימת מומחים
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-slate-200">
                    <th className="text-right py-3 px-4 font-semibold text-slate-700">#</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-700">שם המומחה</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-700">כתובת מייל</th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-700">פעולה</th>
                  </tr>
                </thead>
                <tbody>
                  {experts.map((expert, index) => {
                    const isEditing = editingEmail === expert.id;
                    return (
                      <tr key={expert.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-4 text-slate-500">{index + 1}</td>
                        <td className="py-3 px-4 font-medium text-slate-800">{expert.name}</td>
                        <td className="py-3 px-4 min-w-[240px]">
                          {isEditing ? (
                            <div className="flex items-center gap-1">
                              <Input
                                type="email"
                                value={emailValue}
                                onChange={e => setEmailValue(e.target.value)}
                                placeholder="email@example.com"
                                className="h-7 text-sm"
                                autoFocus
                                onKeyDown={e => e.key === 'Enter' && handleSaveEmail(expert.id)}
                              />
                              <Button size="icon" className="h-7 w-7 bg-green-600 hover:bg-green-700" onClick={() => handleSaveEmail(expert.id)} disabled={savingEmail === expert.id}>
                                <Check className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <button
                              onClick={() => { setEditingEmail(expert.id); setEmailValue(expert.email || ''); }}
                              className="flex items-center gap-1 text-sm text-slate-600 hover:text-purple-600 group"
                            >
                              <Mail className="w-3 h-3 text-slate-400 group-hover:text-purple-400" />
                              {expert.email ? <span>{expert.email}</span> : <span className="text-slate-300 italic">הוסף מייל</span>}
                            </button>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {!isEditing && (
                            <Button variant="ghost" size="sm" onClick={() => { setEditingEmail(expert.id); setEmailValue(expert.email || ''); }} className="text-purple-600 hover:text-purple-700 text-xs">
                              עדכן
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Pending requests not in experts list */}
        {pendingRequests.length > 0 && (
          <Card className="border-0 shadow-xl border-l-4 border-amber-400">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-700">
                <AlertCircle className="w-5 h-5" />
                בקשות גישה שאינן ברשימת המומחים ({pendingRequests.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {pendingRequests.map(req => (
                  <div key={req.id} className="flex items-center justify-between bg-amber-50 rounded-lg px-4 py-2">
                    <div>
                      <span className="font-medium text-slate-800">{req.full_name}</span>
                      <span className="text-slate-500 text-sm mr-2">{req.email}</span>
                    </div>
                    <Badge className={req.status === 'pending' ? 'bg-amber-500' : req.status === 'approved' ? 'bg-green-600' : 'bg-red-500'}>
                      {req.status === 'pending' ? 'ממתין' : req.status === 'approved' ? 'אושר' : 'נדחה'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}