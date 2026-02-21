import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Plus, Calendar, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

export default function ManagerNotes({ intern }) {
  const [showForm, setShowForm] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [noteType, setNoteType] = useState('מחשבות כלליות');
  const queryClient = useQueryClient();

  const { data: notes = [] } = useQuery({
    queryKey: ['manager-notes', intern?.id],
    queryFn: () => base44.entities.ManagerNote.filter({ intern_id: intern.id }, '-created_date'),
    enabled: !!intern?.id
  });

  const createNoteMutation = useMutation({
    mutationFn: (data) => base44.entities.ManagerNote.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager-notes', intern?.id] });
      setNoteContent('');
      setNoteType('מחשבות כלליות');
      setShowForm(false);
    }
  });

  const deleteNoteMutation = useMutation({
    mutationFn: (id) => base44.entities.ManagerNote.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager-notes', intern?.id] });
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!noteContent.trim()) return;

    createNoteMutation.mutate({
      intern_id: intern.id,
      intern_name: intern.name,
      note_content: noteContent,
      note_type: noteType
    });
  };

  const handleDelete = (noteId) => {
    if (window.confirm('האם למחוק הערה זו?')) {
      deleteNoteMutation.mutate(noteId);
    }
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <span className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal-600" />
            הערות מנהל
          </span>
          <Button
            size="sm"
            onClick={() => setShowForm(!showForm)}
            className="bg-teal-600 hover:bg-teal-700"
          >
            <Plus className="w-4 h-4 ml-1" />
            הערה חדשה
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-slate-50 rounded-lg">
            <div className="space-y-2">
              <Label>סוג הערה</Label>
              <Select value={noteType} onValueChange={setNoteType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="פגישה">סיכום פגישה</SelectItem>
                  <SelectItem value="מחשבות כלליות">מחשבות כלליות</SelectItem>
                  <SelectItem value="התקדמות">התקדמות</SelectItem>
                  <SelectItem value="אחר">אחר</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>תוכן ההערה</Label>
              <Textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="כתוב הערה, סיכום פגישה, מחשבות..."
                className="min-h-[150px]"
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={!noteContent.trim()}>
                שמור הערה
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                ביטול
              </Button>
            </div>
          </form>
        )}

        <div className="space-y-3">
          {notes.length === 0 ? (
            <p className="text-slate-500 text-center py-4">אין הערות עדיין</p>
          ) : (
            notes.map(note => (
              <div key={note.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-teal-700 bg-teal-100 px-2 py-1 rounded">
                      {note.note_type}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Calendar className="w-3 h-3" />
                      <span>{format(new Date(note.created_date), 'dd/MM/yyyy HH:mm')}</span>
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDelete(note.id)}
                    className="h-6 w-6 text-slate-400 hover:text-red-600"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{note.note_content}</p>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}