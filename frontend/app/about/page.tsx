'use client'

import React from 'react'
import {
    Container,
    Typography,
    Box,
    Card,
    CardContent,
    Grid,
    Chip,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Avatar,
    Divider,
    Paper,
} from '@mui/material'
import {
    Article as ArticleIcon,
    People as PeopleIcon,
    Category as CategoryIcon,
    Comment as CommentIcon,
    Search as SearchIcon,
    Favorite as FavoriteIcon,
    Security as SecurityIcon,
    Speed as SpeedIcon,
    Smartphone as MobileIcon,
    Code as CodeIcon,
    CheckCircle,
} from '@mui/icons-material'

export default function AboutPage() {
    const features = [
        {
            icon: <ArticleIcon color="primary" />,
            title: '記事管理',
            description: 'マークダウン形式での記事作成・編集・公開機能'
        },
        {
            icon: <CategoryIcon color="primary" />,
            title: 'タグ',
            description: '記事を整理するためのタグ機能'
        },
        {
            icon: <CommentIcon color="primary" />,
            title: 'コメント機能',
            description: '読者との交流を促進するコメント機能'
        },
        {
            icon: <SearchIcon color="primary" />,
            title: '検索・フィルタ',
            description: '高性能な記事検索とフィルタリング機能'
        },
        {
            icon: <PeopleIcon color="primary" />,
            title: '権限管理',
            description: '管理者・編集者・投稿者・読者の4段階権限システム'
        },
        {
            icon: <FavoriteIcon color="primary" />,
            title: 'いいね機能',
            description: '記事への評価とエンゲージメント向上'
        },
        {
            icon: <SecurityIcon color="primary" />,
            title: 'セキュリティ',
            description: 'JWT認証による安全なユーザー管理'
        },
        {
            icon: <SpeedIcon color="primary" />,
            title: 'パフォーマンス',
            description: '高速な記事読み込みと最適化されたUI/UX'
        },
        {
            icon: <MobileIcon color="primary" />,
            title: 'レスポンシブ',
            description: 'モバイル・タブレット・デスクトップ対応'
        }
    ]

    const techStack = [
        { category: 'フロントエンド', items: ['Next.js', 'React', 'TypeScript', 'Material-UI'] },
        { category: 'バックエンド', items: ['Django', 'Django REST Framework', 'Python'] },
        { category: 'データベース', items: ['SQLite (開発)', 'PostgreSQL (本番想定)'] },
        { category: '認証', items: ['JWT', 'Simple JWT'] },
        { category: 'その他', items: ['SWR', 'Axios', 'date-fns'] }
    ]

    const userRoles = [
        {
            role: '管理者',
            description: 'すべての機能にアクセス可能。ユーザー管理、記事管理、サイト設定など',
            color: 'error'
        },
        {
            role: '編集者',
            description: '記事の作成・編集・公開・削除が可能。他のユーザーの記事も編集可能',
            color: 'warning'
        },
        {
            role: '投稿者',
            description: '記事の作成・編集が可能。自分の記事のみ管理できる',
            color: 'info'
        },
        {
            role: '読者',
            description: '記事の閲覧・コメント・いいねが可能',
            color: 'success'
        }
    ]

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            {/* ヘッダー */}
            <Box textAlign="center" mb={6}>
                <Typography variant="h2" component="h1" gutterBottom>
                    このサイトについて
                </Typography>
                <Typography variant="h5" color="text.secondary" paragraph>
                    モダンなブログ管理システム
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 800, mx: 'auto' }}>
                    このサイトは、Next.jsとDjangoを組み合わせた高機能なブログプラットフォームです。
                    記事の作成・管理から読者との交流まで、ブログ運営に必要な機能を包括的に提供します。
                </Typography>
            </Box>

            {/* 主な機能 */}
            <Box mb={6}>
                <Typography variant="h4" component="h2" gutterBottom mb={3}>
                    主な機能
                </Typography>
                <Grid container spacing={3}>
                    {features.map((feature, index) => (
                        <Grid key={index} size={{ xs: 12, md: 4 }}>
                            <Card sx={{ height: '100%' }}>
                                <CardContent>
                                    <Box display="flex" alignItems="center" mb={2}>
                                        <Avatar sx={{ bgcolor: 'primary.light', mr: 2 }}>
                                            {feature.icon}
                                        </Avatar>
                                        <Typography variant="h6" component="h3">
                                            {feature.title}
                                        </Typography>
                                    </Box>
                                    <Typography variant="body2" color="text.secondary">
                                        {feature.description}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Box>

            {/* ユーザー権限 */}
            <Box mb={6}>
                <Typography variant="h4" component="h2" gutterBottom mb={3}>
                    ユーザー権限システム
                </Typography>
                <Grid container spacing={3}>
                    {userRoles.map((roleInfo, index) => (
                        <Grid key={index} size={{ xs: 12, sm: 6 }}>
                            <Card>
                                <CardContent>
                                    <Box display="flex" alignItems="center" mb={2}>
                                        <Chip
                                            label={roleInfo.role}
                                            color={roleInfo.color as any}
                                            sx={{ mr: 2 }}
                                        />
                                    </Box>
                                    <Typography variant="body2" color="text.secondary">
                                        {roleInfo.description}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Box>

            {/* 技術スタック */}
            <Box mb={6}>
                <Typography variant="h4" component="h2" gutterBottom mb={3}>
                    技術スタック
                </Typography>
                <Grid container spacing={3}>
                    {techStack.map((stack, index) => (
                        <Grid key={index} size={{ xs: 12, md: 6 }}>
                            <Paper sx={{ p: 3 }}>
                                <Typography variant="h6" component="h3" gutterBottom>
                                    {stack.category}
                                </Typography>
                                <Box display="flex" flexWrap="wrap" gap={1}>
                                    {stack.items.map((item, itemIndex) => (
                                        <Chip
                                            key={itemIndex}
                                            label={item}
                                            variant="outlined"
                                            size="small"
                                        />
                                    ))}
                                </Box>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>
            </Box>

            {/* サイトの特徴 */}
            <Box mb={6}>
                <Typography variant="h4" component="h2" gutterBottom mb={3}>
                    サイトの特徴
                </Typography>
                <Card>
                    <CardContent>
                        <List>
                            <ListItem>
                                <ListItemIcon>
                                    <CheckCircle color="success" />
                                </ListItemIcon>
                                <ListItemText
                                    primary="モダンなUI/UX"
                                    secondary="Material-UIを使用した直感的で美しいインターフェース"
                                />
                            </ListItem>
                            <Divider />
                            <ListItem>
                                <ListItemIcon>
                                    <CheckCircle color="success" />
                                </ListItemIcon>
                                <ListItemText
                                    primary="SEO最適化"
                                    secondary="Next.jsのSSRとメタタグ最適化によるSEO対応"
                                />
                            </ListItem>
                            <Divider />
                            <ListItem>
                                <ListItemIcon>
                                    <CheckCircle color="success" />
                                </ListItemIcon>
                                <ListItemText
                                    primary="API駆動設計"
                                    secondary="RESTful APIによる拡張性の高いアーキテクチャ"
                                />
                            </ListItem>
                            <Divider />
                            <ListItem>
                                <ListItemIcon>
                                    <CheckCircle color="success" />
                                </ListItemIcon>
                                <ListItemText
                                    primary="マークダウン対応"
                                    secondary="記事作成にマークダウン記法を使用可能"
                                />
                            </ListItem>
                            <Divider />
                            <ListItem>
                                <ListItemIcon>
                                    <CheckCircle color="success" />
                                </ListItemIcon>
                                <ListItemText
                                    primary="画像アップロード"
                                    secondary="記事用画像やアバターのアップロード機能"
                                />
                            </ListItem>
                        </List>
                    </CardContent>
                </Card>
            </Box>

            {/* 開発情報 */}
            <Box mb={6}>
                <Typography variant="h4" component="h2" gutterBottom mb={3}>
                    開発情報
                </Typography>
                <Card>
                    <CardContent>
                        <Grid container spacing={3}>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Typography variant="h6" gutterBottom>
                                    開発コンセプト
                                </Typography>
                                <Typography variant="body2" color="text.secondary" paragraph>
                                    このプロジェクトは、現代的なWeb開発技術を使用して構築された
                                    ブログプラットフォームです。フロントエンドとバックエンドを
                                    分離したアーキテクチャにより、スケーラビリティと保守性を
                                    重視した設計となっています。
                                </Typography>
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Typography variant="h6" gutterBottom>
                                    今後の予定
                                </Typography>
                                <List dense>
                                    <ListItem>
                                        <ListItemText primary="• リアルタイム通知機能" />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemText primary="• 記事のシェア機能" />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemText primary="• 詳細な分析ダッシュボード" />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemText primary="• 多言語対応" />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemText primary="• PWA対応" />
                                    </ListItem>
                                </List>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
            </Box>

            {/* お問い合わせ */}
            <Box textAlign="center">
                <Card>
                    <CardContent>
                        <Typography variant="h5" component="h2" gutterBottom>
                            お問い合わせ
                        </Typography>
                        <Typography variant="body1" color="text.secondary" paragraph>
                            このサイトに関するご質問やご意見がございましたら、
                            お気軽にお問い合わせください。
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            管理者メール: admin@example.com
                        </Typography>
                    </CardContent>
                </Card>
            </Box>
        </Container>
    )
} 