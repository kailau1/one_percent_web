import { WifiOff } from 'lucide-react'
import { useOnline } from '@/lib/useOnline'

/** A strip across the top while the browser is offline. Anything typed stays on screen. */
export function OfflineBanner() {
  const online = useOnline()
  if (online) return null
  return (
    <div role="status" className="flex items-center justify-center gap-2 border-b border-warning-line bg-warning-wash px-4 py-2 text-sm">
      <WifiOff aria-hidden className="size-4" />
      You're offline. Changes can't be saved until you reconnect.
    </div>
  )
}
