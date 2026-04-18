/**
 * Brand demo page — for Playwright visual snapshots.
 *
 * Renders every token/component in a deterministic layout so regressions
 * become pixel diffs. Not a Storybook replacement — just an SSR canvas.
 *
 * NOTE: this route is intentionally outside `[locale]` so snapshots do not
 * depend on next-intl message loading.
 */
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

export const dynamic = "force-static";

const BUTTON_VARIANTS = ["default", "secondary", "outline", "ghost", "destructive"] as const;
const BUTTON_SIZES = ["sm", "default", "lg"] as const;
const BADGE_VARIANTS = ["default", "secondary", "outline", "destructive", "xp", "success", "warning", "info"] as const;
const ALERT_VARIANTS = ["info", "success", "warning", "error"] as const;
const CARD_VARIANTS = ["default", "elevated", "bordered", "interactive"] as const;

// swatch tokens (CSS custom props defined in globals.css)
const SWATCHES: Record<string, string[]> = {
  najm: ["--sma-najm-50", "--sma-najm-100", "--sma-najm-300", "--sma-najm-500", "--sma-najm-700", "--sma-najm-900"],
  qamar: ["--sma-qamar-50", "--sma-qamar-100", "--sma-qamar-300", "--sma-qamar-500", "--sma-qamar-700", "--sma-qamar-900"],
  sahla: ["--sma-sahla-50", "--sma-sahla-100", "--sma-sahla-300", "--sma-sahla-500", "--sma-sahla-700", "--sma-sahla-900"],
  ink: ["--sma-ink-50", "--sma-ink-100", "--sma-ink-300", "--sma-ink-500", "--sma-ink-700", "--sma-ink-900"],
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 rounded-lg border border-border p-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="flex flex-wrap items-start gap-3">{children}</div>
    </section>
  );
}

function Swatch({ token }: { token: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="h-10 w-10 rounded border border-border"
        style={{ background: `var(${token})` }}
      />
      <code className="text-[10px]">{token.replace("--sma-", "")}</code>
    </div>
  );
}

export default function BrandDemoPage() {
  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold">Brand Demo</h1>
        <p className="text-sm text-muted-foreground">
          Visual snapshot canvas — all components in all states. Toggle theme/dir via DOM in tests.
        </p>
      </header>

      <Section title="Logo">
        <Logo variant="color" size={48} />
        <Logo variant="mono-black" size={48} />
        <Logo variant="mono-white" size={48} />
        <Logo variant="solid" size={48} />
      </Section>

      <Section title="Typography">
        <div className="w-full space-y-2">
          <p className="text-5xl font-bold">Hero heading</p>
          <h1 className="text-4xl font-bold">Heading 1</h1>
          <h2 className="text-3xl font-semibold">Heading 2</h2>
          <h3 className="text-2xl font-semibold">Heading 3</h3>
          <h4 className="text-xl font-medium">Heading 4</h4>
          <p className="text-base">Body text — the quick brown fox jumps over the lazy dog.</p>
          <p className="text-xs text-muted-foreground">Caption — metadata, hints.</p>
        </div>
      </Section>

      <Section title="Buttons">
        {BUTTON_SIZES.map((size) => (
          <div key={size} className="flex w-full flex-wrap gap-2">
            {BUTTON_VARIANTS.map((variant) => (
              <Button key={`${size}-${variant}`} variant={variant} size={size}>
                {variant}/{size}
              </Button>
            ))}
          </div>
        ))}
      </Section>

      <Section title="Input">
        <Input placeholder="default" className="max-w-xs" />
        <Input placeholder="focused" autoFocus className="max-w-xs" />
        <Input placeholder="error" aria-invalid className="max-w-xs" />
        <Input placeholder="disabled" disabled className="max-w-xs" />
      </Section>

      <Section title="Cards">
        {CARD_VARIANTS.map((v) => (
          <Card key={v} variant={v} className="w-64">
            <CardHeader>
              <CardTitle>Card {v}</CardTitle>
              <CardDescription>variant={v}</CardDescription>
            </CardHeader>
            <CardContent>Sample body content.</CardContent>
          </Card>
        ))}
      </Section>

      <Section title="Badges">
        {BADGE_VARIANTS.map((v) => (
          <Badge key={v} variant={v}>{v}</Badge>
        ))}
      </Section>

      <Section title="Alerts">
        <div className="w-full space-y-2">
          {ALERT_VARIANTS.map((v) => (
            <Alert key={v} variant={v}>
              <AlertTitle>{v} alert</AlertTitle>
              <AlertDescription>Description for {v} alert.</AlertDescription>
            </Alert>
          ))}
        </div>
      </Section>

      <Section title="Toast (mock)">
        <div
          role="status"
          className="pointer-events-auto flex w-80 items-start gap-3 rounded-lg border border-border bg-card p-3 shadow-md"
        >
          <div className="flex-1">
            <p className="text-sm font-medium">Saved</p>
            <p className="text-xs text-muted-foreground">Your changes have been saved.</p>
          </div>
        </div>
      </Section>

      <Section title="Color palette">
        <div className="w-full space-y-3">
          {Object.entries(SWATCHES).map(([name, tokens]) => (
            <div key={name} className="space-y-1">
              <p className="text-xs font-semibold uppercase">{name}</p>
              <div className="flex flex-wrap gap-2">
                {tokens.map((t) => <Swatch key={t} token={t} />)}
              </div>
            </div>
          ))}
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase">medals</p>
            <div className="flex flex-wrap gap-2">
              {["--sma-gold", "--sma-silver", "--sma-bronze"].map((t) => <Swatch key={t} token={t} />)}
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase">teams</p>
            <div className="flex flex-wrap gap-2">
              {["--sma-team-red", "--sma-team-blue", "--sma-team-green", "--sma-team-yellow"].map((t) => <Swatch key={t} token={t} />)}
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase">semantic</p>
            <div className="flex flex-wrap gap-2">
              {["--success", "--warning", "--destructive", "--info"].map((t) => <Swatch key={t} token={t} />)}
            </div>
          </div>
        </div>
      </Section>

      <section dir="rtl" className="space-y-3 rounded-lg border border-border p-4">
        <h2 className="text-lg font-semibold">RTL mini-demo</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Button>ابدأ الآن</Button>
          <Badge variant="xp">+١٢ نقطة</Badge>
          <Alert variant="info" className="flex-1">
            <AlertTitle>ملاحظة</AlertTitle>
            <AlertDescription>هذا نصّ تجريبي باللغة العربية لاختبار اتجاه RTL.</AlertDescription>
          </Alert>
        </div>
      </section>
    </main>
  );
}
