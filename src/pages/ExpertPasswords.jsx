import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Mail, Check, Shield, Users, AlertCircle, Plus, Star, MessageSquare, Trash2, Pencil, X, ArrowUpDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from '@/lib/AuthContext';
import AlertsBadge from '@/components/notifications/AlertsBadge';

const MANAGER_EMAILS = ['yuval.lavie@hadassah.org.il', 'ronit.gilad@hadassah.org.il', 'zvika@hadassah.org.il'];

export default function ExpertPasswords() {
  const { user, isAuthenticated: isLoggedIn, isLoadingAuth } = useAuth();
  const isAuthenticated = isLoggedIn && (MANAGER_EMAILS.includes(user?.email) || user?.role === 'admin');
  const [editingEmail, setEditingEmail] = useState(null); // 'email' | 'email2' | null — stores which field
  const [editingEmailId, setEditingEmailId] = useState(null);
  const [emailValue, setEmailValue] = useState('');
  const [savingEmail, setSavingEmail] = useState(null);
  const [editingName, setEditingName] = useState(null);
  const [nameValue, setNameValue] = useState('');
  const [addingNew, setAddingNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [sortBy, setSortBy] = useState('name');
  const queryClient = useQueryClient();

  const { data: experts = [], isLoading: expertsLoading } = useQuery({
    queryKey: ['experts-passwords'],
    queryFn: () => base44.entities.Expert.list(),
    enabled: isAuthenticated
  });

  const { data: accessRequests = [] } = useQuery({
    queryKey: ['accessRequests'],
    queryFn: () => base44.entities.AccessRequest.list(),
    enabled: isAuthenticated
  });

  const { data: userPoints = [] } = useQuery({
    queryKey: ['userPoints-experts'],
    queryFn: () => base44.entities.UserPoints.filter({ user_role: 'expert' }),
    enabled: isAuthenticated
  });

  const { data: feedbacks = [] } = useQuery({
    queryKey: ['feedbacks'],
    queryFn: () => base44.entities.Feedback.list(),
    enabled: isAuthenticated
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['all-users-experts'],
    queryFn: () => base44.entities.User.list(),
    enabled: isAuthenticated
  });

  // קבוצת user_id של מי שנכנס לאפליקציה (יש לו רשומת UserPoints)
  const joinedUserIds = new Set(userPoints.map(p => p.user_id));
  // בודק אם מומחה התחבר: מתאים את האימייל שלו ל-User ואז ל-UserPoints
  const hasExpertJoined = (expert) => {
    const emails = [expert.email, expert.email2].filter(Boolean).map(e => e.toLowerCase());
    const matchedUser = allUsers.find(u => u.email && emails.includes(u.email.toLowerCase()));
    return !!(matchedUser && joinedUserIds.has(matchedUser.id));
  };

  const handleSaveEmail = async (expertId, field) => {
    setSavingEmail(expertId);
    await base44.entities.Expert.update(expertId, { [field]: emailValue });
    queryClient.invalidateQueries({ queryKey: ['experts-passwords'] });
    setEditingEmail(null);
    setEditingEmailId(null);
    setSavingEmail(null);
  };

  const handleSaveName = async (expertId) => {
    if (!nameValue.trim()) return;
    await base44.entities.Expert.update(expertId, { name: nameValue });
    queryClient.invalidateQueries({ queryKey: ['experts-passwords'] });
    setEditingName(null);
  };

  const handleDeleteExpert = async (expertId) => {
    await base44.entities.Expert.delete(expertId);
    queryClient.invalidateQueries({ queryKey: ['experts-passwords'] });
    setConfirmDelete(null);
  };

  const handleAddExpert = async () => {
    if (!newName.trim()) return;
    await base44.entities.Expert.create({ name: newName, email: newEmail });
    queryClient.invalidateQueries({ queryKey: ['experts-passwords'] });
    setAddingNew(false);
    setNewName('');
    setNewEmail('');
  };

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-purple-500 rounded-full animate-spin"></div>
      </div>
    );
  }

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

  const expertEmails = new Set([
    ...experts.map(e => e.email).filter(Boolean),
    ...experts.map(e => e.email2).filter(Boolean),
  ]);
  const pendingRequests = accessRequests.filter(r => !expertEmails.has(r.email));

  const sortedExperts = [...experts].sort((a, b) => {
    if (sortBy === 'joined') {
      const aJoined = hasExpertJoined(a);
      const bJoined = hasExpertJoined(b);
      return (aJoined ? 1 : 0) - (bJoined ? 1 : 0);
    }
    return (a.name || '').localeCompare(b.name || '', 'he');
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-slate-100" dir="rtl">
      <div className="max-w-4xl mx-auto px-4 py-8 pb-40 md:pb-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-bl from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Users className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-800">מיילים מומחים</h1>
              <p className="text-slate-500 text-xs md:text-sm">רשימת כתובות מייל של מומחים</p>
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
              <SelectTrigger className="h-8 text-xs w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">שם</SelectItem>
                <SelectItem value="joined">כניסה לאפליקציה</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button size="sm" onClick={() => setAddingNew(true)} className="bg-purple-600 hover:bg-purple-700">
            <Plus className="w-4 h-4 ml-1" />
            הוסף מומחה
          </Button>
        </div>


        {/* Add new form */}
        {addingNew && (
          <Card className="border-2 border-purple-300 mb-4 bg-purple-50">
            <CardContent className="p-4 space-y-3">
              <p className="font-semibold text-purple-800 text-sm">הוספת מומחה חדש</p>
              <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="שם המומחה" autoFocus />
              <Input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="email@example.com" onKeyDown={e => e.key === 'Enter' && handleAddExpert()} />
              <div className="flex gap-2">
                <Button className="bg-green-600 hover:bg-green-700 flex-1" onClick={handleAddExpert}>
                  <Check className="w-4 h-4 ml-1" /> שמור
                </Button>
                <Button variant="outline" onClick={() => setAddingNew(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Experts list - card-based */}
        <div className="space-y-3 mb-6">
          {sortedExperts.map((expert, index) => {
            const isEditingEmail = editingEmail === expert.id;
            const isEditingN = editingName === expert.id;
            const expertEmails = [expert.email, expert.email2].filter(Boolean).map(e => e.toLowerCase());
            const matchedUser = allUsers.find(u => u.email && expertEmails.includes(u.email.toLowerCase()));
            const points = matchedUser ? (userPoints.find(p => p.user_id === matchedUser.id)?.total_points ?? null) : null;
            const joined = hasExpertJoined(expert);
            const feedbackCount = feedbacks.filter(f => f.expert_id === expert.id).length;

            return (
              <Card key={expert.id} className="border border-slate-200 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    {/* Name & Email */}
                    <div className="flex-1 min-w-0 space-y-2">
                      {/* Name */}
                      {isEditingN ? (
                        <div className="flex items-center gap-2">
                          <Input value={nameValue} onChange={e => setNameValue(e.target.value)} className="h-8 text-sm" autoFocus onKeyDown={e => e.key === 'Enter' && handleSaveName(expert.id)} />
                          <Button size="icon" className="h-8 w-8 bg-green-600 hover:bg-green-700 flex-shrink-0" onClick={() => handleSaveName(expert.id)}><Check className="w-3 h-3" /></Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 flex-shrink-0" onClick={() => setEditingName(null)}><X className="w-3 h-3" /></Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800">{expert.name}</span>
                          <button onClick={() => { setEditingName(expert.id); setNameValue(expert.name || ''); }} className="text-slate-400 hover:text-purple-600">
                            <Pencil className="w-3 h-3" />
                          </button>
                          <AlertsBadge personId={expert.id} role="expert" />
                        </div>
                      )}

                      {/* Email 1 */}
                      {editingEmailId === expert.id && editingEmail === 'email' ? (
                        <div className="flex items-center gap-2">
                          <Input type="email" value={emailValue} onChange={e => setEmailValue(e.target.value)} placeholder="email@example.com" className="h-8 text-sm" autoFocus onKeyDown={e => e.key === 'Enter' && handleSaveEmail(expert.id, 'email')} />
                          <Button size="icon" className="h-8 w-8 bg-green-600 hover:bg-green-700 flex-shrink-0" onClick={() => handleSaveEmail(expert.id, 'email')} disabled={savingEmail === expert.id}><Check className="w-3 h-3" /></Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 flex-shrink-0" onClick={() => { setEditingEmail(null); setEditingEmailId(null); }}><X className="w-3 h-3" /></Button>
                        </div>
                      ) : (
                        <button onClick={() => { setEditingEmail('email'); setEditingEmailId(expert.id); setEmailValue(expert.email || ''); }} className="flex items-center gap-1 text-sm text-slate-500 hover:text-purple-600 text-right">
                          <Mail className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{expert.email || <span className="text-slate-300 italic">הוסף מייל ראשי</span>}</span>
                        </button>
                      )}

                      {/* Email 2 */}
                      {editingEmailId === expert.id && editingEmail === 'email2' ? (
                        <div className="flex items-center gap-2">
                          <Input type="email" value={emailValue} onChange={e => setEmailValue(e.target.value)} placeholder="email2@example.com" className="h-8 text-sm" autoFocus onKeyDown={e => e.key === 'Enter' && handleSaveEmail(expert.id, 'email2')} />
                          <Button size="icon" className="h-8 w-8 bg-green-600 hover:bg-green-700 flex-shrink-0" onClick={() => handleSaveEmail(expert.id, 'email2')} disabled={savingEmail === expert.id}><Check className="w-3 h-3" /></Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 flex-shrink-0" onClick={() => { setEditingEmail(null); setEditingEmailId(null); }}><X className="w-3 h-3" /></Button>
                        </div>
                      ) : (
                        <button onClick={() => { setEditingEmail('email2'); setEditingEmailId(expert.id); setEmailValue(expert.email2 || ''); }} className="flex items-center gap-1 text-sm text-slate-400 hover:text-purple-600 text-right">
                          <Mail className="w-3 h-3 flex-shrink-0 opacity-50" />
                          <span className="truncate text-xs">{expert.email2 || <span className="text-slate-300 italic">הוסף מייל נוסף</span>}</span>
                        </button>
                      )}

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
                        {joined ? (
                          <span className="flex items-center gap-1 bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-xs font-medium">
                            <Check className="w-3 h-3" /> נכנס לאפליקציה
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 bg-red-100 text-red-600 px-1.5 py-0.5 rounded text-xs font-medium">
                            <AlertCircle className="w-3 h-3" /> טרם נכנס
                          </span>
                        )}
                        <span className="text-slate-400">#{index + 1}</span>
                      </div>
                    </div>

                    {/* Delete */}
                    <div className="flex-shrink-0">
                      {confirmDelete === expert.id ? (
                        <div className="flex items-center gap-1">
                          <Button size="icon" className="h-8 w-8 bg-red-600 hover:bg-red-700" onClick={() => handleDeleteExpert(expert.id)}><Check className="w-3 h-3" /></Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setConfirmDelete(null)}><X className="w-3 h-3" /></Button>
                        </div>
                      ) : (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => setConfirmDelete(expert.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {expertsLoading && (
            <div className="text-center py-12 text-slate-400">טוען...</div>
          )}
          {!expertsLoading && experts.length === 0 && (
            <div className="text-center py-12 text-slate-500">אין מומחים במערכת</div>
          )}
        </div>

        {/* Pending requests */}
        {pendingRequests.length > 0 && (
          <Card className="border-0 shadow-xl border-l-4 border-amber-400">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-700 text-base">
                <AlertCircle className="w-5 h-5" />
                בקשות גישה שאינן ברשימת המומחים ({pendingRequests.length})
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