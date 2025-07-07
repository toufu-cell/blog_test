'use client'

import React, { useState, useEffect } from 'react'
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
    Switch,
    FormControlLabel,
    FormGroup,
    Typography,
    Divider,
    Accordion,
    AccordionSummary,
    AccordionDetails,
} from '@mui/material'
import {
    Save,
    Cancel,
    ExpandMore,
    Notifications,
    Security,
    Person,
} from '@mui/icons-material'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { UserProfile } from '@/types'
import { authService } from '@/lib/services/auth'

// バリデーションスキーマ
const profileSettingsSchema = yup.object({
    birth_date: yup
        .date()
        .nullable()
        .optional()
        .max(new Date(), '生年月日は今日以前の日付である必要があります'),
    phone: yup
        .string()
        .optional()
        .max(20, '電話番号は20文字以下である必要があります')
        .matches(/^[\d\-\+\(\)\s]*$/, '有効な電話番号を入力してください'),
    address: yup
        .string()
        .optional()
        .max(500, '住所は500文字以下である必要があります'),
    notification_email: yup.boolean().optional(),
    notification_push: yup.boolean().optional(),
    privacy_public_profile: yup.boolean().optional(),
    privacy_show_email: yup.boolean().optional(),
})

// 明示的な型定義
interface ProfileSettingsFormData {
    birth_date?: Date | null
    phone?: string
    address?: string
    notification_email?: boolean
    notification_push?: boolean
    privacy_public_profile?: boolean
    privacy_show_email?: boolean
}

interface ProfileSettingsFormProps {
    onUpdate: () => void
    onCancel: () => void
}

