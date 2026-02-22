import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, CheckCircle, AlertCircle } from 'lucide-react';

export default function ChangePassword({ entityType, entityId }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const queryClient = useQueryClient();

  const updatePasswordMutation = useMutation({
    mutationFn: (password) => {
      if (entityType === 'intern') {
        return base44.entities.Intern.update(entityId, { password });
      } else {
        return base44.entities.Expert.update(entityId, { password });
      }
    },
    onSuccess: () => {
      setSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
      setError('');
      queryClient.invalidateQueries({ queryKey: ['interns'] });
      queryClient.invalidateQueries({ queryKey: ['experts'] });
      setTimeout(() => setSuccess(false), 3000);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // ולידציה
    if (newPassword.length !== 5) {
      setError('הסיסמה חייבת להיות בת 5 תווים בדיוק');
      return;
    }

    const validChars = /^[a-z0-9]+$/;
    if (!validChars.test(newPassword)) {
      setError('הסיסמה חייבת להכיל רק אותיות אנגלית קטנות ומספרים');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('הסיסמאות אינן תואמות');
      return;
    }

    updatePasswordMutation.mutate(newPassword);
  };

  return (
    <Card className="border-2 border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Lock className="w-5 h-5 text-blue-600" />
          שינוי סיסמה
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>סיסמה חדשה (5 תווים)</Label>
            <Input
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="abc12"
              maxLength={5}
              className="font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label>אימות סיסמה</Label>
            <Input
              type="text"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="abc12"
              maxLength={5}
              className="font-mono"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded p-2">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 border border-green-200 rounded p-2">
              <CheckCircle className="w-4 h-4" />
              <span>הסיסמה שונתה בהצלחה!</span>
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded p-3 text-sm text-amber-800">
            <strong>חשוב:</strong> שמור את הסיסמה החדשה במקום בטוח. 
            הסיסמה חייבת להכיל 5 תווים: אותיות אנגלית קטנות (a-z) ומספרים (0-9) בלבד.
          </div>

          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
            שמור סיסמה חדשה
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}