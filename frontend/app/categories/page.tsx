'use client'

import React, { useState } from 'react'
import {
    Container,
    Typography,
    Box,
    Card,
    CardContent,
    Grid,
    Chip,
    CircularProgress,
    Alert,
    TextField,
    InputAdornment,
    Avatar,
} from '@mui/material'
import {
    Search,
    Category as CategoryIcon,
    Article as ArticleIcon,
} from '@mui/icons-material'
import Link from 'next/link'
import useSWR from 'swr'
import { getCategories } from '../../lib/services/blog'
import { Category } from '../../types'

export default function CategoriesPage() {
    const [searchQuery, setSearchQuery] = useState('')

    const { data: categoriesData, error: categoriesError, isLoading: categoriesLoading } = useSWR(
        ['categories', { search: searchQuery, is_active: true }],
        ([_, params]) => getCategories(params),
        {
            revalidateOnFocus: false,
        }
    )

    const handleSearch = (query: string) => {
        setSearchQuery(query)
    }

    if (categoriesError) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Alert severity="error">
                    カテゴリの読み込みでエラーが発生しました
                </Alert>
            </Container>
        )
    }

    const categories = categoriesData?.results || []

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            {/* ヘッダー */}
            <Box mb={4}>
                <Typography variant="h3" component="h1" gutterBottom>
                    カテゴリ一覧
                </Typography>
                <Typography variant="h6" color="text.secondary" mb={3}>
                    {categoriesData && `${categoriesData.count}個のカテゴリがあります`}
                </Typography>

                {/* 検索ボックス */}
                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <TextField
                            fullWidth
                            placeholder="カテゴリを検索..."
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
                    </CardContent>
                </Card>
            </Box>

            {/* ローディング */}
            {categoriesLoading && (
                <Box display="flex" justifyContent="center" py={4}>
                    <CircularProgress />
                </Box>
            )}

            {/* カテゴリ一覧 */}
            {!categoriesLoading && categories.length > 0 && (
                <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: 3,
                    mb: 4
                }}>
                    {categories.map((category: Category) => (
                        <Card key={category.id} sx={{
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: 4,
                            }
                        }}>
                            <CardContent sx={{ flexGrow: 1 }}>
                                {/* カテゴリアイコンと名前 */}
                                <Box display="flex" alignItems="center" mb={2}>
                                    <Avatar
                                        sx={{
                                            bgcolor: category.color || 'primary.main',
                                            width: 48,
                                            height: 48,
                                            mr: 2,
                                        }}
                                    >
                                        <CategoryIcon />
                                    </Avatar>
                                    <Box>
                                        <Typography variant="h6" component="h2">
                                            <Link
                                                href={`/categories/${category.slug}`}
                                                style={{
                                                    textDecoration: 'none',
                                                    color: 'inherit'
                                                }}
                                            >
                                                {category.name}
                                            </Link>
                                        </Typography>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <ArticleIcon fontSize="small" color="disabled" />
                                            <Typography variant="caption" color="text.secondary">
                                                {category.article_count || 0}件の記事
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>

                                {/* 説明 */}
                                {category.description && (
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
                                        {category.description}
                                    </Typography>
                                )}

                                {/* 親カテゴリ - 現在はIDのみ返されるため表示しない */}
                            </CardContent>
                        </Card>
                    ))}
                </Box>
            )}

            {/* カテゴリなし */}
            {!categoriesLoading && categories.length === 0 && (
                <Box textAlign="center" py={8}>
                    <CategoryIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        カテゴリが見つかりませんでした
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        検索条件を変更してお試しください
                    </Typography>
                </Box>
            )}
        </Container>
    )
} 