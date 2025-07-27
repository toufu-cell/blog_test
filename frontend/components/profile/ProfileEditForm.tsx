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
    Typography,
    InputAdornment,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material'
import {
    PhotoCamera,
    Twitter,
    GitHub,
    Language,
    Save,
    Cancel,
    Delete,
} from '@mui/icons-material'
import { mutate } from 'swr'
import { User } from '@/types'
import { api } from '@/lib/api'

interface ProfileEditFormProps {
    user: User
    onUpdate: (user: User) => void
    onCancel: () => void
}

interface FormData {
    username: string
    first_name: string
    last_name: string
    bio: string
    website: string
    twitter: string
    github: string
}

export default function ProfileEditForm({ user, onUpdate, onCancel }: ProfileEditFormProps) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [avatarFile, setAvatarFile] = useState<File | null>(null)
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
    const [deleteAvatarDialogOpen, setDeleteAvatarDialogOpen] = useState(false)
    const [removeAvatar, setRemoveAvatar] = useState(false)

    const [formData, setFormData] = useState<FormData>({
        username: user.username || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        bio: user.bio || '',
        website: user.website || '',
        twitter: user.twitter || '',
        github: user.github || '',
    })

    // フォーム入力の変更処理
    const handleInputChange = (field: keyof FormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

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

            // 画像の解像度チェック
            const img = new Image()
            img.onload = () => {
                if (img.width > 2048 || img.height > 2048) {
                    setError('画像の解像度は2048x2048以下である必要があります')
                    return
                }

                setAvatarFile(file)
                setRemoveAvatar(false)

                // プレビュー画像を作成
                const reader = new FileReader()
                reader.onload = (e) => {
                    setAvatarPreview(e.target?.result as string)
                }
                reader.readAsDataURL(file)
                setError(null)
            }

            img.onerror = () => {
                setError('画像ファイルが破損しているか、サポートされていない形式です')
            }

            const objectUrl = URL.createObjectURL(file)
            img.src = objectUrl
        }
    }

    // アバター削除の確認
    const handleDeleteAvatarClick = () => {
        setDeleteAvatarDialogOpen(true)
    }

    // アバター削除の実行
    const handleDeleteAvatarConfirm = () => {
        setAvatarFile(null)
        setAvatarPreview(null)
        setRemoveAvatar(true)
        setDeleteAvatarDialogOpen(false)
    }

    // フォーム送信処理
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            // 基本的なバリデーション
            if (!formData.username.trim()) {
                throw new Error('ユーザー名は必須です')
            }

            // FormDataを使用してマルチパート送信
            const submitFormData = new FormData()

            // 基本プロフィール情報を追加
            Object.entries(formData).forEach(([key, value]) => {
                if (value !== null && value !== undefined) {
                    submitFormData.append(key, value.toString())
                }
            })

            // アバター画像の処理
            if (removeAvatar) {
                // アバターを削除する場合
                submitFormData.append('avatar', '')
            } else if (avatarFile) {
                // 新しいアバター画像をアップロードする場合
                submitFormData.append('avatar', avatarFile)
            }

            // APIで更新
            const response = await api.patch('/accounts/profile/', submitFormData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            })

            const updatedUser = response.data

            // ローカルストレージのユーザー情報を更新
            localStorage.setItem('user_data', JSON.stringify(updatedUser))

            // SWRキャッシュを更新
            mutate('/accounts/profile/', updatedUser, false)

            onUpdate(updatedUser)

        } catch (err: any) {
            console.error('Profile update error:', err)

            if (err.response?.data?.message) {
                setError(err.response.data.message)
            } else if (err.response?.data?.detail) {
                setError(err.response.data.detail)
            } else if (err.response?.data) {
                // フィールドエラーの場合
                const fieldErrors = err.response.data
                const errorMessages = Object.values(fieldErrors).flat().join(', ')
                setError(errorMessages || 'プロフィールの更新に失敗しました')
            } else {
                setError(err.message || 'プロフィールの更新に失敗しました')
            }
        } finally {
            setLoading(false)
        }
    }

    // キャンセル処理
    const handleCancel = () => {
        setFormData({
            username: user.username || '',
            first_name: user.first_name || '',
            last_name: user.last_name || '',
            bio: user.bio || '',
            website: user.website || '',
            twitter: user.twitter || '',
            github: user.github || '',
        })
        setAvatarFile(null)
        setAvatarPreview(null)
        setRemoveAvatar(false)
        setError(null)
        onCancel()
    }

    // 現在表示するアバター画像を決定
    const getCurrentAvatarSrc = (): string | undefined => {
        if (removeAvatar) return undefined
        if (avatarPreview) return avatarPreview
        return user.avatar || undefined
    }

    return (
        <>
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

                    <form onSubmit={handleSubmit}>
                        {/* アバター画像 */}
                        <Box sx={{ mb: 4, textAlign: 'center' }}>
                            <Box sx={{ position: 'relative', display: 'inline-block' }}>
                                <Avatar
                                    src={getCurrentAvatarSrc()}
                                    sx={{ width: 120, height: 120 }}
                                >
                                    {user.first_name?.[0] || user.username[0]}
                                </Avatar>

                                {/* アップロードボタン */}
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

                                {/* 削除ボタン */}
                                {(user.avatar || avatarPreview) && !removeAvatar && (
                                    <IconButton
                                        color="error"
                                        aria-label="アバター画像を削除"
                                        onClick={handleDeleteAvatarClick}
                                        sx={{
                                            position: 'absolute',
                                            top: 0,
                                            right: 0,
                                            backgroundColor: 'background.paper',
                                            '&:hover': {
                                                backgroundColor: 'background.paper',
                                            },
                                        }}
                                    >
                                        <Delete />
                                    </IconButton>
                                )}
                            </Box>
                            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                                画像ファイル（5MB以下、2048x2048以下）
                            </Typography>
                            {avatarFile && (
                                <Typography variant="caption" color="primary" display="block">
                                    新しい画像: {avatarFile.name}
                                </Typography>
                            )}
                            {removeAvatar && (
                                <Typography variant="caption" color="error" display="block">
                                    画像を削除します
                                </Typography>
                            )}
                        </Box>

                        {/* フォーム入力フィールド */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            {/* ユーザー名 */}
                            <TextField
                                fullWidth
                                label="ユーザー名"
                                value={formData.username}
                                onChange={(e) => handleInputChange('username', e.target.value)}
                                variant="outlined"
                                required
                            />

                            {/* 名前 */}
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <TextField
                                    fullWidth
                                    label="名字"
                                    value={formData.last_name}
                                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                                    variant="outlined"
                                />
                                <TextField
                                    fullWidth
                                    label="名前"
                                    value={formData.first_name}
                                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                                    variant="outlined"
                                />
                            </Box>

                            {/* 自己紹介 */}
                            <TextField
                                fullWidth
                                label="自己紹介"
                                multiline
                                rows={4}
                                value={formData.bio}
                                onChange={(e) => handleInputChange('bio', e.target.value)}
                                variant="outlined"
                                helperText={`${formData.bio.length}/500文字`}
                                inputProps={{ maxLength: 500 }}
                            />

                            {/* ウェブサイト */}
                            <TextField
                                fullWidth
                                label="ウェブサイト"
                                placeholder="https://example.com"
                                value={formData.website}
                                onChange={(e) => handleInputChange('website', e.target.value)}
                                variant="outlined"
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Language />
                                        </InputAdornment>
                                    ),
                                }}
                            />

                            {/* SNSアカウント */}
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <TextField
                                    fullWidth
                                    label="Twitter"
                                    placeholder="username"
                                    value={formData.twitter}
                                    onChange={(e) => handleInputChange('twitter', e.target.value)}
                                    variant="outlined"
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Twitter />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                                <TextField
                                    fullWidth
                                    label="GitHub"
                                    placeholder="username"
                                    value={formData.github}
                                    onChange={(e) => handleInputChange('github', e.target.value)}
                                    variant="outlined"
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <GitHub />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
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
                                disabled={loading}
                                startIcon={loading ? <CircularProgress size={20} /> : <Save />}
                            >
                                {loading ? '保存中...' : '保存'}
                            </Button>
                        </Box>
                    </form>
                </CardContent>
            </Card>

            {/* アバター削除確認ダイアログ */}
            <Dialog
                open={deleteAvatarDialogOpen}
                onClose={() => setDeleteAvatarDialogOpen(false)}
            >
                <DialogTitle>アバター画像を削除</DialogTitle>
                <DialogContent>
                    <Typography>
                        アバター画像を削除してもよろしいですか？
                        この操作は保存するまで反映されません。
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteAvatarDialogOpen(false)}>
                        キャンセル
                    </Button>
                    <Button
                        onClick={handleDeleteAvatarConfirm}
                        color="error"
                        variant="contained"
                    >
                        削除
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    )
} 