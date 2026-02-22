import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, UserCircle, Users, Shield, ArrowLeft, CheckCircle } from 'lucide-react';

export default function Instructions() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-slate-100" dir="rtl">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-bl from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">הוראות שימוש</h1>
            <p className="text-slate-500 text-sm">מדריך למערכת המשוב</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Overview */}
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-purple-600" />
                מהי המערכת?
              </CardTitle>
            </CardHeader>
            <CardContent className="text-slate-700 space-y-2">
              <p>
                מערכת משוב אגף נשים מאפשרת למתמחים לתעד את הפרוצדורות שהם מבצעים,
                לקבל משוב מהמומחים המדריכים, ולעקוב אחר ההתקדמות שלהם.
              </p>
            </CardContent>
          </Card>

          {/* For Interns */}
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCircle className="w-5 h-5 text-blue-600" />
                למתמחים
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold flex items-center justify-center">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-1">הזנת משוב עצמי</h4>
                    <p className="text-sm text-slate-600">
                      בעמוד "הזנת משוב", בחר את שמך, את המומחה שהדריך אותך, ומלא פרטים על הפרוצדורה שביצעת.
                      דרג את עצמך בקטגוריות השונות והוסף משוב מילולי.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold flex items-center justify-center">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-1">קבלת קוד פרוצדורה</h4>
                    <p className="text-sm text-slate-600">
                      לאחר שליחת המשוב, תקבל קוד ייחודי לפרוצדורה (לדוגמה: #001).
                      העבר קוד זה למומחה שהדריך אותך.
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
                      בפאנל "מתמחים", היכנס לעמוד האישי שלך באמצעות הסיסמה האישית שקיבלת.
                      שם תוכל לראות את כל הפרוצדורות שביצעת, את האחוזים שהשלמת מכל סוג פרוצדורה,
                      ואת המשובים העצמיים שלך.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* For Experts */}
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                למומחים
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-semibold flex items-center justify-center">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-1">כניסה לפאנל מומחים</h4>
                    <p className="text-sm text-slate-600">
                      בפאנל "מומחים", בחר את שמך והיכנס באמצעות הסיסמה (אם נדרשת).
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-semibold flex items-center justify-center">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-1">צפייה במשובים ממתינים</h4>
                    <p className="text-sm text-slate-600">
                      תראה רשימה של פרוצדורות שמתמחים ביצעו ומחכים למשוב שלך.
                      כל פרוצדורה מסומנת עם קוד ייחודי ופרטים על המתמחה והפרוצדורה.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-semibold flex items-center justify-center">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-1">מילוי משוב</h4>
                    <p className="text-sm text-slate-600">
                      לחץ על "מלא משוב", דרג את המתמחה בקטגוריות השונות, והוסף משוב מילולי.
                      לאחר השליחה, המשוב יסומן כהושלם.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* For Admins */}
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-teal-600" />
                למנהלים
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-teal-100 text-teal-700 font-semibold flex items-center justify-center">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-1">פאנל ניהול</h4>
                    <p className="text-sm text-slate-600">
                      צפייה בכל המשובים, סטטיסטיקות כלליות, וניהול פגישות משוב.
                      לחיצה על מתמחה תוביל לעמוד מפורט עם כל המידע שלו.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-teal-100 text-teal-700 font-semibold flex items-center justify-center">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-1">סיסמאות מתמחים</h4>
                    <p className="text-sm text-slate-600">
                      בפאנל הניהול יש כפתור "סיסמאות מתמחים" שמציג טבלה עם הסיסמאות האישיות
                      של כל מתמחה לגישה לעמוד האישי שלו.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Important Notes */}
          <Card className="border-2 border-amber-200 bg-amber-50">
            <CardHeader>
              <CardTitle className="text-amber-800">הערות חשובות</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-amber-800">
              <p>• כל מתמחה מקבל סיסמה אישית לגישה לעמוד האישי שלו בפאנל המתמחים</p>
              <p>• קוד הפרוצדורה חייב להיות מועבר למומחה כדי שיוכל למצוא ולמלא את המשוב</p>
              <p>• המערכת עוקבת אחר ההתקדמות של כל מתמחה לפי מפתח הפרוצדורות הנדרש</p>
              <p>• ניתן לראות את האחוזים שהושלמו בכל קטגוריה (OB, GYN, IVF, ONCO, כללי)</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}