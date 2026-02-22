import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit, Save, X } from 'lucide-react';

const PROCEDURE_REQUIREMENTS = {
  "OB": {
    "יולדות-ביקורים עם מתמחה": 5,
    "יולדות-ביקור לבד- להציג את הביקור": 2,
    "ביקור יולדות- הצגה לרופא בכיר": 1,
    "יולדות-לעבור על10 מכתבי שחרור (5 פסיולוגי 5 קיסרי)": 10,
    "יולדות - מכתב שחרור קרע מתקדם": 2,
    "יולדות - מכתב שחרור מורכב": 2,
    "קבלה לקיסרי - צפיה": 1,
    "קבלה לקיסרי - יום קבלות": 2,
    "קיסרי- הכרת המטופלת, השכבה, רחצה": 3,
    "הכנסת קטטר": 3,
    "כתיבת דו\"ח ניתוח": 3,
    "טיפול ביולדת -טיפול בחום אחרי לידה וכו'": 7,
    "PV - אחרי מיילדת או רופא": 10,
    "הכנסת בלון": 4,
    "תפירה בחדר לידה": 10,
    "פענוח מוניטור": 1,
    "BPP": 1,
    "קבלה במיון יולדות- אנמנזה, אינטראקציה, כיתוב": 20,
    "קבלה בחדר לידה/ ביקור בחדר לידה": 5,
    "ליווי יולדת בחדר לידה, כולל קבלת לידה (לפחות 5 לידות ראשונות)": 5,
    "ייעוץ לTOLAC כולל הבנה של התווית נגד": 5,
    "אם ועובר-ניהול יום במחלקה": 20,
    "אם ועובר-העברת מקל בישיבת העברה": 5,
    "מכתבי שחרור": 6,
    "ניהול מעקב הריון רגיל": 3,
    "ניתוח קיסרי כעוזר": 10,
    "ניתוח קיסרי כמנתח ראשון": 1,
    "ניהול השראת לידה": 15,
    "ניהול TOLAC": 10,
    "אפיזיוטומיה - ביצוע": 5,
    "טיפול ביולדת -טיפול במקרה חירום מורכב אחרי לידה": 5,
    "ניהול מקרה במיון המיילדותי": 3,
    "שליטה וניהול עמדת המיון המיילדותי": 3,
    "ניהול מקרה של הריון בסיכון גבוה (אשפוז יום)": 5,
    "ניהול מקרה חירום מיילדותי": 5,
    "ניהול לידה מורכבת": 10,
    "ניהול PPH בחדר לידה": 10,
    "Revision": 5,
    "Manual lysis": 5,
    "ניהול לידת תאומים": 5,
    "לידת VACUUM": 5,
    "תפירה מורכבת כולל אבחנה של OASIS": 10,
    "ביצוע קיסרי מורכב": 5,
    "ניהול חדר לידה ותורנות": 5
  },
  "GYN": {
    "קבלה במיון נשים": 10,
    "קבלה בטרום ניתוח": 5,
    "מעבר על תיק מטופלת - ובדיקת רשימת תיוג": 3,
    "הכנסת מטופלת לחדר ניתוח, כולל השכבה, SIGN IN, הכנת ציוד ורחצה": 5,
    "הבנה של שלבי הניתוח פשוט": 5,
    "תפירה וקשירה": 5,
    "כתיבת דו\"ח ניתוח": 10,
    "ניהול יום במחלקה (כולל כל שלבי היום)": 5,
    "ניהול ביקור בוקר (הכרת נשים, הצגה, תוכנית, רישום)": 5,
    "מכתבי שחרור": 6,
    "מענה ראשוני למצב חירום": 3,
    "העברת מקל בישיבת העברה": 3,
    "ניהול מקרה במיון הגינקולוגי (ניהול מלא כולל מעבר לחדר ניתוח במידת הצורך)": 5,
    "טיפול במטופלת עם סיבוכי הריון צעיר (הפלה מאיימת, אקטופי מסוגים שונים)": 5,
    "טיפול למטופלת במרפאת נשים": 5,
    "בדיקת PAP/HPV": 2,
    "פיפל": 2,
    "הוצאת IUD": 3,
    "הידרוסונוגרפיה": 3,
    "הפסקת הריון": 5,
    "ייעוץ על מניעת הריון": 5,
    "טיפול בהפלה נדחית": 5,
    "הכנסת IUD": 3,
    "ניתוחים קטנים (גרידות, ברתולין)": 15,
    "עזרה בלפרוסקופיה והיסטרוסקופיה": 7,
    "ניהול מקרה גינקולוגי אמבולטורי מורכב": 5,
    "מקרה ילדות ומתבגרות": 3,
    "קוניזציה": 3,
    "ייעוץ לנשים עם תלונות של רצפת האגן": 5,
    "הערכה לנשים עם אנדומטרוזיס": 5,
    "היסטרוסקופיה ניתוחית": 5,
    "כריתת רחם": 5,
    "ניתוחי של רצפת האגן כולל TVH": 3,
    "ניתוח פתוח": 5,
    "טיפול של סיבוכים של ניתוחים": 5
  },
  "IVF": {
    "הערכה של מטופלת/זוג עם אי פוריות כולל תוכנית טיפול": 3,
    "כתיבת הנחיות לפרופיל הורמונלי ופענוח תשובה": 3,
    "הנחיות בדיקת זרע ופענוח בדיקת זרע": 3,
    "הערכה של מדדי רזרבה שחלתית": 3,
    "ביצוע בדיקת US למטופלת פריון: AFC, שחלות, הערכת רחם": 3,
    "הערכה של מטופלת עם הפלות חוזרות/RPF": 3,
    "הערכה של מטופלת לשימור פוריות": 2,
    "הערכת מטופל/ת ל PGT": 1,
    "ניהול מטופלת בתהליך של IVF": 3,
    "בירור אי פוריות גבר": 3,
    "IUI": 2,
    "השראת ביוץ": 3,
    "ניהול סיבוכים של ART": 1
  },
  "ONCO": {
    "מקרה אמבולטורי של ממאירות גינקולוגית": 3,
    "חדר ניתוח": 3,
    "אשפוז יום": 3,
    "מחלקה": 3,
    "קולפוסקופיה": 3
  },
  "כללי": {
    "אורך צוואר": 5,
    "הערכת משקל": 10,
    "דופלר של חבל הטבור": 4,
    "הריון צעיר": 10,
    "פתולוגיה בטפולות": 10,
    "מסירת בשורות רעות -תקשורת מתקדמת על בשורות רעות": 3,
    "מחקר, הבנת הספרות": 3,
    "הוראה": 5,
    "ניהול תורנות כתורן ראשון": 5,
    "מחקר ופרסום": 1
  }
};

