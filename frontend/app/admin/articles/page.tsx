'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Chip,
    Avatar,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Pagination,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    CircularProgress,
    Container,
    Menu,
    ListItemIcon,
    ListItemText,
} from '@mui/material'
import {
    Add,
    Edit,
    Delete,
    Visibility,
    MoreVert,
    Search,
    FilterList,
    Star,
    StarBorder,
    PushPin,
    Publish,
    Public,
    Lock,
    Schedule,
} from '@mui/icons-material'
import { useAuth } from '@/lib/contexts/AuthContext'
import { blogService } from '@/lib/services/blog'
import { Article, Tag, SearchFilters } from '@/types'

export default function ArticlesManagePage() {
    const router = useRouter()
    const { user, isAuthenticated, isLoading } = useAuth()
    const [articles, setArticles] = useState<Article[]>([])
    const [tags, setTags] = useState<Tag[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    // フィルタリング・検索
    const [filters, setFilters] = useState<SearchFilters>({
        search: '',
        status: '',
        tags: [],
        is_featured: undefined,
        ordering: '-created_at',
        page: 1,
    })

    // ページネーション
    const [totalCount, setTotalCount] = useState(0)
    const [totalPages, setTotalPages] = useState(0)

    // UI状態
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
    const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    // 認証チェック
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.replace('/auth/login')
        }
    }, [isAuthenticated, isLoading, router])

    // データ取得
    useEffect(() => {
        if (isAuthenticated) {
            loadData()
        }
    }, [isAuthenticated, filters])

    // タグの取得
    useEffect(() => {
        if (isAuthenticated) {
            loadTags()
        }
    }, [isAuthenticated])

    const loadData = async () => {
        try {
            setLoading(true)
            setError(null)
            const response = await blogService.getArticles(filters)
            setArticles(response.results)
            setTotalCount(response.count)
            setTotalPages(Math.ceil(response.count / 20)) // 20件/ページと仮定
        } catch (err: any) {
            setError(err.response?.data?.message || '記事の取得に失敗しました')
        } finally {
            setLoading(false)
        }
    }

    const loadTags = async () => {
        try {
            const tagsResponse = await blogService.getTags()
            setTags(tagsResponse.results)
        } catch (err) {
            console.error('タグの取得に失敗:', err)
        }
    }

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFilters({ ...filters, search: e.target.value, page: 1 })
    }

    const handleStatusChange = (e: any) => {
        setFilters({ ...filters, status: e.target.value, page: 1 })
    }



    const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
        setFilters({ ...filters, page: value })
    }

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, article: Article) => {
        setAnchorEl(event.currentTarget)
        setSelectedArticle(article)
    }

    const handleMenuClose = () => {
        setAnchorEl(null)
        setSelectedArticle(null)
    }

    const handleToggleFeatured = async (article: Article) => {
        try {
            setSubmitting(true)
            await blogService.toggleArticleFeatured(article.id)
            setSuccess(`記事を${article.is_featured ? '注目解除' : '注目設定'}しました`)
            await loadData()
        } catch (err: any) {
            setError(err.response?.data?.message || '操作に失敗しました')
        } finally {
            setSubmitting(false)
        }
        handleMenuClose()
    }

    const handleTogglePin = async (article: Article) => {
        try {
            setSubmitting(true)
            await blogService.toggleArticlePin(article.id)
            setSuccess(`記事を${article.is_pinned ? 'ピン解除' : 'ピン留め'}しました`)
            await loadData()
        } catch (err: any) {
            setError(err.response?.data?.message || '操作に失敗しました')
        } finally {
            setSubmitting(false)
        }
        handleMenuClose()
    }

    const handleDeleteClick = (article: Article) => {
        setSelectedArticle(article)
        setDeleteDialogOpen(true)
        handleMenuClose()
    }

    const handleDelete = async () => {
        if (!selectedArticle) return

        try {
            setSubmitting(true)
            await blogService.deleteArticle(selectedArticle.id)
            setSuccess('記事を削除しました')
            await loadData()
        } catch (err: any) {
            setError(err.response?.data?.message || '削除に失敗しました')
        } finally {
            setSubmitting(false)
            setDeleteDialogOpen(false)
            setSelectedArticle(null)
        }
    }

    const getStatusChip = (status: string) => {
        const statusConfig = {
            published: { label: '公開', color: 'success' as const, icon: <Public /> },
            draft: { label: '下書き', color: 'default' as const, icon: <Edit /> },
            private: { label: '非公開', color: 'error' as const, icon: <Lock /> },
            scheduled: { label: '予約投稿', color: 'warning' as const, icon: <Schedule /> },
        }

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft

        return (
            <Chip
                icon={config.icon}
                label={config.label}
                color={config.color}
                size="small"
            />
        )
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    if (isLoading) {
        return (
            <Container maxWidth="xl">
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
        <Container maxWidth="xl" sx={{ py: 4 }}>
            {/* ヘッダー */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box>
                    <Typography variant="h4" component="h1">
                        {user?.role === 'admin' ? '記事管理' : '自分の記事管理'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {user?.role === 'admin'
                            ? 'サイト全体の記事を管理・公開できます'
                            : '自分の記事を管理・公開できます'
                        }
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    component={Link}
                    href="/admin/articles/new"
                    size="large"
                >
                    新しい記事を作成
                </Button>
            </Box>

            {/* エラー・成功メッセージ */}
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

            {/* フィルタリング */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 2 }}>
                        <TextField
                            label="検索"
                            value={filters.search}
                            onChange={handleSearchChange}
                            placeholder="タイトル、内容で検索..."
                            InputProps={{
                                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                            }}
                        />

                        <FormControl>
                            <InputLabel>状態</InputLabel>
                            <Select
                                value={filters.status || ''}
                                onChange={handleStatusChange}
                                label="状態"
                            >
                                <MenuItem value="">すべて</MenuItem>
                                <MenuItem value="published">公開</MenuItem>
                                <MenuItem value="draft">下書き</MenuItem>
                                <MenuItem value="private">非公開</MenuItem>
                                <MenuItem value="scheduled">予約投稿</MenuItem>
                            </Select>
                        </FormControl>



                        <Button
                            variant="outlined"
                            startIcon={<FilterList />}
                            onClick={() => setFilters({
                                search: '',
                                status: '',
                                tags: [],
                                is_featured: undefined,
                                ordering: '-created_at',
                                page: 1,
                            })}
                        >
                            リセット
                        </Button>
                    </Box>
                </CardContent>
            </Card>

            {/* 記事一覧 */}
            <Card>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>タイトル</TableCell>
                                <TableCell>著者</TableCell>
                                <TableCell>状態</TableCell>
                                <TableCell>統計</TableCell>
                                <TableCell>更新日</TableCell>
                                <TableCell>操作</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
                                        <CircularProgress />
                                    </TableCell>
                                </TableRow>
                            ) : articles.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
                                        記事が見つかりませんでした
                                    </TableCell>
                                </TableRow>
                            ) : (
                                articles.map((article) => (
                                    <TableRow key={article.id} hover>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                {article.featured_image && (
                                                    <Avatar
                                                        src={article.featured_image}
                                                        sx={{ width: 40, height: 40 }}
                                                        variant="rounded"
                                                    />
                                                )}
                                                <Box>
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                                        {article.title}
                                                        {article.is_featured && (
                                                            <Star sx={{ ml: 1, fontSize: 16, color: 'warning.main' }} />
                                                        )}
                                                        {article.is_pinned && (
                                                            <PushPin sx={{ ml: 1, fontSize: 16, color: 'primary.main' }} />
                                                        )}
                                                    </Typography>
                                                    {article.excerpt && (
                                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                                            {article.excerpt.substring(0, 60)}...
                                                        </Typography>
                                                    )}
                                                </Box>
                                            </Box>
                                        </TableCell>

                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Avatar src={article.author.avatar} sx={{ width: 24, height: 24 }}>
                                                    {article.author.username[0]}
                                                </Avatar>
                                                <Typography variant="body2">
                                                    {article.author.first_name && article.author.last_name
                                                        ? `${article.author.last_name} ${article.author.first_name}`
                                                        : article.author.username
                                                    }
                                                </Typography>
                                            </Box>
                                        </TableCell>



                                        <TableCell>
                                            {getStatusChip(article.status)}
                                        </TableCell>

                                        <TableCell>
                                            <Box sx={{ display: 'flex', gap: 2, fontSize: '0.875rem' }}>
                                                <Tooltip title="閲覧数">
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                        <Visibility sx={{ fontSize: 16 }} />
                                                        {article.view_count}
                                                    </Box>
                                                </Tooltip>
                                                <Tooltip title="いいね数">
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                        <Star sx={{ fontSize: 16 }} />
                                                        {article.like_count}
                                                    </Box>
                                                </Tooltip>
                                            </Box>
                                        </TableCell>

                                        <TableCell>
                                            <Typography variant="body2" color="text.secondary">
                                                {formatDate(article.updated_at)}
                                            </Typography>
                                        </TableCell>

                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                {/* 編集ボタン：自分の記事または管理者 */}
                                                {(article.author.id === user?.id || user?.role === 'admin') && (
                                                    <Tooltip title="編集">
                                                        <IconButton
                                                            component={Link}
                                                            href={`/admin/articles/${article.id}/edit`}
                                                            size="small"
                                                        >
                                                            <Edit />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}

                                                {/* プレビューボタン：全員 */}
                                                <Tooltip title="プレビュー">
                                                    <IconButton
                                                        component={Link}
                                                        href={`/articles/${article.slug}`}
                                                        target="_blank"
                                                        size="small"
                                                    >
                                                        <Visibility />
                                                    </IconButton>
                                                </Tooltip>

                                                {/* その他のアクション：自分の記事または管理者 */}
                                                {(article.author.id === user?.id || user?.role === 'admin') && (
                                                    <IconButton
                                                        onClick={(e) => handleMenuOpen(e, article)}
                                                        size="small"
                                                    >
                                                        <MoreVert />
                                                    </IconButton>
                                                )}
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* ページネーション */}
                {totalPages > 1 && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                        <Pagination
                            count={totalPages}
                            page={filters.page || 1}
                            onChange={handlePageChange}
                            color="primary"
                        />
                    </Box>
                )}
            </Card>

            {/* アクションメニュー */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
            >
                {/* 注目設定・ピン留めは管理者のみ */}
                {user?.role === 'admin' && (
                    <>
                        <MenuItem onClick={() => selectedArticle && handleToggleFeatured(selectedArticle)}>
                            <ListItemIcon>
                                {selectedArticle?.is_featured ? <StarBorder /> : <Star />}
                            </ListItemIcon>
                            <ListItemText>
                                {selectedArticle?.is_featured ? '注目解除' : '注目設定'}
                            </ListItemText>
                        </MenuItem>

                        <MenuItem onClick={() => selectedArticle && handleTogglePin(selectedArticle)}>
                            <ListItemIcon>
                                <PushPin />
                            </ListItemIcon>
                            <ListItemText>
                                {selectedArticle?.is_pinned ? 'ピン解除' : 'ピン留め'}
                            </ListItemText>
                        </MenuItem>
                    </>
                )}

                {/* 削除は自分の記事または管理者 */}
                {(selectedArticle?.author.id === user?.id || user?.role === 'admin') && (
                    <MenuItem onClick={() => selectedArticle && handleDeleteClick(selectedArticle)}>
                        <ListItemIcon>
                            <Delete color="error" />
                        </ListItemIcon>
                        <ListItemText>削除</ListItemText>
                    </MenuItem>
                )}
            </Menu>

            {/* 削除確認ダイアログ */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle>記事を削除</DialogTitle>
                <DialogContent>
                    <Typography>
                        「{selectedArticle?.title}」を削除してもよろしいですか？
                        この操作は取り消せません。
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>
                        キャンセル
                    </Button>
                    <Button
                        onClick={handleDelete}
                        color="error"
                        variant="contained"
                        disabled={submitting}
                    >
                        {submitting ? <CircularProgress size={20} /> : '削除'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    )
} 