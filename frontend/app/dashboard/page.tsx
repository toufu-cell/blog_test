'use client'

import React, { useEffect, useState } from 'react'
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
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Divider,
    IconButton,
} from '@mui/material'
import {
    Article,
    Add,
    TrendingUp,
    People,
    Visibility,
    ThumbUp,
    Comment,
    Edit,
    Public,
    Schedule,
    Lock,
    ChatBubbleOutline,
    OpenInNew,
} from '@mui/icons-material'
import { useAuth } from '@/lib/contexts/AuthContext'
import { analyticsService, UserAnalyticsData } from '@/lib/services/analytics'
import { getDashboardData } from '@/lib/services/blog'

export default function DashboardPage() {
    const router = useRouter()
    const { user, isAuthenticated, isLoading } = useAuth()
    const [userAnalytics, setUserAnalytics] = useState<UserAnalyticsData | null>(null)
    const [analyticsLoading, setAnalyticsLoading] = useState(false)
    const [dashboardData, setDashboardData] = useState<any>(null)
    const [dashboardLoading, setDashboardLoading] = useState(false)

    // 未認証の場合はログインページにリダイレクト
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.replace('/auth/login')
        }
    }, [isAuthenticated, isLoading, router])

    // ユーザー分析データとダッシュボードデータを取得
    useEffect(() => {
        if (isAuthenticated && user) {
            loadUserAnalytics()
            loadDashboardData()
        }
    }, [isAuthenticated, user])

    const loadUserAnalytics = async () => {
        try {
            setAnalyticsLoading(true)
            const data = await analyticsService.getUserAnalytics()
            setUserAnalytics(data)
        } catch (error) {
            console.error('Analytics loading error:', error)
        } finally {
            setAnalyticsLoading(false)
        }
    }

    const loadDashboardData = async () => {
        try {
            setDashboardLoading(true)
            const data = await getDashboardData()
            setDashboardData(data)
        } catch (error) {
            console.error('Dashboard data loading error:', error)
        } finally {
            setDashboardLoading(false)
        }
    }

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
                            {dashboardData?.stats?.total_articles || user.article_count || 0}
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
                            {(analyticsLoading || dashboardLoading) ? (
                                <CircularProgress size={24} />
                            ) : (
                                (dashboardData?.stats?.total_views || userAnalytics?.overview.total_views || 0).toLocaleString()
                            )}
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
                            {(analyticsLoading || dashboardLoading) ? (
                                <CircularProgress size={24} />
                            ) : (
                                (dashboardData?.stats?.total_likes || userAnalytics?.overview.total_likes || 0).toLocaleString()
                            )}
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
                            {(analyticsLoading || dashboardLoading) ? (
                                <CircularProgress size={24} />
                            ) : (
                                (dashboardData?.stats?.total_comments || userAnalytics?.overview.total_comments || 0).toLocaleString()
                            )}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            受信コメント数
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
                        {dashboardLoading ? (
                            <Box display="flex" justifyContent="center" py={2}>
                                <CircularProgress size={24} />
                            </Box>
                        ) : dashboardData?.recent_articles?.length > 0 ? (
                            <List dense>
                                {dashboardData.recent_articles.map((article: any, index: number) => {
                                    const getStatusIcon = (status: string) => {
                                        switch (status) {
                                            case 'published': return <Public color="success" />
                                            case 'draft': return <Edit color="disabled" />
                                            case 'private': return <Lock color="error" />
                                            case 'scheduled': return <Schedule color="warning" />
                                            default: return <Edit color="disabled" />
                                        }
                                    }

                                    const getStatusColor = (status: string) => {
                                        switch (status) {
                                            case 'published': return 'success'
                                            case 'draft': return 'default'
                                            case 'private': return 'error'
                                            case 'scheduled': return 'warning'
                                            default: return 'default'
                                        }
                                    }

                                    return (
                                        <div key={article.id}>
                                            <ListItem
                                                sx={{ px: 0 }}
                                                secondaryAction={
                                                    <IconButton
                                                        edge="end"
                                                        size="small"
                                                        href={article.status === 'published' ? `/articles/${article.slug}` : `/admin/articles/${article.id}/edit`}
                                                        component={Link}
                                                        target={article.status === 'published' ? '_blank' : '_self'}
                                                    >
                                                        <OpenInNew fontSize="small" />
                                                    </IconButton>
                                                }
                                            >
                                                <ListItemIcon>
                                                    {getStatusIcon(article.status)}
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={
                                                        <Box display="flex" alignItems="center" gap={1}>
                                                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                                {article.title}
                                                            </Typography>
                                                            <Chip
                                                                label={article.status === 'published' ? '公開' :
                                                                    article.status === 'draft' ? '下書き' :
                                                                        article.status === 'private' ? '非公開' : '予約投稿'}
                                                                size="small"
                                                                color={getStatusColor(article.status) as any}
                                                                variant="outlined"
                                                            />
                                                        </Box>
                                                    }
                                                    secondary={
                                                        <Box display="flex" alignItems="center" gap={2} mt={0.5}>
                                                            <Box display="flex" alignItems="center" gap={0.5}>
                                                                <Visibility fontSize="small" color="disabled" />
                                                                <Typography variant="caption">
                                                                    {article.view_count}
                                                                </Typography>
                                                            </Box>
                                                            <Box display="flex" alignItems="center" gap={0.5}>
                                                                <ThumbUp fontSize="small" color="disabled" />
                                                                <Typography variant="caption">
                                                                    {article.like_count}
                                                                </Typography>
                                                            </Box>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {new Date(article.created_at).toLocaleDateString('ja-JP')}
                                                            </Typography>
                                                        </Box>
                                                    }
                                                />
                                            </ListItem>
                                            {index < dashboardData.recent_articles.length - 1 && <Divider />}
                                        </div>
                                    )
                                })}
                            </List>
                        ) : (
                            <Typography variant="body2" color="text.secondary">
                                まだ記事がありません。<br />
                                <Button
                                    variant="text"
                                    startIcon={<Add />}
                                    href="/admin/articles/new"
                                    component={Link}
                                    size="small"
                                    sx={{ mt: 1 }}
                                >
                                    新しい記事を作成
                                </Button>
                            </Typography>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            最近のコメント
                        </Typography>
                        {dashboardLoading ? (
                            <Box display="flex" justifyContent="center" py={2}>
                                <CircularProgress size={24} />
                            </Box>
                        ) : dashboardData?.recent_comments?.length > 0 ? (
                            <List dense>
                                {dashboardData.recent_comments.map((comment: any, index: number) => (
                                    <div key={comment.id}>
                                        <ListItem
                                            sx={{ px: 0 }}
                                            secondaryAction={
                                                <IconButton
                                                    edge="end"
                                                    size="small"
                                                    href={`/articles/${comment.article.slug}#comment-${comment.id}`}
                                                    component={Link}
                                                    target="_blank"
                                                >
                                                    <OpenInNew fontSize="small" />
                                                </IconButton>
                                            }
                                        >
                                            <ListItemIcon>
                                                <Avatar
                                                    src={comment.author.avatar}
                                                    sx={{ width: 32, height: 32 }}
                                                >
                                                    {comment.author.username[0]}
                                                </Avatar>
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={
                                                    <Box>
                                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                            {comment.author.username} さんからのコメント
                                                        </Typography>
                                                        <Typography variant="caption" color="primary">
                                                            記事「{comment.article.title}」
                                                        </Typography>
                                                    </Box>
                                                }
                                                secondary={
                                                    <Box>
                                                        <Typography
                                                            variant="body2"
                                                            color="text.secondary"
                                                            sx={{
                                                                mt: 0.5,
                                                                display: '-webkit-box',
                                                                WebkitLineClamp: 2,
                                                                WebkitBoxOrient: 'vertical',
                                                                overflow: 'hidden'
                                                            }}
                                                        >
                                                            {comment.content}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                                            {new Date(comment.created_at).toLocaleDateString('ja-JP', {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </Typography>
                                                    </Box>
                                                }
                                            />
                                        </ListItem>
                                        {index < dashboardData.recent_comments.length - 1 && <Divider />}
                                    </div>
                                ))}
                            </List>
                        ) : (
                            <Typography variant="body2" color="text.secondary">
                                まだコメントがありません。<br />
                                記事を公開してコメントを受け取りましょう。
                            </Typography>
                        )}
                    </CardContent>
                </Card>
            </Box>
        </Container>
    )
} 