import { AzkiaLogo } from '@/components/brand/AzkiaLogo';

export function DashboardFooter() {
  return (
    <footer className="flex h-10 items-center justify-between border-t border-border/40 bg-background px-6">
      <span className="text-xs text-muted-foreground">
        © ٢٠٢٦ جميع الحقوق محفوظة
      </span>
      <AzkiaLogo variant="dark" markSize={20} />
    </footer>
  );
}
