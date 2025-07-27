'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
    InputAdornment,
} from '@mui/material'
import {
    ArrowBack,
    Visibility,
    VisibilityOff,
    Lock,
} from '@mui/icons-material'
import { useAuth } from '@/lib/contexts/AuthContext'
import { confirmPasswordReset } from '@/lib/services/auth'

// バリデーションスキーマ
const schema = yup.object({
    new_password: yup
        .string()
        .min(8, 'パスワードは8文字以上で入力してください')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'パスワードには小文字、大文字、数字を含める必要があります')
        .required('新しいパスワードは必須です'),
    new_password_confirm: yup
        .string()
        .oneOf([yup.ref('new_password')], 'パスワードが一致しません')
        .required('パスワード確認は必須です'),
})

interface FormData {
    new_password: string
    new_password_confirm: string
}

export default function ResetPasswordPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { isAuthenticated, isLoading } = useAuth()
    const [submitLoading, setSubmitLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [uid, setUid] = useState<string | null>(null)
    const [token, setToken] = useState<string | null>(null)
    const [paramsError, setParamsError] = useState<string | null>(null)

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<FormData>({
        resolver: yupResolver(schema),
    })

    // URLパラメータからuidとtokenを取得
    useEffect(() => {
        const uidParam = searchParams.get('uid')
        const tokenParam = searchParams.get('token')

        if (!uidParam || !tokenParam) {
            setParamsError('無効なリセットリンクです。正しいリンクからアクセスしてください。')
        } else {
            setUid(uidParam)
            setToken(tokenParam)
        }
    }, [searchParams])

    // 既にログイン済みの場合はダッシュボードにリダイレクト
    useEffect(() => {
        if (isAuthenticated && !isLoading) {
            router.replace('/dashboard')
        }
    }, [isAuthenticated, isLoading, router])

    const onSubmit = async (data: FormData) => {
        if (!uid || !token) {
            setError('リセット情報が不足しています。')
            return
        }

        try {
            setSubmitLoading(true)
            setError(null)

            await confirmPasswordReset({
                uid,
                token,
                new_password: data.new_password,
                new_password_confirm: data.new_password_confirm,
            })

            setSuccess('パスワードが正常にリセットされました。')

            // 3秒後にログインページにリダイレクト
            setTimeout(() => {
                router.push('/auth/login')
            }, 3000)

        } catch (error: any) {
            console.error('Password reset confirm error:', error)

            if (error.response?.data?.error) {
                setError(error.response.data.error)
            } else if (error.response?.data?.new_password) {
                setError(`パスワードエラー: ${error.response.data.new_password.join(', ')}`)
            } else if (error.response?.data?.message) {
                setError(error.response.data.message)
            } else {
                setError('パスワードリセットでエラーが発生しました')
            }
        } finally {
            setSubmitLoading(false)
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
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                            <IconButton
                                component={Link}
                                href="/auth/login"
                                sx={{ mr: 1 }}
                            >
                                <ArrowBack />
                            </IconButton>
                            <Typography variant="h4" component="h1">
                                パスワードリセット
                            </Typography>
                        </Box>

                        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                            新しいパスワードを入力してください。
                        </Typography>

                        {/* エラー・成功メッセージ */}
                        {(error || paramsError) && (
                            <Alert severity="error" sx={{ mb: 3 }} onClose={() => {
                                setError(null)
                                setParamsError(null)
                            }}>
                                {error || paramsError}
                            </Alert>
                        )}

                        {success && (
                            <Alert severity="success" sx={{ mb: 3 }}>
                                {success}
                                <Typography variant="body2" sx={{ mt: 1 }}>
                                    3秒後にログインページに移動します...
                                </Typography>
                            </Alert>
                        )}

                        {/* パラメータエラーまたは成功時はフォームを非表示 */}
                        {!paramsError && !success && (
                            <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                                <TextField
                                    {...register('new_password')}
                                    fullWidth
                                    label="新しいパスワード"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="new-password"
                                    error={!!errors.new_password}
                                    helperText={errors.new_password?.message}
                                    sx={{ mb: 2 }}
                                    InputProps={{
                                        startAdornment: (
                                            <Lock sx={{ mr: 1, color: 'text.secondary' }} />
                                        ),
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
                                    {...register('new_password_confirm')}
                                    fullWidth
                                    label="新しいパスワード（確認）"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    autoComplete="new-password"
                                    error={!!errors.new_password_confirm}
                                    helperText={errors.new_password_confirm?.message}
                                    sx={{ mb: 3 }}
                                    InputProps={{
                                        startAdornment: (
                                            <Lock sx={{ mr: 1, color: 'text.secondary' }} />
                                        ),
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
                                    disabled={submitLoading}
                                    sx={{ mb: 3 }}
                                >
                                    {submitLoading ? (
                                        <>
                                            <CircularProgress size={20} sx={{ mr: 1 }} />
                                            リセット中...
                                        </>
                                    ) : (
                                        'パスワードをリセット'
                                    )}
                                </Button>
                            </Box>
                        )}

                        {/* ナビゲーションリンク */}
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary">
                                ログインページに戻る{' '}
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

                        {paramsError && (
                            <Box sx={{ textAlign: 'center', mt: 2 }}>
                                <Typography variant="body2" color="text.secondary">
                                    パスワードをお忘れの場合{' '}
                                    <Link href="/auth/forgot-password" style={{ textDecoration: 'none' }}>
                                        <Typography
                                            component="span"
                                            variant="body2"
                                            color="primary"
                                            sx={{ fontWeight: 600 }}
                                        >
                                            パスワードリセット
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