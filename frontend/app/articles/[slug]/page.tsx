'use client'

import React from 'react'
import {
    Container,
    Typography,
    Box,
    Chip,
    Stack,
    Avatar,
    Divider,
    CircularProgress,
    Alert,
} from '@mui/material'
import { CalendarMonth, Visibility, ThumbUp, Share } from '@mui/icons-material'
import { formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'
import useSWR from 'swr'
import { getArticleBySlug } from '../../../lib/services/blog'
import CommentList from '../../../components/comments/CommentList'
import { User, Tag } from '../../../types'

interface ArticlePageProps {
    params: {
        slug: string
    }
}

export default function ArticlePage({ params }: ArticlePageProps) {
    const { data: article, error, isLoading } = useSWR(
        ['article', params.slug],
        () => getArticleBySlug(params.slug),
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

    const getAvatarSrc = (author: User) => {
        return author.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(author.username)}&background=random`
    }

    if (isLoading) {
        return (
            <Container maxWidth="md" sx={{ py: 4 }}>
                <Box display="flex" justifyContent="center">
                    <CircularProgress />
                </Box>
            </Container>
        )
    }

    if (error || !article) {
        return (
            <Container maxWidth="md" sx={{ py: 4 }}>
                <Alert severity="error">
                    記事が見つかりませんでした
                </Alert>
            </Container>
        )
    }

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            {/* 記事ヘッダー */}
            <Box mb={4}>
                <Typography variant="h3" component="h1" gutterBottom>
                    {article.title}
                </Typography>

                {article.excerpt && (
                    <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
                        {article.excerpt}
                    </Typography>
                )}

                {/* 著者情報・メタデータ */}
                <Box display="flex" alignItems="center" gap={2} mb={3}>
                    <Avatar
                        src={getAvatarSrc(article.author)}
                        alt={article.author.username}
                        sx={{ width: 48, height: 48 }}
                    />
                    <Box>
                        <Typography variant="subtitle1" fontWeight="bold">
                            {article.author.username}
                        </Typography>
                        <Box display="flex" alignItems="center" gap={2}>
                            <Box display="flex" alignItems="center" gap={0.5}>
                                <CalendarMonth fontSize="small" color="disabled" />
                                <Typography variant="caption" color="text.secondary">
                                    {formatDate(article.published_at || article.created_at)}
                                </Typography>
                            </Box>
                            <Box display="flex" alignItems="center" gap={0.5}>
                                <Visibility fontSize="small" color="disabled" />
                                <Typography variant="caption" color="text.secondary">
                                    {article.view_count} 回表示
                                </Typography>
                            </Box>
                            <Box display="flex" alignItems="center" gap={0.5}>
                                <ThumbUp fontSize="small" color="disabled" />
                                <Typography variant="caption" color="text.secondary">
                                    {article.like_count}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                </Box>

                {/* カテゴリ・タグ */}
                <Stack direction="row" spacing={1} flexWrap="wrap" mb={3}>
                    {article.category && (
                        <Chip
                            label={article.category.name}
                            variant="filled"
                            color="primary"
                            size="small"
                        />
                    )}
                    {article.tags.map((tag: Tag) => (
                        <Chip
                            key={tag.id}
                            label={tag.name}
                            variant="outlined"
                            size="small"
                        />
                    ))}
                </Stack>

                {article.featured_image && (
                    <Box sx={{ mb: 4 }}>
                        <img
                            src={article.featured_image}
                            alt={article.featured_image_alt || article.title}
                            style={{
                                width: '100%',
                                height: 'auto',
                                borderRadius: 8,
                                maxHeight: 400,
                                objectFit: 'cover'
                            }}
                        />
                    </Box>
                )}
            </Box>

            {/* 記事本文 */}
            <Box sx={{ mb: 6 }}>
                {article.content_html ? (
                    <div
                        dangerouslySetInnerHTML={{ __html: article.content_html }}
                        style={{
                            lineHeight: 1.8,
                            fontSize: '16px',
                        }}
                    />
                ) : (
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
                        {article.content}
                    </Typography>
                )}
            </Box>

            <Divider sx={{ mb: 4 }} />

            {/* コメントセクション */}
            <CommentList
                articleId={article.id}
                allowComments={article.allow_comments}
            />
        </Container>
    )
} 