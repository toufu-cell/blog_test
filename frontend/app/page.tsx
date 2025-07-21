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
} from '@mui/material'
import { Search, CalendarMonth, Visibility, ThumbUp, ChatBubbleOutline } from '@mui/icons-material'
import { formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'
import Link from 'next/link'
import useSWR from 'swr'
import { getPublicArticles } from '../lib/services/blog'
import { Article } from '../types'

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)

  const { data, error, isLoading } = useSWR(
    ['public-articles', { search: searchQuery, page, ordering: '-published_at' }],
    ([_, params]) => getPublicArticles(params),
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

  if (isLoading && !data) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center">
          <CircularProgress />
        </Box>
      </Container>
    )
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          記事の読み込みでエラーが発生しました
        </Alert>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* ヘッダー */}
      <Box mb={4} textAlign="center">
        <Typography variant="h2" component="h1" gutterBottom>
          ブログ
        </Typography>
        <Typography variant="h6" color="text.secondary" mb={4}>
          最新の記事をお楽しみください
        </Typography>

        {/* 検索ボックス */}
        <Box maxWidth={600} mx="auto">
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
      </Box>

      {/* 記事一覧 */}
      {data?.results && data.results.length > 0 ? (
        <>
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 3
          }}>
            {data.results.map((article: Article) => (
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
                    記事を読む
                  </Button>
                </Box>
              </Card>
            ))}
          </Box>

          {/* ページネーション */}
          {data?.next && (
            <Box display="flex" justifyContent="center" mt={4}>
              <Button
                variant="outlined"
                onClick={() => setPage(page + 1)}
                disabled={isLoading}
              >
                さらに読み込む
              </Button>
            </Box>
          )}
        </>
      ) : (
        <Box textAlign="center" py={8}>
          <Typography variant="h6" color="text.secondary" mb={2}>
            {searchQuery ? '検索結果が見つかりませんでした' : '記事がまだありません'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchQuery ? '検索条件を変更してお試しください' : '最初の記事を投稿してみましょう'}
          </Typography>
        </Box>
      )
      }
    </Container >
  )
}
