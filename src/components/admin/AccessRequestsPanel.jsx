import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserCheck, UserX, Clock, Mail, UserPlus } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/lib/AuthContext';

const MANAGER_EMAILS = ['yuval.lavie@hadassah.org.il', 'ronit.gilad@hadassah.org.il', 'zvika@hadassah.org.il'];

export default function AccessRequestsPanel({ interns, experts, queryClient: externalQueryClient }) {
  const { user, isAuthenticated } = useAuth();
  const isManager = isAuthenticated && (MANAGER_EMAILS.includes(user?.email) || user?.role === 'admin');
  const internalQueryClient = useQueryClient();
  const queryClient = externalQueryClient || internalQueryClient;
  const [assigning, setAssigning] = useState({}); // { [requestId]: { role, entityId, createNew, newName } }

  const { data: requests = [] } = useQuery({
    queryKey: ['access-requests'],
    queryFn: () => base44.entities.AccessRequest.filter({ status: 'pending' }, '-created_date'),
    refetchInterval: 30000
  });

  const handleApprove = async (req) => {
    const cfg = assigning[req.id];
    if (!cfg?.role) return;

    let entityId = cfg.entityId;

    if (cfg.createNew) {
      // צור רשומה חדשה
      if (!cfg.newName?.trim()) return;
      const created = cfg.role === 'intern'
        ? await base44.entities.Intern.create({ name: cfg.newName.trim(), email: req.email })
        : await base44.entities.Expert.create({ name: cfg.newName.trim(), email: req.email });
      entityId = created.id;
    } else {
      if (!entityId) return;
      // עדכן מייל ברשומה קיימת
      if (cfg.role === 'intern') {
        await base44.entities.Intern.update(entityId, { email: req.email });
      } else {
        await base44.entities.Expert.update(entityId, { email: req.email });
      }
    }

    await base44.entities.AccessRequest.update(req.id, {
      status: 'approved',
      assigned_role: cfg.role,
      assigned_entity_id: entityId
    });

    queryClient.invalidateQueries({ queryKey: ['access-requests'] });
    queryClient.invalidateQueries({ queryKey: ['interns'] });
    queryClient.invalidateQueries({ queryKey: ['experts'] });
  };

  const handleReject = async (req) => {
    await base44.entities.AccessRequest.update(req.id, { status: 'rejected' });
    queryClient.invalidateQueries({ queryKey: ['access-requests'] });
  };

  if (!isManager) return null;

  return (
    <Card className="border-2 border-orange-300 shadow-lg mb-8">
      <CardHeader className="bg-orange-50 border-b border-orange-200">
        <CardTitle className="flex items-center gap-3 text-orange-900">
          <Clock className="w-5 h-5" />
          בקשות גישה ממתינות
          {requests.length > 0 && <Badge className="bg-orange-500">{requests.length}</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {requests.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            אין בקשות גישה ממתינות כרגע
          </div>
        ) : (
          <div className="space-y-4">
        {requests.map(req => {
          const cfg = assigning[req.id] || {};
          const entityList = cfg.role === 'intern' ? interns : cfg.role === 'expert' ? experts : [];
          const canApprove = cfg.role && (cfg.createNew ? cfg.newName?.trim() : cfg.entityId);

          return (
            <div key={req.id} className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-slate-800">{req.full_name}</p>
                  <div className="flex items-center gap-1 text-sm text-slate-500 mt-0.5">
                    <Mail className="w-3 h-3" />
                    {req.email}
                  </div>
                  {req.created_date && (
                    <p className="text-xs text-slate-400 mt-1">
                      {format(new Date(req.created_date), 'dd/MM/yyyy HH:mm')}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* בחר תפקיד */}
                <Select
                  value={cfg.role || ''}
                  onValueChange={val => setAssigning(prev => ({ ...prev, [req.id]: { role: val, entityId: '' } }))}
                >
                  <SelectTrigger className="w-36 h-8 text-sm">
                    <SelectValue placeholder="בחר תפקיד" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="intern">מתמחה</SelectItem>
                    <SelectItem value="expert">מומחה</SelectItem>
                  </SelectContent>
                </Select>

                {/* חדש או קיים */}
                {cfg.role && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs gap-1"
                    onClick={() => setAssigning(prev => ({ ...prev, [req.id]: { ...prev[req.id], createNew: !prev[req.id]?.createNew, entityId: '', newName: '' } }))}
                  >
                    <UserPlus className="w-3 h-3" />
                    {cfg.createNew ? 'שייך לקיים' : 'צור חדש'}
                  </Button>
                )}

                {/* שייך לרשומה קיימת */}
                {cfg.role && !cfg.createNew && (
                  <Select
                    value={cfg.entityId || ''}
                    onValueChange={val => setAssigning(prev => ({ ...prev, [req.id]: { ...prev[req.id], entityId: val } }))}
                  >
                    <SelectTrigger className="w-48 h-8 text-sm">
                      <SelectValue placeholder={`בחר ${cfg.role === 'intern' ? 'מתמחה' : 'מומחה'}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {entityList.map(e => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.name} {e.email ? `(${e.email})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {/* יצירת רשומה חדשה */}
                {cfg.role && cfg.createNew && (
                  <Input
                    className="w-48 h-8 text-sm"
                    placeholder={`שם ${cfg.role === 'intern' ? 'המתמחה' : 'המומחה'}`}
                    value={cfg.newName || ''}
                    onChange={e => setAssigning(prev => ({ ...prev, [req.id]: { ...prev[req.id], newName: e.target.value } }))}
                  />
                )}

                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 h-8"
                  disabled={!canApprove}
                  onClick={() => handleApprove(req)}
                >
                  <UserCheck className="w-4 h-4 ml-1" />
                  אשר
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 border-red-300 hover:bg-red-50 h-8"
                  onClick={() => handleReject(req)}
                >
                  <UserX className="w-4 h-4 ml-1" />
                  דחה
                </Button>
              </div>
            </div>
            );
            })}
            </div>
            )}
            </CardContent>
            </Card>
            );
            }