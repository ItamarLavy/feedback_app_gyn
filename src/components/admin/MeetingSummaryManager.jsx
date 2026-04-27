import React, { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { FileText, Upload, Trash2, Sparkles, Loader2, Plus, X, ExternalLink, FolderOpen, Briefcase, Layers } from 'lucide-react';
import { format } from 'date-fns';

const BUCKETS = {
  meeting_summary: { label: 'סיכומי פגישה', icon: FolderOpen, color: 'bg-blue-50 border-blue-200 text-blue-800', badge: 'bg-blue-100 text-blue-700' },
  professional: { label: 'מסמכים מקצועיים', icon: Briefcase, color: 'bg-green-50 border-green-200 text-green-800', badge: 'bg-green-100 text-green-700' },
  misc: { label: 'שונות', icon: Layers, color: 'bg-slate-50 border-slate-200 text-slate-700', badge: 'bg-slate-100 text-slate-600' },
};

export default function MeetingSummaryManager({ intern, feedbacks = [], manualCounts = [], managerNotes = [], rotations = [] }) {
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [classifying, setClassifying] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState('');
  const [activeBucket, setActiveBucket] = useState('all');
  const [form, setForm] = useState({ title: '', meeting_date: '', notes: '', file_url: '', file_name: '', bucket: '' });
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
    setUploading(false);

    // סיווג אוטומטי לפי שם הקובץ + AI
    setClassifying(true);
    const classResult = await base44.integrations.Core.InvokeLLM({
      prompt: `סווג את המסמך הבא לאחד משלושה סלים בלבד. 
שם הקובץ: "${file.name}"

הסלים האפשריים:
- "meeting_summary" – סיכום פגישה, פגישת מנטורינג, דו"ח פגישה
- "professional" – מסמך מקצועי כגון הכשרה, תעודה, קורס, צו, אישור, מילואים, מסמך רפואי
- "misc" – כל דבר אחר

ענה במילה אחת בלבד: meeting_summary או professional או misc`,
      response_json_schema: {
        type: 'object',
        properties: { bucket: { type: 'string' } }
      }
    });
    const bucket = ['meeting_summary', 'professional', 'misc'].includes(classResult?.bucket)
      ? classResult.bucket : 'misc';
    setForm(f => ({ ...f, file_url, file_name: file.name, bucket }));
    setClassifying(false);
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
      notes: form.notes,
      bucket: form.bucket || 'misc'
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

    const notesText = managerNotes.map(n =>
      `[${n.created_date ? format(new Date(n.created_date), 'dd/MM/yyyy') : '?'}] סוג: ${n.note_type} | ${n.note_content}`
    ).join('\n');

    const rotationsText = rotations.map(r =>
      `${r.rotation_type} | ${r.start_date}${r.end_date ? ` עד ${r.end_date}` : ''} | סטטוס: ${r.status}`
    ).join('\n');

    const manualCountsText = manualCounts.map(m =>
      `${m.procedure_category} - ${m.procedure_name}: ${m.manual_count} ביצועים ידניים`
    ).join('\n');

    const pendingMeeting = meetings.find(m => m.status === 'מתוכנן');

    const prompt = `אתה מנחה רפואי בכיר המכין דוח לפגישת מנטורינג עם מתמחה ברפואת נשים.

שם המתמחה: ${intern?.name}

=== משובים מהמומחים (${feedbacks.length} סה"כ) ===
${feedbackText || 'אין נתונים'}

=== ביצועים ידניים (ללא משוב) ===
${manualCountsText || 'אין נתונים'}

=== תוכנית ההתמחות - סבבים ===
${rotationsText || 'אין נתונים'}

=== הערות מנהל ===
${notesText || 'אין הערות'}

=== פגישות מנטורינג קודמות ===
${meetingsText || 'אין נתונים'}

=== סיכומי פגישות שנכתבו ===
${summariesText || 'אין נתונים'}

=== הפגישה הקרובה ===
${pendingMeeting ? `תאריך: ${pendingMeeting.meeting_date ? format(new Date(pendingMeeting.meeting_date), 'dd/MM/yyyy') : 'לא ידוע'}` : 'לא קיימת פגישה מתוכננת'}

---
אנא הכן סיכום מנהלי מפורט ומועיל שיכלול:

1. **תמונת מצב כללית** - איך המתמחה מתקדם בסה"כ? (כולל מיקום בתוכנית הסבבים)
2. **נקודות חוזק** - מה עולה בצורה עקבית כחזק?
3. **תחומים לשיפור** - מה צריך לחזק? (על בסיס הנתונים)
4. **מגמות לאורך זמן** - האם יש שיפור/ירידה בדירוגים? האם תדירות הבקשות עקבית?
5. **הערות מנהל - נושאים חשובים** - אם יש הערות מנהל, ציין את הנושאים המרכזיים שעלו
6. **הכנה לפגישה הקרובה** - 3-5 נושאים מומלצים לדיון, שאלות שכדאי לשאול
7. **המלצות לפעולה** - מה כדאי לעשות בטווח הקרוב?

כתוב בעברית, בצורה מקצועית, ממוקדת ומועילה. אל תפרט כל משוב לגופו, אלא תן תמונה כוללת ותובנות.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      file_urls: fileUrls.length > 0 ? fileUrls : undefined,
      model: 'claude_sonnet_4_6'
    });

    setAiSummary(typeof result === 'string' ? result : JSON.stringify(result));
    setAiLoading(false);
  };

  const filteredSummaries = activeBucket === 'all' ? summaries : summaries.filter(s => (s.bucket || 'misc') === activeBucket);

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            מסמכים ({summaries.length})
          </div>
          <Button size="sm" onClick={() => setShowForm(s => !s)} variant="outline">
            {showForm ? <X className="w-4 h-4" /> : <><Plus className="w-4 h-4 ml-1" />הוסף מסמך</>}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* טופס הוספה */}
        {showForm && (
          <div className="border border-indigo-200 rounded-xl p-4 bg-indigo-50 space-y-3">
            <Input
              placeholder="כותרת (לדוגמה: פגישת מנטורינג רבעונית)"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            />
            <Input
              type="date"
              value={form.meeting_date}
              onChange={e => setForm(f => ({ ...f, meeting_date: e.target.value }))}
            />
            <Textarea
              placeholder="הערות נוספות..."
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={3}
            />
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-indigo-700 bg-white border border-indigo-200 rounded-lg px-3 py-2 hover:bg-indigo-50 w-fit">
                {uploading || classifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {uploading ? 'מעלה...' : classifying ? 'מסווג מסמך...' : (form.file_name || 'העלה קובץ (PDF/Word/תמונה)')}
                <input type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg" />
              </label>
              {form.file_name && form.bucket && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-green-600">✓ {form.file_name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${BUCKETS[form.bucket]?.badge}`}>
                    {BUCKETS[form.bucket]?.label}
                  </span>
                  {/* אפשרות תיקון ידני */}
                  <select
                    value={form.bucket}
                    onChange={e => setForm(f => ({ ...f, bucket: e.target.value }))}
                    className="text-xs border border-slate-200 rounded px-1 py-0.5 bg-white"
                  >
                    {Object.entries(BUCKETS).map(([key, b]) => (
                      <option key={key} value={key}>{b.label}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSubmit} disabled={!form.meeting_date || createMutation.isPending || classifying} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'שמור'}
              </Button>
              <Button onClick={() => setShowForm(false)} variant="ghost" size="sm">ביטול</Button>
            </div>
          </div>
        )}

        {/* סלים */}
        {summaries.length > 0 && (
          <>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setActiveBucket('all')}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${activeBucket === 'all' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
              >
                הכל ({summaries.length})
              </button>
              {Object.entries(BUCKETS).map(([key, b]) => {
                const count = summaries.filter(s => (s.bucket || 'misc') === key).length;
                if (count === 0) return null;
                return (
                  <button
                    key={key}
                    onClick={() => setActiveBucket(key)}
                    className={`text-xs px-3 py-1 rounded-full border transition-colors flex items-center gap-1 ${activeBucket === key ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                  >
                    {count > 0 && <span>({count})</span>}
                    {b.label}
                  </button>
                );
              })}
            </div>

            <div className="space-y-2">
              {filteredSummaries.map(s => {
                const bucket = BUCKETS[s.bucket || 'misc'];
                const BucketIcon = bucket.icon;
                return (
                  <div key={s.id} className={`flex items-start justify-between rounded-lg p-3 border ${bucket.color}`}>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <BucketIcon className="w-3.5 h-3.5 opacity-70" />
                        <Badge variant="outline" className="text-xs">{s.meeting_date}</Badge>
                        {s.title && <span className="font-medium text-sm">{s.title}</span>}
                        {s.file_url && (
                          <a href={s.file_url} target="_blank" rel="noopener noreferrer" className="opacity-60 hover:opacity-100">
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                      {s.notes && <p className="text-xs opacity-70 line-clamp-2">{s.notes}</p>}
                      {s.file_name && <p className="text-xs opacity-60 mt-1">📎 {s.file_name}</p>}
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(s.id)} className="text-red-400 hover:text-red-600 flex-shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {summaries.length === 0 && !showForm && (
          <p className="text-sm text-slate-400 text-center py-4">אין מסמכים עדיין</p>
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