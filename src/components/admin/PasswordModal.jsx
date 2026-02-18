import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, Eye, EyeOff } from 'lucide-react';

const ADMIN_PASSWORD = "admin123"; // סיסמת מנהל

export default function PasswordModal({ open, onSuccess, onClose }) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      onSuccess();
      setPassword('');
      setError('');
    } else {
      setError('סיסמה שגויה');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-center flex items-center justify-center gap-2">
            <Lock className="w-5 h-5 text-teal-600" />
            כניסה לאזור ניהול
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              placeholder="הזן סיסמת מנהל"
              className="h-12 pr-4 pl-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}
          <Button 
            type="submit" 
            className="w-full h-12 bg-teal-600 hover:bg-teal-700"
          >
            כניסה
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}