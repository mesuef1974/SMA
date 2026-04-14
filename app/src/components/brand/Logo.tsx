/**
 * SMA — Square Mīm Logo
 *
 * Arabic letter "م" reimagined: the loop becomes a perfect square
 * (a geometric pun on squares / root / coordinate grid).
 * Two shapes. No fills. Monochrome-safe at any size.
 *
 * Brand assets source: D:\SMA\assets\brand\logo\
 *
 * Variants:
 *   - color       → Najm Indigo (#2D2B7E) stroke on transparent
 *   - mono-black  → Black stroke — for print
 *   - mono-white  → White stroke — for dark backgrounds (e.g. sidebar)
 *   - solid       → Rounded indigo tile with white mark (app icon / social)
 */

interface LogoProps {
  variant?: 'color' | 'mono-black' | 'mono-white' | 'solid';
  size?: number;
  className?: string;
}

export function Logo({
  variant = 'color',
  size = 32,
  className,
}: LogoProps) {
  const ariaLabel =
    variant === 'mono-black'
      ? 'SMA mark (black)'
      : variant === 'mono-white'
        ? 'SMA mark (white)'
        : variant === 'solid'
          ? 'SMA mark (solid)'
          : 'SMA mark';

  if (variant === 'solid') {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 120 120"
        width={size}
        height={size}
        role="img"
        aria-label={ariaLabel}
        className={className}
      >
        <title>SMA — Square Mīm mark, solid tile version</title>
        <rect width="120" height="120" rx="24" fill="#2D2B7E" />
        <g
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="11"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="32" y="26" width="48" height="48" rx="6" />
          <path d="M42 74 L42 96" />
        </g>
      </svg>
    );
  }

  const stroke =
    variant === 'mono-black'
      ? '#000000'
      : variant === 'mono-white'
        ? '#FFFFFF'
        : '#2D2B7E';

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 120 120"
      width={size}
      height={size}
      role="img"
      aria-label={ariaLabel}
      className={className}
    >
      <title>SMA — Square Mīm mark</title>
      <g
        fill="none"
        stroke={stroke}
        strokeWidth="11"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="32" y="26" width="48" height="48" rx="6" />
        <path d="M42 74 L42 96" />
      </g>
    </svg>
  );
}
