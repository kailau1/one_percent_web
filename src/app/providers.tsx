import { QueryClientProvider, type QueryClient } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { Toaster } from 'sonner'
import { createQueryClient } from '@/api/queryClient'
import { AuthProvider } from '@/features/auth/AuthProvider'
import { ThemeProvider } from '@/lib/theme'
import { useTheme } from '@/lib/useTheme'

function ThemedToaster() {
  const { theme } = useTheme()
  return <Toaster theme={theme} position="bottom-center" closeButton />
}

/** Everything the pages rely on, in one place. Tests wrap components in the same providers. */
export function Providers({ children, queryClient }: { children: ReactNode; queryClient?: QueryClient }) {
  const [client] = useState(() => queryClient ?? createQueryClient())
  return (
    <ThemeProvider>
      <QueryClientProvider client={client}>
        <AuthProvider>{children}</AuthProvider>
        <ThemedToaster />
      </QueryClientProvider>
    </ThemeProvider>
  )
}
