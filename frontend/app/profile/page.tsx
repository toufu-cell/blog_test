'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    Box,
    Card,
    CardContent,
    Typography,
    CircularProgress,
    Container,
    Avatar,
    Chip,
    Tabs,
    Tab,
    Button,
    Divider,
} from '@mui/material'
import {
    Person,
    Edit,
    Lock,
    Settings,
    Refresh,
} from '@mui/icons-material'
import { useAuth } from '@/lib/contexts/AuthContext'
import ProfileEditForm from '@/components/profile/ProfileEditForm'
import PasswordChangeForm from '@/components/profile/PasswordChangeForm'
import ProfileSettingsForm from '@/components/profile/ProfileSettingsForm'

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
            id={`profile-tabpanel-${index}`}
            aria-labelledby={`profile-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ pt: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    )
}

function a11yProps(index: number) {
    return {
        id: `profile-tab-${index}`,
        'aria-controls': `profile-tabpanel-${index}`,
    }
}

export default function ProfilePage() {
    const router = useRouter()
    const { user, isAuthenticated, isLoading } = useAuth()
    const [tabValue, setTabValue] = useState(0)
    const [refreshing, setRefreshing] = useState(false)

    // 未認証の場合はログインページにリダイレクト
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.replace('/auth/login')
        }
    }, [isAuthenticated, isLoading, router])

    // タブ変更処理
    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue)
    }

    // ユーザー情報の更新処理
    const handleUserUpdate = async (updatedUser?: any) => {
        setRefreshing(true)
        try {
            // AuthContextにrefreshUser関数がないため、ページリロードで対応
            window.location.reload()
        } catch (error) {
            console.error('Failed to refresh user:', error)
        } finally {
            setRefreshing(false)
        }
    }

    // 編集キャンセル処理
    const handleEditCancel = () => {
        setTabValue(0)
    }

    // パスワード変更成功処理
    const handlePasswordChangeSuccess = () => {
        setTabValue(0)
    }

    // 設定更新成功処理
    const handleSettingsUpdate = () => {
        setTabValue(0)
    }

    if (isLoading) {
        return (
            <Container maxWidth="md">
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
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
                プロフィール管理
            </Typography>

            <Card>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs
                        value={tabValue}
                        onChange={handleTabChange}
                        variant="fullWidth"
                        scrollButtons="auto"
                    >
                        <Tab
                            label="プロフィール"
                            icon={<Person />}
                            iconPosition="start"
                            {...a11yProps(0)}
                        />
                        <Tab
                            label="編集"
                            icon={<Edit />}
                            iconPosition="start"
                            {...a11yProps(1)}
                        />
                        <Tab
                            label="パスワード"
                            icon={<Lock />}
                            iconPosition="start"
                            {...a11yProps(2)}
                        />
                        <Tab
                            label="設定"
                            icon={<Settings />}
                            iconPosition="start"
                            {...a11yProps(3)}
                        />
                    </Tabs>
                </Box>

                {/* プロフィール表示タブ */}
                <TabPanel value={tabValue} index={0}>
                    <CardContent>
                        {/* アバターセクション */}
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                            <Avatar
                                src={user.avatar}
                                sx={{ width: 100, height: 100, mr: 3 }}
                            >
                                {user.first_name?.[0] || user.username[0]}
                            </Avatar>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="h5" gutterBottom>
                                    {user.first_name && user.last_name
                                        ? `${user.last_name} ${user.first_name}`
                                        : user.username
                                    }
                                </Typography>
                                <Typography variant="body1" color="text.secondary" gutterBottom>
                                    {user.email}
                                </Typography>
                                <Chip
                                    label={user.role}
                                    color="primary"
                                    variant="outlined"
                                />
                            </Box>
                            <Button
                                variant="outlined"
                                startIcon={refreshing ? <CircularProgress size={16} /> : <Refresh />}
                                onClick={() => handleUserUpdate()}
                                disabled={refreshing}
                            >
                                更新
                            </Button>
                        </Box>

                        <Divider sx={{ my: 3 }} />

                        {/* ユーザー情報 */}
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                            <Box>
                                <Typography variant="h6" gutterBottom>
                                    基本情報
                                </Typography>

                                <Box sx={{ display: 'grid', gap: 2 }}>
                                    <Box>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            ユーザー名
                                        </Typography>
                                        <Typography variant="body1">
                                            {user.username}
                                        </Typography>
                                    </Box>

                                    <Box>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            メールアドレス
                                        </Typography>
                                        <Typography variant="body1">
                                            {user.email}
                                        </Typography>
                                    </Box>

                                    <Box>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            役割
                                        </Typography>
                                        <Typography variant="body1">
                                            {user.role}
                                        </Typography>
                                    </Box>

                                    {user.bio && (
                                        <Box>
                                            <Typography variant="subtitle2" color="text.secondary">
                                                自己紹介
                                            </Typography>
                                            <Typography variant="body1">
                                                {user.bio}
                                            </Typography>
                                        </Box>
                                    )}

                                    {user.website && (
                                        <Box>
                                            <Typography variant="subtitle2" color="text.secondary">
                                                ウェブサイト
                                            </Typography>
                                            <Typography
                                                variant="body1"
                                                component="a"
                                                href={user.website}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                sx={{ color: 'primary.main', textDecoration: 'none' }}
                                            >
                                                {user.website}
                                            </Typography>
                                        </Box>
                                    )}

                                    {(user.twitter || user.github) && (
                                        <Box>
                                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                SNS
                                            </Typography>
                                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                                {user.twitter && (
                                                    <Chip
                                                        label={`Twitter: @${user.twitter}`}
                                                        variant="outlined"
                                                        size="small"
                                                        clickable
                                                        component="a"
                                                        href={`https://twitter.com/${user.twitter}`}
                                                        target="_blank"
                                                    />
                                                )}
                                                {user.github && (
                                                    <Chip
                                                        label={`GitHub: @${user.github}`}
                                                        variant="outlined"
                                                        size="small"
                                                        clickable
                                                        component="a"
                                                        href={`https://github.com/${user.github}`}
                                                        target="_blank"
                                                    />
                                                )}
                                            </Box>
                                        </Box>
                                    )}
                                </Box>
                            </Box>

                            <Box>
                                <Typography variant="h6" gutterBottom>
                                    アカウント情報
                                </Typography>

                                <Box sx={{ display: 'grid', gap: 2 }}>
                                    <Box>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            アカウント作成日
                                        </Typography>
                                        <Typography variant="body1">
                                            {new Date(user.created_at).toLocaleDateString('ja-JP')}
                                        </Typography>
                                    </Box>

                                    <Box>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            最終更新日
                                        </Typography>
                                        <Typography variant="body1">
                                            {new Date(user.updated_at).toLocaleDateString('ja-JP')}
                                        </Typography>
                                    </Box>

                                    <Box>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            メール認証
                                        </Typography>
                                        <Chip
                                            label={user.is_email_verified ? '認証済み' : '未認証'}
                                            color={user.is_email_verified ? 'success' : 'warning'}
                                            size="small"
                                        />
                                    </Box>
                                </Box>

                                {/* 統計情報 */}
                                {(user.article_count !== undefined || user.comment_count !== undefined) && (
                                    <Box sx={{ mt: 3 }}>
                                        <Typography variant="h6" gutterBottom>
                                            統計情報
                                        </Typography>

                                        <Box sx={{ display: 'flex', gap: 4 }}>
                                            {user.article_count !== undefined && (
                                                <Box sx={{ textAlign: 'center' }}>
                                                    <Typography variant="h4" color="primary">
                                                        {user.article_count}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        投稿記事数
                                                    </Typography>
                                                </Box>
                                            )}

                                            {user.comment_count !== undefined && (
                                                <Box sx={{ textAlign: 'center' }}>
                                                    <Typography variant="h4" color="primary">
                                                        {user.comment_count}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        コメント数
                                                    </Typography>
                                                </Box>
                                            )}
                                        </Box>
                                    </Box>
                                )}
                            </Box>
                        </Box>
                    </CardContent>
                </TabPanel>

                {/* プロフィール編集タブ */}
                <TabPanel value={tabValue} index={1}>
                    <ProfileEditForm
                        user={user}
                        onUpdate={handleUserUpdate}
                        onCancel={handleEditCancel}
                    />
                </TabPanel>

                {/* パスワード変更タブ */}
                <TabPanel value={tabValue} index={2}>
                    <PasswordChangeForm
                        onSuccess={handlePasswordChangeSuccess}
                        onCancel={handleEditCancel}
                    />
                </TabPanel>

                {/* 設定タブ */}
                <TabPanel value={tabValue} index={3}>
                    <ProfileSettingsForm
                        onUpdate={handleSettingsUpdate}
                        onCancel={handleEditCancel}
                    />
                </TabPanel>
            </Card>
        </Container>
    )
} 