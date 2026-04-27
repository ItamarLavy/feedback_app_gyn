import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, User, Stethoscope, Lock, Key, ChevronDown, ChevronUp, AlertTriangle, Star, ClipboardList, BarChart2, MessageSquare } from 'lucide-react';

const Section = ({ icon: Icon, title, color, children }) => {
  const [open, setOpen] = useState(true);
  const colors = {
    blue: 'bg-blue-50 border-blue-200 text-blue-900',
    purple: 'bg-purple-50 border-purple-200 text-purple-900',
    amber: 'bg-amber-50 border-amber-200 text-amber-900',
  };
  return (
    <Card className="border-0 shadow-xl mb-6">
      <CardHeader
        className={`${colors[color]} border-b-2 cursor-pointer select-none`}
        onClick={() => setOpen(o => !o)}
      >
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon className="w-6 h-6" />
            {title}
          </div>
          {open ? <ChevronUp className="w-5 h-5 opacity-60" /> : <ChevronDown className="w-5 h-5 opacity-60" />}
        </CardTitle>
      </CardHeader>
      {open && <CardContent className="p-6">{children}</CardContent>}
    </Card>
  );
};

const Step = ({ num, color, icon: Icon, title, children }) => {
  const colors = {
    blue: 'bg-blue-100 text-blue-700',
    purple: 'bg-purple-100 text-purple-700',
  };
  return (
    <div className="flex gap-4">
      <div className={`flex-shrink-0 w-9 h-9 rounded-full ${colors[color]} font-bold text-base flex items-center justify-center shadow-sm`}>
        {num}
      </div>
      <div className="flex-1">
        <h4 className="font-semibold text-slate-800 mb-1 flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-slate-500" />}
          {title}
        </h4>
        <div className="text-sm text-slate-600 leading-relaxed space-y-1">{children}</div>
      </div>
    </div>
  );
};

