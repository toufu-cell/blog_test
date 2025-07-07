import React from 'react'
import Link from 'next/link'
import {
    Box,
    Container,
    Typography,
    IconButton,
    Divider,
} from '@mui/material'
import {
    GitHub,
    Twitter,
    Email,
    RssFeed,
} from '@mui/icons-material'

const Footer: React.FC = () => {
    const currentYear = new Date().getFullYear()

    return (
        <Box
            component="footer"
            sx={{
                bgcolor: 'grey.900',
                color: 'white',
                py: 6,
                mt: 'auto',
            }}
        >
            <Container maxWidth="lg">
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: {
                            xs: '1fr',
                            sm: 'repeat(2, 1fr)',
                            md: 'repeat(4, 1fr)'
                        },
                        gap: 4,
                    }}
                >
                    {/* サイト情報 */}
                    <Box>
                        <Typography variant="h6" component="h3" gutterBottom>
                            Blog CMS
                        </Typography>
                        <Typography variant="body2" color="grey.400">
                            モダンなブログ・コンテンツ管理システム。
                            記事の作成・管理・公開を簡単に行えます。
                        </Typography>
                    </Box>

                    {/* ナビゲーションリンク */}
                    <Box>
                        <Typography variant="h6" component="h3" gutterBottom>
                            ナビゲーション
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>
                                <Typography variant="body2" color="grey.400" sx={{ '&:hover': { color: 'white' } }}>
                                    ホーム
                                </Typography>
                            </Link>
                            <Link href="/articles" style={{ color: 'inherit', textDecoration: 'none' }}>
                                <Typography variant="body2" color="grey.400" sx={{ '&:hover': { color: 'white' } }}>
                                    記事一覧
                                </Typography>
                            </Link>
                            <Link href="/categories" style={{ color: 'inherit', textDecoration: 'none' }}>
                                <Typography variant="body2" color="grey.400" sx={{ '&:hover': { color: 'white' } }}>
                                    カテゴリ
                                </Typography>
                            </Link>
                            <Link href="/about" style={{ color: 'inherit', textDecoration: 'none' }}>
                                <Typography variant="body2" color="grey.400" sx={{ '&:hover': { color: 'white' } }}>
                                    このサイトについて
                                </Typography>
                            </Link>
                        </Box>
                    </Box>

                    {/* アカウント関連 */}
                    <Box>
                        <Typography variant="h6" component="h3" gutterBottom>
                            アカウント
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Link href="/auth/login" style={{ color: 'inherit', textDecoration: 'none' }}>
                                <Typography variant="body2" color="grey.400" sx={{ '&:hover': { color: 'white' } }}>
                                    ログイン
                                </Typography>
                            </Link>
                            <Link href="/auth/register" style={{ color: 'inherit', textDecoration: 'none' }}>
                                <Typography variant="body2" color="grey.400" sx={{ '&:hover': { color: 'white' } }}>
                                    新規登録
                                </Typography>
                            </Link>
                            <Link href="/profile" style={{ color: 'inherit', textDecoration: 'none' }}>
                                <Typography variant="body2" color="grey.400" sx={{ '&:hover': { color: 'white' } }}>
                                    プロフィール
                                </Typography>
                            </Link>
                            <Link href="/dashboard" style={{ color: 'inherit', textDecoration: 'none' }}>
                                <Typography variant="body2" color="grey.400" sx={{ '&:hover': { color: 'white' } }}>
                                    ダッシュボード
                                </Typography>
                            </Link>
                        </Box>
                    </Box>

                    {/* ソーシャルメディア */}
                    <Box>
                        <Typography variant="h6" component="h3" gutterBottom>
                            フォローする
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                            <IconButton
                                component="a"
                                href="#"
                                target="_blank"
                                rel="noopener noreferrer"
                                sx={{ color: 'grey.400', '&:hover': { color: 'white' } }}
                            >
                                <GitHub />
                            </IconButton>
                            <IconButton
                                component="a"
                                href="#"
                                target="_blank"
                                rel="noopener noreferrer"
                                sx={{ color: 'grey.400', '&:hover': { color: 'white' } }}
                            >
                                <Twitter />
                            </IconButton>
                            <IconButton
                                component="a"
                                href="#"
                                target="_blank"
                                rel="noopener noreferrer"
                                sx={{ color: 'grey.400', '&:hover': { color: 'white' } }}
                            >
                                <Email />
                            </IconButton>
                            <IconButton
                                component="a"
                                href="/rss"
                                target="_blank"
                                rel="noopener noreferrer"
                                sx={{ color: 'grey.400', '&:hover': { color: 'white' } }}
                            >
                                <RssFeed />
                            </IconButton>
                        </Box>
                        <Typography variant="body2" color="grey.400">
                            最新の記事やお知らせを受け取る
                        </Typography>
                    </Box>
                </Box>

                <Divider sx={{ my: 4, borderColor: 'grey.700' }} />

                {/* コピーライト */}
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 2,
                    }}
                >
                    <Typography variant="body2" color="grey.400">
                        © {currentYear} Blog CMS. All rights reserved.
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 3 }}>
                        <Link href="/privacy" style={{ color: 'inherit', textDecoration: 'none' }}>
                            <Typography variant="body2" color="grey.400" sx={{ '&:hover': { color: 'white' } }}>
                                プライバシーポリシー
                            </Typography>
                        </Link>
                        <Link href="/terms" style={{ color: 'inherit', textDecoration: 'none' }}>
                            <Typography variant="body2" color="grey.400" sx={{ '&:hover': { color: 'white' } }}>
                                利用規約
                            </Typography>
                        </Link>
                        <Link href="/contact" style={{ color: 'inherit', textDecoration: 'none' }}>
                            <Typography variant="body2" color="grey.400" sx={{ '&:hover': { color: 'white' } }}>
                                お問い合わせ
                            </Typography>
                        </Link>
                    </Box>
                </Box>
            </Container>
        </Box>
    )
}

export default Footer 