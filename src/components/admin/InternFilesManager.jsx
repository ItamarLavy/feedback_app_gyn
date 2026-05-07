import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Upload, Trash2, Plus, X, Loader2, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

const BUCKET_LABELS = {
  meeting_summary: 'סיכום פגישה',
  professional: 'מסמך מקצועי',
  misc: 'כללי'
};

const BUCKET_COLORS = {
  meeting_summary: 'bg-blue-100 text-blue-700',
  professional: 'bg-green-100 text-green-700',
  misc: 'bg-slate-100 text-slate-600'
};

export default function InternFilesManager({ intern }) {
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    meeting_date: new Date().toISOString().split('T')[0],
    bucket: 'misc',
    notes: '',
    file: null
  });
  const queryClient = useQueryClient();

  const { data: files = [] } = useQuery({
    queryKey: ['intern-files', intern?.id],
    queryFn: () => base44.entities.MeetingSummary.filter({ intern_id: intern?.id }, '-meeting_date'),
    enabled: !!intern?.id
  });

  const handleUpload = async () => {
    if (!form.title && !form.file) return;
    setUploading(true);

    let fileUrl = null;
    let fileName = null;

    if (form.file) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: form.file });
      fileUrl = file_url;
      fileName = form.file.name;
    }

    await base44.entities.MeetingSummary.create({
      intern_id: intern.id,
      intern_name: intern.name,
      meeting_date: form.meeting_date,
      title: form.title || fileName || 'ללא כותרת',
      file_url: fileUrl,
      file_name: fileName,
      notes: form.notes,
      bucket: form.bucket
    });

    queryClient.invalidateQueries({ queryKey: ['intern-files', intern.id] });
    setForm({ title: '', meeting_date: new Date().toISOString().split('T')[0], bucket: 'misc', notes: '', file: null });
    setShowForm(false);
    setUploading(false);
  };

  const handleDelete = async (id) => {
    await base44.entities.MeetingSummary.delete(id);
    queryClient.invalidateQueries({ queryKey: ['intern-files', intern.id] });
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            קבצים ומסמכים ({files.length})
          </div>
          <Button size="sm" variant="outline" onClick={() => setShowForm(!showForm)}>
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4 ml-1" />}
            {showForm ? 'בטל' : 'הוסף'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 space-y-3">
            <Input
              placeholder="כותרת / תיאור"
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="date"
                value={form.meeting_date}
                onChange={e => setForm(p => ({ ...p, meeting_date: e.target.value }))}
              />
              <Select value={form.bucket} onValueChange={v => setForm(p => ({ ...p, bucket: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="meeting_summary">סיכום פגישה</SelectItem>
                  <SelectItem value="professional">מסמך מקצועי</SelectItem>
                  <SelectItem value="misc">כללי</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Textarea
              placeholder="הערות (יכלל בסיכום AI)"
              value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              className="min-h-[80px] text-sm"
            />
            <div className="flex items-center gap-3">
              <label className="flex-1 flex items-center gap-2 px-3 py-2 border-2 border-dashed border-indigo-300 rounded-lg cursor-pointer hover:border-indigo-500 transition-colors text-sm text-slate-600">
                <Upload className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                {form.file ? form.file.name : 'בחר קובץ (אופציונלי)'}
                <input type="file" className="hidden" onChange={e => setForm(p => ({ ...p, file: e.target.files[0] || null }))} />
              </label>
              <Button onClick={handleUpload} disabled={uploading || (!form.title && !form.file)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'שמור'}
              </Button>
            </div>
          </div>
        )}

        {files.length === 0 && !showForm && (
          <p className="text-center text-slate-400 py-6 text-sm">אין קבצים עדיין. הוסף מסמכים, סיכומי פגישות או אישורים.</p>
        )}

        <div className="space-y-2">
          {files.map(file => (
            <div key={file.id} className="flex items-start gap-3 p-3 bg-white border border-slate-200 rounded-lg hover:border-indigo-200 transition-colors">
              <FileText className="w-5 h-5 text-indigo-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-slate-800 text-sm">{file.title}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${BUCKET_COLORS[file.bucket] || BUCKET_COLORS.misc}`}>
                    {BUCKET_LABELS[file.bucket] || file.bucket}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{file.meeting_date && format(new Date(file.meeting_date), 'dd/MM/yyyy')}</p>
                {file.notes && <p className="text-xs text-slate-600 mt-1 line-clamp-2">{file.notes}</p>}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {file.file_url && (
                  <a href={file.file_url} target="_blank" rel="noreferrer">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-indigo-500 hover:text-indigo-700">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  </a>
                )}
                <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50"
                  onClick={() => handleDelete(file.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}