import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Key, Copy } from 'lucide-react';
import PasswordModal from '../components/admin/PasswordModal';

// פונקציה ליצירת סיסמה דטרמיניסטית מה-ID (זהה למתמחים)
function generatePassword(expertId) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  let hash = 0;
  
  for (let i = 0; i < expertId.length; i++) {
    hash = expertId.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  for (let i = 0; i < 5; i++) {
    hash = ((hash << 5) - hash) + i;
    const index = Math.abs(hash) % chars.length;
    password += chars[index];
  }
  
  return password;
}

export default function ExpertPasswords() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  const { data: experts = [] } = useQuery({
    queryKey: ['experts'],
    queryFn: () => base44.entities.Expert.list(),
    enabled: isAuthenticated
  });

  const handleCopy = (password, expertId) => {
    navigator.clipboard.writeText(password);
    setCopiedId(expertId);
    setTimeout(() => setCopiedId(null), 2000);
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
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-bl from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Key className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">סיסמאות מומחים</h1>
              <p className="text-slate-500 text-sm">טבלת סיסמאות גישה</p>
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
            <CardTitle>סיסמאות גישה לעמוד אישי</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-slate-200">
                    <th className="text-right py-3 px-4 font-semibold text-slate-700">#</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-700">שם המומחה</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-700">סיסמה נוכחית</th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-700">פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {experts.map((expert, index) => {
                    const password = expert.password || generatePassword(expert.id);
                    return (
                      <tr key={expert.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-4 text-slate-600">{index + 1}</td>
                        <td className="py-3 px-4 font-medium text-slate-800">{expert.name}</td>
                        <td className="py-3 px-4">
                          <code className="bg-slate-100 px-3 py-1 rounded font-mono text-purple-700">
                            {password}
                          </code>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopy(password, expert.id)}
                            className="text-purple-600 hover:text-purple-700"
                          >
                            {copiedId === expert.id ? (
                              <span className="text-green-600">✓ הועתק</span>
                            ) : (
                              <>
                                <Copy className="w-4 h-4 ml-1" />
                                העתק
                              </>
                            )}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-800">
                <strong>שים לב:</strong> הסיסמאות מוצגות כפי שהן במערכת - אם מומחה שינה סיסמה, 
                הסיסמה המעודכנת תוצג כאן. הסיסמאות הראשוניות נוצרות אוטומטית.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}