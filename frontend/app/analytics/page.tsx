'use client'

import React, { useState, useEffect } from 'react'
import {
    Container,
    Typography,
    Box,
    Card,
    CardContent,
    Grid,
    Tabs,
    Tab,
    CircularProgress,
    Alert,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Divider,
} from '@mui/material'
import {
    TrendingUp,
    Visibility,
    ThumbUp,
    Comment,
    Article,
    People,
    Category,
    LocalOffer,
    Star,
    Timeline,
    BarChart,
    ShowChart,
} from '@mui/icons-material'
import { useAuth } from '@/lib/contexts/AuthContext'
import { analyticsService, UserAnalyticsData, SiteAnalyticsData } from '@/lib/services/analytics'
import { formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    BarChart as RechartsBarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
} from 'recharts'

interface TabPanelProps {
    children?: React.ReactNode
    index: number
    value: number
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`analytics-tabpanel-${index}`}
            aria-labelledby={`analytics-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
        </div>
    )
}

export default function AnalyticsPage() {
    const { user, isAuthenticated, isLoading } = useAuth()
    const [tabValue, setTabValue] = useState(0)
    const [userAnalytics, setUserAnalytics] = useState<UserAnalyticsData | null>(null)
    const [siteAnalytics, setSiteAnalytics] = useState<SiteAnalyticsData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (isAuthenticated && user) {
            loadAnalyticsData()
        }
    }, [isAuthenticated, user])

    const loadAnalyticsData = async () => {
        try {
            setLoading(true)
            setError(null)

            // ユーザー個人の分析データを取得
            const userDataPromise = analyticsService.getUserAnalytics()

            // 編集者以上の場合、サイト全体の分析データも取得
            if (user?.role === 'admin') {
                const [userData, siteData] = await Promise.all([
                    userDataPromise,
                    analyticsService.getSiteAnalytics()
                ])
                setUserAnalytics(userData)
                setSiteAnalytics(siteData)
            } else {
                const userData = await userDataPromise
                setUserAnalytics(userData)
            }

        } catch (err: any) {
            console.error('Analytics data loading error:', err)
            setError('分析データの読み込みに失敗しました')
        } finally {
            setLoading(false)
        }
    }

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue)
    }

    const formatDate = (dateString: string) => {
        return formatDistanceToNow(new Date(dateString), {
            addSuffix: true,
            locale: ja
        })
    }

    const StatCard = ({ icon, title, value, color, subtitle }: {
        icon: React.ReactNode
        title: string
        value: string | number
        color: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'
        subtitle?: string
    }) => (
        <Card>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ color: `${color}.main` }}>
                        {icon}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="h4" color={`${color}.main`}>
                            {value}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {title}
                        </Typography>
                        {subtitle && (
                            <Typography variant="caption" color="text.secondary">
                                {subtitle}
                            </Typography>
                        )}
                    </Box>
                </Box>
            </CardContent>
        </Card>
    )

    if (isLoading || loading) {
        return (
            <Container maxWidth="xl" sx={{ py: 4 }}>
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                    <CircularProgress />
                </Box>
            </Container>
        )
    }

    if (!isAuthenticated) {
        return (
            <Container maxWidth="xl" sx={{ py: 4 }}>
                <Alert severity="warning">
                    分析機能を使用するにはログインが必要です。
                </Alert>
            </Container>
        )
    }

    if (error) {
        return (
            <Container maxWidth="xl" sx={{ py: 4 }}>
                <Alert severity="error">
                    {error}
                </Alert>
            </Container>
        )
    }

    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            {/* ヘッダー */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" gutterBottom>
                    📊 分析ダッシュボード
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    あなたの記事のパフォーマンスとサイト全体の統計を確認できます
                </Typography>
            </Box>

            {/* タブ */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs
                    value={tabValue}
                    onChange={handleTabChange}
                    variant="scrollable"
                    scrollButtons="auto"
                >
                    <Tab
                        label="マイ分析"
                        icon={<BarChart />}
                        iconPosition="start"
                    />
                    {user?.role === 'admin' && (
                        <Tab
                            label="サイト全体分析"
                            icon={<Timeline />}
                            iconPosition="start"
                        />
                    )}
                </Tabs>
            </Box>

            {/* マイ分析タブ */}
            <TabPanel value={tabValue} index={0}>
                {userAnalytics && (
                    <Box>
                        {/* 概要統計カード */}
                        <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
                            概要統計
                        </Typography>
                        <Grid container spacing={3} sx={{ mb: 4 }}>
                            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                <StatCard
                                    icon={<Article sx={{ fontSize: 40 }} />}
                                    title="投稿記事数"
                                    value={userAnalytics.overview.total_articles}
                                    color="primary"
                                    subtitle={`最近30日: ${userAnalytics.overview.recent_articles}件`}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                <StatCard
                                    icon={<Visibility sx={{ fontSize: 40 }} />}
                                    title="総閲覧数"
                                    value={userAnalytics.overview.total_views.toLocaleString()}
                                    color="success"
                                    subtitle={`平均: ${userAnalytics.overview.avg_views_per_article}/記事`}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                <StatCard
                                    icon={<ThumbUp sx={{ fontSize: 40 }} />}
                                    title="総いいね数"
                                    value={userAnalytics.overview.total_likes.toLocaleString()}
                                    color="warning"
                                    subtitle={`平均: ${userAnalytics.overview.avg_likes_per_article}/記事`}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                <StatCard
                                    icon={<Comment sx={{ fontSize: 40 }} />}
                                    title="総コメント数"
                                    value={userAnalytics.overview.total_comments.toLocaleString()}
                                    color="info"
                                />
                            </Grid>
                        </Grid>

                        {/* コンテンツグリッド */}
                        <Grid container spacing={3}>
                            {/* 人気記事 */}
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom>
                                            <Star sx={{ mr: 1, verticalAlign: 'middle' }} />
                                            人気記事トップ5
                                        </Typography>
                                        {userAnalytics.popular_articles.length > 0 ? (
                                            <List>
                                                {userAnalytics.popular_articles.map((article, index) => (
                                                    <ListItem key={article.id} divider={index < userAnalytics.popular_articles.length - 1}>
                                                        <ListItemText
                                                            primary={article.title}
                                                            secondary={
                                                                <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                                                                    <Chip
                                                                        icon={<Visibility />}
                                                                        label={article.view_count}
                                                                        size="small"
                                                                        variant="outlined"
                                                                    />
                                                                    <Chip
                                                                        icon={<ThumbUp />}
                                                                        label={article.like_count}
                                                                        size="small"
                                                                        variant="outlined"
                                                                    />
                                                                    <Typography variant="caption" color="text.secondary">
                                                                        {formatDate(article.published_at)}
                                                                    </Typography>
                                                                </Box>
                                                            }
                                                        />
                                                    </ListItem>
                                                ))}
                                            </List>
                                        ) : (
                                            <Typography variant="body2" color="text.secondary">
                                                まだ公開記事がありません
                                            </Typography>
                                        )}
                                    </CardContent>
                                </Card>
                            </Grid>

                            {/* 最近の活動 */}
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom>
                                            <TrendingUp sx={{ mr: 1, verticalAlign: 'middle' }} />
                                            最近の記事
                                        </Typography>
                                        {userAnalytics.recent_activity.length > 0 ? (
                                            <List>
                                                {userAnalytics.recent_activity.slice(0, 5).map((article, index) => (
                                                    <ListItem key={article.id} divider={index < 4}>
                                                        <ListItemText
                                                            primary={article.title}
                                                            secondary={
                                                                <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                                                                    <Chip
                                                                        icon={<Visibility />}
                                                                        label={article.view_count}
                                                                        size="small"
                                                                        variant="outlined"
                                                                    />
                                                                    <Typography variant="caption" color="text.secondary">
                                                                        {formatDate(article.published_at)}
                                                                    </Typography>
                                                                </Box>
                                                            }
                                                        />
                                                    </ListItem>
                                                ))}
                                            </List>
                                        ) : (
                                            <Typography variant="body2" color="text.secondary">
                                                まだ公開記事がありません
                                            </Typography>
                                        )}
                                    </CardContent>
                                </Card>
                            </Grid>

                            {/* 月別統計チャート */}
                            <Grid size={{ xs: 12, md: 8 }}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom>
                                            <ShowChart sx={{ mr: 1, verticalAlign: 'middle' }} />
                                            月別パフォーマンス推移
                                        </Typography>
                                        {userAnalytics.monthly_stats.length > 0 ? (
                                            <Box sx={{ width: '100%', height: 300 }}>
                                                <ResponsiveContainer>
                                                    <LineChart data={userAnalytics.monthly_stats}>
                                                        <CartesianGrid strokeDasharray="3 3" />
                                                        <XAxis dataKey="month" />
                                                        <YAxis />
                                                        <Tooltip />
                                                        <Line
                                                            type="monotone"
                                                            dataKey="articles"
                                                            stroke="#1976d2"
                                                            strokeWidth={2}
                                                            name="記事数"
                                                        />
                                                        <Line
                                                            type="monotone"
                                                            dataKey="views"
                                                            stroke="#2e7d32"
                                                            strokeWidth={2}
                                                            name="閲覧数"
                                                        />
                                                        <Line
                                                            type="monotone"
                                                            dataKey="likes"
                                                            stroke="#ed6c02"
                                                            strokeWidth={2}
                                                            name="いいね数"
                                                        />
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            </Box>
                                        ) : (
                                            <Typography variant="body2" color="text.secondary">
                                                まだ統計データがありません
                                            </Typography>
                                        )}
                                    </CardContent>
                                </Card>
                            </Grid>

                            {/* カテゴリ別統計チャート */}
                            <Grid size={{ xs: 12, md: 4 }}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom>
                                            <Category sx={{ mr: 1, verticalAlign: 'middle' }} />
                                            カテゴリ別記事数
                                        </Typography>
                                        {userAnalytics.category_stats.length > 0 ? (
                                            <Box sx={{ width: '100%', height: 300 }}>
                                                <ResponsiveContainer>
                                                    <PieChart>
                                                        <Pie
                                                            data={userAnalytics.category_stats.map((cat, index) => ({
                                                                name: cat.category__name || '未分類',
                                                                value: cat.count,
                                                                fill: [
                                                                    '#1976d2', '#2e7d32', '#ed6c02', '#d32f2f',
                                                                    '#7b1fa2', '#1565c0', '#388e3c', '#f57c00',
                                                                    '#c62828', '#512da8'
                                                                ][index % 10]
                                                            }))}
                                                            cx="50%"
                                                            cy="50%"
                                                            labelLine={false}
                                                            label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                                                            outerRadius={80}
                                                            fill="#8884d8"
                                                            dataKey="value"
                                                        />
                                                        <Tooltip />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </Box>
                                        ) : (
                                            <Typography variant="body2" color="text.secondary">
                                                まだ統計データがありません
                                            </Typography>
                                        )}
                                    </CardContent>
                                </Card>
                            </Grid>

                            {/* カテゴリ別詳細統計テーブル */}
                            <Grid size={12}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom>
                                            <Category sx={{ mr: 1, verticalAlign: 'middle' }} />
                                            カテゴリ別詳細統計
                                        </Typography>
                                        {userAnalytics.category_stats.length > 0 ? (
                                            <TableContainer>
                                                <Table>
                                                    <TableHead>
                                                        <TableRow>
                                                            <TableCell>カテゴリ</TableCell>
                                                            <TableCell align="right">記事数</TableCell>
                                                            <TableCell align="right">総閲覧数</TableCell>
                                                            <TableCell align="right">総いいね数</TableCell>
                                                            <TableCell align="right">平均閲覧数</TableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {userAnalytics.category_stats.map((category) => (
                                                            <TableRow key={category.category__name || 'uncategorized'}>
                                                                <TableCell>
                                                                    {category.category__name || '未分類'}
                                                                </TableCell>
                                                                <TableCell align="right">{category.count}</TableCell>
                                                                <TableCell align="right">{category.views?.toLocaleString() || 0}</TableCell>
                                                                <TableCell align="right">{category.likes?.toLocaleString() || 0}</TableCell>
                                                                <TableCell align="right">
                                                                    {Math.round((category.views || 0) / Math.max(category.count, 1))}
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                        ) : (
                                            <Typography variant="body2" color="text.secondary">
                                                まだ統計データがありません
                                            </Typography>
                                        )}
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                    </Box>
                )}
            </TabPanel>

            {/* サイト全体分析タブ */}
            {user?.role === 'admin' && (
                <TabPanel value={tabValue} index={1}>
                    {siteAnalytics && (
                        <Box>
                            {/* サイト全体統計カード */}
                            <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
                                サイト全体統計
                            </Typography>
                            <Grid container spacing={3} sx={{ mb: 4 }}>
                                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                    <StatCard
                                        icon={<People sx={{ fontSize: 40 }} />}
                                        title="総ユーザー数"
                                        value={siteAnalytics.overview.total_users}
                                        color="primary"
                                        subtitle={`新規30日: ${siteAnalytics.overview.new_users_30d}人`}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                    <StatCard
                                        icon={<Article sx={{ fontSize: 40 }} />}
                                        title="総記事数"
                                        value={siteAnalytics.overview.total_articles}
                                        color="secondary"
                                        subtitle={`新規30日: ${siteAnalytics.overview.new_articles_30d}件`}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                    <StatCard
                                        icon={<Visibility sx={{ fontSize: 40 }} />}
                                        title="総閲覧数"
                                        value={siteAnalytics.overview.total_views.toLocaleString()}
                                        color="success"
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                    <StatCard
                                        icon={<ThumbUp sx={{ fontSize: 40 }} />}
                                        title="総いいね数"
                                        value={siteAnalytics.overview.total_likes.toLocaleString()}
                                        color="warning"
                                    />
                                </Grid>
                            </Grid>

                            {/* チャートエリア */}
                            <Grid container spacing={3} sx={{ mb: 4 }}>
                                {/* サイト成長チャート */}
                                <Grid size={{ xs: 12, md: 8 }}>
                                    <Card>
                                        <CardContent>
                                            <Typography variant="h6" gutterBottom>
                                                <Timeline sx={{ mr: 1, verticalAlign: 'middle' }} />
                                                サイト成長推移
                                            </Typography>
                                            <Box sx={{ width: '100%', height: 300 }}>
                                                <ResponsiveContainer>
                                                    <LineChart data={siteAnalytics.growth_stats}>
                                                        <CartesianGrid strokeDasharray="3 3" />
                                                        <XAxis dataKey="month" />
                                                        <YAxis />
                                                        <Tooltip />
                                                        <Line
                                                            type="monotone"
                                                            dataKey="new_users"
                                                            stroke="#1976d2"
                                                            strokeWidth={2}
                                                            name="新規ユーザー"
                                                        />
                                                        <Line
                                                            type="monotone"
                                                            dataKey="new_articles"
                                                            stroke="#2e7d32"
                                                            strokeWidth={2}
                                                            name="新規記事"
                                                        />
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>

                                {/* ユーザー役割統計チャート */}
                                <Grid size={{ xs: 12, md: 4 }}>
                                    <Card>
                                        <CardContent>
                                            <Typography variant="h6" gutterBottom>
                                                <People sx={{ mr: 1, verticalAlign: 'middle' }} />
                                                ユーザー役割別統計
                                            </Typography>
                                            <Box sx={{ width: '100%', height: 300 }}>
                                                <ResponsiveContainer>
                                                    <PieChart>
                                                        <Pie
                                                            data={siteAnalytics.user_role_stats.map((role, index) => ({
                                                                name: role.role,
                                                                value: role.count,
                                                                fill: ['#1976d2', '#2e7d32', '#ed6c02', '#d32f2f'][index % 4]
                                                            }))}
                                                            cx="50%"
                                                            cy="50%"
                                                            labelLine={false}
                                                            label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                                                            outerRadius={80}
                                                            fill="#8884d8"
                                                            dataKey="value"
                                                        />
                                                        <Tooltip />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>

                            {/* サイト全体コンテンツ */}
                            <Grid container spacing={3}>
                                {/* アクティブユーザー */}
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Card>
                                        <CardContent>
                                            <Typography variant="h6" gutterBottom>
                                                <Star sx={{ mr: 1, verticalAlign: 'middle' }} />
                                                アクティブ投稿者
                                            </Typography>
                                            <List>
                                                {siteAnalytics.active_authors.slice(0, 5).map((author, index) => (
                                                    <ListItem key={author.id} divider={index < 4}>
                                                        <ListItemText
                                                            primary={`${author.last_name || ''} ${author.first_name || ''} (@${author.username})`}
                                                            secondary={`${author.article_count}記事`}
                                                        />
                                                    </ListItem>
                                                ))}
                                            </List>
                                        </CardContent>
                                    </Card>
                                </Grid>

                                {/* カテゴリ別記事統計 */}
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Card>
                                        <CardContent>
                                            <Typography variant="h6" gutterBottom>
                                                <Category sx={{ mr: 1, verticalAlign: 'middle' }} />
                                                カテゴリ別記事統計
                                            </Typography>
                                            <List>
                                                {siteAnalytics.category_stats.slice(0, 5).map((category, index) => (
                                                    <ListItem key={category.name} divider={index < 4}>
                                                        <ListItemText
                                                            primary={category.name}
                                                            secondary={`${category.article_count}記事 | ${category.total_views?.toLocaleString() || 0}閲覧`}
                                                        />
                                                    </ListItem>
                                                ))}
                                            </List>
                                        </CardContent>
                                    </Card>
                                </Grid>

                                {/* 人気記事全体 */}
                                <Grid size={12}>
                                    <Card>
                                        <CardContent>
                                            <Typography variant="h6" gutterBottom>
                                                <TrendingUp sx={{ mr: 1, verticalAlign: 'middle' }} />
                                                サイト全体の人気記事
                                            </Typography>
                                            <TableContainer>
                                                <Table>
                                                    <TableHead>
                                                        <TableRow>
                                                            <TableCell>タイトル</TableCell>
                                                            <TableCell>著者</TableCell>
                                                            <TableCell align="right">閲覧数</TableCell>
                                                            <TableCell align="right">いいね数</TableCell>
                                                            <TableCell>公開日</TableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {siteAnalytics.popular_articles.slice(0, 10).map((article) => (
                                                            <TableRow key={article.id}>
                                                                <TableCell>{article.title}</TableCell>
                                                                <TableCell>@{article.author__username}</TableCell>
                                                                <TableCell align="right">{article.view_count.toLocaleString()}</TableCell>
                                                                <TableCell align="right">{article.like_count.toLocaleString()}</TableCell>
                                                                <TableCell>{formatDate(article.published_at)}</TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>
                        </Box>
                    )}
                </TabPanel>
            )}
        </Container>
    )
} 