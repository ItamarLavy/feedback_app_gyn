import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, Trash2, User } from 'lucide-react';
import DeleteAccountModal from '@/components/user/DeleteAccountModal';

export default function UserSettings() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated]);

  const handleLogout = async () => {
    await base44.auth.logout('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-slate-100" dir="rtl">
      <div className="max-w-2xl mx-auto px-4 py-8">
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
              <p className="text-sm text-slate-600">כתובת דוא"ל</p>
              <p className="text-lg font-medium text-slate-800">{user?.email}</p>
            </div>
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