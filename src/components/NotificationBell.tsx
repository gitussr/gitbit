import { useEffect, useRef, useState } from 'react'
import { Bell, BellOff } from 'lucide-react'
import { useNotificationPermission } from '@/hooks/useNotificationPermission'
import { NotificationStatus } from '@/components/NotificationStatus'
import { IconButton } from '@/components/ui/IconButton'
import { Dialog } from '@/components/ui/Dialog'

/**
 * Header-wide access point for GitBit Daily notifications (Section 14/27):
 * a bell that reflects the current permission state and opens the same
 * `NotificationStatus` panel used on /daily. Also auto-opens once per
 * visitor on landing, while the state is still undecided — closing it
 * without deciding marks it dismissed so it isn't asked again (mirrors
 * the embedded card's dismiss behavior in `useNotificationPermission`).
 */
export function NotificationBell() {
  const permission = useNotificationPermission()
  const { state, supported, dismissed, dismiss } = permission
  const [open, setOpen] = useState(false)
  const autoPrompted = useRef(false)

  useEffect(() => {
    if (autoPrompted.current || dismissed || state !== 'default') return
    autoPrompted.current = true
    setOpen(true)
  }, [dismissed, state])

  if (!supported) return null

  const close = () => {
    setOpen(false)
    if (state === 'default') dismiss()
  }

  const icon = state === 'granted' || state === 'default' ? <Bell aria-hidden="true" /> : <BellOff aria-hidden="true" />

  return (
    <>
      <IconButton icon={icon} label="GitBit Daily notifications" size="sm" onClick={() => setOpen(true)} />
      <Dialog open={open} onClose={close} title="GitBit Daily notifications">
        <NotificationStatus {...permission} />
      </Dialog>
    </>
  )
}
