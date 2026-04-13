'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Lightweight collapsible component (no external dependency).
 * Provides open/close toggle with smooth height transition.
 */

interface CollapsibleContextValue {
  open: boolean;
  toggle: () => void;
}

const CollapsibleContext = React.createContext<CollapsibleContextValue>({
  open: false,
  toggle: () => {},
});

function Collapsible({
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
  className,
  children,
  ...props
}: React.ComponentProps<'div'> & {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const toggle = React.useCallback(() => {
    const next = !open;
    if (!isControlled) setUncontrolledOpen(next);
    onOpenChange?.(next);
  }, [open, isControlled, onOpenChange]);

  return (
    <CollapsibleContext.Provider value={{ open, toggle }}>
      <div data-slot="collapsible" data-state={open ? 'open' : 'closed'} className={className} {...props}>
        {children}
      </div>
    </CollapsibleContext.Provider>
  );
}

function CollapsibleTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<'button'>) {
  const { open, toggle } = React.useContext(CollapsibleContext);
  return (
    <button
      type="button"
      data-slot="collapsible-trigger"
      aria-expanded={open}
      onClick={toggle}
      className={className}
      {...props}
    >
      {children}
    </button>
  );
}

function CollapsibleContent({
  className,
  children,
  ...props
}: React.ComponentProps<'div'>) {
  const { open } = React.useContext(CollapsibleContext);

  if (!open) return null;

  return (
    <div
      data-slot="collapsible-content"
      className={cn('animate-in fade-in-0', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
