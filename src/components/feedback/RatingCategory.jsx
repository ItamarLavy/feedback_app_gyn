import React from 'react';
import { Star } from 'lucide-react';
import { Label } from "@/components/ui/label";

export default function RatingCategory({ label, description, value, onChange }) {
  const [hovered, setHovered] = React.useState(0);

  return (
    <div className="space-y-2 p-4 bg-slate-50 rounded-xl">
      <div className="flex justify-between items-start">
        <div>
          <Label className="text-slate-700 font-medium">{label}</Label>
          <p className="text-xs text-slate-500 mt-0.5">{description}</p>
        </div>
        {value > 0 && (
          <button
            type="button"
            onClick={() => onChange(0)}
            className="text-xs text-slate-400 hover:text-red-500"
          >
            נקה
          </button>
        )}
      </div>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className="p-0.5 transition-transform hover:scale-110"
          >
            <Star
              className={`w-7 h-7 transition-colors ${
                star <= (hovered || value)
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-slate-300'
              }`}
            />
          </button>
        ))}
      </div>
      <p className="text-xs text-slate-400">
        {value > 0 ? `דירוג: ${value} מתוך 5` : 'לא רלוונטי (השאר ריק)'}
      </p>
    </div>
  );
}