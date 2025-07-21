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
    Divider,
    ToggleButton,
    ToggleButtonGroup,
} from '@mui/material'
import {
    Search,
    CalendarMonth,
    Visibility,
    ThumbUp,
    ChatBubbleOutline,
    FilterList,
    GridView,
    ViewList,
    Sort,
} from '@mui/icons-material'
import { formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'
import Link from 'next/link'
import useSWR from 'swr'
import { getPublicArticles, getTags } from '../../lib/services/blog'
import { Article, Tag } from '../../types'

export default function ArticlesPage() {
    const [searchQuery, setSearchQuery] = useState('')
    const [page, setPage] = useState(1)

    const [selectedTag, setSelectedTag] = useState<number | ''>('')
    const [ordering, setOrdering] = useState('-published_at')
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
    const [showFilters, setShowFilters] = useState(false)

    const { data: articlesData, error: articlesError, isLoading: articlesLoading } = useSWR(
        ['public-articles', {
            search: searchQuery,
            page,
            ordering,
            tags: selectedTag ? [selectedTag] : undefined,
        }],
        ([_, params]) => getPublicArticles(params),
        {
            revalidateOnFocus: false,
        }
    )


    const { data: tagsData } = useSWR('tags', () => getTags({}))

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



    const handleTagChange = (tagId: number | '') => {
        setSelectedTag(tagId)
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

    const clearFilters = () => {
        setSearchQuery('')
        setSelectedTag('')
        setOrdering('-published_at')
        setPage(1)
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

    const articles = articlesData?.results || []
    const totalPages = articlesData ? Math.ceil(articlesData.count / 12) : 0
    const tags = tagsData?.results || []

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            {/* ヘッダー */}
            <Box mb={4}>
                <Typography variant="h3" component="h1" gutterBottom>
                    記事一覧
                </Typography>
                <Typography variant="h6" color="text.secondary" mb={3}>
                    {articlesData && `${articlesData.count}件の記事が見つかりました`}
                </Typography>

                {/* 検索とフィルター */}
                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        {/* 検索ボックス */}
                        <Box mb={3}>
                            <TextField
                                fullWidth
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
                            />
                        </Box>

                        {/* フィルターとビュー切り替え */}
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                            <Button
                                startIcon={<FilterList />}
                                onClick={() => setShowFilters(!showFilters)}
                                variant={showFilters ? "contained" : "outlined"}
                            >
                                フィルター
                            </Button>

                            <Box display="flex" gap={2} alignItems="center">
                                {/* 並び順 */}
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

                                {/* ビュー切り替え */}
                                <ToggleButtonGroup
                                    value={viewMode}
                                    exclusive
                                    onChange={(e, newMode) => newMode && setViewMode(newMode)}
                                    size="small"
                                >
                                    <ToggleButton value="grid">
                                        <GridView />
                                    </ToggleButton>
                                    <ToggleButton value="list">
                                        <ViewList />
                                    </ToggleButton>
                                </ToggleButtonGroup>
                            </Box>
                        </Box>

                        {/* 詳細フィルター */}
                        {showFilters && (
                            <>
                                <Divider sx={{ mb: 2 }} />
                                <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
                                    <FormControl size="small" sx={{ minWidth: 150 }}>
                                        <InputLabel>タグ</InputLabel>
                                        <Select
                                            value={selectedTag}
                                            label="タグ"
                                            onChange={(e) => handleTagChange(e.target.value as number | '')}
                                        >
                                            <MenuItem value="">すべて</MenuItem>
                                            {tags.map((tag: Tag) => (
                                                <MenuItem key={tag.id} value={tag.id}>
                                                    {tag.name}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>

                                    <Button
                                        variant="outlined"
                                        size="small"
                                        onClick={clearFilters}
                                    >
                                        フィルタークリア
                                    </Button>
                                </Box>
                            </>
                        )}
                    </CardContent>
                </Card>
            </Box>

            {/* ローディング */}
            {articlesLoading && (
                <Box display="flex" justifyContent="center" py={4}>
                    <CircularProgress />
                </Box>
            )}

            {/* 記事一覧 */}
            {!articlesLoading && articles.length > 0 && (
                <>
                    {viewMode === 'grid' ? (
                        // グリッドビュー
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
                                        {/* 注目記事バッジ */}
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
                                                onClick={(e) => {
                                                    e.preventDefault()
                                                    window.location.href = `/articles/${article.slug}`
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
                                            onClick={(e) => {
                                                e.preventDefault()
                                                window.location.href = `/articles/${article.slug}`
                                            }}
                                        >
                                            続きを読む
                                        </Button>
                                    </Box>
                                </Card>
                            ))}
                        </Box>
                    ) : (
                        // リストビュー
                        <Box sx={{ mb: 4 }}>
                            {articles.map((article: Article, index: number) => (
                                <Card key={article.id} sx={{ mb: 2 }}>
                                    <CardContent>
                                        <Grid container spacing={2}>
                                            {article.featured_image && (
                                                <Grid size={{ xs: 12, sm: 3 }}>
                                                    <CardMedia
                                                        component="img"
                                                        height="120"
                                                        image={article.featured_image}
                                                        alt={article.featured_image_alt || article.title}
                                                        sx={{ objectFit: 'cover', borderRadius: 1 }}
                                                    />
                                                </Grid>
                                            )}
                                            <Grid size={{ xs: 12, sm: article.featured_image ? 9 : 12 }}>
                                                {/* 注目記事バッジ */}
                                                <Stack direction="row" spacing={1} mb={1}>
                                                    {article.is_featured && (
                                                        <Chip
                                                            label="注目"
                                                            size="small"
                                                            color="error"
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
                                                        onClick={(e) => {
                                                            e.preventDefault()
                                                            window.location.href = `/articles/${article.slug}`
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
                                                            WebkitLineClamp: 2,
                                                            WebkitBoxOrient: 'vertical',
                                                            overflow: 'hidden',
                                                        }}
                                                    >
                                                        {article.excerpt}
                                                    </Typography>
                                                )}

                                                {/* メタ情報 */}
                                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                                    <Box display="flex" alignItems="center" gap={1}>
                                                        <Avatar
                                                            src={getAvatarSrc(article.author)}
                                                            alt={article.author.username}
                                                            sx={{ width: 20, height: 20 }}
                                                        />
                                                        <Typography variant="caption" color="text.secondary">
                                                            {article.author.username} • {formatDate(article.published_at || article.created_at)}
                                                        </Typography>
                                                    </Box>

                                                    <Stack direction="row" spacing={2}>
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
                                                </Box>
                                            </Grid>
                                        </Grid>
                                    </CardContent>
                                </Card>
                            ))}
                        </Box>
                    )}

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
            {!articlesLoading && articles.length === 0 && (
                <Box textAlign="center" py={8}>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        記事が見つかりませんでした
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mb={3}>
                        検索条件を変更してお試しください
                    </Typography>
                    <Button variant="outlined" onClick={clearFilters}>
                        フィルターをクリア
                    </Button>
                </Box>
            )}
        </Container>
    )
} 