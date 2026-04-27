import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const AVATARS = [
  { id: 'doctor_f', emoji: '👩‍⚕️', label: 'רופאה' },
  { id: 'doctor_m', emoji: '👨‍⚕️', label: 'רופא' },
  { id: 'surgeon_f', emoji: '🧑‍⚕️', label: 'מנתחת' },
  { id: 'superhero_f', emoji: '🦸‍♀️', label: 'גיבורת על' },
  { id: 'superhero_m', emoji: '🦸‍♂️', label: 'גיבור על' },
  { id: 'scientist_f', emoji: '👩‍🔬', label: 'מדענית' },
  { id: 'scientist_m', emoji: '👨‍🔬', label: 'מדען' },
  { id: 'astronaut_f', emoji: '👩‍🚀', label: 'אסטרונאוטית' },
  { id: 'astronaut_m', emoji: '👨‍🚀', label: 'אסטרונאוט' },
  { id: 'mage', emoji: '🧙‍♂️', label: 'קוסם' },
  { id: 'ninja', emoji: '🥷', label: 'נינג\'ה' },
  { id: 'robot', emoji: '🤖', label: 'רובוט' },
];

export default function AvatarSetup({ intern, onDone }) {
  const [nickname, setNickname] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: () => base44.entities.Intern.update(intern.id, {
      nickname: nickname || intern.name,
      avatar: selectedAvatar
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intern', intern.id] });
      onDone(nickname || intern.name, selectedAvatar);
    }
  });

  const canSave = selectedAvatar !== null;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-teal-50 to-slate-100 flex items-center justify-center z-50 p-4" dir="rtl">
      <Card className="w-full max-w-lg border-0 shadow-2xl">
        <CardHeader className="text-center bg-gradient-to-l from-teal-500 to-blue-600 text-white rounded-t-xl">
          <CardTitle className="text-xl font-bold">ברוך הבא, {intern.name}! 🎉</CardTitle>
          <p className="text-blue-100 text-sm mt-1">בחר כינוי ודמות אישית</p>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Nickname */}
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-2">כינוי (אופציונלי)</label>
            <Input
              placeholder={intern.name}
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              className="text-center text-lg font-medium"
              maxLength={20}
            />
            <p className="text-xs text-slate-400 mt-1 text-center">ישאר ריק = ייעשה שימוש בשמך</p>
          </div>

          {/* Avatar selection */}
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-3">בחר דמות</label>
            <div className="grid grid-cols-4 gap-3">
              {AVATARS.map(av => (
                <button
                  key={av.id}
                  onClick={() => setSelectedAvatar(av.id)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                    selectedAvatar === av.id
                      ? 'border-blue-500 bg-blue-50 shadow-md scale-105'
                      : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  <span className="text-3xl">{av.emoji}</span>
                  <span className="text-xs text-slate-600">{av.label}</span>
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={() => saveMutation.mutate()}
            disabled={!canSave || saveMutation.isPending}
            className="w-full h-12 bg-gradient-to-l from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white font-bold text-lg"
          >
            {saveMutation.isPending ? 'שומר...' : 'בואו נתחיל! 🚀'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}