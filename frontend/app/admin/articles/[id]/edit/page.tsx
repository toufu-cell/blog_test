'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import {
    Box,
    Card,
    CardContent,
    Typography,
    TextField,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    OutlinedInput,
    FormControlLabel,
    Switch,
    Tabs,
    Tab,
    Alert,
    CircularProgress,
    Container,
    Grid,
    IconButton,
    InputAdornment,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Stack,
} from '@mui/material'
import {
    ArrowBack,
    Save,
    Publish,
    Preview,
    Image,
    DeleteOutline,
    ExpandMore,
    Schedule,
} from '@mui/icons-material'
import { useAuth } from '@/lib/contexts/AuthContext'
import { blogService } from '@/lib/services/blog'
import { Article, ArticleCreateData, Category, Tag } from '@/types'

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
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
        </div>
    )
}

export default function EditArticlePage() {
    const router = useRouter()
    const params = useParams()
    const articleId = params.id as string
    const { user, isAuthenticated, isLoading } = useAuth()
    const [loading, setLoading] = useState(false)
    const [initialLoading, setInitialLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [tabValue, setTabValue] = useState(0)
    const [article, setArticle] = useState<Article | null>(null)

    // フォームデータ
    const [formData, setFormData] = useState<Partial<ArticleCreateData>>({
        title: '',
        slug: '',
        excerpt: '',
        content: '',

        tag_ids: [],
        status: 'draft',
        meta_title: '',
        meta_description: '',
        og_title: '',
        og_description: '',
        featured_image_alt: '',
        published_at: '',
        allow_comments: true,
        is_featured: false,
        is_pinned: false,
    })

    // タグ
    const [tags, setTags] = useState<Tag[]>([])

    // 画像プレビュー
    const [featuredImagePreview, setFeaturedImagePreview] = useState<string>('')
    const [ogImagePreview, setOgImagePreview] = useState<string>('')

    // 認証チェック
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.replace('/auth/login')
        }
    }, [isAuthenticated, isLoading, router])

    // データ取得
    useEffect(() => {
        if (isAuthenticated && articleId) {
            loadData()
        }
    }, [isAuthenticated, articleId])

    const loadData = async () => {
        try {
            setInitialLoading(true)
            setError(null)

            const [articleData, tagsResponse] = await Promise.all([
                blogService.getArticle(parseInt(articleId)),
                blogService.getTags()
            ])

            setArticle(articleData)
            setTags(tagsResponse.results)

            // フォームデータを設定
            setFormData({
                title: articleData.title,
                slug: articleData.slug,
                excerpt: articleData.excerpt,
                content: articleData.content,

                tag_ids: articleData.tags.map(tag => tag.id),
                status: articleData.status,
                meta_title: articleData.meta_title || '',
                meta_description: articleData.meta_description || '',
                og_title: articleData.og_title || '',
                og_description: articleData.og_description || '',
                featured_image_alt: articleData.featured_image_alt || '',
                published_at: articleData.published_at ?
                    new Date(articleData.published_at).toISOString().slice(0, 16) : '',
                allow_comments: articleData.allow_comments,
                is_featured: articleData.is_featured,
                is_pinned: articleData.is_pinned,
            })

            // 既存画像のプレビューを設定
            if (articleData.featured_image) {
                setFeaturedImagePreview(articleData.featured_image)
            }
            if (articleData.og_image) {
                setOgImagePreview(articleData.og_image)
            }

        } catch (err: any) {
            setError(err.response?.data?.message || '記事の取得に失敗しました')
        } finally {
            setInitialLoading(false)
        }
    }

    const handleInputChange = (field: keyof ArticleCreateData, value: any) => {
        setFormData({ ...formData, [field]: value })
    }

    const handleImageChange = (field: 'featured_image' | 'og_image', file: File | null) => {
        setFormData({ ...formData, [field]: file })

        if (file) {
            const reader = new FileReader()
            reader.onload = (e) => {
                const preview = e.target?.result as string
                if (field === 'featured_image') {
                    setFeaturedImagePreview(preview)
                } else {
                    setOgImagePreview(preview)
                }
            }
            reader.readAsDataURL(file)
        } else {
            if (field === 'featured_image') {
                setFeaturedImagePreview(article?.featured_image || '')
            } else {
                setOgImagePreview(article?.og_image || '')
            }
        }
    }

    const handleTagChange = (event: any) => {
        const value = event.target.value as number[]
        setFormData({ ...formData, tag_ids: value })
    }

    const handleSubmit = async (status?: 'draft' | 'published') => {
        if (!article) return

        try {
            setLoading(true)
            setError(null)

            const submitData = { ...formData }
            if (status) {
                submitData.status = status
            }

            // 公開の場合、必須項目をチェック
            if (submitData.status === 'published') {
                if (!submitData.title?.trim()) {
                    throw new Error('タイトルは必須です')
                }
                if (!submitData.content?.trim()) {
                    throw new Error('本文は必須です')
                }
            }

            await blogService.updateArticle(article.id, submitData)
            setSuccess(`記事を${submitData.status === 'published' ? '公開' : '更新'}しました`)

            // データを再読み込み
            setTimeout(() => {
                loadData()
            }, 1000)

        } catch (err: any) {
            setError(err.message || err.response?.data?.message || '記事の更新に失敗しました')
        } finally {
            setLoading(false)
        }
    }

    const generateSlug = () => {
        if (formData.title) {
            const slug = formData.title
                .toLowerCase()
                .replace(/[^a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]+/g, '-')
                .replace(/^-+|-+$/g, '')
            setFormData({ ...formData, slug })
        }
    }

    if (isLoading || initialLoading) {
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

    if (!user || !article) {
        return null
    }

    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            {/* ヘッダー */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                <IconButton component={Link} href="/admin/articles">
                    <ArrowBack />
                </IconButton>
                <Typography variant="h4" component="h1">
                    記事を編集
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    ID: {article.id}
                </Typography>
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

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 3 }}>
                {/* メインコンテンツ */}
                <Box>
                    <Card>
                        <CardContent>
                            <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
                                <Tab label="基本情報" />
                                <Tab label="SEO設定" />
                                <Tab label="画像" />
                            </Tabs>

                            <TabPanel value={tabValue} index={0}>
                                <Stack spacing={3}>
                                    {/* タイトル */}
                                    <TextField
                                        label="タイトル"
                                        value={formData.title}
                                        onChange={(e) => handleInputChange('title', e.target.value)}
                                        fullWidth
                                        required
                                        placeholder="魅力的なタイトルを入力してください"
                                    />

                                    {/* スラグ */}
                                    <TextField
                                        label="スラグ (URL)"
                                        value={formData.slug}
                                        onChange={(e) => handleInputChange('slug', e.target.value)}
                                        fullWidth
                                        placeholder="記事のURL識別子"
                                        InputProps={{
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <Button size="small" onClick={generateSlug}>
                                                        自動生成
                                                    </Button>
                                                </InputAdornment>
                                            )
                                        }}
                                        helperText="記事のURLに使用されます（英数字、ハイフン推奨）"
                                    />

                                    {/* 要約 */}
                                    <TextField
                                        label="要約"
                                        value={formData.excerpt}
                                        onChange={(e) => handleInputChange('excerpt', e.target.value)}
                                        fullWidth
                                        multiline
                                        rows={3}
                                        placeholder="記事の概要を簡潔に..."
                                        helperText={`${formData.excerpt?.length || 0}/300文字`}
                                        inputProps={{ maxLength: 300 }}
                                    />

                                    {/* 本文 */}
                                    <TextField
                                        label="本文"
                                        value={formData.content}
                                        onChange={(e) => handleInputChange('content', e.target.value)}
                                        fullWidth
                                        multiline
                                        rows={15}
                                        required
                                        placeholder="記事の内容をMarkdown形式で入力してください..."
                                        helperText="Markdown記法をサポートしています"
                                    />
                                </Stack>
                            </TabPanel>

                            <TabPanel value={tabValue} index={1}>
                                <Stack spacing={3}>
                                    <Typography variant="h6">SEO設定</Typography>

                                    {/* メタタイトル */}
                                    <TextField
                                        label="メタタイトル"
                                        value={formData.meta_title}
                                        onChange={(e) => handleInputChange('meta_title', e.target.value)}
                                        fullWidth
                                        placeholder="検索結果に表示されるタイトル"
                                        helperText={`${formData.meta_title?.length || 0}/60文字（推奨）`}
                                        inputProps={{ maxLength: 60 }}
                                    />

                                    {/* メタディスクリプション */}
                                    <TextField
                                        label="メタディスクリプション"
                                        value={formData.meta_description}
                                        onChange={(e) => handleInputChange('meta_description', e.target.value)}
                                        fullWidth
                                        multiline
                                        rows={3}
                                        placeholder="検索結果に表示される説明文"
                                        helperText={`${formData.meta_description?.length || 0}/160文字（推奨）`}
                                        inputProps={{ maxLength: 160 }}
                                    />

                                    <Accordion>
                                        <AccordionSummary expandIcon={<ExpandMore />}>
                                            <Typography>OGP設定（ソーシャルメディア）</Typography>
                                        </AccordionSummary>
                                        <AccordionDetails>
                                            <Stack spacing={2}>
                                                <TextField
                                                    label="OGタイトル"
                                                    value={formData.og_title}
                                                    onChange={(e) => handleInputChange('og_title', e.target.value)}
                                                    fullWidth
                                                    placeholder="SNSでシェアされる時のタイトル"
                                                    helperText={`${formData.og_title?.length || 0}/60文字（推奨）`}
                                                    inputProps={{ maxLength: 60 }}
                                                />
                                                <TextField
                                                    label="OGディスクリプション"
                                                    value={formData.og_description}
                                                    onChange={(e) => handleInputChange('og_description', e.target.value)}
                                                    fullWidth
                                                    multiline
                                                    rows={2}
                                                    placeholder="SNSでシェアされる時の説明文"
                                                    helperText={`${formData.og_description?.length || 0}/160文字（推奨）`}
                                                    inputProps={{ maxLength: 160 }}
                                                />
                                            </Stack>
                                        </AccordionDetails>
                                    </Accordion>
                                </Stack>
                            </TabPanel>

                            <TabPanel value={tabValue} index={2}>
                                <Stack spacing={3}>
                                    <Typography variant="h6">画像設定</Typography>

                                    {/* アイキャッチ画像 */}
                                    <Box>
                                        <Typography variant="subtitle1" gutterBottom>
                                            アイキャッチ画像
                                        </Typography>
                                        <input
                                            accept="image/*"
                                            style={{ display: 'none' }}
                                            id="featured-image-upload"
                                            type="file"
                                            onChange={(e) => handleImageChange('featured_image', e.target.files?.[0] || null)}
                                        />
                                        <label htmlFor="featured-image-upload">
                                            <Button
                                                variant="outlined"
                                                component="span"
                                                startIcon={<Image />}
                                                sx={{ mb: 2 }}
                                            >
                                                画像を選択
                                            </Button>
                                        </label>

                                        {featuredImagePreview && (
                                            <Box sx={{ position: 'relative', display: 'inline-block' }}>
                                                <img
                                                    src={featuredImagePreview}
                                                    alt="アイキャッチ画像プレビュー"
                                                    style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8 }}
                                                />
                                                <IconButton
                                                    sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'rgba(255,255,255,0.8)' }}
                                                    onClick={() => handleImageChange('featured_image', null)}
                                                >
                                                    <DeleteOutline />
                                                </IconButton>
                                            </Box>
                                        )}

                                        <TextField
                                            label="アイキャッチ画像の代替テキスト"
                                            value={formData.featured_image_alt}
                                            onChange={(e) => handleInputChange('featured_image_alt', e.target.value)}
                                            fullWidth
                                            placeholder="画像の内容を説明するテキスト"
                                            helperText="アクセシビリティのために推奨"
                                            sx={{ mt: 2 }}
                                        />
                                    </Box>

                                    {/* OG画像 */}
                                    <Box>
                                        <Typography variant="subtitle1" gutterBottom>
                                            OG画像（SNS用）
                                        </Typography>
                                        <input
                                            accept="image/*"
                                            style={{ display: 'none' }}
                                            id="og-image-upload"
                                            type="file"
                                            onChange={(e) => handleImageChange('og_image', e.target.files?.[0] || null)}
                                        />
                                        <label htmlFor="og-image-upload">
                                            <Button
                                                variant="outlined"
                                                component="span"
                                                startIcon={<Image />}
                                                sx={{ mb: 2 }}
                                            >
                                                画像を選択
                                            </Button>
                                        </label>

                                        {ogImagePreview && (
                                            <Box sx={{ position: 'relative', display: 'inline-block' }}>
                                                <img
                                                    src={ogImagePreview}
                                                    alt="OG画像プレビュー"
                                                    style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8 }}
                                                />
                                                <IconButton
                                                    sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'rgba(255,255,255,0.8)' }}
                                                    onClick={() => handleImageChange('og_image', null)}
                                                >
                                                    <DeleteOutline />
                                                </IconButton>
                                            </Box>
                                        )}
                                    </Box>
                                </Stack>
                            </TabPanel>
                        </CardContent>
                    </Card>
                </Box>

                {/* サイドバー */}
                <Box>
                    <Stack spacing={3}>
                        {/* 記事情報 */}
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    記事情報
                                </Typography>
                                <Stack spacing={1}>
                                    <Typography variant="body2">
                                        作成日: {new Date(article.created_at).toLocaleDateString('ja-JP')}
                                    </Typography>
                                    <Typography variant="body2">
                                        更新日: {new Date(article.updated_at).toLocaleDateString('ja-JP')}
                                    </Typography>
                                    <Typography variant="body2">
                                        閲覧数: {article.view_count}
                                    </Typography>
                                    <Typography variant="body2">
                                        いいね数: {article.like_count}
                                    </Typography>
                                </Stack>
                            </CardContent>
                        </Card>

                        {/* 公開設定 */}
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    公開設定
                                </Typography>

                                <Stack spacing={2}>
                                    <FormControl fullWidth>
                                        <InputLabel>状態</InputLabel>
                                        <Select
                                            value={formData.status}
                                            onChange={(e) => handleInputChange('status', e.target.value)}
                                            label="状態"
                                        >
                                            <MenuItem value="draft">下書き</MenuItem>
                                            <MenuItem value="published">公開</MenuItem>
                                            <MenuItem value="private">非公開</MenuItem>
                                            <MenuItem value="scheduled">予約投稿</MenuItem>
                                        </Select>
                                    </FormControl>

                                    {formData.status === 'scheduled' && (
                                        <TextField
                                            label="公開日時"
                                            type="datetime-local"
                                            value={formData.published_at}
                                            onChange={(e) => handleInputChange('published_at', e.target.value)}
                                            fullWidth
                                            InputLabelProps={{ shrink: true }}
                                        />
                                    )}

                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={formData.allow_comments}
                                                onChange={(e) => handleInputChange('allow_comments', e.target.checked)}
                                            />
                                        }
                                        label="コメントを許可"
                                    />

                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={formData.is_featured}
                                                onChange={(e) => handleInputChange('is_featured', e.target.checked)}
                                            />
                                        }
                                        label="注目記事"
                                    />

                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={formData.is_pinned}
                                                onChange={(e) => handleInputChange('is_pinned', e.target.checked)}
                                            />
                                        }
                                        label="ピン留め"
                                    />
                                </Stack>
                            </CardContent>
                        </Card>

                        {/* カテゴリ・タグ */}
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    タグ
                                </Typography>

                                <Stack spacing={2}>

                                    <FormControl fullWidth>
                                        <InputLabel>タグ</InputLabel>
                                        <Select
                                            multiple
                                            value={formData.tag_ids || []}
                                            onChange={handleTagChange}
                                            input={<OutlinedInput label="タグ" />}
                                            renderValue={(selected) => (
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                    {(selected as number[]).map((value) => {
                                                        const tag = tags.find(t => t.id === value)
                                                        return tag ? (
                                                            <Chip
                                                                key={value}
                                                                label={tag.name}
                                                                size="small"
                                                                sx={{ backgroundColor: tag.color + '20', color: tag.color }}
                                                            />
                                                        ) : null
                                                    })}
                                                </Box>
                                            )}
                                        >
                                            {tags.map((tag) => (
                                                <MenuItem key={tag.id} value={tag.id}>
                                                    {tag.name}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Stack>
                            </CardContent>
                        </Card>

                        {/* アクションボタン */}
                        <Card>
                            <CardContent>
                                <Stack spacing={2}>
                                    <Button
                                        variant="contained"
                                        startIcon={loading ? <CircularProgress size={20} /> : <Save />}
                                        onClick={() => handleSubmit()}
                                        disabled={loading}
                                        fullWidth
                                        size="large"
                                    >
                                        更新
                                    </Button>

                                    {formData.status !== 'published' && (
                                        <Button
                                            variant="contained"
                                            color="success"
                                            startIcon={loading ? <CircularProgress size={20} /> : <Publish />}
                                            onClick={() => handleSubmit('published')}
                                            disabled={loading}
                                            fullWidth
                                        >
                                            公開
                                        </Button>
                                    )}

                                    <Button
                                        variant="outlined"
                                        startIcon={<Preview />}
                                        component={Link}
                                        href={`/articles/${article.slug}`}
                                        target="_blank"
                                        disabled={loading}
                                        fullWidth
                                    >
                                        プレビュー
                                    </Button>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Stack>
                </Box>
            </Box>
        </Container>
    )
} 