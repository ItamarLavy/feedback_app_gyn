import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, Circle, Calendar } from 'lucide-react';
import { format, isPast, isFuture } from 'date-fns';

export default function RotationMap({ rotations }) {
  const sortedRotations = [...rotations].sort((a, b) => 
    new Date(a.start_date) - new Date(b.start_date)
  );

  const getRotationStatus = (rotation) => {
    if (rotation.status === 'הושלם') {
      return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', label: 'הושלם' };
    }
    if (rotation.status === 'בביצוע') {
      return { icon: Clock, color: 'text-blue-600', bg: 'bg-blue-100', label: 'בביצוע' };
    }
    return { icon: Circle, color: 'text-slate-400', bg: 'bg-slate-100', label: 'מתוכנן' };
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg">מפת התמחות</CardTitle>
      </CardHeader>
      <CardContent>
        {sortedRotations.length === 0 ? (
          <p className="text-slate-500 text-center py-8">לא הוגדרה תוכנית התמחות עדיין</p>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute right-6 top-0 bottom-0 w-0.5 bg-slate-200" />
            
            <div className="space-y-6">
              {sortedRotations.map((rotation, idx) => {
                const status = getRotationStatus(rotation);
                const Icon = status.icon;
                
                return (
                  <div key={rotation.id} className="relative pr-14">
                    {/* Timeline dot */}
                    <div className={`absolute right-0 w-12 h-12 rounded-full ${status.bg} flex items-center justify-center border-4 border-white shadow-md`}>
                      <Icon className={`w-5 h-5 ${status.color}`} />
                    </div>
                    
                    {/* Content */}
                    <div className={`p-4 rounded-lg border-2 ${
                      rotation.status === 'הושלם'
                        ? 'bg-green-50 border-green-200'
                        : rotation.status === 'בביצוע'
                        ? 'bg-blue-50 border-blue-300'
                        : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-slate-800">{rotation.rotation_type}</h4>
                        <Badge className={status.bg + ' ' + status.color + ' border-0'}>
                          {status.label}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Calendar className="w-4 h-4" />
                        <span>
                          התחלה: {format(new Date(rotation.start_date), 'dd/MM/yyyy')}
                        </span>
                      </div>
                      
                      {rotation.end_date && (
                        <div className="flex items-center gap-2 text-sm text-slate-600 mt-1">
                          <Calendar className="w-4 h-4 opacity-0" />
                          <span>
                            סיום: {format(new Date(rotation.end_date), 'dd/MM/yyyy')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}