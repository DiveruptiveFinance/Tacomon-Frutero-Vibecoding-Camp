'use client'

import { PrivyProvider } from '@privy-io/react-auth'
import { ThemeProvider } from '@/components/theme-provider'
import { SalsaProvider } from '@/hooks/use-salsa'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || 'cmkyyrsbj04bck40bidlscndo'}
      config={{
        loginMethods: ['wallet', 'google', 'email'],
        appearance: {
          theme: 'light',
          accentColor: '#d4520a',
          logo: '/icon.svg',
          walletList: ['metamask', 'rainbow', 'coinbase_wallet', 'wallet_connect'],
        },
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
      }}
    >
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} storageKey="tacomon-theme">
        <SalsaProvider>
          {children}
        </SalsaProvider>
      </ThemeProvider>
    </PrivyProvider>
  )
}
