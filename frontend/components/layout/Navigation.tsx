'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
    AppBar,
    Toolbar,
    Typography,
    Button,
    IconButton,
    Menu,
    MenuItem,
    Box,
    Container,
    Drawer,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    useTheme,
    useMediaQuery,
    Avatar,
    Divider,
} from '@mui/material'
import {
    Menu as MenuIcon,
    AccountCircle,
    Article,
    Dashboard,
    Home,
    Login,
    PersonAdd,
    Logout,
    Settings,
    CategoryOutlined,
} from '@mui/icons-material'
import { useAuth } from '@/lib/contexts/AuthContext'

const Navigation: React.FC = () => {
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('md'))
    const router = useRouter()
    const { user, isAuthenticated, isLoading, logout } = useAuth()
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
    const [mobileOpen, setMobileOpen] = useState(false)

    const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget)
    }

    const handleClose = () => {
        setAnchorEl(null)
    }

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen)
    }

    const handleLogout = async () => {
        try {
            await logout()
            router.push('/')
        } catch (error) {
            console.error('Logout error:', error)
        }
        handleClose()
    }

    // 公開メニューアイテム
    const publicMenuItems = [
        { label: 'ホーム', href: '/', icon: <Home /> },
        { label: '記事一覧', href: '/articles', icon: <Article /> },
        { label: 'カテゴリ', href: '/categories', icon: <CategoryOutlined /> },
    ]

    // 認証済みユーザー用メニューアイテム
    const authMenuItems = isAuthenticated
        ? [
            { label: 'ダッシュボード', href: '/dashboard', icon: <Dashboard /> },
            { label: '記事管理', href: '/admin/articles', icon: <Article /> },
        ]
        : []

    // モバイルドロワー用のすべてのメニューアイテム
    const allMenuItems = [...publicMenuItems, ...authMenuItems]

    const drawer = (
        <Box sx={{ width: 250 }} role="presentation" onClick={handleDrawerToggle}>
            <List>
                {/* ユーザー情報（認証済みの場合） */}
                {isAuthenticated && user && (
                    <>
                        <ListItem>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2 }}>
                                <Avatar
                                    src={user.avatar}
                                    sx={{ width: 40, height: 40 }}
                                >
                                    {user.first_name?.[0] || user.username[0]}
                                </Avatar>
                                <Box>
                                    <Typography variant="subtitle1">
                                        {user.first_name && user.last_name
                                            ? `${user.last_name} ${user.first_name}`
                                            : user.username
                                        }
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {user.email}
                                    </Typography>
                                </Box>
                            </Box>
                        </ListItem>
                        <Divider />
                    </>
                )}

                {/* メニューアイテム */}
                {allMenuItems.map((item) => (
                    <ListItem
                        key={item.href}
                        component={Link}
                        href={item.href}
                        onClick={(e) => {
                            e.preventDefault()
                            handleDrawerToggle()
                            router.push(item.href)
                        }}
                    >
                        <ListItemIcon>{item.icon}</ListItemIcon>
                        <ListItemText primary={item.label} />
                    </ListItem>
                ))}

                {/* 認証関連アイテム */}
                {!isAuthenticated && (
                    <>
                        <Divider />
                        <ListItem
                            component={Link}
                            href="/auth/login"
                            onClick={(e) => {
                                e.preventDefault()
                                handleDrawerToggle()
                                router.push('/auth/login')
                            }}
                        >
                            <ListItemIcon><Login /></ListItemIcon>
                            <ListItemText primary="ログイン" />
                        </ListItem>
                        <ListItem
                            component={Link}
                            href="/auth/register"
                            onClick={(e) => {
                                e.preventDefault()
                                handleDrawerToggle()
                                router.push('/auth/register')
                            }}
                        >
                            <ListItemIcon><PersonAdd /></ListItemIcon>
                            <ListItemText primary="新規登録" />
                        </ListItem>
                    </>
                )}

                {isAuthenticated && (
                    <>
                        <Divider />
                        <ListItem
                            component={Link}
                            href="/profile"
                            onClick={(e) => {
                                e.preventDefault()
                                handleDrawerToggle()
                                router.push('/profile')
                            }}
                        >
                            <ListItemIcon><Settings /></ListItemIcon>
                            <ListItemText primary="プロフィール" />
                        </ListItem>
                        <ListItem onClick={handleLogout}>
                            <ListItemIcon><Logout /></ListItemIcon>
                            <ListItemText primary="ログアウト" />
                        </ListItem>
                    </>
                )}
            </List>
        </Box>
    )

    return (
        <>
            <AppBar position="static" elevation={1}>
                <Container maxWidth="xl">
                    <Toolbar disableGutters>
                        {/* モバイルメニューボタン */}
                        {isMobile && (
                            <IconButton
                                color="inherit"
                                aria-label="open drawer"
                                edge="start"
                                onClick={handleDrawerToggle}
                                sx={{ mr: 2 }}
                            >
                                <MenuIcon />
                            </IconButton>
                        )}

                        {/* ロゴ */}
                        <Typography
                            variant="h6"
                            noWrap
                            component={Link}
                            href="/"
                            sx={{
                                mr: 2,
                                fontFamily: 'monospace',
                                fontWeight: 700,
                                letterSpacing: '.3rem',
                                color: 'inherit',
                                textDecoration: 'none',
                            }}
                        >
                            Blog CMS
                        </Typography>

                        <Box sx={{ flexGrow: 1 }} />

                        {/* デスクトップメニュー */}
                        {!isMobile && (
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                {publicMenuItems.map((item) => (
                                    <Button
                                        key={item.href}
                                        color="inherit"
                                        component={Link}
                                        href={item.href}
                                        startIcon={item.icon}
                                        onClick={(e) => {
                                            e.preventDefault()
                                            router.push(item.href)
                                        }}
                                    >
                                        {item.label}
                                    </Button>
                                ))}
                                {authMenuItems.map((item) => (
                                    <Button
                                        key={item.href}
                                        color="inherit"
                                        component={Link}
                                        href={item.href}
                                        startIcon={item.icon}
                                        onClick={(e) => {
                                            e.preventDefault()
                                            router.push(item.href)
                                        }}
                                    >
                                        {item.label}
                                    </Button>
                                ))}
                            </Box>
                        )}

                        {/* 認証メニュー */}
                        <Box sx={{ ml: 2 }}>
                            {isAuthenticated ? (
                                <div>
                                    <IconButton
                                        size="large"
                                        aria-label="account of current user"
                                        aria-controls="menu-appbar"
                                        aria-haspopup="true"
                                        onClick={handleMenu}
                                        color="inherit"
                                    >
                                        {user?.avatar ? (
                                            <Avatar
                                                src={user.avatar}
                                                sx={{ width: 32, height: 32 }}
                                            />
                                        ) : (
                                            <Avatar sx={{ width: 32, height: 32 }}>
                                                {user?.first_name?.[0] || user?.username[0] || <AccountCircle />}
                                            </Avatar>
                                        )}
                                    </IconButton>
                                    <Menu
                                        id="menu-appbar"
                                        anchorEl={anchorEl}
                                        anchorOrigin={{
                                            vertical: 'bottom',
                                            horizontal: 'right',
                                        }}
                                        keepMounted
                                        transformOrigin={{
                                            vertical: 'top',
                                            horizontal: 'right',
                                        }}
                                        open={Boolean(anchorEl)}
                                        onClose={handleClose}
                                    >
                                        {user && (
                                            <>
                                                <Box sx={{ px: 2, py: 1 }}>
                                                    <Typography variant="subtitle1">
                                                        {user.first_name && user.last_name
                                                            ? `${user.last_name} ${user.first_name}`
                                                            : user.username
                                                        }
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {user.email}
                                                    </Typography>
                                                </Box>
                                                <Divider />
                                            </>
                                        )}
                                        <MenuItem onClick={handleClose} component={Link} href="/profile">
                                            プロフィール
                                        </MenuItem>
                                        <MenuItem onClick={handleClose} component={Link} href="/dashboard">
                                            ダッシュボード
                                        </MenuItem>
                                        <Divider />
                                        <MenuItem onClick={handleLogout}>
                                            ログアウト
                                        </MenuItem>
                                    </Menu>
                                </div>
                            ) : (
                                !isLoading && (
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <Button color="inherit" component={Link} href="/auth/login">
                                            ログイン
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            color="inherit"
                                            component={Link}
                                            href="/auth/register"
                                        >
                                            新規登録
                                        </Button>
                                    </Box>
                                )
                            )}
                        </Box>
                    </Toolbar>
                </Container>
            </AppBar>

            {/* モバイルドロワー */}
            <Drawer
                variant="temporary"
                open={mobileOpen}
                onClose={handleDrawerToggle}
                ModalProps={{
                    keepMounted: true, // Better open performance on mobile.
                }}
                sx={{
                    display: { xs: 'block', md: 'none' },
                    '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 250 },
                }}
            >
                {drawer}
            </Drawer>
        </>
    )
}

export default Navigation 