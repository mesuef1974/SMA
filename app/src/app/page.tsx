import { MathRenderer } from "@/components/math/MathRenderer";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-center gap-10 py-32 px-8">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          محلل الرياضيات الذكي — SMA
        </h1>

        <p className="max-w-xl text-center text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          منصة تعليم الرياضيات بالذكاء الاصطناعي للمرحلة الثانوية في قطر.
          <br />
          معلّمك الخاص يساعدك خطوة بخطوة بطريقة سقراطية.
        </p>

        <div className="rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="mb-4 text-sm font-medium text-zinc-500 dark:text-zinc-400">
            مثال — الصيغة التربيعية:
          </p>
          <div className="flex items-center justify-center text-xl">
            <MathRenderer
              math="x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}"
              display
            />
          </div>
        </div>
      </main>
    </div>
  );
}
