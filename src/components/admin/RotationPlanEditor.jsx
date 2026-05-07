import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MapPin, Plus, Trash2, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';

const DEPARTMENTS = ['גניקולוגיה', 'מיילדות', 'פוריות', 'כללי', 'רוטציה חיצונית'];

const emptyPlan = {
  department: '',
  stage_name: '',
  external_location: '',
  start_date: '',
  end_date: '',
  is_current: false,
  notes: ''
};

export default function RotationPlanEditor({ intern }) {
  const internId = intern?.id;
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(emptyPlan);
  const [saving, setSaving] = useState(false);

  const { data: plans = [] } = useQuery({
    queryKey: ['rotation-plans', internId],
    queryFn: () => base44.entities.InternRotationPlan.filter({ intern_id: internId }, 'start_date'),
    enabled: !!internId
  });

  const handleSave = async () => {
    if (!formData.department || !formData.start_date || !formData.end_date) return;
    setSaving(true);
    await base44.entities.InternRotationPlan.create({
      ...formData,
      intern_id: internId,
      intern_name: intern?.name
    });
    queryClient.invalidateQueries({ queryKey: ['rotation-plans', internId] });
    setFormData(emptyPlan);
    setShowForm(false);
    setSaving(false);
  };

  const handleDelete = async (id) => {
    await base44.entities.InternRotationPlan.delete(id);
    queryClient.invalidateQueries({ queryKey: ['rotation-plans', internId] });
  };

  const handleMarkCurrent = async (plan) => {
    // Unmark all others
    for (const p of plans) {
      if (p.is_current && p.id !== plan.id) {
        await base44.entities.InternRotationPlan.update(p.id, { is_current: false });
      }
    }
    await base44.entities.InternRotationPlan.update(plan.id, { is_current: !plan.is_current });
    queryClient.invalidateQueries({ queryKey: ['rotation-plans', internId] });
  };

  const getDuration = (start, end) => {
    const days = differenceInDays(parseISO(end), parseISO(start));
    if (days < 30) return `${days} ימים`;
    const weeks = Math.round(days / 7);
    return `${weeks} שבועות`;
  };

  const getStatus = (plan) => {
    const today = new Date();
    const start = parseISO(plan.start_date);
    const end = parseISO(plan.end_date);
    if (today < start) return { label: 'עתידי', color: 'bg-blue-100 text-blue-700' };
    if (today > end) return { label: 'הסתיים', color: 'bg-slate-100 text-slate-600' };
    return { label: 'פעיל', color: 'bg-green-100 text-green-700' };
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-teal-600" />
            תוכנית התמחות
          </div>
          <Button
            size="sm"
            onClick={() => setShowForm(!showForm)}
            className="bg-teal-600 hover:bg-teal-700 text-white"
          >
            <Plus className="w-4 h-4 ml-1" />
            הוסף שלב
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 space-y-3">
            <h4 className="font-semibold text-teal-800 text-sm">שלב חדש</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-600 mb-1 block">מחלקה *</label>
                <Select value={formData.department} onValueChange={v => setFormData(d => ({ ...d, department: v }))}>
                  <SelectTrigger className="h-9 bg-white">
                    <SelectValue placeholder="בחר מחלקה" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map(dep => (
                      <SelectItem key={dep} value={dep}>{dep}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-slate-600 mb-1 block">שם השלב</label>
                <Input
                  placeholder="לדוג': בסיס, מיון..."
                  value={formData.stage_name}
                  onChange={e => setFormData(d => ({ ...d, stage_name: e.target.value }))}
                  className="h-9 bg-white"
                />
              </div>
              {formData.department === 'רוטציה חיצונית' && (
                <div className="col-span-2">
                  <label className="text-xs text-slate-600 mb-1 block">מיקום הרוטציה (פנימית, כירורגיה וכו') *</label>
                  <Input
                    placeholder="לדוג': מחלקה פנימית, כירורגיה, ניתוחים..."
                    value={formData.external_location}
                    onChange={e => setFormData(d => ({ ...d, external_location: e.target.value }))}
                    className="h-9 bg-white border-orange-300 focus:border-orange-500"
                  />
                </div>
              )}
              <div>
                <label className="text-xs text-slate-600 mb-1 block">תאריך התחלה *</label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={e => setFormData(d => ({ ...d, start_date: e.target.value }))}
                  className="h-9 bg-white"
                />
              </div>
              <div>
                <label className="text-xs text-slate-600 mb-1 block">תאריך סיום *</label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={e => setFormData(d => ({ ...d, end_date: e.target.value }))}
                  className="h-9 bg-white"
                />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-slate-600 mb-1 block">הערות</label>
                <Input
                  placeholder="הערות..."
                  value={formData.notes}
                  onChange={e => setFormData(d => ({ ...d, notes: e.target.value }))}
                  className="h-9 bg-white"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button size="sm" onClick={handleSave} disabled={saving} className="bg-teal-600 hover:bg-teal-700 text-white">
                {saving ? 'שומר...' : 'שמור'}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>ביטול</Button>
            </div>
          </div>
        )}

        {plans.length === 0 && !showForm && (
          <p className="text-center text-slate-400 py-6 text-sm">אין שלבי התמחות מוגדרים</p>
        )}

        <div className="space-y-3">
          {plans.map(plan => {
            const status = getStatus(plan);
            return (
              <div
                key={plan.id}
                className={`rounded-xl border p-4 ${plan.is_current ? 'border-teal-400 bg-teal-50' : 'border-slate-200 bg-white'}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-slate-800">{plan.department}</span>
                      {plan.stage_name && (
                        <span className="text-slate-500 text-sm">· {plan.stage_name}</span>
                      )}
                      <Badge className={status.color + ' border-0 text-xs'}>{status.label}</Badge>
                      {plan.is_current && (
                        <Badge className="bg-teal-600 text-white text-xs">נוכחי</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{format(parseISO(plan.start_date), 'dd/MM/yyyy')} – {format(parseISO(plan.end_date), 'dd/MM/yyyy')}</span>
                      <span className="text-slate-400">({getDuration(plan.start_date, plan.end_date)})</span>
                    </div>
                    {plan.external_location && (
                      <p className="text-xs text-orange-600 font-medium mt-1">📍 {plan.external_location}</p>
                    )}
                    {plan.notes && (
                      <p className="text-xs text-slate-400 mt-1">{plan.notes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className={`h-7 text-xs ${plan.is_current ? 'border-teal-400 text-teal-700' : ''}`}
                      onClick={() => handleMarkCurrent(plan)}
                    >
                      {plan.is_current ? 'נוכחי ✓' : 'סמן נוכחי'}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(plan.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}