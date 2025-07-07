'use client'

import React from 'react'
import { AppRouterCacheProvider } from '@mui/material-nextjs/v13-appRouter'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import theme from '@/theme'
import { AuthProvider } from '@/lib/contexts/AuthContext'

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <AppRouterCacheProvider>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <AuthProvider>
                    {children}
                </AuthProvider>
            </ThemeProvider>
        </AppRouterCacheProvider>
    )
} 