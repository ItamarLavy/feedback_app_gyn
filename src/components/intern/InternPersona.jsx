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
    <>
      {/* Nickname - top center */}
      {nickname && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
          <div className="bg-white/90 backdrop-blur-sm border border-blue-200 shadow-md rounded-full px-5 py-1.5">
            <span className="text-blue-700 font-bold text-base">✨ {nickname}</span>
          </div>
        </div>
      )}

      {/* Avatar - top right (RTL: visually top-left) */}
      {avatar && AVATAR_MAP[avatar] && (
        <div className="fixed top-20 left-4 z-40 pointer-events-none">
          <div className="text-5xl drop-shadow-lg select-none">
            {AVATAR_MAP[avatar]}
          </div>
        </div>
      )}
    </>
  );
}