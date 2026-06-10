import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, ChevronRight } from 'lucide-react';
import InternSelfFeedbackFormSimple from '@/components/feedback/InternSelfFeedbackFormSimple';

export default function PendingFeedbackTasks({ internId, internName, internStage, experts, seniorInterns }) {
  const queryClient = useQueryClient();
  const [activeTaskId, setActiveTaskId] = useState(null);

  const { data: tasks = [] } = useQuery({
    queryKey: ['feedback-tasks-intern', internId],
    queryFn: () => base44.entities.FeedbackTask.filter({ intern_id: internId }, '-created_date'),
    enabled: !!internId
  });

  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  if (tasks.length === 0) return null;

  const activeTask = tasks.find(t => t.id === activeTaskId);

  return (
    <details className="mb-4 bg-white rounded-xl border-2 border-purple-200 shadow-sm overflow-hidden" open={pendingTasks.length > 0}>
      <summary className="px-4 py-3 cursor-pointer font-medium text-slate-800 flex items-center gap-2 hover:bg-purple-50 transition-colors list-none">
        <Bell className="w-4 h-4 text-purple-500" />
        בקשות ממתינות
        {pendingTasks.length > 0 && (
          <span className="bg-purple-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{pendingTasks.length}</span>
        )}
      </summary>
      <div className="px-4 pb-4 pt-2 space-y-3">
        {/* פורם מילוי - אם נבחרה משימה */}
        {activeTask && (
          <div className="border-2 border-purple-200 rounded-xl overflow-hidden">
            <div className="bg-purple-50 px-4 py-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-purple-800">
                מילוי משוב — {activeTask.procedure_type}
              </span>
              <button onClick={() => setActiveTaskId(null)} className="text-xs text-slate-500 hover:text-slate-700">סגור</button>
            </div>
            <div className="p-3">
              <InternSelfFeedbackFormSimple
                internId={internId}
                internName={internName}
                internStage={internStage}
                experts={experts}
                seniorInterns={seniorInterns}
                prefill={{
                  procedure_category: activeTask.procedure_category,
                  procedure_type: activeTask.procedure_type,
                  procedure_date: activeTask.procedure_date,
                  expert_id: activeTask.expert_id,
                  expert_name: activeTask.expert_name,
                }}
                onSuccess={async (feedbackId) => {
                  // סמן את המשימה כבוצעה
                  await base44.entities.FeedbackTask.update(activeTask.id, {
                    status: 'completed',
                    feedback_id: feedbackId || '',
                    completed_at: new Date().toISOString()
                  });
                  queryClient.invalidateQueries({ queryKey: ['feedback-tasks-intern', internId] });
                  queryClient.invalidateQueries({ queryKey: ['intern-feedbacks', internId] });
                  setActiveTaskId(null);
                }}
              />
              <Button variant="outline" onClick={() => setActiveTaskId(null)} className="mt-3 w-full text-sm">
                ביטול
              </Button>
            </div>
          </div>
        )}

        {/* רשימת בקשות ממתינות */}
        {pendingTasks.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-purple-600">ממתינות למילוי ({pendingTasks.length})</p>
            {pendingTasks.map(task => (
              <button
                key={task.id}
                onClick={() => setActiveTaskId(task.id === activeTaskId ? null : task.id)}
                className="w-full bg-purple-50 border border-purple-200 rounded-lg px-3 py-3 text-right hover:bg-purple-100 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-purple-700">מ: {task.expert_name}</span>
                      <span className="text-xs text-slate-400">{task.procedure_date}</span>
                    </div>
                    <p className="text-sm font-medium text-slate-800 truncate">{task.procedure_type}</p>
                    <p className="text-xs text-slate-500">{task.procedure_category}</p>
                    {task.notes && (
                      <p className="text-xs text-slate-600 mt-1 italic">"{task.notes}"</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge className="bg-purple-500 text-xs">ממתין</Badge>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* בקשות שבוצעו */}
        {completedTasks.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-semibold text-green-600">בוצעו ({completedTasks.length})</p>
            {completedTasks.map(task => (
              <div key={task.id} className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-xs text-slate-600">{task.expert_name} • </span>
                  <span className="text-sm text-slate-700">{task.procedure_type}</span>
                  <span className="text-xs text-slate-400 block">{task.procedure_date}</span>
                </div>
                <Badge className="bg-green-600 text-xs flex-shrink-0">בוצע</Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </details>
  );
}