import React from 'react';

const AVATAR_MAP = {
  doctor_f: '👩‍⚕️',
  doctor_m: '👨‍⚕️',
  surgeon_f: '🧑‍⚕️',
  superhero_f: '🦸‍♀️',
  superhero_m: '🦸‍♂️',
  scientist_f: '👩‍🔬',
  scientist_m: '👨‍🔬',
  astronaut_f: '👩‍🚀',
  astronaut_m: '👨‍🚀',
  mage: '🧙‍♂️',
  ninja: '🥷',
  robot: '🤖',
};

export default function InternPersona({ nickname, avatar }) {
  if (!nickname && !avatar) return null;

  return (
    <div className="flex items-center gap-2">
      {avatar && AVATAR_MAP[avatar] && (
        <span className="text-2xl select-none leading-none">{AVATAR_MAP[avatar]}</span>
      )}
      {nickname && (
        <span className="bg-blue-100 text-blue-700 font-semibold text-xs px-2 py-0.5 rounded-full">✨ {nickname}</span>
      )}
    </div>
  );
}