export default function ManualProcedureEntry({ internId, internName }) {
  const [isEditing, setIsEditing] = useState(false);
  const [manualCounts, setManualCounts] = useState({});
  const queryClient = useQueryClient();

  const { data: existingManualCounts = [] } = useQuery({
    queryKey: ['manual-procedure-counts', internId],
    queryFn: () => base44.entities.ManualProcedureCount.filter({ intern_id: internId }),
    enabled: !!internId
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      // מחיקת כל הרשומות הקודמות
      const deletePromises = existingManualCounts.map(item => 
        base44.entities.ManualProcedureCount.delete(item.id)
      );
      await Promise.all(deletePromises);

      // יצירת רשומות חדשות
      const createPromises = Object.entries(data).map(([key, count]) => {
        if (count > 0) {
          const [category, procName] = key.split('|||');
          return base44.entities.ManualProcedureCount.create({
            intern_id: internId,
            intern_name: internName,
            procedure_category: category,
            procedure_name: procName,
            manual_count: count
          });
        }
      }).filter(Boolean);

      await Promise.all(createPromises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manual-procedure-counts', internId] });
      setIsEditing(false);
    }
  });

  React.useEffect(() => {
    const counts = {};
    existingManualCounts.forEach(item => {
      const key = `${item.procedure_category}|||${item.procedure_name}`;
      counts[key] = item.manual_count || 0;
    });
    setManualCounts(counts);
  }, [existingManualCounts]);

  const handleCountChange = (category, procName, value) => {
    const key = `${category}|||${procName}`;
    setManualCounts(prev => ({
      ...prev,
      [key]: parseInt(value) || 0
    }));
  };

  const handleSave = () => {
    saveMutation.mutate(manualCounts);
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>הזנה ידנית של פרוצדורות קיימות</span>
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} size="sm" variant="outline">
              <Edit className="w-4 h-4 ml-2" />
              עריכה
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button onClick={handleSave} size="sm" className="bg-green-600 hover:bg-green-700">
                <Save className="w-4 h-4 ml-2" />
                שמור
              </Button>
              <Button onClick={() => setIsEditing(false)} size="sm" variant="outline">
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-slate-600 mb-4">
          הזן כאן את מספר הפרוצדורות שביצעת עד כה (ללא משוב). ביצועים אלה יופיעו בצבע אפור בטבלת ההתקדמות.
        </p>
        
        <div className="space-y-6 max-h-96 overflow-y-auto">
          {Object.entries(PROCEDURE_REQUIREMENTS).map(([category, procedures]) => (
            <div key={category}>
              <h4 className="font-semibold text-slate-800 mb-3 sticky top-0 bg-white py-1">{category}</h4>
              <div className="space-y-2">
                {Object.entries(procedures).map(([procName, required]) => {
                  const key = `${category}|||${procName}`;
                  const value = manualCounts[key] || 0;
                  
                  return (
                    <div key={procName} className="flex items-center gap-3 text-sm">
                      <span className="flex-1 text-slate-700">{procName}</span>
                      {isEditing ? (
                        <Input
                          type="number"
                          min="0"
                          value={value}
                          onChange={(e) => handleCountChange(category, procName, e.target.value)}
                          className="w-20 h-8 text-center"
                        />
                      ) : (
                        <span className="w-20 text-center text-slate-600 font-medium">
                          {value > 0 ? value : '-'}
                        </span>
                      )}
                      <span className="text-slate-400 w-12 text-right">/ {required}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}