import type { ComponentProps } from 'react';

/**
 * Renders content that is visually hidden but remains accessible to screen readers.
 * Use this for skip-nav links, accessible labels, and other a11y content.
 */
export function VisuallyHidden({ children, ...props }: ComponentProps<'span'>) {
  return (
    <span
      {...props}
      style={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: 0,
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        borderWidth: 0,
        ...props.style,
      }}
    >
      {children}
    </span>
  );
}
