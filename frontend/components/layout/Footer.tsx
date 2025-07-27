import React from 'react'
import Link from 'next/link'
import {
    Box,
    Container,
    Typography,
    Divider,
} from '@mui/material'

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
                        <Link href="/about" style={{ color: 'inherit', textDecoration: 'none' }}>
                            <Typography variant="body2" color="grey.400" sx={{ '&:hover': { color: 'white' } }}>
                                このサイトについて
                            </Typography>
                        </Link>
                    </Box>
                </Box>
            </Container>
        </Box>
    )
}

export default Footer 