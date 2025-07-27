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
    IconButton,
} from '@mui/material'
import {
    ArrowBack,
    Email,
} from '@mui/icons-material'
import { useAuth } from '@/lib/contexts/AuthContext'
import { requestPasswordReset } from '@/lib/services/auth'

// バリデーションスキーマ
const schema = yup.object({
    email: yup
        .string()
        .email('有効なメールアドレスを入力してください')
        .required('メールアドレスは必須です'),
})

interface FormData {
    email: string
}

export default function ForgotPasswordPage() {
    const router = useRouter()
    const { isAuthenticated, isLoading } = useAuth()
    const [submitLoading, setSubmitLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [resetLink, setResetLink] = useState<string | null>(null)

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<FormData>({
        resolver: yupResolver(schema),
    })

    // 既にログイン済みの場合はダッシュボードにリダイレクト
    useEffect(() => {
        if (isAuthenticated && !isLoading) {
            router.replace('/dashboard')
        }
    }, [isAuthenticated, isLoading, router])

    const onSubmit = async (data: FormData) => {
        try {
            setSubmitLoading(true)
            setError(null)
            setSuccess(null)

            const response = await requestPasswordReset(data.email)
            setSuccess(response.message)

            // デバッグ用のリセットリンクがある場合は表示
            if (response.reset_link) {
                setResetLink(response.reset_link)
            }

        } catch (error: any) {
            console.error('Password reset request error:', error)
            setError(
                error.response?.data?.email?.[0] ||
                error.response?.data?.message ||
                'パスワードリセットの要求でエラーが発生しました'
            )
        } finally {
            setSubmitLoading(false)
        }
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
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                            <IconButton
                                component={Link}
                                href="/auth/login"
                                sx={{ mr: 1 }}
                            >
                                <ArrowBack />
                            </IconButton>
                            <Typography variant="h4" component="h1">
                                パスワードを忘れた場合
                            </Typography>
                        </Box>

                        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                            登録されているメールアドレスを入力してください。<br />
                            パスワードリセット用のリンクをお送りします。
                        </Typography>

                        {/* エラー・成功メッセージ */}
                        {error && (
                            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                                {error}
                            </Alert>
                        )}

                        {success && (
                            <Alert severity="success" sx={{ mb: 3 }}>
                                {success}
                            </Alert>
                        )}

                        {/* デバッグ用: リセットリンク表示 */}
                        {resetLink && (
                            <Alert severity="info" sx={{ mb: 3 }}>
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                    <strong>開発環境用リンク:</strong>
                                </Typography>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => window.open(resetLink, '_blank')}
                                >
                                    パスワードリセットページを開く
                                </Button>
                            </Alert>
                        )}

                        {!success && (
                            <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                                <TextField
                                    {...register('email')}
                                    fullWidth
                                    label="メールアドレス"
                                    type="email"
                                    autoComplete="email"
                                    error={!!errors.email}
                                    helperText={errors.email?.message}
                                    sx={{ mb: 3 }}
                                    InputProps={{
                                        startAdornment: (
                                            <Email sx={{ mr: 1, color: 'text.secondary' }} />
                                        ),
                                    }}
                                />

                                <Button
                                    type="submit"
                                    fullWidth
                                    variant="contained"
                                    size="large"
                                    disabled={submitLoading}
                                    sx={{ mb: 3 }}
                                >
                                    {submitLoading ? (
                                        <>
                                            <CircularProgress size={20} sx={{ mr: 1 }} />
                                            送信中...
                                        </>
                                    ) : (
                                        'リセットリンクを送信'
                                    )}
                                </Button>
                            </Box>
                        )}

                        {/* ナビゲーションリンク */}
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary">
                                パスワードを思い出した場合{' '}
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

                        {success && (
                            <Box sx={{ textAlign: 'center', mt: 2 }}>
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
                        )}
                    </CardContent>
                </Card>
            </Box>
        </Container>
    )
} 