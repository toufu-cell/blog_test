'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    Box,
    Card,
    CardContent,
    Typography,
    CircularProgress,
    Container,
    Avatar,
    Chip,
} from '@mui/material'
import { useAuth } from '@/lib/contexts/AuthContext'

export default function ProfilePage() {
    const router = useRouter()
    const { user, isAuthenticated, isLoading } = useAuth()

    // 未認証の場合はログインページにリダイレクト
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.replace('/auth/login')
        }
    }, [isAuthenticated, isLoading, router])

    if (isLoading) {
        return (
            <Container maxWidth="md">
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

    if (!user) {
        return null
    }

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
                プロフィール
            </Typography>

            <Card>
                <CardContent>
                    {/* アバターセクション */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                        <Avatar
                            src={user.avatar}
                            sx={{ width: 100, height: 100, mr: 3 }}
                        >
                            {user.first_name?.[0] || user.username[0]}
                        </Avatar>
                        <Box>
                            <Typography variant="h5" gutterBottom>
                                {user.first_name && user.last_name
                                    ? `${user.last_name} ${user.first_name}`
                                    : user.username
                                }
                            </Typography>
                            <Typography variant="body1" color="text.secondary" gutterBottom>
                                {user.email}
                            </Typography>
                            <Chip
                                label={user.role}
                                color="primary"
                                variant="outlined"
                            />
                        </Box>
                    </Box>

                    {/* ユーザー情報 */}
                    <Box sx={{ mt: 4 }}>
                        <Typography variant="h6" gutterBottom>
                            基本情報
                        </Typography>

                        <Box sx={{ display: 'grid', gap: 2 }}>
                            <Box>
                                <Typography variant="subtitle2" color="text.secondary">
                                    ユーザー名
                                </Typography>
                                <Typography variant="body1">
                                    {user.username}
                                </Typography>
                            </Box>

                            <Box>
                                <Typography variant="subtitle2" color="text.secondary">
                                    メールアドレス
                                </Typography>
                                <Typography variant="body1">
                                    {user.email}
                                </Typography>
                            </Box>

                            <Box>
                                <Typography variant="subtitle2" color="text.secondary">
                                    役割
                                </Typography>
                                <Typography variant="body1">
                                    {user.role}
                                </Typography>
                            </Box>

                            {user.bio && (
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        自己紹介
                                    </Typography>
                                    <Typography variant="body1">
                                        {user.bio}
                                    </Typography>
                                </Box>
                            )}

                            <Box>
                                <Typography variant="subtitle2" color="text.secondary">
                                    アカウント作成日
                                </Typography>
                                <Typography variant="body1">
                                    {new Date(user.created_at).toLocaleDateString('ja-JP')}
                                </Typography>
                            </Box>

                            <Box>
                                <Typography variant="subtitle2" color="text.secondary">
                                    最終更新日
                                </Typography>
                                <Typography variant="body1">
                                    {new Date(user.updated_at).toLocaleDateString('ja-JP')}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>

                    {/* 統計情報 */}
                    {(user.article_count !== undefined || user.comment_count !== undefined) && (
                        <Box sx={{ mt: 4 }}>
                            <Typography variant="h6" gutterBottom>
                                統計情報
                            </Typography>

                            <Box sx={{ display: 'flex', gap: 4 }}>
                                {user.article_count !== undefined && (
                                    <Box sx={{ textAlign: 'center' }}>
                                        <Typography variant="h4" color="primary">
                                            {user.article_count}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            投稿記事数
                                        </Typography>
                                    </Box>
                                )}

                                {user.comment_count !== undefined && (
                                    <Box sx={{ textAlign: 'center' }}>
                                        <Typography variant="h4" color="primary">
                                            {user.comment_count}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            コメント数
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        </Box>
                    )}
                </CardContent>
            </Card>
        </Container>
    )
} 