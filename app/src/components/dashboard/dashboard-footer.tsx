import { AzkiaLogo } from '@/components/brand/AzkiaLogo';

export function DashboardFooter() {
  return (
    <footer className="flex h-10 items-center justify-between border-t border-border/40 bg-background px-6">
      <span className="text-xs text-muted-foreground">
        © ٢٠٢٦ جميع الحقوق محفوظة
      </span>
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground">بواسطة</span>
        <AzkiaLogo variant="dark" size={64} />
      </div>
    </footer>
  );
}
