'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    Box,
    Card,
    CardContent,
    Typography,
    CircularProgress,
    Container,
    Button,
    Avatar,
    Chip,
    Paper,
} from '@mui/material'
import {
    Article,
    Add,
    TrendingUp,
    People,
    Visibility,
    ThumbUp,
    Comment,
} from '@mui/icons-material'
import { useAuth } from '@/lib/contexts/AuthContext'

export default function DashboardPage() {
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
            <Container maxWidth="lg">
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
        <Container maxWidth="lg" sx={{ py: 4 }}>
            {/* ウェルカムセクション */}
            <Paper sx={{ p: 4, mb: 4, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Avatar
                        src={user.avatar}
                        sx={{ width: 80, height: 80 }}
                    >
                        {user.first_name?.[0] || user.username[0]}
                    </Avatar>
                    <Box>
                        <Typography variant="h4" gutterBottom>
                            おかえりなさい、
                            {user.first_name && user.last_name
                                ? `${user.last_name} ${user.first_name}`
                                : user.username
                            }さん
                        </Typography>
                        <Typography variant="h6" sx={{ opacity: 0.9 }}>
                            今日も素晴らしい記事を作成しましょう！
                        </Typography>
                        <Chip
                            label={user.role}
                            variant="outlined"
                            sx={{ mt: 2, borderColor: 'white', color: 'white' }}
                        />
                    </Box>
                </Box>
            </Paper>

            {/* 統計カード */}
            <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
                gap: 3,
                mb: 4
            }}>
                <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                        <Article sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                        <Typography variant="h4" color="primary" gutterBottom>
                            {user.article_count || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            投稿記事数
                        </Typography>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                        <Visibility sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
                        <Typography variant="h4" color="success.main" gutterBottom>
                            -
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            総閲覧数
                        </Typography>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                        <ThumbUp sx={{ fontSize: 48, color: 'warning.main', mb: 2 }} />
                        <Typography variant="h4" color="warning.main" gutterBottom>
                            -
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            総いいね数
                        </Typography>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                        <Comment sx={{ fontSize: 48, color: 'info.main', mb: 2 }} />
                        <Typography variant="h4" color="info.main" gutterBottom>
                            {user.comment_count || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            コメント数
                        </Typography>
                    </CardContent>
                </Card>
            </Box>

            {/* クイックアクション */}
            <Card sx={{ mb: 4 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        クイックアクション
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                        <Button
                            variant="contained"
                            startIcon={<Add />}
                            component={Link}
                            href="/admin/articles/new"
                            size="large"
                        >
                            新しい記事を作成
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<Article />}
                            component={Link}
                            href="/admin/articles"
                        >
                            記事管理
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<People />}
                            component={Link}
                            href="/profile"
                        >
                            プロフィール編集
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<TrendingUp />}
                            component={Link}
                            href="/analytics"
                        >
                            分析
                        </Button>
                    </Box>

                    {/* 緊急ナビゲーション（リンク問題対策） */}
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ width: '100%', mb: 1 }}>
                            ※ リンクが動作しない場合は以下をお試しください：
                        </Typography>
                        <Button
                            size="small"
                            variant="text"
                            onClick={() => {
                                window.location.href = '/'
                            }}
                        >
                            ホーム
                        </Button>
                        <Button
                            size="small"
                            variant="text"
                            onClick={() => {
                                window.location.href = '/admin/articles'
                            }}
                        >
                            記事管理
                        </Button>
                        <Button
                            size="small"
                            variant="text"
                            onClick={() => {
                                window.location.reload()
                            }}
                        >
                            ページリロード
                        </Button>
                    </Box>
                </CardContent>
            </Card>

            {/* 最近の活動 */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            最近の記事
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            記事一覧機能は今後実装予定です。
                        </Typography>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            最近のコメント
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            コメント一覧機能は今後実装予定です。
                        </Typography>
                    </CardContent>
                </Card>
            </Box>
        </Container>
    )
} 