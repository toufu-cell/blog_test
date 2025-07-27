'use client'

import React, { useState } from 'react'
import {
    Box,
    Card,
    CardContent,
    TextField,
    Button,
    Typography,
    Alert,
    Avatar,
    Stack,
} from '@mui/material'
import { Send, Close } from '@mui/icons-material'
import { useAuth } from '../../lib/contexts/AuthContext'
import { createComment } from '../../lib/services/comments'
import type { CommentCreateData } from '../../types'
import { mutate } from 'swr'

interface CommentFormProps {
    articleId: number
    parentId?: number
    parentAuthor?: string
    onSuccess?: () => void
    onCancel?: () => void
}

export default function CommentForm({
    articleId,
    parentId,
    parentAuthor,
    onSuccess,
    onCancel
}: CommentFormProps) {
    const { user } = useAuth()
    const [content, setContent] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!content.trim()) {
            setError('コメント内容を入力してください')
            return
        }

        if (!user) {
            setError('コメントするにはログインが必要です')
            return
        }

        setLoading(true)
        setError(null)

        try {
            const commentData: CommentCreateData = {
                article: articleId,
                content: content.trim(),
                ...(parentId && { parent: parentId })
            }

            await createComment(commentData)
            setContent('')
            onSuccess?.()

            // 関連するキャッシュを無効化してデータを更新
            mutate(['article-comments', articleId])  // コメント一覧
            mutate((key) => Array.isArray(key) && key[0] === 'public-articles')  // ブログ一覧の全パターン
        } catch (error: any) {
            console.error('コメント投稿エラー:', error)
            console.error('エラーレスポンス:', error.response)

            if (error.response?.status === 401) {
                setError('認証が必要です。再ログインしてください。')
            } else if (error.response?.status === 403) {
                setError('この操作を行う権限がありません。')
            } else if (error.response?.status === 400) {
                const errorData = error.response.data
                if (errorData.article) {
                    setError(`記事エラー: ${errorData.article.join(', ')}`)
                } else if (errorData.content) {
                    setError(`コンテンツエラー: ${errorData.content.join(', ')}`)
                } else if (errorData.message) {
                    setError(errorData.message)
                } else {
                    setError('入力データに問題があります。')
                }
            } else if (error.response?.data?.message) {
                setError(error.response.data.message)
            } else {
                setError(`コメントの投稿でエラーが発生しました (${error.response?.status || 'unknown'})`)
            }
        } finally {
            setLoading(false)
        }
    }

    const handleCancel = () => {
        setContent('')
        setError(null)
        onCancel?.()
    }

    const getAvatarSrc = () => {
        if (!user) return undefined
        return user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=random`
    }

    if (!user) {
        return (
            <Card sx={{ mb: 2 }}>
                <CardContent>
                    <Alert severity="info">
                        コメントを投稿するには<a href="/auth/login">ログイン</a>が必要です
                    </Alert>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card sx={{ mb: 2 }}>
            <CardContent>
                {parentId && parentAuthor && (
                    <Box mb={2}>
                        <Typography variant="body2" color="text.secondary">
                            {parentAuthor} さんに返信
                        </Typography>
                    </Box>
                )}

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit}>
                    <Box display="flex" alignItems="flex-start" gap={2} mb={2}>
                        <Avatar
                            src={getAvatarSrc()}
                            alt={user.username}
                            sx={{ width: 40, height: 40 }}
                        />

                        <Box flex={1}>
                            <TextField
                                fullWidth
                                multiline
                                rows={4}
                                placeholder={
                                    parentId
                                        ? `${parentAuthor} さんに返信...`
                                        : 'コメントを入力してください...'
                                }
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                variant="outlined"
                                disabled={loading}
                                inputProps={{ maxLength: 1000 }}
                            />

                            <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
                                <Typography variant="caption" color="text.secondary">
                                    {content.length}/1000
                                </Typography>

                                <Stack direction="row" spacing={1}>
                                    {parentId && (
                                        <Button
                                            variant="outlined"
                                            startIcon={<Close />}
                                            onClick={handleCancel}
                                            disabled={loading}
                                        >
                                            キャンセル
                                        </Button>
                                    )}

                                    <Button
                                        type="submit"
                                        variant="contained"
                                        startIcon={<Send />}
                                        disabled={loading || !content.trim()}
                                    >
                                        {parentId ? '返信' : 'コメント'}を投稿
                                    </Button>
                                </Stack>
                            </Box>
                        </Box>
                    </Box>

                    {/* 全ユーザーが投稿者権限を持つため、承認メッセージは削除 */}
                </Box>
            </CardContent>
        </Card>
    )
} 