export default function Instructions() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-slate-100" dir="rtl">
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-bl from-amber-500 to-amber-600 shadow-lg mb-4">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">הוראות שימוש</h1>
          <p className="text-slate-500 text-base">מדריך מפורט למערכת המשוב – אגף נשים, הדסה</p>
        </div>

        {/* מתמחים */}
        <Section icon={User} title="למתמחים" color="blue">
          <div className="space-y-7">
            <Step num="1" color="blue" icon={Key} title="כניסה לפרופיל האישי">
              <p>גש ללשונית <strong>מתמחים</strong> בסרגל הניווט העליון.</p>
              <p>בחר את שמך מהרשימה ← הזן את <strong>הסיסמה האישית שלך</strong> (5 תווים: אותיות אנגלית קטנות ומספרים).</p>
              <p className="text-slate-400 text-xs">הסיסמה הראשונית ניתנת על ידי המנהל. ניתן לשנות אותה בכל עת מהעמוד האישי.</p>
            </Step>

            <Step num="2" color="blue" icon={ClipboardList} title="הגשת בקשת משוב לאחר פרוצדורה">
              <p>לאחר ביצוע פרוצדורה, לחץ על <strong>"בקש משוב חדש"</strong> בעמוד האישי שלך.</p>
              <p>מלא את הפרטים הבאים:</p>
              <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-600">
                <li><strong>מומחה מדריך</strong> – מי ליווה אותך בפרוצדורה</li>
                <li><strong>קטגוריה</strong> – OB / GYN / IVF / ONCO / כללי</li>
                <li><strong>סוג הפרוצדורה</strong> – מהרשימה הנפתחת</li>
                <li><strong>תאריך ביצוע</strong></li>
                <li><strong>דירוג עצמי</strong> – ידע, מיומנות קלינית, תקשורת, עצמאות</li>
                <li><strong>משוב מילולי עצמי</strong> – תיאור קצר של הביצוע</li>
              </ul>
              <p className="mt-1">לאחר שליחה, <strong>תקבל מספר סידורי</strong> ותישלח התראה אוטומטית למומחה.</p>
            </Step>

            <Step num="3" color="blue" icon={Star} title="מעקב נקודות והתקדמות">
              <p>על כל בקשת משוב שתגיש תקבל <strong>נקודות</strong> המוצגות בפינה העליונה של המסך.</p>
              <p>בעמוד האישי תוכל לראות:</p>
              <ul className="list-disc list-inside mt-1 space-y-0.5">
                <li>אחוז השלמה לכל קטגוריה ופרוצדורה</li>
                <li>היסטוריית כל הפרוצדורות שביצעת</li>
                <li>סטטוס כל משוב (ממתין / הושלם)</li>
                <li>המשובים שקיבלת מהמומחים לאחר מילויים</li>
              </ul>
            </Step>

            <Step num="4" color="blue" icon={BarChart2} title="הזנה ידנית (תקופת פיילוט בלבד)">
              <p>ניתן להזין ידנית פרוצדורות שבוצעו <strong>לפני השקת המערכת</strong>, ללא משוב מומחה.</p>
              <p>פרוצדורות אלה יחושבו לקידמה הכוללת שלך אך יוצגו <span className="font-medium text-slate-500">באפור</span> – ללא דירוג.</p>
              <p className="text-xs text-slate-400 mt-1">⚠ אפשרות זו תוסר בסוף תקופת הפיילוט.</p>
            </Step>
          </div>
        </Section>

        {/* מומחים */}
        <Section icon={Stethoscope} title="למומחים" color="purple">
          <div className="space-y-7">
            <Step num="1" color="purple" icon={Key} title="כניסה לפרופיל האישי">
              <p>גש ללשונית <strong>מומחים</strong> בסרגל הניווט העליון.</p>
              <p>בחר את שמך מהרשימה ← הזן את <strong>הסיסמה האישית שלך</strong>.</p>
              <p>המערכת תציג מיד כמה משובים ממתינים לטיפולך.</p>
            </Step>

            <Step num="2" color="purple" icon={MessageSquare} title="מילוי משוב ממתין">
              <p>בעמוד האישי תראה שני לשוניות: <strong>ממתינים למילוי</strong> ו<strong>הושלמו</strong>.</p>
              <p>לחץ על משוב ממתין כדי לפתוח אותו. תוכל לראות את:</p>
              <ul className="list-disc list-inside mt-1 space-y-0.5">
                <li>פרטי הפרוצדורה שדיווח עליה המתמחה</li>
                <li>הדירוג העצמי והמשוב המילולי שלו/ה</li>
              </ul>
              <p className="mt-1">לאחר מכן מלא את <strong>הדירוג שלך</strong> (ידע, מיומנות, תקשורת, עצמאות, מקצועיות) ואת <strong>המשוב המילולי</strong> שלך ולחץ <strong>"שמור משוב"</strong>.</p>
              <p className="text-xs text-slate-400 mt-1">💡 המתמחה מקבל התראה ונקודות ברגע שתסיים למלא.</p>
            </Step>

            <Step num="3" color="purple" icon={BarChart2} title="פגישות מנטורינג">
              <p>אם תוזמנת לפגישת מנטורינג עם מתמחה, תראה אותה בעמוד האישי שלך תחת <strong>"פגישות מנטורינג"</strong>.</p>
              <p>תזכורת תישלח אליך <strong>יומיים לפני</strong> הפגישה ו<strong>בבוקר יום הפגישה</strong>.</p>
            </Step>
          </div>
        </Section>

        {/* הערות חשובות */}
        <Card className="border-2 border-amber-300 bg-amber-50 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-amber-900">
              <Lock className="w-6 h-6" />
              סיסמאות ואבטחה
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4 text-sm text-amber-900">
              <li className="flex items-start gap-2">
                <Key className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>סיסמה ראשונית:</strong> כל מתמחה ומומחה מקבל סיסמה ראשונית מהמנהל (5 תווים: אותיות אנגלית קטנות ומספרים בלבד).
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Key className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>שינוי סיסמה:</strong> בכל עמוד אישי (מתמחה/מומחה) מופיעה אפשרות <strong>"שינוי סיסמה"</strong>. מומלץ לשנות את הסיסמה הראשונית בכניסה הראשונה.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
                <span>
                  <strong>שכחת סיסמה?</strong> אין שחזור עצמי. יש לפנות למנהל שיוכל לאפס/לצפות בסיסמה הנוכחית דרך לוח הניהול.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
                <span>
                  <strong>שמור את הסיסמה בסוד!</strong> הסיסמה היא אישית ומזהה אותך במערכת – אל תשתף אותה עם אחרים.
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}