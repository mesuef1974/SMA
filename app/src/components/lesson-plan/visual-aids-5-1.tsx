'use client';

/**
 * VisualAids51 — Teaching aids for Lesson 5-1: Analyzing Data Displays
 *
 * Displays three interactive charts demonstrating the data representations
 * taught in the lesson: Dot Plot, Box-and-Whisker Plot, and Histogram.
 * All charts use the shared class data set (15 students, scores out of 20).
 */

import DotPlot from '@/components/charts/DotPlot';
import BoxWhiskerPlot from '@/components/charts/BoxWhiskerPlot';
import Histogram from '@/components/charts/Histogram';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function VisualAids51() {
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <span>الوسائل التعليمية — تمثيل البيانات</span>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          درجات 15 طالباً من 20: 12، 12، 13، 14، 14، 14، 15، 15، 15، 16، 16، 17، 17، 18، 18
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Section 1: Dot Plot */}
          <div className="flex flex-col gap-3">
            <h4 className="font-semibold text-sm text-center">التمثيل بالنقاط</h4>
            <div className="flex justify-center overflow-x-auto">
              <DotPlot
                width={480}
                xLabel="الدرجة من 20"
              />
            </div>
            <p className="text-xs text-muted-foreground text-center leading-relaxed">
              يُظهر التمثيل بالنقاط كل قيمة فردية فوق المحور. المنوال (الأكثر تكراراً)
              يظهر بوضوح من خلال أعلى عمود من النقاط.
            </p>
          </div>

          {/* Section 2: Box-and-Whisker Plot */}
          <div className="flex flex-col gap-3">
            <h4 className="font-semibold text-sm text-center">مخطط الصندوق وطرفيه</h4>
            <div className="flex justify-center overflow-x-auto">
              <BoxWhiskerPlot
                width={480}
                min={12}
                q1={14}
                median={15}
                q3={17}
                max={18}
              />
            </div>
            <p className="text-xs text-muted-foreground text-center leading-relaxed">
              الملخص الخماسي: Min=12، Q1=14، الوسيط=15، Q3=17، Max=18.
              الصندوق يمثل 50% من البيانات والمدى الربيعي IQR=3.
            </p>
          </div>

          {/* Section 3: Histogram */}
          <div className="flex flex-col gap-3 md:col-span-2 xl:col-span-1">
            <h4 className="font-semibold text-sm text-center">المدرج التكراري</h4>
            <div className="flex justify-center overflow-x-auto">
              <Histogram
                width={480}
                xLabel="فئات الدرجات"
                yLabel="التكرار"
              />
            </div>
            <p className="text-xs text-muted-foreground text-center leading-relaxed">
              فترات عرضها 2: [12-14) تكرار=3، [14-16) تكرار=6، [16-18) تكرار=4، [18-20] تكرار=2.
              الفترة [14-16) تضم 40% من الطلاب.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
