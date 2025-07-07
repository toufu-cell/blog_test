'use client'

import React, { useState } from 'react'
import {
    Container,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    Chip,
    Box,
    Avatar,
    IconButton,
    Menu,
    MenuItem,
    Tab,
    Tabs,
    Alert,
    CircularProgress,
} from '@mui/material'
import {
    CheckCircle,
    Block,
    Delete,
    MoreVert,
    Comment as CommentIcon,
} from '@mui/icons-material'
import { formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'
import useSWR from 'swr'
import { getModerationComments, getPendingComments, getSpamComments, approveComment, markCommentAsSpam, deleteComment } from '../../../lib/services/comments'
import { Comment } from '../../../types'

interface TabPanelProps {
    children?: React.ReactNode
    index: number
    value: number
}

function TabPanel({ children, value, index }: TabPanelProps) {
    return (
        <div hidden={value !== index}>
            {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
        </div>
    )
}

export default function CommentsManagementPage() {
    const [tabValue, setTabValue] = useState(0)
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
    const [selectedComment, setSelectedComment] = useState<Comment | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const { data: allComments, error: allError, mutate: mutateAll } = useSWR(
        'moderation-comments-all',
        () => getModerationComments({ ordering: '-created_at' }),
        { revalidateOnFocus: false }
    )

    const { data: pendingComments, error: pendingError, mutate: mutatePending } = useSWR(
        'moderation-comments-pending',
        getPendingComments,
        { revalidateOnFocus: false }
    )

    const { data: spamComments, error: spamError, mutate: mutateSpam } = useSWR(
        'moderation-comments-spam',
        getSpamComments,
        { revalidateOnFocus: false }
    )

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, comment: Comment) => {
        setAnchorEl(event.currentTarget)
        setSelectedComment(comment)
    }

    const handleMenuClose = () => {
        setAnchorEl(null)
        setSelectedComment(null)
    }

    const handleApprove = async () => {
        if (!selectedComment) return

        setLoading(true)
        try {
            await approveComment(selectedComment.id)
            mutateAll()
            mutatePending()
            setError(null)
        } catch (error) {
            setError('コメントの承認でエラーが発生しました')
        } finally {
            setLoading(false)
            handleMenuClose()
        }
    }

    const handleMarkSpam = async () => {
        if (!selectedComment) return

        setLoading(true)
        try {
            await markCommentAsSpam(selectedComment.id)
            mutateAll()
            mutatePending()
            mutateSpam()
            setError(null)
        } catch (error) {
            setError('コメントのスパムマークでエラーが発生しました')
        } finally {
            setLoading(false)
            handleMenuClose()
        }
    }

    const handleDelete = async () => {
        if (!selectedComment || !window.confirm('このコメントを削除しますか？')) return

        setLoading(true)
        try {
            await deleteComment(selectedComment.id)
            mutateAll()
            mutatePending()
            mutateSpam()
            setError(null)
        } catch (error) {
            setError('コメントの削除でエラーが発生しました')
        } finally {
            setLoading(false)
            handleMenuClose()
        }
    }

    const formatDate = (dateString: string) => {
        return formatDistanceToNow(new Date(dateString), {
            addSuffix: true,
            locale: ja
        })
    }

    const getAvatarSrc = (author: any) => {
        return author.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(author.username)}&background=random`
    }

    const renderCommentTable = (comments: Comment[] | { results: Comment[] } | undefined, isLoading: boolean, error: any) => {
        if (isLoading) {
            return (
                <Box display="flex" justifyContent="center" py={4}>
                    <CircularProgress />
                </Box>
            )
        }

        if (error) {
            return (
                <Alert severity="error">
                    コメントの読み込みでエラーが発生しました
                </Alert>
            )
        }

        const commentList = Array.isArray(comments) ? comments : comments?.results || []

        if (commentList.length === 0) {
            return (
                <Box textAlign="center" py={4}>
                    <Typography variant="body1" color="text.secondary">
                        コメントがありません
                    </Typography>
                </Box>
            )
        }

        return (
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>作成者</TableCell>
                            <TableCell>コメント</TableCell>
                            <TableCell>記事</TableCell>
                            <TableCell>状態</TableCell>
                            <TableCell>作成日時</TableCell>
                            <TableCell width={100}>操作</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {commentList.map((comment) => (
                            <TableRow key={comment.id}>
                                <TableCell>
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <Avatar
                                            src={getAvatarSrc(comment.author)}
                                            alt={comment.author.username}
                                            sx={{ width: 32, height: 32 }}
                                        />
                                        <Typography variant="body2">
                                            {comment.author.username}
                                        </Typography>
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2" sx={{ maxWidth: 300 }}>
                                        {comment.content.length > 100
                                            ? `${comment.content.substring(0, 100)}...`
                                            : comment.content
                                        }
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2" color="text.secondary">
                                        {(comment as any).article_title || `記事 #${comment.article}`}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Box display="flex" gap={1}>
                                        {comment.is_approved ? (
                                            <Chip label="承認済み" size="small" color="success" />
                                        ) : (
                                            <Chip label="承認待ち" size="small" color="warning" />
                                        )}
                                        {comment.is_spam && (
                                            <Chip label="スパム" size="small" color="error" />
                                        )}
                                        {comment.is_edited && (
                                            <Chip label="編集済み" size="small" color="info" />
                                        )}
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="caption" color="text.secondary">
                                        {formatDate(comment.created_at)}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <IconButton
                                        size="small"
                                        onClick={(e) => handleMenuOpen(e, comment)}
                                    >
                                        <MoreVert />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        )
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Box display="flex" alignItems="center" gap={1} mb={4}>
                <CommentIcon />
                <Typography variant="h4" component="h1">
                    コメント管理
                </Typography>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            <Paper sx={{ mb: 3 }}>
                <Tabs
                    value={tabValue}
                    onChange={(_, newValue) => setTabValue(newValue)}
                    indicatorColor="primary"
                    textColor="primary"
                >
                    <Tab label="すべて" />
                    <Tab label="承認待ち" />
                    <Tab label="スパム" />
                </Tabs>

                <TabPanel value={tabValue} index={0}>
                    {renderCommentTable(allComments, !allComments && !allError, allError)}
                </TabPanel>

                <TabPanel value={tabValue} index={1}>
                    {renderCommentTable(pendingComments, !pendingComments && !pendingError, pendingError)}
                </TabPanel>

                <TabPanel value={tabValue} index={2}>
                    {renderCommentTable(spamComments, !spamComments && !spamError, spamError)}
                </TabPanel>
            </Paper>

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
            >
                {selectedComment && !selectedComment.is_approved && (
                    <MenuItem onClick={handleApprove} disabled={loading}>
                        <CheckCircle sx={{ mr: 1 }} />
                        承認
                    </MenuItem>
                )}
                {selectedComment && !selectedComment.is_spam && (
                    <MenuItem onClick={handleMarkSpam} disabled={loading}>
                        <Block sx={{ mr: 1 }} />
                        スパムマーク
                    </MenuItem>
                )}
                <MenuItem onClick={handleDelete} disabled={loading}>
                    <Delete sx={{ mr: 1 }} />
                    削除
                </MenuItem>
            </Menu>
        </Container>
    )
} 