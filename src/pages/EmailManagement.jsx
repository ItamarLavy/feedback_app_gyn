import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import PasswordModal from '../components/admin/PasswordModal';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Mail, Save, Users, UserCheck } from 'lucide-react';

export default function EmailManagement() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(true);
  const queryClient = useQueryClient();

  const { data: interns = [] } = useQuery({
    queryKey: ['interns'],
    queryFn: () => base44.entities.Intern.list(),
    enabled: isAuthenticated
  });

  const { data: experts = [] } = useQuery({
    queryKey: ['experts'],
    queryFn: () => base44.entities.Expert.list(),
    enabled: isAuthenticated
  });

  const updateInternMutation = useMutation({
    mutationFn: ({ id, email }) => base44.entities.Intern.update(id, { email }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interns'] });
    }
  });

  const updateExpertMutation = useMutation({
    mutationFn: ({ id, email }) => base44.entities.Expert.update(id, { email }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experts'] });
    }
  });

  const [internEmails, setInternEmails] = useState({});
  const [expertEmails, setExpertEmails] = useState({});

  const handleInternEmailChange = (id, email) => {
    setInternEmails({ ...internEmails, [id]: email });
  };

  const handleExpertEmailChange = (id, email) => {
    setExpertEmails({ ...expertEmails, [id]: email });
  };

  const saveInternEmail = (id) => {
    const email = internEmails[id];
    if (email) {
      updateInternMutation.mutate({ id, email });
    }
  };

  const saveExpertEmail = (id) => {
    const email = expertEmails[id];
    if (email) {
      updateExpertMutation.mutate({ id, email });
    }
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
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-bl from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">ניהול כתובות מייל</h1>
              <p className="text-slate-500 text-sm">הזנת כתובות מייל למתמחים ומומחים</p>
            </div>
          </div>
          <Link 
            to={createPageUrl('Admin')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            חזרה לניהול
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>

        {/* Interns Table */}
        <Card className="border-0 shadow-lg mb-8">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-teal-600" />
              מתמחים
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-right py-3 px-4 font-semibold text-slate-700">שם</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-700">כתובת מייל</th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-700">פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {interns.map((intern) => (
                    <tr key={intern.id} className="border-b border-slate-100">
                      <td className="py-3 px-4 text-slate-700">{intern.name}</td>
                      <td className="py-3 px-4">
                        <Input
                          type="email"
                          placeholder="הזן כתובת מייל"
                          defaultValue={intern.email || ''}
                          onChange={(e) => handleInternEmailChange(intern.id, e.target.value)}
                          className="max-w-md"
                        />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Button
                          size="sm"
                          onClick={() => saveInternEmail(intern.id)}
                          className="bg-teal-600 hover:bg-teal-700"
                        >
                          <Save className="w-4 h-4 ml-1" />
                          שמור
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {interns.length === 0 && (
                    <tr>
                      <td colSpan="3" className="py-8 text-center text-slate-500">
                        אין מתמחים במערכת
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Experts Table */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-purple-600" />
              מומחים
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-right py-3 px-4 font-semibold text-slate-700">שם</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-700">כתובת מייל</th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-700">פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {experts.map((expert) => (
                    <tr key={expert.id} className="border-b border-slate-100">
                      <td className="py-3 px-4 text-slate-700">{expert.name}</td>
                      <td className="py-3 px-4">
                        <Input
                          type="email"
                          placeholder="הזן כתובת מייל"
                          defaultValue={expert.email || ''}
                          onChange={(e) => handleExpertEmailChange(expert.id, e.target.value)}
                          className="max-w-md"
                        />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Button
                          size="sm"
                          onClick={() => saveExpertEmail(expert.id)}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          <Save className="w-4 h-4 ml-1" />
                          שמור
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {experts.length === 0 && (
                    <tr>
                      <td colSpan="3" className="py-8 text-center text-slate-500">
                        אין מומחים במערכת
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}