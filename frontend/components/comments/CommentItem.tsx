'use client'

import React, { useState } from 'react'
import {
    Box,
    Card,
    CardContent,
    Avatar,
    Typography,
    Button,
    IconButton,
    Menu,
    MenuItem,
    Chip,
    TextField,
    Stack,
    Divider,
    Alert,
} from '@mui/material'
import {
    ThumbUp,
    ThumbUpOutlined,
    Reply,
    MoreVert,
    Edit,
    Delete,
    Report,
    Check,
    Close,
} from '@mui/icons-material'
import { formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Comment, User } from '../../types'
import { useAuth } from '../../lib/contexts/AuthContext'
import { likeComment, unlikeComment, updateComment, deleteComment, reportComment } from '../../lib/services/comments'

interface CommentItemProps {
    comment: Comment
    onReply?: (parentId: number) => void
    onUpdate?: () => void
    onDelete?: (commentId: number) => void
    maxDepth?: number
}

export default function CommentItem({
    comment,
    onReply,
    onUpdate,
    onDelete,
    maxDepth = 3
}: CommentItemProps) {
    const { user } = useAuth()
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
    const [isEditing, setIsEditing] = useState(false)
    const [editContent, setEditContent] = useState(comment.content)
    const [isLiked, setIsLiked] = useState(comment.is_liked || false)
    const [likeCount, setLikeCount] = useState(comment.like_count)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const canEdit = user && (user.id === comment.author.id || user.role === 'admin' || user.role === 'editor')
    const canReply = comment.depth < maxDepth
    const showReplies = comment.replies && comment.replies.length > 0

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget)
    }

    const handleMenuClose = () => {
        setAnchorEl(null)
    }

    const handleLike = async () => {
        if (!user) return

        setLoading(true)
        try {
            if (isLiked) {
                await unlikeComment(comment.id)
                setIsLiked(false)
                setLikeCount(prev => prev - 1)
            } else {
                await likeComment(comment.id)
                setIsLiked(true)
                setLikeCount(prev => prev + 1)
            }
        } catch (error) {
            setError('いいねの処理でエラーが発生しました')
        } finally {
            setLoading(false)
        }
    }

    const handleEdit = async () => {
        if (!editContent.trim()) return

        setLoading(true)
        try {
            await updateComment(comment.id, editContent)
            setIsEditing(false)
            setError(null)
            onUpdate?.()
        } catch (error) {
            setError('コメントの更新でエラーが発生しました')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!window.confirm('このコメントを削除しますか？')) return

        setLoading(true)
        try {
            await deleteComment(comment.id)
            onDelete?.(comment.id)
        } catch (error) {
            setError('コメントの削除でエラーが発生しました')
        } finally {
            setLoading(false)
        }
    }

    const handleReport = async () => {
        if (!user) return

        try {
            await reportComment(comment.id, {
                reason: 'inappropriate',
                description: '不適切なコンテンツ'
            })
            alert('コメントを報告しました')
            handleMenuClose()
        } catch (error) {
            setError('報告の送信でエラーが発生しました')
        }
    }

    const formatDate = (dateString: string) => {
        return formatDistanceToNow(new Date(dateString), {
            addSuffix: true,
            locale: ja
        })
    }

    const getAvatarSrc = (author: User) => {
        return author.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(author.username)}&background=random`
    }

    return (
        <Card
            elevation={comment.parent ? 1 : 2}
            sx={{
                mb: 2,
                ml: comment.parent ? 2 : 0,
                borderLeft: comment.parent ? '3px solid #e0e0e0' : 'none'
            }}
        >
            <CardContent>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                <Box display="flex" alignItems="flex-start" gap={2}>
                    <Avatar
                        src={getAvatarSrc(comment.author)}
                        alt={comment.author.username}
                        sx={{ width: 40, height: 40 }}
                    />

                    <Box flex={1}>
                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                            <Typography variant="subtitle2" fontWeight="bold">
                                {comment.author.username}
                            </Typography>

                            {comment.author.role !== 'reader' && (
                                <Chip
                                    label={comment.author.role}
                                    size="small"
                                    color={comment.author.role === 'admin' ? 'error' : 'primary'}
                                    variant="outlined"
                                />
                            )}

                            <Typography variant="caption" color="text.secondary">
                                {formatDate(comment.created_at)}
                            </Typography>

                            {comment.is_edited && (
                                <Typography variant="caption" color="text.secondary">
                                    (編集済み)
                                </Typography>
                            )}

                            {!comment.is_approved && (
                                <Chip label="承認待ち" size="small" color="warning" />
                            )}
                        </Box>

                        {isEditing ? (
                            <Box>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={3}
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    variant="outlined"
                                    size="small"
                                    sx={{ mb: 1 }}
                                />
                                <Stack direction="row" spacing={1}>
                                    <Button
                                        size="small"
                                        variant="contained"
                                        startIcon={<Check />}
                                        onClick={handleEdit}
                                        disabled={loading || !editContent.trim()}
                                    >
                                        保存
                                    </Button>
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        startIcon={<Close />}
                                        onClick={() => {
                                            setIsEditing(false)
                                            setEditContent(comment.content)
                                        }}
                                    >
                                        キャンセル
                                    </Button>
                                </Stack>
                            </Box>
                        ) : (
                            <>
                                <Typography variant="body2" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
                                    {comment.content}
                                </Typography>

                                <Stack direction="row" spacing={1} alignItems="center">
                                    <IconButton
                                        size="small"
                                        onClick={handleLike}
                                        disabled={!user || loading}
                                        color={isLiked ? 'primary' : 'default'}
                                    >
                                        {isLiked ? <ThumbUp /> : <ThumbUpOutlined />}
                                    </IconButton>
                                    <Typography variant="caption" color="text.secondary">
                                        {likeCount}
                                    </Typography>

                                    {canReply && (
                                        <Button
                                            size="small"
                                            startIcon={<Reply />}
                                            onClick={() => onReply?.(comment.id)}
                                            disabled={!user}
                                        >
                                            返信
                                        </Button>
                                    )}

                                    {user && (
                                        <>
                                            <IconButton size="small" onClick={handleMenuOpen}>
                                                <MoreVert />
                                            </IconButton>
                                            <Menu
                                                anchorEl={anchorEl}
                                                open={Boolean(anchorEl)}
                                                onClose={handleMenuClose}
                                            >
                                                {canEdit && (
                                                    <MenuItem
                                                        onClick={() => {
                                                            setIsEditing(true)
                                                            handleMenuClose()
                                                        }}
                                                    >
                                                        <Edit sx={{ mr: 1 }} />
                                                        編集
                                                    </MenuItem>
                                                )}
                                                {canEdit && (
                                                    <MenuItem
                                                        onClick={() => {
                                                            handleDelete()
                                                            handleMenuClose()
                                                        }}
                                                    >
                                                        <Delete sx={{ mr: 1 }} />
                                                        削除
                                                    </MenuItem>
                                                )}
                                                {user.id !== comment.author.id && (
                                                    <MenuItem onClick={handleReport}>
                                                        <Report sx={{ mr: 1 }} />
                                                        報告
                                                    </MenuItem>
                                                )}
                                            </Menu>
                                        </>
                                    )}
                                </Stack>
                            </>
                        )}
                    </Box>
                </Box>

                {showReplies && (
                    <Box mt={2}>
                        <Divider sx={{ mb: 2 }} />
                        {comment.replies!.map((reply) => (
                            <CommentItem
                                key={reply.id}
                                comment={reply}
                                onReply={onReply}
                                onUpdate={onUpdate}
                                onDelete={onDelete}
                                maxDepth={maxDepth}
                            />
                        ))}
                    </Box>
                )}
            </CardContent>
        </Card>
    )
} 