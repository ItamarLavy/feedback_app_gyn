import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, CheckCircle, Calendar, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

// מיפוי שמות פרוצדורות ידועים לקטגוריות
const CATEGORY_KEYWORDS = {
  'OB': ['יולדות', 'קיסרי', 'לידה', 'יולדת', 'BPP', 'TOLAC', 'PPH', 'VACUUM', 'אפיזיוטומיה', 'revision', 'manual lysis'],
  'GYN': ['גינ', 'ניתוח', 'לפרוסקופ', 'היסטרוסקופ', 'IUD', 'PAP', 'HPV', 'קולפוסקופ', 'קוניזציה', 'מיון', 'רחם'],
  'IVF': ['פריון', 'IVF', 'IUI', 'ביוץ', 'זרע', 'שחלת', 'RPF', 'PGT', 'ART'],
  'ONCO': ['אונקו', 'ממאיר', 'גידול'],
  'כללי': ['אורך צוואר', 'דופלר', 'הריון צעיר', 'פתולוגיה', 'מחקר', 'הוראה', 'תורנות']
};

function guessCategory(procName) {
  const lower = procName.toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(k => lower.includes(k.toLowerCase()))) return cat;
  }
  return 'כללי';
}

function parseCSV(text) {
  const lines = text.split('\n').filter(l => l.trim());
  const results = [];

  for (const line of lines) {
    // ניסיון לפרסר: שם פרוצדורה, כמות
    const parts = line.split(/[,\t;]/).map(p => p.trim().replace(/^"|"$/g, ''));
    if (parts.length >= 2) {
      const name = parts[0];
      const count = parseInt(parts[parts.length - 1]);
      if (name && !isNaN(count) && count > 0) {
        results.push({
          procedure_name: name,
          category: guessCategory(name),
          count
        });
      }
    }
  }
  return results;
}

export default function MonthlyTableUpload({ internId, internName }) {
  const queryClient = useQueryClient();
  const [dragOver, setDragOver] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  const [parseError, setParseError] = useState(null);
  const [fileName, setFileName] = useState('');

  const currentYearMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

  const { data: uploads = [] } = useQuery({
    queryKey: ['monthly-uploads', internId],
    queryFn: () => base44.entities.MonthlyProcedureUpload.filter({ intern_id: internId }),
    enabled: !!internId
  });

  const thisMonthUpload = uploads.find(u => u.year_month === currentYearMonth);

  const saveMutation = useMutation({
    mutationFn: async (procedures) => {
      // עדכון ManualProcedureCount - הוספה על הקיים
      const existingManual = await base44.entities.ManualProcedureCount.filter({ intern_id: internId });

      const updates = [];
      for (const proc of procedures) {
        const existing = existingManual.find(
          e => e.procedure_category === proc.category && e.procedure_name === proc.procedure_name
        );
        if (existing) {
          updates.push(
            base44.entities.ManualProcedureCount.update(existing.id, {
              manual_count: (existing.manual_count || 0) + proc.count
            })
          );
        } else {
          updates.push(
            base44.entities.ManualProcedureCount.create({
              intern_id: internId,
              intern_name: internName,
              procedure_category: proc.category,
              procedure_name: proc.procedure_name,
              manual_count: proc.count
            })
          );
        }
      }
      await Promise.all(updates);

      // שמירת רשומת ההעלאה החודשית
      if (thisMonthUpload) {
        await base44.entities.MonthlyProcedureUpload.update(thisMonthUpload.id, {
          upload_date: new Date().toISOString(),
          procedures_data: procedures,
          total_procedures: procedures.reduce((s, p) => s + p.count, 0)
        });
      } else {
        await base44.entities.MonthlyProcedureUpload.create({
          intern_id: internId,
          intern_name: internName,
          year_month: currentYearMonth,
          upload_date: new Date().toISOString(),
          procedures_data: procedures,
          total_procedures: procedures.reduce((s, p) => s + p.count, 0)
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monthly-uploads', internId] });
      queryClient.invalidateQueries({ queryKey: ['manual-procedure-counts', internId] });
      setParsedData(null);
      setFileName('');
    }
  });

  const handleFile = (file) => {
    if (!file) return;
    setParseError(null);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const parsed = parseCSV(text);
      if (parsed.length === 0) {
        setParseError('לא ניתן לקרוא את הקובץ. ודא שהוא בפורמט CSV עם עמודות: שם פרוצדורה, כמות');
      } else {
        setParsedData(parsed);
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  const monthLabel = new Date().toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });

  return (
    <Card className="border-0 shadow-lg mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileSpreadsheet className="w-5 h-5 text-teal-600" />
          <span>העלאת טבלת פרוצדורות חודשית</span>
          <Badge className="bg-slate-200 text-slate-600 text-xs font-normal">{monthLabel}</Badge>
          {thisMonthUpload && (
            <Badge className="bg-green-100 text-green-700 text-xs">
              <CheckCircle className="w-3 h-3 ml-1" />
              הועלה
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {thisMonthUpload && !parsedData && (
          <div className="bg-green-50 rounded-lg p-3 mb-4 flex items-center gap-2 text-sm text-green-700">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <div>
              <p className="font-medium">הטבלה החודשית הועלתה בהצלחה</p>
              <p className="text-xs text-green-600 mt-0.5">
                {thisMonthUpload.total_procedures} פרוצדורות • {thisMonthUpload.upload_date && format(new Date(thisMonthUpload.upload_date), 'dd/MM/yyyy HH:mm')}
              </p>
            </div>
          </div>
        )}

        <p className="text-xs text-slate-500 mb-3">
          העלה קובץ CSV שהורדת ממערכת המחשוב של בית החולים. הפרוצדורות יתווספו לספירה הכוללת שלך (ללא משוב). הן <strong>לא</strong> נספרות לצורך מעבר שלב.
        </p>

        {!parsedData ? (
          <div
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
              dragOver ? 'border-teal-400 bg-teal-50' : 'border-slate-300 hover:border-teal-300 hover:bg-slate-50'
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm text-slate-600 mb-1">גרור קובץ CSV לכאן</p>
            <p className="text-xs text-slate-400 mb-3">או</p>
            <label className="cursor-pointer">
              <span className="bg-teal-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors">
                בחר קובץ
              </span>
              <input
                type="file"
                accept=".csv,.txt"
                className="hidden"
                onChange={(e) => handleFile(e.target.files[0])}
              />
            </label>
            {parseError && (
              <div className="mt-3 flex items-center gap-1 text-red-600 text-xs justify-center">
                <AlertCircle className="w-3.5 h-3.5" />
                {parseError}
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-slate-700">
                נמצאו {parsedData.length} פרוצדורות מ-{fileName}
              </p>
              <button
                onClick={() => { setParsedData(null); setFileName(''); }}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                ביטול
              </button>
            </div>
            <div className="max-h-48 overflow-y-auto space-y-1 mb-4 bg-slate-50 rounded-lg p-3">
              {parsedData.map((p, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 truncate flex-1">{p.procedure_name}</span>
                  <span className="text-slate-400 mr-2">[{p.category}]</span>
                  <span className="font-medium text-teal-700 w-8 text-left">×{p.count}</span>
                </div>
              ))}
            </div>
            <Button
              onClick={() => saveMutation.mutate(parsedData)}
              disabled={saveMutation.isPending}
              className="w-full bg-teal-600 hover:bg-teal-700"
            >
              {saveMutation.isPending ? 'שומר...' : `הוסף ${parsedData.reduce((s,p)=>s+p.count,0)} פרוצדורות לספירה`}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}