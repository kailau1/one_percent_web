import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import type { UserProfile } from '@/api/types'
import { habitKeys } from '@/features/habits/hooks'
import { browserTimeZone } from '@/lib/dates'
import { getProfile, setTimeZone } from './api'

export const accountKeys = { profile: ['account', 'profile'] as const }

export function useProfile() {
  return useQuery({ queryKey: accountKeys.profile, queryFn: getProfile, staleTime: 5 * 60_000 })
}

/**
 * Keeps the server's idea of "today" in step with this device: when the profile's time zone
 * differs from the browser's (first visit, or after travelling), it is updated. Habit data is
 * then refetched, since which day a tick belongs to may have changed. Runs quietly: if the server
 * refuses the zone, days are simply counted as before, so there's nothing for the user to fix.
 */
export function useTimeZoneSync() {
  const queryClient = useQueryClient()
  const profile = useProfile()
  const zone = browserTimeZone()
  const { mutate, isIdle } = useMutation({
    mutationFn: setTimeZone,
    onSuccess: (updated) => {
      queryClient.setQueryData<UserProfile>(accountKeys.profile, updated)
      queryClient.invalidateQueries({ queryKey: habitKeys.all })
      queryClient.invalidateQueries({ queryKey: habitKeys.history })
    },
  })
  const serverZone = profile.data?.timeZone

  useEffect(() => {
    // isIdle: one attempt per page load, so a refused zone can't cause a request loop
    if (zone && profile.data && serverZone !== zone && isIdle) mutate(zone)
  }, [zone, profile.data, serverZone, isIdle, mutate])
}
