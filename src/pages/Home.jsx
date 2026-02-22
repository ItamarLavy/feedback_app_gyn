import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Stethoscope, Notebook, Users, Shield, BookOpen } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-slate-100" dir="rtl">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-bl from-teal-500 to-teal-600 shadow-lg shadow-teal-500/30 mb-6">
            <Stethoscope className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-slate-800 mb-3">
            מערכת משוב אגף נשים
          </h1>
          <p className="text-xl text-teal-700 font-medium mb-2">הדסה הר הצופים</p>
          <p className="text-lg text-slate-600">
            מערכת לניהול ומעקב אחר התקדמות מתמחים
          </p>
        </div>

        {/* Navigation Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          <Link to={createPageUrl('Interns')}>
            <Card className="border-0 shadow-xl hover:shadow-2xl transition-all cursor-pointer group">
              <CardContent className="p-8">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <Notebook className="w-7 h-7 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">פאנל מתמחים</h3>
                    <p className="text-slate-600">
                      כניסה לעמוד אישי, הזנת משוב עצמי ומעקב אחר התקדמות
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to={createPageUrl('Experts')}>
            <Card className="border-0 shadow-xl hover:shadow-2xl transition-all cursor-pointer group">
              <CardContent className="p-8">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                    <Stethoscope className="w-7 h-7 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">פאנל מומחים</h3>
                    <p className="text-slate-600">
                      מילוי משובים על מתמחים וצפייה במשובים שהושלמו
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to={createPageUrl('Admin')}>
            <Card className="border-0 shadow-xl hover:shadow-2xl transition-all cursor-pointer group">
              <CardContent className="p-8">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-teal-100 flex items-center justify-center group-hover:bg-teal-200 transition-colors">
                    <Shield className="w-7 h-7 text-teal-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">פאנל ניהול</h3>
                    <p className="text-slate-600">
                      צפייה בכל המשובים, ניהול מתמחים ומומחים
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to={createPageUrl('Instructions')}>
            <Card className="border-0 shadow-xl hover:shadow-2xl transition-all cursor-pointer group">
              <CardContent className="p-8">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-amber-100 flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                    <BookOpen className="w-7 h-7 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">הוראות שימוש</h3>
                    <p className="text-slate-600">
                      מדריך מפורט לשימוש במערכת
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}