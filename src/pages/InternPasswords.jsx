import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Mail, Check, Shield, Users, AlertCircle, Plus, Star, MessageSquare, Trash2, Pencil, X, GraduationCap, Stethoscope, ArrowUpDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AlertsBadge from '@/components/notifications/AlertsBadge';

import { STAGE_OPTIONS } from '@/lib/procedureConstants';
const ROTATION_OPTIONS = ['גינקולוגיה', 'מיילדות', 'פוריות', 'אונקולוגיה', 'מיון', 'רוטציה חיצונית'];
const STAGE_ORDER = { 'תורנות מחלקה': 1, 'מיון': 2, 'שחרור ממיון': 3, 'עצמאי': 4 };
import { useAuth } from '@/lib/AuthContext';

const MANAGER_EMAILS = ['yuval.lavie@hadassah.org.il', 'ronit.gilad@hadassah.org.il', 'zvika@hadassah.org.il'];

export default function InternPasswords() {
  const { user, isAuthenticated: isLoggedIn } = useAuth();
  const isAuthenticated = isLoggedIn && (MANAGER_EMAILS.includes(user?.email) || user?.role === 'admin');
  const [editingEmail, setEditingEmail] = useState(null);
  const [editingEmailId, setEditingEmailId] = useState(null);
  const [emailValue, setEmailValue] = useState('');
  const [savingEmail, setSavingEmail] = useState(null);
  const [editingName, setEditingName] = useState(null);
  const [nameValue, setNameValue] = useState('');
  const [editingStage, setEditingStage] = useState(null);
  const [stageValue, setStageValue] = useState('');
  const [addingNew, setAddingNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [sortBy, setSortBy] = useState('name'); // 'name' | 'stage' | 'rotation'
  const queryClient = useQueryClient();

  const { data: interns = [] } = useQuery({
    queryKey: ['interns'],
    queryFn: () => base44.entities.Intern.list(),
    enabled: isAuthenticated
  });

  const { data: accessRequests = [] } = useQuery({
    queryKey: ['accessRequests'],
    queryFn: () => base44.entities.AccessRequest.list(),
    enabled: isAuthenticated
  });

  const { data: userPoints = [] } = useQuery({
    queryKey: ['userPoints-interns'],
    queryFn: () => base44.entities.UserPoints.filter({ user_role: 'intern' }),
    enabled: isAuthenticated
  });

  const { data: feedbacks = [] } = useQuery({
    queryKey: ['feedbacks'],
    queryFn: () => base44.entities.Feedback.list(),
    enabled: isAuthenticated
  });

  const handleSaveEmail = async (internId, field) => {
    setSavingEmail(internId);
    await base44.entities.Intern.update(internId, { [field]: emailValue });
    queryClient.invalidateQueries({ queryKey: ['interns'] });
    setEditingEmail(null);
    setEditingEmailId(null);
    setSavingEmail(null);
  };

  const handleSaveName = async (internId) => {
    if (!nameValue.trim()) return;
    await base44.entities.Intern.update(internId, { name: nameValue });
    queryClient.invalidateQueries({ queryKey: ['interns'] });
    setEditingName(null);
  };

  const handleSaveStage = async (internId) => {
    await base44.entities.Intern.update(internId, { stage: stageValue });
    queryClient.invalidateQueries({ queryKey: ['interns'] });
    setEditingStage(null);
  };

  const handleDeleteIntern = async (internId) => {
    try {
      await base44.entities.Intern.delete(internId);
    } catch (e) {
      // Entity may already be deleted - ignore not found errors
    }
    queryClient.invalidateQueries({ queryKey: ['interns'] });
    setConfirmDelete(null);
  };

  const handleAddIntern = async () => {
    if (!newName.trim()) return;
    await base44.entities.Intern.create({ name: newName, email: newEmail });
    queryClient.invalidateQueries({ queryKey: ['interns'] });
    setAddingNew(false);
    setNewName('');
    setNewEmail('');
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

  const internEmails = new Set([
    ...interns.map(i => i.email).filter(Boolean),
    ...interns.map(i => i.email2).filter(Boolean),
  ]);
  const pendingRequests = accessRequests.filter(r => !internEmails.has(r.email));

  const sortedInterns = [...interns].sort((a, b) => {
    if (sortBy === 'stage') {
      return (STAGE_ORDER[a.stage] || 99) - (STAGE_ORDER[b.stage] || 99);
    }
    if (sortBy === 'rotation') {
      return (a.rotation || 'ת').localeCompare(b.rotation || 'ת', 'he');
    }
    return (a.name || '').localeCompare(b.name || '', 'he');
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-slate-100" dir="rtl">
      <div className="max-w-4xl mx-auto px-4 py-8 pb-40 md:pb-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-bl from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
              <Users className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-800">מיילים מתמחים</h1>
              <p className="text-slate-500 text-xs md:text-sm">רשימת כתובות מייל של מתמחים</p>
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

        {/* Controls row */}
        <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-slate-500" />
            <span className="text-sm text-slate-600">מיין לפי:</span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-8 text-xs w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">שם</SelectItem>
                <SelectItem value="stage">שלב</SelectItem>
                <SelectItem value="rotation">רוטציה</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button size="sm" onClick={() => setAddingNew(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 ml-1" />
            הוסף מתמחה
          </Button>
        </div>

        {/* Add new form */}
        {addingNew && (
          <Card className="border-2 border-blue-300 mb-4 bg-blue-50">
            <CardContent className="p-4 space-y-3">
              <p className="font-semibold text-blue-800 text-sm">הוספת מתמחה חדש</p>
              <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="שם המתמחה" autoFocus />
              <Input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="email@example.com" onKeyDown={e => e.key === 'Enter' && handleAddIntern()} />
              <div className="flex gap-2">
                <Button className="bg-green-600 hover:bg-green-700 flex-1" onClick={handleAddIntern}>
                  <Check className="w-4 h-4 ml-1" /> שמור
                </Button>
                <Button variant="outline" onClick={() => setAddingNew(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Interns list - card-based */}
        <div className="space-y-3 mb-6">
          {sortedInterns.map((intern, index) => {
            const isEditingEmail = editingEmail === intern.id;
            const isEditingN = editingName === intern.id;
            const points = userPoints.find(p => p.user_id === intern.id)?.total_points ?? null;
            const feedbackCount = feedbacks.filter(f => f.intern_id === intern.id).length;

            return (
              <Card key={intern.id} className="border border-slate-200 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    {/* Name & Email */}
                    <div className="flex-1 min-w-0 space-y-2">
                      {/* Name */}
                      {isEditingN ? (
                        <div className="flex items-center gap-2">
                          <Input value={nameValue} onChange={e => setNameValue(e.target.value)} className="h-8 text-sm" autoFocus onKeyDown={e => e.key === 'Enter' && handleSaveName(intern.id)} />
                          <Button size="icon" className="h-8 w-8 bg-green-600 hover:bg-green-700 flex-shrink-0" onClick={() => handleSaveName(intern.id)}><Check className="w-3 h-3" /></Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 flex-shrink-0" onClick={() => setEditingName(null)}><X className="w-3 h-3" /></Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800">{intern.name}</span>
                          <button onClick={() => { setEditingName(intern.id); setNameValue(intern.name || ''); }} className="text-slate-400 hover:text-blue-600">
                            <Pencil className="w-3 h-3" />
                          </button>
                          <AlertsBadge personId={intern.id} role="intern" />
                        </div>
                      )}

                      {/* Email 1 */}
                      {editingEmailId === intern.id && editingEmail === 'email' ? (
                        <div className="flex items-center gap-2">
                          <Input type="email" value={emailValue} onChange={e => setEmailValue(e.target.value)} placeholder="email@example.com" className="h-8 text-sm" autoFocus onKeyDown={e => e.key === 'Enter' && handleSaveEmail(intern.id, 'email')} />
                          <Button size="icon" className="h-8 w-8 bg-green-600 hover:bg-green-700 flex-shrink-0" onClick={() => handleSaveEmail(intern.id, 'email')} disabled={savingEmail === intern.id}><Check className="w-3 h-3" /></Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 flex-shrink-0" onClick={() => { setEditingEmail(null); setEditingEmailId(null); }}><X className="w-3 h-3" /></Button>
                        </div>
                      ) : (
                        <button onClick={() => { setEditingEmail('email'); setEditingEmailId(intern.id); setEmailValue(intern.email || ''); }} className="flex items-center gap-1 text-sm text-slate-500 hover:text-blue-600 text-right">
                          <Mail className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{intern.email || <span className="text-slate-300 italic">הוסף מייל ראשי</span>}</span>
                        </button>
                      )}

                      {/* Email 2 */}
                      {editingEmailId === intern.id && editingEmail === 'email2' ? (
                        <div className="flex items-center gap-2">
                          <Input type="email" value={emailValue} onChange={e => setEmailValue(e.target.value)} placeholder="email2@example.com" className="h-8 text-sm" autoFocus onKeyDown={e => e.key === 'Enter' && handleSaveEmail(intern.id, 'email2')} />
                          <Button size="icon" className="h-8 w-8 bg-green-600 hover:bg-green-700 flex-shrink-0" onClick={() => handleSaveEmail(intern.id, 'email2')} disabled={savingEmail === intern.id}><Check className="w-3 h-3" /></Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 flex-shrink-0" onClick={() => { setEditingEmail(null); setEditingEmailId(null); }}><X className="w-3 h-3" /></Button>
                        </div>
                      ) : (
                        <button onClick={() => { setEditingEmail('email2'); setEditingEmailId(intern.id); setEmailValue(intern.email2 || ''); }} className="flex items-center gap-1 text-sm text-slate-400 hover:text-blue-600 text-right">
                          <Mail className="w-3 h-3 flex-shrink-0 opacity-50" />
                          <span className="truncate text-xs">{intern.email2 || <span className="text-slate-300 italic">הוסף מייל נוסף</span>}</span>
                        </button>
                      )}

                      {/* Stage + Rotation */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-1">
                          <GraduationCap className="w-3 h-3 text-purple-500 flex-shrink-0" />
                          <Select value={intern.stage || ''} onValueChange={async (val) => {
                            await base44.entities.Intern.update(intern.id, { stage: val });
                            queryClient.invalidateQueries({ queryKey: ['interns'] });
                          }}>
                            <SelectTrigger className="h-7 text-xs border-purple-200 text-purple-700 flex-1 min-w-0">
                              <SelectValue placeholder="שלב..." />
                            </SelectTrigger>
                            <SelectContent>
                              {STAGE_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center gap-1">
                          <Stethoscope className="w-3 h-3 text-teal-500 flex-shrink-0" />
                          <Select value={intern.rotation || ''} onValueChange={async (val) => {
                            await base44.entities.Intern.update(intern.id, { rotation: val });
                            queryClient.invalidateQueries({ queryKey: ['interns'] });
                          }}>
                            <SelectTrigger className="h-7 text-xs border-teal-200 text-teal-700 flex-1 min-w-0">
                              <SelectValue placeholder="רוטציה..." />
                            </SelectTrigger>
                            <SelectContent>
                              {ROTATION_OPTIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-3 text-xs flex-wrap">
                       <span className="flex items-center gap-1 text-teal-600 font-semibold">
                         <MessageSquare className="w-3 h-3" />{feedbackCount}
                       </span>
                       {points !== null && (
                         <span className="flex items-center gap-1 text-amber-600 font-semibold">
                           <Star className="w-3 h-3 fill-amber-400 text-amber-400" />{points}
                         </span>
                       )}
                       {intern.stage && (
                         <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded text-xs">{intern.stage}</span>
                       )}
                       {intern.rotation && (
                         <span className="bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded text-xs">{intern.rotation}</span>
                       )}
                       <span className="text-slate-400">#{index + 1}</span>
                      </div>
                    </div>

                    {/* Delete */}
                    <div className="flex-shrink-0">
                      {confirmDelete === intern.id ? (
                        <div className="flex items-center gap-1">
                          <Button size="icon" className="h-8 w-8 bg-red-600 hover:bg-red-700" onClick={() => handleDeleteIntern(intern.id)}><Check className="w-3 h-3" /></Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setConfirmDelete(null)}><X className="w-3 h-3" /></Button>
                        </div>
                      ) : (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => setConfirmDelete(intern.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {interns.length === 0 && (
            <div className="text-center py-12 text-slate-500">אין מתמחים במערכת</div>
          )}
        </div>

        {/* Pending requests */}
        {pendingRequests.length > 0 && (
          <Card className="border-0 shadow-xl border-l-4 border-amber-400">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-700 text-base">
                <AlertCircle className="w-5 h-5" />
                בקשות גישה שאינן ברשימת המתמחים ({pendingRequests.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {pendingRequests.map(req => (
                  <div key={req.id} className="flex items-center justify-between bg-amber-50 rounded-lg px-4 py-2 gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800 text-sm">{req.full_name}</p>
                      <p className="text-slate-500 text-xs truncate">{req.email}</p>
                    </div>
                    <Badge className={`flex-shrink-0 ${req.status === 'pending' ? 'bg-amber-500' : req.status === 'approved' ? 'bg-green-600' : 'bg-red-500'}`}>
                      {req.status === 'pending' ? 'ממתין' : req.status === 'approved' ? 'אושר' : 'נדחה'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}