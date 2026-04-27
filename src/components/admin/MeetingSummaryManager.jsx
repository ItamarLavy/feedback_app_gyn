import React, { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { FileText, Upload, Trash2, Sparkles, Loader2, Plus, X, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

export default function MeetingSummaryManager({ intern, feedbacks = [], manualCounts = [] }) {
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState('');
  const [form, setForm] = useState({ title: '', meeting_date: '', notes: '', file_url: '', file_name: '' });
  const queryClient = useQueryClient();

  const { data: summaries = [] } = useQuery({
    queryKey: ['meeting-summaries', intern?.id],
    queryFn: () => base44.entities.MeetingSummary.filter({ intern_id: intern?.id }, '-meeting_date'),
    enabled: !!intern?.id
  });

  const { data: meetings = [] } = useQuery({
    queryKey: ['meetings-for-ai', intern?.id],
    queryFn: () => base44.entities.FeedbackMeeting.filter({ intern_id: intern?.id }, '-meeting_date'),
    enabled: !!intern?.id
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.MeetingSummary.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting-summaries', intern?.id] });
      setForm({ title: '', meeting_date: '', notes: '', file_url: '', file_name: '' });
      setShowForm(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.MeetingSummary.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['meeting-summaries', intern?.id] })
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, file_url, file_name: file.name }));
    setUploading(false);
  };

  const handleSubmit = () => {
    if (!form.meeting_date) return;
    createMutation.mutate({
      intern_id: intern.id,
      intern_name: intern.name,
      meeting_date: form.meeting_date,
      title: form.title,
      file_url: form.file_url,
      file_name: form.file_name,
      notes: form.notes
    });
  };

  const generateAISummary = async () => {
    setAiLoading(true);
    setAiSummary('');

    // קריאת תוכן קבצי הסיכומים
    const fileUrls = summaries.filter(s => s.file_url).map(s => s.file_url);

    // בניית פרומפט מקיף
    const feedbackText = feedbacks.map(f =>
      `[${f.procedure_date || 'לא ידוע'}] ${f.procedure_category} - ${f.procedure_type} | מומחה: ${f.expert_name} | דירוג מומחה: ידע ${f.expert_knowledge_rating || '-'}, מיומנות ${f.expert_manual_skill_rating || '-'}, מקצועיות ${f.expert_professionalism_rating || '-'}, עצמאות ${f.expert_independence_rating || '-'} | משוב מומחה: "${f.expert_verbal_feedback || ''}" | משוב עצמי: "${f.intern_verbal_feedback || ''}"`
    ).join('\n');

    const meetingsText = meetings.map(m =>
      `[${m.meeting_date ? format(new Date(m.meeting_date), 'dd/MM/yyyy') : '?'}] מומחים: ${(m.invited_experts || []).map(e => e.name).join(', ')} | סטטוס: ${m.status} | מיקום: ${m.location || ''}`
    ).join('\n');

    const summariesText = summaries.map(s =>
      `[${s.meeting_date}] ${s.title || ''}: ${s.notes || ''}`
    ).join('\n');

    const pendingMeeting = meetings.find(m => m.status === 'מתוכנן');

    const prompt = `אתה מנחה רפואי בכיר המכין דוח לפגישת מנטורינג עם מתמחה ברפואת נשים.

שם המתמחה: ${intern?.name}

=== משובים מהמומחים (${feedbacks.length} סה"כ) ===
${feedbackText || 'אין נתונים'}

=== פגישות מנטורינג קודמות ===
${meetingsText || 'אין נתונים'}

=== סיכומי פגישות שנכתבו ===
${summariesText || 'אין נתונים'}

=== הפגישה הקרובה ===
${pendingMeeting ? `תאריך: ${pendingMeeting.meeting_date ? format(new Date(pendingMeeting.meeting_date), 'dd/MM/yyyy') : 'לא ידוע'}` : 'לא קיימת פגישה מתוכננת'}

---
אנא הכן סיכום מנהלי מפורט ומועיל שיכלול:

1. **תמונת מצב כללית** - איך המתמחה מתקדם בסה"כ?
2. **נקודות חוזק** - מה עולה בצורה עקבית כחזק?
3. **תחומים לשיפור** - מה צריך לחזק? (על בסיס הנתונים)
4. **מגמות לאורך זמן** - האם יש שיפור/ירידה בדירוגים? האם תדירות הבקשות עקבית?
5. **הכנה לפגישה הקרובה** - 3-5 נושאים מומלצים לדיון, שאלות שכדאי לשאול
6. **המלצות לפעולה** - מה כדאי לעשות בטווח הקרוב?

כתוב בעברית, בצורה מקצועית, ממוקדת ומועילה. אל תפרט כל משוב לגופו, אלא תן תמונה כוללת ותובנות.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      file_urls: fileUrls.length > 0 ? fileUrls : undefined,
      model: 'claude_sonnet_4_6'
    });

    setAiSummary(typeof result === 'string' ? result : JSON.stringify(result));
    setAiLoading(false);
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            סיכומי פגישות ({summaries.length})
          </div>
          <Button size="sm" onClick={() => setShowForm(s => !s)} variant="outline">
            {showForm ? <X className="w-4 h-4" /> : <><Plus className="w-4 h-4 ml-1" />הוסף סיכום</>}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* טופס הוספה */}
        {showForm && (
          <div className="border border-indigo-200 rounded-xl p-4 bg-indigo-50 space-y-3">
            <Input
              placeholder="כותרת הפגישה (לדוגמה: פגישת מנטורינג רבעונית)"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            />
            <Input
              type="date"
              value={form.meeting_date}
              onChange={e => setForm(f => ({ ...f, meeting_date: e.target.value }))}
            />
            <Textarea
              placeholder="הערות / נושאים שעלו בפגישה..."
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={3}
            />
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-indigo-700 bg-white border border-indigo-200 rounded-lg px-3 py-2 hover:bg-indigo-50">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {form.file_name || 'העלה קובץ סיכום (PDF/Word/תמונה)'}
                <input type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg" />
              </label>
              {form.file_name && <span className="text-xs text-green-600">✓ {form.file_name}</span>}
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSubmit} disabled={!form.meeting_date || createMutation.isPending} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'שמור'}
              </Button>
              <Button onClick={() => setShowForm(false)} variant="ghost" size="sm">ביטול</Button>
            </div>
          </div>
        )}

        {/* רשימת סיכומים */}
        {summaries.length > 0 && (
          <div className="space-y-2">
            {summaries.map(s => (
              <div key={s.id} className="flex items-start justify-between bg-slate-50 rounded-lg p-3 border border-slate-200">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">{s.meeting_date}</Badge>
                    {s.title && <span className="font-medium text-slate-800 text-sm">{s.title}</span>}
                    {s.file_url && (
                      <a href={s.file_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800">
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  {s.notes && <p className="text-xs text-slate-500 line-clamp-2">{s.notes}</p>}
                  {s.file_name && <p className="text-xs text-indigo-500 mt-1">📎 {s.file_name}</p>}
                </div>
                <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(s.id)} className="text-red-400 hover:text-red-600 flex-shrink-0">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {summaries.length === 0 && !showForm && (
          <p className="text-sm text-slate-400 text-center py-4">אין סיכומי פגישות עדיין</p>
        )}

        {/* כפתור AI */}
        <div className="pt-2 border-t border-slate-200">
          <Button
            onClick={generateAISummary}
            disabled={aiLoading}
            className="w-full bg-gradient-to-l from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
          >
            {aiLoading
              ? <><Loader2 className="w-4 h-4 animate-spin ml-2" />מכין סיכום AI...</>
              : <><Sparkles className="w-4 h-4 ml-2" />הכן סיכום AI לפגישה הקרובה</>
            }
          </Button>
          <p className="text-xs text-slate-400 text-center mt-1">משקלל משובים, פגישות קודמות וסיכומים</p>
        </div>

        {/* AI Summary Output */}
        {aiSummary && (
          <div className="mt-4 bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <h4 className="font-semibold text-purple-900">סיכום AI - הכנה לפגישה</h4>
            </div>
            <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{aiSummary}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}