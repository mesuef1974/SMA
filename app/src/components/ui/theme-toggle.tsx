'use client'
import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'
import { useSyncExternalStore } from 'react'
import { Button } from '@/components/ui/button'

// useSyncExternalStore-based mount guard — avoids the react-hooks/set-state-in-effect lint rule
// while preventing hydration mismatch (server snapshot = false, client snapshot = true).
function useIsMounted() {
  return useSyncExternalStore(
    () => () => {},          // subscribe: no-op (nothing to subscribe to)
    () => true,              // getSnapshot (client): mounted
    () => false,             // getServerSnapshot: not mounted
  )
}

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme()
  const mounted = useIsMounted()

  if (!mounted) return <div className="w-9 h-9" aria-hidden="true" /> // SSR placeholder — avoid hydration mismatch

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      aria-label={resolvedTheme === 'dark' ? 'تفعيل الوضع النهاري' : 'تفعيل الوضع الليلي'}
    >
      {resolvedTheme === 'dark'
        ? <Sun className="h-5 w-5" />
        : <Moon className="h-5 w-5" />
      }
    </Button>
  )
}
