'use client'

import React, { useState, useEffect } from 'react'
import {
    Box,
    Typography,
    Button,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    CircularProgress,
    Alert,
    Stack,
    Divider,
} from '@mui/material'
import { ChatBubbleOutline, Sort } from '@mui/icons-material'
import useSWR from 'swr'
import { getArticleComments } from '../../lib/services/comments'
import { Comment } from '../../types'
import CommentItem from './CommentItem'
import CommentForm from './CommentForm'

interface CommentListProps {
    articleId: number
    allowComments: boolean
}

export default function CommentList({ articleId, allowComments }: CommentListProps) {
    const [ordering, setOrdering] = useState('created_at')
    const [replyToId, setReplyToId] = useState<number | null>(null)
    const [replyToAuthor, setReplyToAuthor] = useState<string>('')

    const {
        data: comments,
        error,
        isLoading,
        mutate
    } = useSWR(
        ['article-comments', articleId, ordering],
        () => getArticleComments(articleId, ordering),
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
        }
    )

    const handleReply = (parentId: number) => {
        const parentComment = findCommentById(comments || [], parentId)
        if (parentComment) {
            setReplyToId(parentId)
            setReplyToAuthor(parentComment.author.username)
            // スムーズにフォームまでスクロール
            setTimeout(() => {
                const formElement = document.getElementById('reply-form')
                if (formElement) {
                    formElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
                }
            }, 100)
        }
    }

    const handleCommentSuccess = () => {
        mutate() // コメント一覧を再取得
        setReplyToId(null)
        setReplyToAuthor('')
    }

    const handleCommentDelete = (commentId: number) => {
        mutate() // コメント一覧を再取得
    }

    const handleCommentUpdate = () => {
        mutate() // コメント一覧を再取得
    }

    const findCommentById = (comments: Comment[], id: number): Comment | null => {
        if (!Array.isArray(comments)) {
            return null
        }
        for (const comment of comments) {
            if (comment.id === id) return comment
            if (comment.replies) {
                const found = findCommentById(comment.replies, id)
                if (found) return found
            }
        }
        return null
    }

    const getTotalCommentCount = (comments: Comment[]): number => {
        if (!Array.isArray(comments)) {
            return 0
        }
        return comments.reduce((total, comment) => {
            return total + 1 + (comment.replies ? getTotalCommentCount(comment.replies) : 0)
        }, 0)
    }

    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
            </Box>
        )
    }

    if (error) {
        return (
            <Alert severity="error" sx={{ my: 2 }}>
                コメントの読み込みでエラーが発生しました
            </Alert>
        )
    }

    const totalComments = comments ? getTotalCommentCount(comments) : 0

    return (
        <Box sx={{ mt: 4 }}>
            <Box display="flex" alignItems="center" gap={1} mb={3}>
                <ChatBubbleOutline />
                <Typography variant="h5" component="h2">
                    コメント ({totalComments})
                </Typography>
            </Box>

            {allowComments && (
                <Box mb={4}>
                    <CommentForm
                        articleId={articleId}
                        onSuccess={handleCommentSuccess}
                    />
                </Box>
            )}

            {!allowComments && (
                <Alert severity="info" sx={{ mb: 4 }}>
                    この記事のコメントは無効になっています
                </Alert>
            )}

            {totalComments > 0 && (
                <>
                    <Box display="flex" alignItems="center" gap={2} mb={3}>
                        <FormControl size="small" sx={{ minWidth: 150 }}>
                            <InputLabel>並び順</InputLabel>
                            <Select
                                value={ordering}
                                label="並び順"
                                onChange={(e) => setOrdering(e.target.value)}
                            >
                                <MenuItem value="created_at">投稿順</MenuItem>
                                <MenuItem value="-created_at">新着順</MenuItem>
                                <MenuItem value="-like_count">いいね順</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>

                    <Divider sx={{ mb: 3 }} />

                    <Box>
                        {Array.isArray(comments) && comments.map((comment) => (
                            <CommentItem
                                key={comment.id}
                                comment={comment}
                                onReply={handleReply}
                                onUpdate={handleCommentUpdate}
                                onDelete={handleCommentDelete}
                            />
                        ))}
                    </Box>
                </>
            )}

            {replyToId && allowComments && (
                <Box id="reply-form" sx={{ mt: 4, pt: 2, borderTop: '2px solid #e0e0e0' }}>
                    <CommentForm
                        articleId={articleId}
                        parentId={replyToId}
                        parentAuthor={replyToAuthor}
                        onSuccess={handleCommentSuccess}
                        onCancel={() => {
                            setReplyToId(null)
                            setReplyToAuthor('')
                        }}
                    />
                </Box>
            )}

            {totalComments === 0 && allowComments && (
                <Box textAlign="center" py={6}>
                    <Typography variant="body1" color="text.secondary" mb={2}>
                        まだコメントがありません
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        最初にコメントしてみませんか？
                    </Typography>
                </Box>
            )}
        </Box>
    )
} 