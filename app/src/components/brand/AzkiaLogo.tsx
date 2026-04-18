// BRAND-APPROVED: Azkia official logo — sourced from corporate/brand/01-logo/

interface AzkiaLogoProps {
  variant?: 'white' | 'dark';
  markSize?: number;
  className?: string;
}

function AzkiaMark({ fill, accentFill, size }: { fill: string; accentFill: string; size: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 120 120"
      width={size}
      height={size}
      aria-hidden="true"
    >
      <g fill={fill}>
        <path d="M60 8 L68 28 Q72 36 68 44 L60 54 L52 44 Q48 36 52 28 Z"/>
        <path d="M96.8 23.2 L90.5 44.3 Q87.6 52.7 79.5 55.5 L65.7 60.3 L62.9 48.7 Q61.1 40.6 67.1 34.6 Z"/>
        <path d="M112 60 L92 68 Q84 72 76 68 L66 60 L76 52 Q84 48 92 52 Z"/>
        <path d="M96.8 96.8 L75.7 90.5 Q67.3 87.6 64.5 79.5 L59.7 65.7 L71.3 62.9 Q79.4 61.1 85.4 67.1 Z"/>
        <path d="M60 112 L52 92 Q48 84 52 76 L60 66 L68 76 Q72 84 68 92 Z"/>
        <path d="M23.2 96.8 L29.5 75.7 Q32.4 67.3 40.5 64.5 L54.3 59.7 L57.1 71.3 Q58.9 79.4 52.9 85.4 Z"/>
        <path d="M8 60 L28 52 Q36 48 44 52 L54 60 L44 68 Q36 72 28 68 Z"/>
        <path d="M23.2 23.2 L44.3 29.5 Q52.7 32.4 55.5 40.5 L60.3 54.3 L48.7 57.1 Q40.6 58.9 34.6 52.9 Z"/>
        <circle cx="60" cy="60" r="7" fill={accentFill}/>
      </g>
    </svg>
  );
}

export function AzkiaLogo({ variant = 'white', markSize = 32, className }: AzkiaLogoProps) {
  const fill = variant === 'white' ? '#FFFFFF' : '#0B1F3A'; // BRAND-APPROVED: Azkia corporate colors from official SVG source
  const accentFill = variant === 'white' ? 'rgba(255,255,255,0.75)' : '#C9A24B'; // BRAND-APPROVED: Azkia gold accent from corporate identity
  const textColor = variant === 'white' ? 'text-white' : 'text-[#0B1F3A]'; // BRAND-APPROVED

  const fontSize = Math.round(markSize * 0.45);

  return (
    <div
      className={`flex items-center gap-2 ${className ?? ''}`}
      role="img"
      aria-label="أذكياء للبرمجيات — Azkia"
    >
      {/* AZKIA — Latin */}
      <span
        className={`font-bold tracking-widest ${textColor}`}
        style={{ fontSize, fontFamily: 'inherit', letterSpacing: '0.12em' }}
      >
        AZKIA
      </span>

      {/* Separator */}
      <span className={`opacity-30 ${textColor}`} style={{ fontSize: fontSize * 0.7 }}>|</span>

      {/* Mark */}
      <AzkiaMark fill={fill} accentFill={accentFill} size={markSize} />

      {/* Separator */}
      <span className={`opacity-30 ${textColor}`} style={{ fontSize: fontSize * 0.7 }}>|</span>

      {/* أذكياء للبرمجيات — Arabic */}
      <span
        className={`font-medium ${textColor}`}
        style={{ fontSize, fontFamily: 'inherit' }}
        dir="rtl"
      >
        أذكياء للبرمجيات
      </span>
    </div>
  );
}
