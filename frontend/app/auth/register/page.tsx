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
} from '@mui/icons-material'
import { useAuth } from '@/lib/contexts/AuthContext'
import { RegisterData } from '@/types'

// バリデーションスキーマ
const schema = yup.object({
    username: yup
        .string()
        .min(3, 'ユーザー名は3文字以上で入力してください')
        .max(150, 'ユーザー名は150文字以下で入力してください')
        .matches(/^[a-zA-Z0-9_]+$/, 'ユーザー名には英数字とアンダースコアのみ使用できます')
        .required('ユーザー名は必須です'),
    email: yup
        .string()
        .email('有効なメールアドレスを入力してください')
        .required('メールアドレスは必須です'),
    password: yup
        .string()
        .min(8, 'パスワードは8文字以上で入力してください')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'パスワードには小文字、大文字、数字を含める必要があります')
        .required('パスワードは必須です'),
    password_confirm: yup
        .string()
        .oneOf([yup.ref('password')], 'パスワードが一致しません')
        .required('パスワード確認は必須です'),
})

export default function RegisterPage() {
    const router = useRouter()
    const { register: registerUser, isAuthenticated, isLoading, error, clearError } = useAuth()
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)


    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<RegisterData>({
        resolver: yupResolver(schema),
    })

    // 既にログイン済みの場合はダッシュボードにリダイレクト
    useEffect(() => {
        if (isAuthenticated && !isLoading) {
            router.replace('/dashboard')
        }
    }, [isAuthenticated, isLoading, router])

    // エラーをクリア
    useEffect(() => {
        return () => {
            clearError()
        }
    }, [clearError])

    const onSubmit = async (data: RegisterData) => {
        try {
            await registerUser(data)
            router.push('/dashboard')
        } catch (error) {
            // エラーはコンテキストで管理されている
        }
    }

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword)
    }

    const toggleConfirmPasswordVisibility = () => {
        setShowConfirmPassword(!showConfirmPassword)
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
                                新規登録
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                新しいアカウントを作成してください
                            </Typography>
                        </Box>

                        {/* エラーメッセージ */}
                        {error && (
                            <Alert severity="error" sx={{ mb: 3 }} onClose={clearError}>
                                {error}
                            </Alert>
                        )}

                        {/* 登録フォーム */}
                        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                            <TextField
                                {...register('username')}
                                fullWidth
                                label="ユーザー名"
                                autoComplete="username"
                                error={!!errors.username}
                                helperText={errors.username?.message}
                                sx={{ mb: 2 }}
                            />

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
                                autoComplete="new-password"
                                error={!!errors.password}
                                helperText={errors.password?.message}
                                sx={{ mb: 2 }}
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

                            <TextField
                                {...register('password_confirm')}
                                fullWidth
                                label="パスワード確認"
                                type={showConfirmPassword ? 'text' : 'password'}
                                autoComplete="new-password"
                                error={!!errors.password_confirm}
                                helperText={errors.password_confirm?.message}
                                sx={{ mb: 3 }}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                aria-label="toggle confirm password visibility"
                                                onClick={toggleConfirmPasswordVisibility}
                                                edge="end"
                                            >
                                                {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
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
                                disabled={isSubmitting}
                                sx={{ mb: 2 }}
                            >
                                {isSubmitting ? (
                                    <CircularProgress size={24} />
                                ) : (
                                    'アカウント作成'
                                )}
                            </Button>
                        </Box>



                        {/* ログインリンク */}
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary">
                                既にアカウントをお持ちの場合{' '}
                                <Link href="/auth/login" style={{ textDecoration: 'none' }}>
                                    <Typography
                                        component="span"
                                        variant="body2"
                                        color="primary"
                                        sx={{ fontWeight: 600 }}
                                    >
                                        ログイン
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