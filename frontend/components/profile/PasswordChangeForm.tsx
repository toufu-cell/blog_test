'use client'

import React, { useState } from 'react'
import {
    Box,
    Card,
    CardContent,
    CardHeader,
    TextField,
    Button,
    Alert,
    CircularProgress,
    Grid,
    IconButton,
    InputAdornment,
} from '@mui/material'
import {
    Save,
    Cancel,
    Visibility,
    VisibilityOff,
    Lock,
} from '@mui/icons-material'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { authService } from '@/lib/services/auth'

// バリデーションスキーマ
const passwordSchema = yup.object({
    old_password: yup
        .string()
        .required('現在のパスワードは必須です'),
    new_password: yup
        .string()
        .required('新しいパスワードは必須です')
        .min(8, 'パスワードは8文字以上である必要があります')
        .matches(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
            'パスワードは英大文字、英小文字、数字、特殊文字をそれぞれ1文字以上含む必要があります'
        ),
    new_password_confirm: yup
        .string()
        .required('パスワード確認は必須です')
        .oneOf([yup.ref('new_password')], 'パスワードが一致しません'),
})

type PasswordFormData = yup.InferType<typeof passwordSchema>

interface PasswordChangeFormProps {
    onSuccess: () => void
    onCancel: () => void
}

export default function PasswordChangeForm({ onSuccess, onCancel }: PasswordChangeFormProps) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [showPasswords, setShowPasswords] = useState({
        old: false,
        new: false,
        confirm: false,
    })

    const {
        control,
        handleSubmit,
        formState: { errors, isDirty },
        reset,
    } = useForm<PasswordFormData>({
        resolver: yupResolver(passwordSchema),
        defaultValues: {
            old_password: '',
            new_password: '',
            new_password_confirm: '',
        },
    })

    // パスワード表示/非表示の切り替え
    const togglePasswordVisibility = (field: 'old' | 'new' | 'confirm') => {
        setShowPasswords(prev => ({
            ...prev,
            [field]: !prev[field],
        }))
    }

    // フォーム送信処理
    const onSubmit = async (data: PasswordFormData) => {
        setLoading(true)
        setError(null)
        setSuccess(null)

        try {
            const result = await authService.changePassword({
                old_password: data.old_password,
                new_password: data.new_password,
                new_password_confirm: data.new_password_confirm,
            })

            setSuccess(result.message || 'パスワードが正常に変更されました')
            reset()

            // 成功後少し待ってから親コンポーネントに通知
            setTimeout(() => {
                onSuccess()
            }, 2000)
        } catch (err: any) {
            console.error('Password change error:', err)

            if (err.response?.data?.message) {
                setError(err.response.data.message)
            } else if (err.response?.data?.old_password) {
                setError('現在のパスワードが正しくありません。')
            } else if (err.response?.data?.new_password) {
                const passwordErrors = Array.isArray(err.response.data.new_password)
                    ? err.response.data.new_password
                    : [err.response.data.new_password]
                setError(`新しいパスワードに問題があります: ${passwordErrors.join(', ')}`)
            } else if (err.response?.data?.new_password_confirm) {
                setError('パスワード確認が一致していません。')
            } else if (err.response?.data?.non_field_errors) {
                setError(err.response.data.non_field_errors.join(', '))
            } else if (err.response?.status === 401) {
                setError('認証が無効です。再度ログインしてください。')
            } else if (err.response?.status === 403) {
                setError('この操作を実行する権限がありません。')
            } else if (err.response?.status === 429) {
                setError('リクエストが多すぎます。しばらく時間をおいてから再度お試しください。')
            } else if (err.response?.status >= 500) {
                setError('サーバーエラーが発生しました。しばらく時間をおいてから再度お試しください。')
            } else {
                setError('パスワードの変更に失敗しました。入力内容をご確認ください。')
            }
        } finally {
            setLoading(false)
        }
    }

    // キャンセル処理
    const handleCancel = () => {
        reset()
        setError(null)
        setSuccess(null)
        onCancel()
    }

    return (
        <Card>
            <CardHeader
                title="パスワード変更"
                titleTypographyProps={{ variant: 'h6' }}
                avatar={<Lock color="primary" />}
            />
            <CardContent>
                {error && (
                    <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                {success && (
                    <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
                        {success}
                    </Alert>
                )}

                <form onSubmit={handleSubmit(onSubmit)}>
                    <Grid container spacing={3}>
                        {/* 現在のパスワード */}
                        <Grid size={{ xs: 12 }}>
                            <Controller
                                name="old_password"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        label="現在のパスワード"
                                        type={showPasswords.old ? 'text' : 'password'}
                                        error={!!errors.old_password}
                                        helperText={errors.old_password?.message}
                                        variant="outlined"
                                        InputProps={{
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton
                                                        aria-label="パスワードを表示/非表示"
                                                        onClick={() => togglePasswordVisibility('old')}
                                                        edge="end"
                                                    >
                                                        {showPasswords.old ? <VisibilityOff /> : <Visibility />}
                                                    </IconButton>
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                )}
                            />
                        </Grid>

                        {/* 新しいパスワード */}
                        <Grid size={{ xs: 12 }}>
                            <Controller
                                name="new_password"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        label="新しいパスワード"
                                        type={showPasswords.new ? 'text' : 'password'}
                                        error={!!errors.new_password}
                                        helperText={errors.new_password?.message}
                                        variant="outlined"
                                        InputProps={{
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton
                                                        aria-label="パスワードを表示/非表示"
                                                        onClick={() => togglePasswordVisibility('new')}
                                                        edge="end"
                                                    >
                                                        {showPasswords.new ? <VisibilityOff /> : <Visibility />}
                                                    </IconButton>
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                )}
                            />
                        </Grid>

                        {/* パスワード確認 */}
                        <Grid size={{ xs: 12 }}>
                            <Controller
                                name="new_password_confirm"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        label="新しいパスワード（確認）"
                                        type={showPasswords.confirm ? 'text' : 'password'}
                                        error={!!errors.new_password_confirm}
                                        helperText={errors.new_password_confirm?.message}
                                        variant="outlined"
                                        InputProps={{
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton
                                                        aria-label="パスワードを表示/非表示"
                                                        onClick={() => togglePasswordVisibility('confirm')}
                                                        edge="end"
                                                    >
                                                        {showPasswords.confirm ? <VisibilityOff /> : <Visibility />}
                                                    </IconButton>
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                )}
                            />
                        </Grid>
                    </Grid>

                    {/* パスワードの要件説明 */}
                    <Box sx={{ mt: 2, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
                        <Box component="ul" sx={{ m: 0, pl: 2 }}>
                            <li>8文字以上である必要があります</li>
                            <li>英大文字、英小文字、数字、特殊文字をそれぞれ1文字以上含む必要があります</li>
                            <li>特殊文字: @$!%*?&</li>
                        </Box>
                    </Box>

                    {/* フォームボタン */}
                    <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                        <Button
                            variant="outlined"
                            onClick={handleCancel}
                            disabled={loading}
                            startIcon={<Cancel />}
                        >
                            キャンセル
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={loading || !isDirty}
                            startIcon={loading ? <CircularProgress size={20} /> : <Save />}
                        >
                            {loading ? '変更中...' : 'パスワード変更'}
                        </Button>
                    </Box>
                </form>
            </CardContent>
        </Card>
    )
} 