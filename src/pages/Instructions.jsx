import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, User, Stethoscope, Shield, Key, Lock } from 'lucide-react';

export default function Instructions() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-slate-100" dir="rtl">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-bl from-amber-500 to-amber-600 shadow-lg mb-4">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">הוראות שימוש</h1>
          <p className="text-lg text-slate-600">מדריך למערכת המשוב</p>
        </div>

        {/* למתמחים */}
        <Card className="border-0 shadow-xl mb-6">
          <CardHeader className="bg-blue-50 border-b-2 border-blue-200">
            <CardTitle className="flex items-center gap-3 text-blue-900">
              <User className="w-6 h-6" />
              למתמחים
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold flex items-center justify-center">
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800 mb-1">כניסה לעמוד אישי</h4>
                  <p className="text-sm text-slate-600">
                    היכנס לפאנל מתמחים, בחר את השם שלך מהרשימה. 
                    תתבקש להזין את הסיסמה האישית שקיבלת מהמנהל (5 תווים: אותיות אנגלית קטנות ומספרים).
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold flex items-center justify-center">
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800 mb-1">הזנת משוב עצמי</h4>
                  <p className="text-sm text-slate-600">
                    בעמוד האישי, לחץ על "הוסף משוב עצמי חדש". מלא את הפרטים: המומחה המדריך, 
                    קטגוריית הפרוצדורה, סוג הפרוצדורה, תאריך, ודירוג עצמי (לפחות קטגוריה אחת). 
                    לאחר שליחה תקבל מספר סידורי ייחודי.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold flex items-center justify-center">
                  3
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800 mb-1">מעקב אחר התקדמות</h4>
                  <p className="text-sm text-slate-600">
                    בעמוד האישי תוכל לראות את אחוזי ההשלמה שלך בכל קטגוריה, 
                    רשימת כל הפרוצדורות שביצעת, והמשובים שקיבלת מהמומחים.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* למומחים */}
        <Card className="border-0 shadow-xl mb-6">
          <CardHeader className="bg-purple-50 border-b-2 border-purple-200">
            <CardTitle className="flex items-center gap-3 text-purple-900">
              <Stethoscope className="w-6 h-6" />
              למומחים
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-semibold flex items-center justify-center">
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800 mb-1">כניסה לעמוד אישי</h4>
                  <p className="text-sm text-slate-600">
                    היכנס לפאנל מומחים, בחר את השם שלך. 
                    תתבקש להזין את הסיסמה האישית שקיבלת (5 תווים).
                    המערכת תציין לך אם יש משובים חדשים למילוי.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-semibold flex items-center justify-center">
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800 mb-1">מילוי משוב</h4>
                  <p className="text-sm text-slate-600">
                    בעמוד האישי תראה רשימה של משובים הממתינים למילוי ומשובים שכבר הושלמו.
                    עבור כל משוב ממתין, תוכל לראות את המשוב העצמי של המתמחה ולמלא את הדירוג והמשוב שלך.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-semibold flex items-center justify-center">
                  3
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800 mb-1">צפייה במשובים ופגישות מנטורינג</h4>
                  <p className="text-sm text-slate-600">
                    תוכל לראות את כל המשובים שמילאת ואת <strong>פגישות המנטורינג</strong> הקרובות אם יש כאלה.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* הערות חשובות */}
        <Card className="border-2 border-amber-300 bg-amber-50 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-amber-900">
              <Lock className="w-6 h-6" />
              הערות חשובות - סיסמאות
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm text-amber-900">
              <li className="flex items-start gap-2">
                <Key className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>סיסמה ראשונית:</strong> כל מתמחה ומומחה מקבל סיסמה ראשונית מהמנהל (5 תווים: אותיות אנגלית קטנות ומספרים).
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Key className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>שינוי סיסמה:</strong> בעמוד האישי (של מתמחה או מומחה) יש אפשרות "שינוי סיסמה" - ניתן להחליף את הסיסמה בסיסמה אישית חדשה.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Key className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>חשוב לשמור את הסיסמה!</strong> אין אפשרות לשחזר סיסמה שנשכחה ישירות במערכת. 
                  במקרה של שכחה, יש לפנות למנהל שיכול לראות את הסיסמה הנוכחית בטבלת הסיסמאות.
                </span>
              </li>

            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}