'use client'

import React from 'react'
import { AppRouterCacheProvider } from '@mui/material-nextjs/v13-appRouter'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { SWRConfig } from 'swr'
import theme from '@/theme'
import { AuthProvider } from '@/lib/contexts/AuthContext'

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <AppRouterCacheProvider>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <SWRConfig
                    value={{
                        refreshInterval: 60000, // 60秒ごとにリフレッシュ
                        revalidateOnFocus: false,
                        revalidateOnReconnect: true,
                        shouldRetryOnError: false,
                        errorRetryInterval: 5000,
                        errorRetryCount: 3,
                        dedupingInterval: 2000,
                    }}
                >
                    <AuthProvider>
                        {children}
                    </AuthProvider>
                </SWRConfig>
            </ThemeProvider>
        </AppRouterCacheProvider>
    )
} 