import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { toApiError } from '@/api/client'
import type { UserProfile } from '@/api/types'
import { habitKeys } from '@/features/habits/hooks'
import { browserTimeZone } from '@/lib/dates'
import { useOnline } from '@/lib/useOnline'
import { getProfile, setTimeZone } from './api'

export const accountKeys = { profile: ['account', 'profile'] as const }

export function useProfile() {
  return useQuery({ queryKey: accountKeys.profile, queryFn: getProfile, staleTime: 5 * 60_000 })
}

/**
 * Keeps the server's idea of "today" in step with this device: when the profile's time zone
 * differs from the browser's (first visit, after travelling, or the device's zone changing while
 * the app is open), it is updated, and habit data refetched, since which day a tick belongs to may
 * have changed. The device in use wins, so someone switching between devices in different zones
 * gets the zone of the one in front of them.
 *
 * Each zone is sent once. If the server refuses it (4xx) that's final for this page load: days
 * are just counted as before and there's nothing for the user to fix. A server error is retried
 * once straight away; if the server couldn't be reached, it's tried again when the connection
 * comes back.
 */
export function useTimeZoneSync() {
  const queryClient = useQueryClient()
  const profile = useProfile()
  const zone = browserTimeZone()
  const online = useOnline()
  const attempted = useRef<string | null>(null) // a ref, so StrictMode's double effect can't send twice
  const { mutate } = useMutation({
    mutationFn: setTimeZone,
    retry: (failures, error) => failures < 1 && toApiError(error).kind === 'server',
    onSuccess: (updated) => {
      queryClient.setQueryData<UserProfile>(accountKeys.profile, updated)
      queryClient.invalidateQueries({ queryKey: habitKeys.all })
      queryClient.invalidateQueries({ queryKey: habitKeys.history })
    },
    onError: (error) => {
      if (toApiError(error).kind !== 'badRequest') attempted.current = null
    },
  })
  const serverZone = profile.data?.timeZone

  useEffect(() => {
    if (!online || !zone || !profile.data || serverZone === zone || attempted.current === zone) return
    attempted.current = zone
    mutate(zone)
  }, [online, zone, profile.data, serverZone, mutate])
}
