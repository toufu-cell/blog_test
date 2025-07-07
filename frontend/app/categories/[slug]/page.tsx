'use client'

import React, { useState } from 'react'
import {
    Container,
    Typography,
    Box,
    Card,
    CardContent,
    CardMedia,
    Grid,
    Chip,
    Button,
    Stack,
    Avatar,
    CircularProgress,
    Alert,
    TextField,
    InputAdornment,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Pagination,
    Breadcrumbs,
} from '@mui/material'
import {
    Search,
    CalendarMonth,
    Visibility,
    ThumbUp,
    ChatBubbleOutline,
    Category as CategoryIcon,
    Home,
} from '@mui/icons-material'
import { formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'
import Link from 'next/link'
import useSWR from 'swr'
import { getPublicArticles, getCategories } from '../../../lib/services/blog'
import { Article, Category } from '../../../types'

interface CategoryPageProps {
    params: {
        slug: string
    }
}

export default function CategoryPage({ params }: CategoryPageProps) {
    const [searchQuery, setSearchQuery] = useState('')
    const [page, setPage] = useState(1)
    const [ordering, setOrdering] = useState('-published_at')

    // カテゴリ情報取得
    const { data: categoriesData } = useSWR(
        ['categories', { search: params.slug }],
        ([_, queryParams]) => getCategories(queryParams)
    )

    const category = categoriesData?.results?.find((cat: Category) => cat.slug === params.slug)

    // カテゴリの記事一覧取得
    const { data: articlesData, error: articlesError, isLoading: articlesLoading } = useSWR(
        category ? ['public-articles', {
            search: searchQuery,
            page,
            ordering,
            category: category.id,
        }] : null,
        ([_, queryParams]) => getPublicArticles(queryParams),
        {
            revalidateOnFocus: false,
        }
    )

    const formatDate = (dateString: string) => {
        return formatDistanceToNow(new Date(dateString), {
            addSuffix: true,
            locale: ja
        })
    }

    const getAvatarSrc = (author: any) => {
        return author.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(author.username)}&background=random`
    }

    const handleSearch = (query: string) => {
        setSearchQuery(query)
        setPage(1)
    }

    const handleOrderingChange = (newOrdering: string) => {
        setOrdering(newOrdering)
        setPage(1)
    }

    const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
        setPage(value)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    if (articlesError) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Alert severity="error">
                    記事の読み込みでエラーが発生しました
                </Alert>
            </Container>
        )
    }

    if (!category && categoriesData) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Alert severity="error">
                    カテゴリが見つかりませんでした
                </Alert>
            </Container>
        )
    }

    const articles = articlesData?.results || []
    const totalPages = articlesData ? Math.ceil(articlesData.count / 12) : 0

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            {/* パンくずリスト */}
            <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
                <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <Box display="flex" alignItems="center" gap={0.5}>
                        <Home fontSize="small" />
                        <Typography variant="body2">ホーム</Typography>
                    </Box>
                </Link>
                <Link href="/categories" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <Typography variant="body2">カテゴリ</Typography>
                </Link>
                {category && (
                    <Typography variant="body2" color="text.primary">
                        {category.name}
                    </Typography>
                )}
            </Breadcrumbs>

            {/* カテゴリヘッダー */}
            {category && (
                <Card sx={{ mb: 4 }}>
                    <CardContent>
                        <Box display="flex" alignItems="center" mb={2}>
                            <Avatar
                                sx={{
                                    bgcolor: category.color || 'primary.main',
                                    width: 64,
                                    height: 64,
                                    mr: 3,
                                }}
                            >
                                <CategoryIcon fontSize="large" />
                            </Avatar>
                            <Box>
                                <Typography variant="h3" component="h1" gutterBottom>
                                    {category.name}
                                </Typography>
                                <Typography variant="h6" color="text.secondary">
                                    {articlesData && `${articlesData.count}件の記事`}
                                </Typography>
                            </Box>
                        </Box>

                        {category.description && (
                            <Typography variant="body1" color="text.secondary" paragraph>
                                {category.description}
                            </Typography>
                        )}

                        {/* 親カテゴリ - 現在はIDのみ返されるため表示しない */}
                    </CardContent>
                </Card>
            )}

            {/* 検索とフィルター */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
                        <TextField
                            placeholder="記事を検索..."
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{ minWidth: 300, flexGrow: 1 }}
                        />

                        <FormControl size="small" sx={{ minWidth: 150 }}>
                            <InputLabel>並び順</InputLabel>
                            <Select
                                value={ordering}
                                label="並び順"
                                onChange={(e) => handleOrderingChange(e.target.value)}
                            >
                                <MenuItem value="-published_at">新着順</MenuItem>
                                <MenuItem value="published_at">古い順</MenuItem>
                                <MenuItem value="-view_count">人気順</MenuItem>
                                <MenuItem value="-like_count">いいね順</MenuItem>
                                <MenuItem value="-comment_count">コメント順</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                </CardContent>
            </Card>

            {/* ローディング */}
            {articlesLoading && (
                <Box display="flex" justifyContent="center" py={4}>
                    <CircularProgress />
                </Box>
            )}

            {/* 記事一覧 */}
            {!articlesLoading && articles.length > 0 && (
                <>
                    <Box sx={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                        gap: 3,
                        mb: 4
                    }}>
                        {articles.map((article: Article) => (
                            <Card key={article.id} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                {article.featured_image && (
                                    <CardMedia
                                        component="img"
                                        height="200"
                                        image={article.featured_image}
                                        alt={article.featured_image_alt || article.title}
                                        sx={{ objectFit: 'cover' }}
                                    />
                                )}

                                <CardContent sx={{ flexGrow: 1 }}>
                                    {/* 注目記事・ピン留めバッジ */}
                                    <Stack direction="row" spacing={1} mb={2}>
                                        {article.is_featured && (
                                            <Chip
                                                label="注目"
                                                size="small"
                                                color="error"
                                                variant="filled"
                                            />
                                        )}
                                        {article.is_pinned && (
                                            <Chip
                                                label="ピン留め"
                                                size="small"
                                                color="warning"
                                                variant="filled"
                                            />
                                        )}
                                    </Stack>

                                    {/* タイトル */}
                                    <Typography variant="h6" component="h2" gutterBottom>
                                        <Link
                                            href={`/articles/${article.slug}`}
                                            style={{
                                                textDecoration: 'none',
                                                color: 'inherit'
                                            }}
                                        >
                                            {article.title}
                                        </Link>
                                    </Typography>

                                    {/* 抜粋 */}
                                    {article.excerpt && (
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            paragraph
                                            sx={{
                                                display: '-webkit-box',
                                                WebkitLineClamp: 3,
                                                WebkitBoxOrient: 'vertical',
                                                overflow: 'hidden',
                                            }}
                                        >
                                            {article.excerpt}
                                        </Typography>
                                    )}

                                    {/* 著者情報 */}
                                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                                        <Avatar
                                            src={getAvatarSrc(article.author)}
                                            alt={article.author.username}
                                            sx={{ width: 24, height: 24 }}
                                        />
                                        <Typography variant="caption" color="text.secondary">
                                            {article.author.username}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            •
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {formatDate(article.published_at || article.created_at)}
                                        </Typography>
                                    </Box>

                                    {/* タグ */}
                                    <Stack direction="row" spacing={0.5} mb={2} flexWrap="wrap">
                                        {article.tags.slice(0, 3).map((tag) => (
                                            <Chip
                                                key={tag.id}
                                                label={tag.name}
                                                size="small"
                                                variant="outlined"
                                            />
                                        ))}
                                        {article.tags.length > 3 && (
                                            <Chip
                                                label={`+${article.tags.length - 3}`}
                                                size="small"
                                                variant="outlined"
                                            />
                                        )}
                                    </Stack>

                                    {/* 統計情報 */}
                                    <Stack direction="row" spacing={2} alignItems="center">
                                        <Box display="flex" alignItems="center" gap={0.5}>
                                            <Visibility fontSize="small" color="disabled" />
                                            <Typography variant="caption" color="text.secondary">
                                                {article.view_count}
                                            </Typography>
                                        </Box>
                                        <Box display="flex" alignItems="center" gap={0.5}>
                                            <ThumbUp fontSize="small" color="disabled" />
                                            <Typography variant="caption" color="text.secondary">
                                                {article.like_count}
                                            </Typography>
                                        </Box>
                                        <Box display="flex" alignItems="center" gap={0.5}>
                                            <ChatBubbleOutline fontSize="small" color="disabled" />
                                            <Typography variant="caption" color="text.secondary">
                                                {article.comment_count}
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </CardContent>

                                <Box p={2} pt={0}>
                                    <Button
                                        component={Link}
                                        href={`/articles/${article.slug}`}
                                        variant="outlined"
                                        fullWidth
                                    >
                                        続きを読む
                                    </Button>
                                </Box>
                            </Card>
                        ))}
                    </Box>

                    {/* ページネーション */}
                    {totalPages > 1 && (
                        <Box display="flex" justifyContent="center" mt={4}>
                            <Pagination
                                count={totalPages}
                                page={page}
                                onChange={handlePageChange}
                                color="primary"
                                size="large"
                                showFirstButton
                                showLastButton
                            />
                        </Box>
                    )}
                </>
            )}

            {/* 記事なし */}
            {!articlesLoading && articles.length === 0 && category && (
                <Box textAlign="center" py={8}>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        このカテゴリには記事がまだありません
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mb={3}>
                        他のカテゴリをご覧ください
                    </Typography>
                    <Button
                        component={Link}
                        href="/categories"
                        variant="outlined"
                    >
                        カテゴリ一覧へ
                    </Button>
                </Box>
            )}
        </Container>
    )
} 