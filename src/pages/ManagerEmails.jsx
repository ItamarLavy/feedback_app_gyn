import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, Shield, Check, Plus, Trash2, Pencil, X } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

const MANAGER_EMAILS_AUTH = ['yuval.lavie@hadassah.org.il', 'ronit.gilad@hadassah.org.il', 'zvika@hadassah.org.il'];

export default function ManagerEmails() {
  const { user, isAuthenticated: isLoggedIn } = useAuth();
  const isAuthenticated = isLoggedIn && (MANAGER_EMAILS_AUTH.includes(user?.email) || user?.role === 'admin');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [addingNew, setAddingNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const queryClient = useQueryClient();

  const { data: managers = [] } = useQuery({
    queryKey: ['managers'],
    queryFn: () => base44.entities.Manager.list(),
    enabled: isAuthenticated
  });

  const handleSave = async (id) => {
    await base44.entities.Manager.update(id, { name: editName, email: editEmail });
    queryClient.invalidateQueries({ queryKey: ['managers'] });
    setEditingId(null);
  };

  const handleAdd = async () => {
    if (!newName.trim()) return;
    await base44.entities.Manager.create({ name: newName, email: newEmail });
    queryClient.invalidateQueries({ queryKey: ['managers'] });
    setAddingNew(false);
    setNewName('');
    setNewEmail('');
  };

  const handleDelete = async (id) => {
    await base44.entities.Manager.delete(id);
    queryClient.invalidateQueries({ queryKey: ['managers'] });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-slate-100 flex items-center justify-center" dir="rtl">
        <div className="text-center p-8">
          <Shield className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600 text-lg font-medium">אין לך הרשאה לצפות בדף זה</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-slate-100" dir="rtl">
      <div className="max-w-3xl mx-auto px-4 py-8 pb-40 md:pb-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-bl from-teal-500 to-teal-600 flex items-center justify-center shadow-lg">
              <Shield className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-800">מיילים מנהלים</h1>
              <p className="text-slate-500 text-xs md:text-sm">כתובות מייל של מנהלי המערכת</p>
            </div>
          </div>
          <Link
            to={createPageUrl('Admin')}
            className="flex items-center gap-2 text-teal-600 hover:text-teal-700 font-medium text-sm"
          >
            חזרה לניהול
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>

        {/* Add new button */}
        <div className="mb-4 flex justify-end">
          <Button size="sm" onClick={() => setAddingNew(true)} className="bg-teal-600 hover:bg-teal-700">
            <Plus className="w-4 h-4 ml-1" />
            הוסף מנהל
          </Button>
        </div>

        {/* Add new form */}
        {addingNew && (
          <Card className="border-2 border-teal-300 mb-4 bg-teal-50">
            <CardContent className="p-4 space-y-3">
              <p className="font-semibold text-teal-800 text-sm">הוספת מנהל חדש</p>
              <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="שם המנהל" autoFocus />
              <Input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="email@example.com" onKeyDown={e => e.key === 'Enter' && handleAdd()} />
              <div className="flex gap-2">
                <Button className="bg-green-600 hover:bg-green-700 flex-1" onClick={handleAdd}>
                  <Check className="w-4 h-4 ml-1" /> שמור
                </Button>
                <Button variant="outline" onClick={() => setAddingNew(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Managers list - card-based */}
        <div className="space-y-3">
          {managers.map((manager, index) => {
            const isEditing = editingId === manager.id;
            return (
              <Card key={manager.id} className="border border-slate-200 shadow-sm">
                <CardContent className="p-4">
                  {isEditing ? (
                    <div className="space-y-3">
                      <Input value={editName} onChange={e => setEditName(e.target.value)} placeholder="שם המנהל" autoFocus />
                      <Input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} placeholder="email@example.com" onKeyDown={e => e.key === 'Enter' && handleSave(manager.id)} />
                      <div className="flex gap-2">
                        <Button className="bg-green-600 hover:bg-green-700 flex-1" onClick={() => handleSave(manager.id)}>
                          <Check className="w-4 h-4 ml-1" /> שמור
                        </Button>
                        <Button variant="outline" onClick={() => setEditingId(null)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="font-semibold text-slate-800">{manager.name}</p>
                        <div className="flex items-center gap-1 text-sm text-slate-500">
                          <Mail className="w-3 h-3 text-teal-400 flex-shrink-0" />
                          <span className="truncate">{manager.email || <span className="text-slate-300 italic">לא הוגדר</span>}</span>
                        </div>
                        <p className="text-xs text-slate-400">#{index + 1}</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-teal-600" onClick={() => { setEditingId(manager.id); setEditName(manager.name); setEditEmail(manager.email || ''); }}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(manager.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
          {managers.length === 0 && !addingNew && (
            <div className="text-center py-12 text-slate-400">אין מנהלים ברשימה</div>
          )}
        </div>
      </div>
    </div>
  );
}