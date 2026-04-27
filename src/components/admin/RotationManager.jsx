import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Calendar, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/lib/AuthContext';

const MANAGER_EMAILS = ['yuval.lavie@hadassah.org.il', 'ronit.gilad@hadassah.org.il', 'zvika@hadassah.org.il'];

const ROTATION_TYPES = [
  "מיילדות - בסיס",
  "גניקולוגיה - בסיס",
  "הריון בסיכון",
  "מיון מיילדותי",
  "מיון גניקולוגי",
  "מרפאה",
  "גניקולוגיה - סניור",
  "מיילדות - סניור",
  "פוריות",
  "מדעי יסוד",
  "אלקטיב",
  "שלב א",
  "שלב ב",
  "מיילדות כללי",
  "גניקולוגיה כללי"
];

export default function RotationManager({ intern, rotations }) {
  const { user, isAuthenticated } = useAuth();
  const isManager = isAuthenticated && (MANAGER_EMAILS.includes(user?.email) || user?.role === 'admin');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    rotation_type: '',
    start_date: '',
    end_date: '',
    status: 'מתוכנן'
  });
  const queryClient = useQueryClient();

  const createRotationMutation = useMutation({
    mutationFn: (data) => base44.entities.Rotation.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rotations'] });
      setShowForm(false);
      setFormData({ rotation_type: '', start_date: '', end_date: '', status: 'מתוכנן' });
    }
  });

  const deleteRotationMutation = useMutation({
    mutationFn: (id) => base44.entities.Rotation.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rotations'] });
    }
  });

  const updateRotationMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Rotation.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rotations'] });
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createRotationMutation.mutate({
      intern_id: intern.id,
      intern_name: intern.name,
      ...formData
    });
  };

  const handleDelete = (rotationId) => {
    if (window.confirm('האם למחוק סבב זה?')) {
      deleteRotationMutation.mutate(rotationId);
    }
  };

  const handleStatusChange = (rotation, newStatus) => {
    updateRotationMutation.mutate({
      id: rotation.id,
      data: { ...rotation, status: newStatus }
    });
  };

  const sortedRotations = [...rotations].sort((a, b) => 
    new Date(a.start_date) - new Date(b.start_date)
  );

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <span>תוכנית התמחות</span>
          {isManager && (
            <Button
              size="sm"
              onClick={() => setShowForm(!showForm)}
              className="bg-teal-600 hover:bg-teal-700"
            >
              <Plus className="w-4 h-4 ml-1" />
              הוסף סבב
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-slate-50 rounded-lg">
            <div className="space-y-2">
              <Label>סוג סבב</Label>
              <Select
                value={formData.rotation_type}
                onValueChange={(value) => setFormData({ ...formData, rotation_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר סוג סבב" />
                </SelectTrigger>
                <SelectContent>
                  {ROTATION_TYPES.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>תאריך התחלה</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>תאריך סיום (אופציונלי)</Label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={!formData.rotation_type || !formData.start_date}>
                שמור
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                ביטול
              </Button>
            </div>
          </form>
        )}

        <div className="space-y-3">
          {sortedRotations.length === 0 && (
            <p className="text-slate-500 text-center py-4">לא הוגדרו סבבים עדיין</p>
          )}
          
          {sortedRotations.map(rotation => {
            const isPast = new Date(rotation.start_date) < new Date();
            const isCurrent = rotation.status === 'בביצוע';
            
            return (
              <div
                key={rotation.id}
                className={`p-4 rounded-lg border-2 ${
                  rotation.status === 'הושלם'
                    ? 'bg-green-50 border-green-200'
                    : isCurrent
                    ? 'bg-blue-50 border-blue-300'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-800 mb-1">{rotation.rotation_type}</h4>
                    <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {format(new Date(rotation.start_date), 'dd/MM/yyyy')}
                        {rotation.end_date && ` - ${format(new Date(rotation.end_date), 'dd/MM/yyyy')}`}
                      </span>
                    </div>
                    {isManager ? (
                      <Select
                        value={rotation.status}
                        onValueChange={(value) => handleStatusChange(rotation, value)}
                      >
                        <SelectTrigger className="w-40 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="מתוכנן">מתוכנן</SelectItem>
                          <SelectItem value="בביצוע">בביצוע</SelectItem>
                          <SelectItem value="הושלם">הושלם</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">{rotation.status}</span>
                    )}
                  </div>
                  {isManager && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(rotation.id)}
                      className="text-slate-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}