import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, Trash2 } from 'lucide-react';

export default function DeleteAccountModal({ isOpen, onClose }) {
  const [confirmEmail, setConfirmEmail] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1: warning, 2: confirmation

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      const currentUser = await base44.auth.me();
      if (!currentUser) throw new Error('User not found');
      
      // Delete user account
      await base44.entities.User.delete(currentUser.id);
      
      // Logout
      await base44.auth.logout('/');
    },
    onError: () => {
      setError('שגיאה במחיקת החשבון. אנא נסה שוב.');
    }
  });

  const handleConfirmDelete = async () => {
    setError('');
    
    const currentUser = await base44.auth.me();
    if (confirmEmail !== currentUser.email) {
      setError('כתובת המייל אינה תואמת');
      return;
    }

    deleteAccountMutation.mutate();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="w-5 h-5" />
            מחיקת חשבון
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 1 && (
            <>
              <div className="bg-red-100 border border-red-300 rounded-lg p-4 text-sm text-red-800">
                <p className="font-semibold mb-2">זהו פעולה בלתי הפיכה!</p>
                <p>מחיקת החשבון תביא לאובדן כל המידע המשויך. לא ניתן יהיה לשחזר את הנתונים.</p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                >
                  ביטול
                </Button>
                <Button
                  onClick={() => setStep(2)}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  המשך למחיקה
                </Button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <p className="text-sm text-slate-700">
                הקלד את כתובת המייל שלך לאישור מחיקת החשבון:
              </p>
              <Input
                type="email"
                placeholder="כתובת מייל"
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
                className="bg-white"
              />
              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-100 border border-red-300 rounded p-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              )}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep(1);
                    setConfirmEmail('');
                    setError('');
                  }}
                  className="flex-1"
                >
                  חזור
                </Button>
                <Button
                  onClick={handleConfirmDelete}
                  disabled={deleteAccountMutation.isPending}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                  מחק חשבון
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}