export default function ProfileSettingsForm({ onUpdate, onCancel }: ProfileSettingsFormProps) {
    const [loading, setLoading] = useState(false)
    const [loadingProfile, setLoadingProfile] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    const {
        control,
        handleSubmit,
        formState: { errors, isDirty },
        reset,
        setValue,
    } = useForm<ProfileSettingsFormData>({
        resolver: yupResolver(profileSettingsSchema) as any,
        defaultValues: {
            birth_date: null,
            phone: '',
            address: '',
            notification_email: true,
            notification_push: true,
            privacy_public_profile: true,
            privacy_show_email: false,
        },
    })

    // プロフィール詳細情報を取得
    useEffect(() => {
        const loadProfileDetail = async () => {
            try {
                const profileDetail = await authService.getProfileDetail()

                // フォームのデフォルト値を設定
                setValue('birth_date', profileDetail.birth_date ? new Date(profileDetail.birth_date) : null)
                setValue('phone', profileDetail.phone || '')
                setValue('address', profileDetail.address || '')
                setValue('notification_email', profileDetail.notification_email)
                setValue('notification_push', profileDetail.notification_push)
                setValue('privacy_public_profile', profileDetail.privacy_public_profile)
                setValue('privacy_show_email', profileDetail.privacy_show_email)
            } catch (err: any) {
                console.error('Failed to load profile detail:', err)
                setError('プロフィール詳細の読み込みに失敗しました')
            } finally {
                setLoadingProfile(false)
            }
        }

        loadProfileDetail()
    }, [setValue])

    // フォーム送信処理
    const onSubmit = async (data: ProfileSettingsFormData) => {
        setLoading(true)
        setError(null)
        setSuccess(null)

        try {
            const updateData = {
                ...data,
                birth_date: data.birth_date ? data.birth_date.toISOString().split('T')[0] : undefined,
            }

            await authService.updateProfileDetail(updateData)
            setSuccess('プロフィール設定が正常に更新されました')

            // 成功後少し待ってから親コンポーネントに通知
            setTimeout(() => {
                onUpdate()
            }, 2000)
        } catch (err: any) {
            console.error('Profile settings update error:', err)
            if (err.response?.data?.message) {
                setError(err.response.data.message)
            } else if (err.response?.data?.field_errors) {
                const fieldErrors = err.response.data.field_errors
                const errorMessages = Object.values(fieldErrors).flat().join(', ')
                setError(errorMessages)
            } else {
                setError('プロフィール設定の更新に失敗しました')
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

    if (loadingProfile) {
        return (
            <Card>
                <CardContent sx={{ textAlign: 'center', py: 4 }}>
                    <CircularProgress />
                    <Typography variant="body2" sx={{ mt: 2 }}>
                        プロフィール設定を読み込み中...
                    </Typography>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader
                title="詳細プロフィール設定"
                titleTypographyProps={{ variant: 'h6' }}
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
                    {/* 個人情報セクション */}
                    <Accordion defaultExpanded>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Person color="primary" />
                                <Typography variant="h6">個人情報</Typography>
                            </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3 }}>
                                {/* 生年月日 */}
                                <Box>
                                    <Controller
                                        name="birth_date"
                                        control={control}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                fullWidth
                                                label="生年月日"
                                                type="date"
                                                value={field.value ? field.value.toISOString().split('T')[0] : ''}
                                                onChange={(e) => {
                                                    const date = e.target.value ? new Date(e.target.value) : null
                                                    field.onChange(date)
                                                }}
                                                error={!!errors.birth_date}
                                                helperText={errors.birth_date?.message}
                                                variant="outlined"
                                                InputLabelProps={{
                                                    shrink: true,
                                                }}
                                            />
                                        )}
                                    />
                                </Box>

                                {/* 電話番号 */}
                                <Box>
                                    <Controller
                                        name="phone"
                                        control={control}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                fullWidth
                                                label="電話番号"
                                                placeholder="090-1234-5678"
                                                error={!!errors.phone}
                                                helperText={errors.phone?.message}
                                                variant="outlined"
                                            />
                                        )}
                                    />
                                </Box>

                                {/* 住所 */}
                                <Box sx={{ gridColumn: '1 / -1' }}>
                                    <Controller
                                        name="address"
                                        control={control}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                fullWidth
                                                label="住所"
                                                multiline
                                                rows={3}
                                                error={!!errors.address}
                                                helperText={errors.address?.message}
                                                variant="outlined"
                                            />
                                        )}
                                    />
                                </Box>
                            </Box>
                        </AccordionDetails>
                    </Accordion>

                    {/* 通知設定セクション */}
                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Notifications color="primary" />
                                <Typography variant="h6">通知設定</Typography>
                            </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                            <FormGroup>
                                <Controller
                                    name="notification_email"
                                    control={control}
                                    render={({ field }) => (
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={field.value}
                                                    onChange={field.onChange}
                                                    color="primary"
                                                />
                                            }
                                            label="メール通知"
                                        />
                                    )}
                                />
                                <Typography variant="caption" color="text.secondary" sx={{ mb: 2, ml: 4 }}>
                                    新しいコメントやいいねの通知をメールで受け取る
                                </Typography>

                                <Controller
                                    name="notification_push"
                                    control={control}
                                    render={({ field }) => (
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={field.value}
                                                    onChange={field.onChange}
                                                    color="primary"
                                                />
                                            }
                                            label="プッシュ通知"
                                        />
                                    )}
                                />
                                <Typography variant="caption" color="text.secondary" sx={{ ml: 4 }}>
                                    ブラウザやモバイルでのプッシュ通知を受け取る
                                </Typography>
                            </FormGroup>
                        </AccordionDetails>
                    </Accordion>

                    {/* プライバシー設定セクション */}
                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Security color="primary" />
                                <Typography variant="h6">プライバシー設定</Typography>
                            </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                            <FormGroup>
                                <Controller
                                    name="privacy_public_profile"
                                    control={control}
                                    render={({ field }) => (
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={field.value}
                                                    onChange={field.onChange}
                                                    color="primary"
                                                />
                                            }
                                            label="プロフィール公開"
                                        />
                                    )}
                                />
                                <Typography variant="caption" color="text.secondary" sx={{ mb: 2, ml: 4 }}>
                                    他のユーザーがあなたのプロフィールを閲覧できるようにする
                                </Typography>

                                <Controller
                                    name="privacy_show_email"
                                    control={control}
                                    render={({ field }) => (
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={field.value}
                                                    onChange={field.onChange}
                                                    color="primary"
                                                />
                                            }
                                            label="メールアドレス公開"
                                        />
                                    )}
                                />
                                <Typography variant="caption" color="text.secondary" sx={{ ml: 4 }}>
                                    プロフィールページでメールアドレスを表示する
                                </Typography>
                            </FormGroup>
                        </AccordionDetails>
                    </Accordion>

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
                            {loading ? '保存中...' : '設定保存'}
                        </Button>
                    </Box>
                </form>
            </CardContent>
        </Card>
    )
} 