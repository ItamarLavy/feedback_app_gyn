import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogOut, Trash2, User, Mail, Check, X, Pencil } from 'lucide-react';
import DeleteAccountModal from '@/components/user/DeleteAccountModal';

export default function UserSettings() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [myRecord, setMyRecord] = useState(null);
  const [myRecordType, setMyRecordType] = useState(null); // 'intern' | 'expert'
  const [editingEmail2, setEditingEmail2] = useState(false);
  const [email2Value, setEmail2Value] = useState('');
  const [savingEmail2, setSavingEmail2] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!user?.email) return;
    const fetchMyRecord = async () => {
      const [interns, experts, interns2, experts2] = await Promise.all([
        base44.entities.Intern.filter({ email: user.email }),
        base44.entities.Expert.filter({ email: user.email }),
        base44.entities.Intern.filter({ email2: user.email }),
        base44.entities.Expert.filter({ email2: user.email }),
      ]);
      if (interns.length > 0) { setMyRecord(interns[0]); setMyRecordType('intern'); }
      else if (interns2.length > 0) { setMyRecord(interns2[0]); setMyRecordType('intern'); }
      else if (experts.length > 0) { setMyRecord(experts[0]); setMyRecordType('expert'); }
      else if (experts2.length > 0) { setMyRecord(experts2[0]); setMyRecordType('expert'); }
    };
    fetchMyRecord();
  }, [user?.email]);

  const handleSaveEmail2 = async () => {
    if (!myRecord) return;
    setSavingEmail2(true);
    const entity = myRecordType === 'intern' ? base44.entities.Intern : base44.entities.Expert;
    await entity.update(myRecord.id, { email2: email2Value });
    setMyRecord(prev => ({ ...prev, email2: email2Value }));
    setEditingEmail2(false);
    setSavingEmail2(false);
  };

  const handleLogout = async () => {
    await base44.auth.logout('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-slate-100" dir="rtl">
      <div className="max-w-2xl mx-auto px-4 py-8 pb-40 md:pb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-8">הגדרות</h1>

        {/* User Info Card */}
        <Card className="border-0 shadow-lg mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              פרטי החשבון
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-slate-600">שם מלא</p>
              <p className="text-lg font-medium text-slate-800">{user?.full_name || 'משתמש'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">כתובת דוא"ל ראשית</p>
              <p className="text-lg font-medium text-slate-800">{user?.email}</p>
            </div>
            {myRecord && (
              <div>
                <p className="text-sm text-slate-600 mb-1">כתובת דוא"ל נוספת</p>
                {editingEmail2 ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="email"
                      value={email2Value}
                      onChange={e => setEmail2Value(e.target.value)}
                      placeholder="email2@example.com"
                      className="h-9"
                      autoFocus
                      onKeyDown={e => e.key === 'Enter' && handleSaveEmail2()}
                    />
                    <Button size="icon" className="h-9 w-9 bg-green-600 hover:bg-green-700 flex-shrink-0" onClick={handleSaveEmail2} disabled={savingEmail2}>
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-9 w-9 flex-shrink-0" onClick={() => setEditingEmail2(false)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setEditingEmail2(true); setEmail2Value(myRecord.email2 || ''); }}
                    className="flex items-center gap-2 text-slate-700 hover:text-teal-600 group"
                  >
                    <Mail className="w-4 h-4 text-slate-400 group-hover:text-teal-500" />
                    <span className="text-base font-medium">{myRecord.email2 || <span className="text-slate-400 italic text-sm">הוסף מייל נוסף</span>}</span>
                    <Pencil className="w-3 h-3 text-slate-300 group-hover:text-teal-500" />
                  </button>
                )}
                <p className="text-xs text-slate-400 mt-1">ניתן להתחבר למערכת גם עם כתובת מייל זו</p>
              </div>
            )}
            {user?.role && (
              <div>
                <p className="text-sm text-slate-600">תפקיד</p>
                <p className="text-lg font-medium text-slate-800 capitalize">{user.role}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Logout Card */}
        <Card className="border-0 shadow-lg mb-6">
          <CardContent className="p-6">
            <Button
              onClick={handleLogout}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <LogOut className="w-4 h-4 ml-2" />
              התנתק
            </Button>
          </CardContent>
        </Card>

        {/* Delete Account Card */}
        <Card className="border-2 border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              אזור הסכנה
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-700 mb-4">
              מחיקת החשבון הינה פעולה בלתי הפיכה. כל המידע שלך יימחק לצמיתות.
            </p>
            <Button
              onClick={() => setIsDeleteModalOpen(true)}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="w-4 h-4 ml-2" />
              מחק חשבון
            </Button>
          </CardContent>
        </Card>
      </div>

      <DeleteAccountModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
}