import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Lightbulb, X, Send, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export default function ImprovementSuggestionModal({ onClose, userRole = 'unknown' }) {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setLoading(true);
    await base44.entities.ImprovementSuggestion.create({
      user_name: user?.full_name || '',
      user_role: userRole,
      content: text.trim()
    });
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
        <button onClick={onClose} className="absolute top-4 left-4 text-slate-400 hover:text-slate-600 transition-colors">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-400 flex items-center justify-center shadow-md">
            <Lightbulb className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">הצעות לשיפור</h2>
            <p className="text-xs text-slate-500">עזור לנו לשפר את האפליקציה</p>
          </div>
        </div>

        {submitted ? (
          <div className="text-center py-8">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Check className="w-7 h-7 text-green-600" />
            </div>
            <p className="font-semibold text-slate-800 mb-1">תודה רבה!</p>
            <p className="text-sm text-slate-500 mb-5">ההצעה שלך התקבלה ותסייע לנו לשפר את המערכת.</p>
            <Button onClick={onClose} className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white">סגור</Button>
          </div>
        ) : (
          <>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="כתוב כאן את הצעתך לשיפור — תכונה חדשה, בעיה שנתקלת בה, שיפור בממשק..."
              className="min-h-[140px] text-sm mb-4 resize-none"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={onClose}>ביטול</Button>
              <Button
                onClick={handleSubmit}
                disabled={!text.trim() || loading}
                className="bg-gradient-to-r from-amber-400 to-yellow-400 text-white hover:from-amber-500 hover:to-yellow-500"
              >
                <Send className="w-4 h-4 ml-2" />
                שלח הצעה
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}