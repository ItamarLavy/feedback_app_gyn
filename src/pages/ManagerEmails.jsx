import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Mail, Shield, Check, Plus, Trash2, Pencil } from 'lucide-react';
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
  const [selectedManager, setSelectedManager] = useState(null);
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
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-bl from-teal-500 to-teal-600 flex items-center justify-center shadow-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">מיילים מנהלים</h1>
              <p className="text-slate-500 text-sm">כתובות מייל של מנהלי המערכת</p>
            </div>
          </div>
          <Link
            to={createPageUrl('Admin')}
            className="flex items-center gap-2 text-teal-600 hover:text-teal-700 font-medium"
          >
            חזרה לניהול
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>

        <Card className="border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-teal-500" />
                רשימת מנהלים
              </div>
              <Button size="sm" onClick={() => setAddingNew(true)} className="bg-teal-600 hover:bg-teal-700">
                <Plus className="w-4 h-4 ml-1" />
                הוסף מנהל
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-slate-200">
                    <th className="text-right py-3 px-4 font-semibold text-slate-700">#</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-700">שם המנהל</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-700">כתובת מייל</th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-700">פעולות</th>
                  </tr>
                </thead>
                <tbody>
                   {managers.map((manager, index) => {
                     const isEditing = editingId === manager.id;
                     return (
                       <tr 
                         key={manager.id} 
                         className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                         onClick={() => !isEditing && setSelectedManager(manager)}
                       >
                         <td className="py-3 px-4 text-slate-500">{index + 1}</td>
                         <td className="py-3 px-4">
                           {isEditing ? (
                             <Input value={editName} onChange={e => setEditName(e.target.value)} className="h-7 text-sm" autoFocus onClick={e => e.stopPropagation()} />
                           ) : (
                             <span className="font-medium text-slate-800">{manager.name}</span>
                           )}
                         </td>
                         <td className="py-3 px-4 min-w-[240px]">
                           {isEditing ? (
                             <Input 
                               type="email" 
                               value={editEmail} 
                               onChange={e => setEditEmail(e.target.value)} 
                               placeholder="email@example.com" 
                               className="h-7 text-sm" 
                               onKeyDown={e => e.key === 'Enter' && handleSave(manager.id)}
                               onClick={e => e.stopPropagation()}
                             />
                           ) : (
                             <div className="flex items-center gap-1">
                               <Mail className="w-3 h-3 text-teal-400" />
                               <span className="text-slate-600 text-sm">{manager.email || <span className="text-slate-300 italic">לא הוגדר</span>}</span>
                             </div>
                           )}
                         </td>
                         <td className="py-3 px-4 text-center" onClick={e => e.stopPropagation()}>
                           {isEditing ? (
                             <div className="flex items-center justify-center gap-1">
                               <Button size="icon" className="h-7 w-7 bg-green-600 hover:bg-green-700" onClick={() => handleSave(manager.id)}>
                                 <Check className="w-3 h-3" />
                               </Button>
                               <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingId(null)}>✕</Button>
                             </div>
                           ) : (
                             <div className="flex items-center justify-center gap-1">
                               <Button variant="ghost" size="icon" className="h-7 w-7 text-teal-600" onClick={() => { setEditingId(manager.id); setEditName(manager.name); setEditEmail(manager.email || ''); }}>
                                 <Pencil className="w-3 h-3" />
                               </Button>
                               <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700" onClick={() => handleDelete(manager.id)}>
                                 <Trash2 className="w-3 h-3" />
                               </Button>
                             </div>
                           )}
                         </td>
                       </tr>
                     );
                   })}

                  {/* Add new row */}
                  {addingNew && (
                    <tr className="border-b border-teal-100 bg-teal-50">
                      <td className="py-3 px-4 text-slate-400">+</td>
                      <td className="py-3 px-4">
                        <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="שם המנהל" className="h-7 text-sm" autoFocus />
                      </td>
                      <td className="py-3 px-4">
                        <Input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="email@example.com" className="h-7 text-sm" onKeyDown={e => e.key === 'Enter' && handleAdd()} />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button size="icon" className="h-7 w-7 bg-green-600 hover:bg-green-700" onClick={handleAdd}>
                            <Check className="w-3 h-3" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setAddingNew(false)}>✕</Button>
                        </div>
                      </td>
                    </tr>
                  )}

                  {managers.length === 0 && !addingNew && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400">אין מנהלים ברשימה</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            </CardContent>
            </Card>

            {/* Modal - Manager Details */}
            <Dialog open={!!selectedManager} onOpenChange={(open) => !open && setSelectedManager(null)}>
            <DialogContent className="max-w-sm" dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-semibold text-sm">
                  {selectedManager?.name?.[0]}
                </div>
                {selectedManager?.name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                <Mail className="w-5 h-5 text-teal-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-500">כתובת מייל</p>
                  <p className="font-mono text-sm text-slate-700 break-all">{selectedManager?.email || '—'}</p>
                </div>
              </div>
              <Button onClick={() => setSelectedManager(null)} className="w-full bg-teal-600 hover:bg-teal-700">
                סגור
              </Button>
            </div>
            </DialogContent>
            </Dialog>
            </div>
            </div>
            );
            }