import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ClipboardList, ChevronDown, ChevronUp, Trash2, Check, X, Clock, CheckCircle } from 'lucide-react';

export default function FeedbackTasksPanel() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const { data: tasks = [] } = useQuery({
    queryKey: ['feedback-tasks-admin'],
    queryFn: () => base44.entities.FeedbackTask.list('-created_date'),
  });

  const handleDelete = async (taskId) => {
    await base44.entities.FeedbackTask.delete(taskId);
    queryClient.invalidateQueries({ queryKey: ['feedback-tasks-admin'] });
    queryClient.invalidateQueries({ queryKey: ['feedback-tasks-expert'] });
    queryClient.invalidateQueries({ queryKey: ['feedback-tasks-intern'] });
    setConfirmDelete(null);
  };

  const pending = tasks.filter(t => t.status === 'pending');
  const completed = tasks.filter(t => t.status === 'completed');

  const TaskRow = ({ task }) => {
    const isPending = task.status === 'pending';
    return (
      <div className={`rounded-lg px-3 py-2.5 border flex items-center justify-between gap-2 ${isPending ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}`}>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
            <span className="text-xs font-medium text-purple-700">{task.expert_name}</span>
            <span className="text-slate-300">←</span>
            <span className="text-sm font-medium text-slate-800 truncate">{task.intern_name}</span>
          </div>
          <p className="text-sm text-slate-700 truncate">{task.procedure_type} <span className="text-xs text-slate-400">({task.procedure_category})</span></p>
          <span className="text-xs text-slate-400">{task.procedure_date}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge className={`text-xs ${isPending ? 'bg-amber-500' : 'bg-green-600'}`}>{isPending ? 'ממתין' : 'בוצע'}</Badge>
          {confirmDelete === task.id ? (
            <div className="flex items-center gap-1">
              <Button size="icon" className="h-7 w-7 bg-red-600 hover:bg-red-700" onClick={() => handleDelete(task.id)}><Check className="w-3 h-3" /></Button>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setConfirmDelete(null)}><X className="w-3 h-3" /></Button>
            </div>
          ) : (
            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => setConfirmDelete(task.id)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card className="border-0 shadow-lg mb-8">
      <CardHeader className="cursor-pointer select-none hover:bg-slate-50 transition-colors rounded-xl" onClick={() => setOpen(p => !p)}>
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-purple-600" />
            בקשות משוב מבכירים
            {pending.length > 0 && (
              <span className="bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{pending.length}</span>
            )}
          </div>
          {open ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </CardTitle>
      </CardHeader>
      {open && (
        <CardContent className="pt-0 space-y-4">
          {tasks.length === 0 && (
            <p className="text-center text-slate-400 py-6 text-sm">אין בקשות משוב</p>
          )}
          {pending.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-amber-600 flex items-center gap-1"><Clock className="w-3 h-3" /> ממתינות ({pending.length})</p>
              {pending.map(t => <TaskRow key={t.id} task={t} />)}
            </div>
          )}
          {completed.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-green-600 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> בוצעו ({completed.length})</p>
              {completed.map(t => <TaskRow key={t.id} task={t} />)}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}