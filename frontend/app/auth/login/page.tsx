'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import {
    Box,
    Card,
    CardContent,
    Typography,
    TextField,
    Button,
    Alert,
    CircularProgress,
    Container,
    Divider,
    IconButton,
    InputAdornment,
} from '@mui/material'
import {
    Visibility,
    VisibilityOff,
    Google,
    GitHub,
} from '@mui/icons-material'
import { useAuth } from '@/lib/contexts/AuthContext'
import { LoginData } from '@/types'

// バリデーションスキーマ
const schema = yup.object({
    email: yup
        .string()
        .email('有効なメールアドレスを入力してください')
        .required('メールアドレスは必須です'),
    password: yup
        .string()
        .min(8, 'パスワードは8文字以上で入力してください')
        .required('パスワードは必須です'),
})

export default function LoginPage() {
    const router = useRouter()
    const { login, isAuthenticated, isLoading, error, clearError } = useAuth()
    const [showPassword, setShowPassword] = useState(false)
    const [isLoginSuccessful, setIsLoginSuccessful] = useState(false)

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginData>({
        resolver: yupResolver(schema),
    })

    // 認証状態を監視してリダイレクト
    useEffect(() => {
        if (isAuthenticated && !isLoading) {
            setIsLoginSuccessful(true)
            // ルーターをリフレッシュしてページ状態をクリア
            router.refresh()
            // 少し遅延させてからリダイレクト（確実な遷移のため）
            setTimeout(() => {
                // 複数の遷移方法を試行
                router.push('/dashboard')
                // フォールバック: 直接的な遷移も試行
                setTimeout(() => {
                    if (window.location.pathname !== '/dashboard') {
                        window.location.href = '/dashboard'
                    }
                }, 500)
                // 最終手段: 2秒後にページ全体をリロード
                setTimeout(() => {
                    if (window.location.pathname !== '/dashboard') {
                        console.log('強制リダイレクト実行')
                        window.location.replace('/dashboard')
                    }
                }, 2000)
            }, 1000)
        }
    }, [isAuthenticated, isLoading, router])

    // エラーをクリア
    useEffect(() => {
        return () => {
            clearError()
        }
    }, [clearError])

    const onSubmit = async (data: LoginData) => {
        try {
            await login(data)
            // ログイン成功時の遷移はuseEffectで処理されるため、ここでは何もしない
        } catch (error) {
            // エラーはコンテキストで管理されている
        }
    }

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword)
    }

    if (isLoading) {
        return (
            <Container maxWidth="sm">
                <Box
                    sx={{
                        minHeight: '100vh',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <CircularProgress />
                </Box>
            </Container>
        )
    }

    return (
        <Container maxWidth="sm">
            <Box
                sx={{
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    py: 4,
                }}
            >
                <Card elevation={3}>
                    <CardContent sx={{ p: 4 }}>
                        {/* ヘッダー */}
                        <Box sx={{ textAlign: 'center', mb: 4 }}>
                            <Typography variant="h4" component="h1" gutterBottom>
                                ログイン
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                アカウントにサインインしてください
                            </Typography>
                        </Box>

                        {/* エラーメッセージ・成功メッセージ */}
                        {error && !isLoginSuccessful && (
                            <Alert severity="error" sx={{ mb: 3 }} onClose={clearError}>
                                {error}
                            </Alert>
                        )}

                        {isLoginSuccessful && (
                            <Alert severity="success" sx={{ mb: 3 }}>
                                ログインに成功しました。ダッシュボードに移動中...
                            </Alert>
                        )}

                        {/* ログインフォーム */}
                        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                            <TextField
                                {...register('email')}
                                fullWidth
                                label="メールアドレス"
                                type="email"
                                autoComplete="email"
                                error={!!errors.email}
                                helperText={errors.email?.message}
                                sx={{ mb: 2 }}
                            />

                            <TextField
                                {...register('password')}
                                fullWidth
                                label="パスワード"
                                type={showPassword ? 'text' : 'password'}
                                autoComplete="current-password"
                                error={!!errors.password}
                                helperText={errors.password?.message}
                                sx={{ mb: 3 }}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                aria-label="toggle password visibility"
                                                onClick={togglePasswordVisibility}
                                                edge="end"
                                            >
                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />

                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                size="large"
                                disabled={isSubmitting || isLoginSuccessful || isLoading}
                                sx={{ mb: 2 }}
                            >
                                {isLoginSuccessful ? (
                                    <>
                                        <CircularProgress size={20} sx={{ mr: 1 }} />
                                        ダッシュボードに移動中...
                                    </>
                                ) : isSubmitting ? (
                                    <>
                                        <CircularProgress size={20} sx={{ mr: 1 }} />
                                        ログイン中...
                                    </>
                                ) : (
                                    'ログイン'
                                )}
                            </Button>
                        </Box>

                        {/* パスワードを忘れた場合 */}
                        <Box sx={{ textAlign: 'center', mb: 3 }}>
                            <Link href="/auth/forgot-password" style={{ textDecoration: 'none' }}>
                                <Typography variant="body2" color="primary">
                                    パスワードを忘れた場合
                                </Typography>
                            </Link>
                        </Box>

                        <Divider sx={{ my: 3 }}>
                            <Typography variant="body2" color="text.secondary">
                                または
                            </Typography>
                        </Divider>

                        {/* ソーシャルログイン */}
                        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                            <Button
                                fullWidth
                                variant="outlined"
                                startIcon={<Google />}
                                onClick={() => {
                                    // Google OAuth実装予定
                                    console.log('Google login')
                                }}
                            >
                                Google
                            </Button>
                            <Button
                                fullWidth
                                variant="outlined"
                                startIcon={<GitHub />}
                                onClick={() => {
                                    // GitHub OAuth実装予定
                                    console.log('GitHub login')
                                }}
                            >
                                GitHub
                            </Button>
                        </Box>

                        {/* 新規登録リンク */}
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary">
                                アカウントをお持ちでない場合{' '}
                                <Link href="/auth/register" style={{ textDecoration: 'none' }}>
                                    <Typography
                                        component="span"
                                        variant="body2"
                                        color="primary"
                                        sx={{ fontWeight: 600 }}
                                    >
                                        新規登録
                                    </Typography>
                                </Link>
                            </Typography>
                        </Box>
                    </CardContent>
                </Card>
            </Box>
        </Container>
    )
} 