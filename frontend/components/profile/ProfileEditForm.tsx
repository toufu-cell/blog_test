'use client'

import React, { useState } from 'react'
import {
    Box,
    Card,
    CardContent,
    CardHeader,
    TextField,
    Button,
    Avatar,
    IconButton,
    Alert,
    CircularProgress,
    Grid,
    Typography,
    InputAdornment,
} from '@mui/material'
import {
    PhotoCamera,
    Twitter,
    GitHub,
    Language,
    Save,
    Cancel,
} from '@mui/icons-material'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { User } from '@/types'
import { authService } from '@/lib/services/auth'

// バリデーションスキーマ
const profileSchema = yup.object({
    username: yup
        .string()
        .required('ユーザー名は必須です')
        .min(3, 'ユーザー名は3文字以上である必要があります')
        .max(150, 'ユーザー名は150文字以下である必要があります')
        .matches(/^[\w.@+-]+$/, 'ユーザー名に使用できない文字が含まれています'),
    first_name: yup
        .string()
        .max(150, '名前は150文字以下である必要があります'),
    last_name: yup
        .string()
        .max(150, '名字は150文字以下である必要があります'),
    bio: yup
        .string()
        .max(500, '自己紹介は500文字以下である必要があります'),
    website: yup
        .string()
        .url('有効なURLを入力してください')
        .nullable(),
    twitter: yup
        .string()
        .max(50, 'Twitterユーザー名は50文字以下である必要があります'),
    github: yup
        .string()
        .max(50, 'GitHubユーザー名は50文字以下である必要があります'),
})

type ProfileFormData = yup.InferType<typeof profileSchema>

interface ProfileEditFormProps {
    user: User
    onUpdate: (user: User) => void
    onCancel: () => void
}

export default function ProfileEditForm({ user, onUpdate, onCancel }: ProfileEditFormProps) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [avatarFile, setAvatarFile] = useState<File | null>(null)
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

    const {
        control,
        handleSubmit,
        formState: { errors, isDirty },
        reset,
    } = useForm<ProfileFormData>({
        resolver: yupResolver(profileSchema),
        defaultValues: {
            username: user.username || '',
            first_name: user.first_name || '',
            last_name: user.last_name || '',
            bio: user.bio || '',
            website: user.website || '',
            twitter: user.twitter || '',
            github: user.github || '',
        },
    })

    // アバター画像の選択処理
    const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            // ファイルサイズチェック (5MB制限)
            if (file.size > 5 * 1024 * 1024) {
                setError('画像ファイルは5MB以下である必要があります')
                return
            }

            // ファイル形式チェック
            if (!file.type.startsWith('image/')) {
                setError('画像ファイルを選択してください')
                return
            }

            setAvatarFile(file)

            // プレビュー画像を作成
            const reader = new FileReader()
            reader.onload = (e) => {
                setAvatarPreview(e.target?.result as string)
            }
            reader.readAsDataURL(file)
            setError(null)
        }
    }

    // フォーム送信処理
    const onSubmit = async (data: ProfileFormData) => {
        setLoading(true)
        setError(null)

        try {
            // まず基本プロフィール情報を更新
            const updatedUser = await authService.updateProfile(data)

            // アバター画像がある場合は別途アップロード
            let finalUser = updatedUser
            if (avatarFile) {
                finalUser = await authService.uploadAvatar(avatarFile)
            }

            onUpdate(finalUser)
        } catch (err: any) {
            console.error('Profile update error:', err)
            if (err.response?.data?.message) {
                setError(err.response.data.message)
            } else if (err.response?.data?.field_errors) {
                const fieldErrors = err.response.data.field_errors
                const errorMessages = Object.values(fieldErrors).flat().join(', ')
                setError(errorMessages)
            } else {
                setError('プロフィールの更新に失敗しました')
            }
        } finally {
            setLoading(false)
        }
    }

    // キャンセル処理
    const handleCancel = () => {
        reset()
        setAvatarFile(null)
        setAvatarPreview(null)
        setError(null)
        onCancel()
    }

    return (
        <Card>
            <CardHeader
                title="基本プロフィール編集"
                titleTypographyProps={{ variant: 'h6' }}
            />
            <CardContent>
                {error && (
                    <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                <form onSubmit={handleSubmit(onSubmit)}>
                    {/* アバター画像 */}
                    <Box sx={{ mb: 4, textAlign: 'center' }}>
                        <Box sx={{ position: 'relative', display: 'inline-block' }}>
                            <Avatar
                                src={avatarPreview || user.avatar}
                                sx={{ width: 120, height: 120 }}
                            >
                                {user.first_name?.[0] || user.username[0]}
                            </Avatar>
                            <input
                                accept="image/*"
                                style={{ display: 'none' }}
                                id="avatar-upload"
                                type="file"
                                onChange={handleAvatarChange}
                            />
                            <label htmlFor="avatar-upload">
                                <IconButton
                                    color="primary"
                                    aria-label="アバター画像をアップロード"
                                    component="span"
                                    sx={{
                                        position: 'absolute',
                                        bottom: 0,
                                        right: 0,
                                        backgroundColor: 'background.paper',
                                        '&:hover': {
                                            backgroundColor: 'background.paper',
                                        },
                                    }}
                                >
                                    <PhotoCamera />
                                </IconButton>
                            </label>
                        </Box>
                        <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                            画像ファイル（5MB以下）
                        </Typography>
                    </Box>

                    <Grid container spacing={3}>
                        {/* ユーザー名 */}
                        <Grid item xs={12}>
                            <Controller
                                name="username"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        label="ユーザー名"
                                        error={!!errors.username}
                                        helperText={errors.username?.message}
                                        variant="outlined"
                                    />
                                )}
                            />
                        </Grid>

                        {/* 名前 */}
                        <Grid item xs={12} sm={6}>
                            <Controller
                                name="last_name"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        label="名字"
                                        error={!!errors.last_name}
                                        helperText={errors.last_name?.message}
                                        variant="outlined"
                                    />
                                )}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <Controller
                                name="first_name"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        label="名前"
                                        error={!!errors.first_name}
                                        helperText={errors.first_name?.message}
                                        variant="outlined"
                                    />
                                )}
                            />
                        </Grid>

                        {/* 自己紹介 */}
                        <Grid item xs={12}>
                            <Controller
                                name="bio"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        label="自己紹介"
                                        multiline
                                        rows={4}
                                        error={!!errors.bio}
                                        helperText={errors.bio?.message}
                                        variant="outlined"
                                    />
                                )}
                            />
                        </Grid>

                        {/* ウェブサイト */}
                        <Grid item xs={12}>
                            <Controller
                                name="website"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        label="ウェブサイト"
                                        placeholder="https://example.com"
                                        error={!!errors.website}
                                        helperText={errors.website?.message}
                                        variant="outlined"
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Language />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                )}
                            />
                        </Grid>

                        {/* SNSアカウント */}
                        <Grid item xs={12} sm={6}>
                            <Controller
                                name="twitter"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        label="Twitter"
                                        placeholder="username"
                                        error={!!errors.twitter}
                                        helperText={errors.twitter?.message}
                                        variant="outlined"
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Twitter />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                )}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <Controller
                                name="github"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        label="GitHub"
                                        placeholder="username"
                                        error={!!errors.github}
                                        helperText={errors.github?.message}
                                        variant="outlined"
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <GitHub />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                )}
                            />
                        </Grid>
                    </Grid>

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
                            {loading ? '保存中...' : '保存'}
                        </Button>
                    </Box>
                </form>
            </CardContent>
        </Card>
    )
} 