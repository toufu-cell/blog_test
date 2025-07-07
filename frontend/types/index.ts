// ユーザー関連の型定義
export interface User {
    id: number
    username: string
    email: string
    first_name: string
    last_name: string
    role: 'admin' | 'editor' | 'author' | 'reader'
    bio: string
    avatar?: string
    website?: string
    twitter?: string
    github?: string
    is_email_verified: boolean
    created_at: string
    updated_at: string
    article_count?: number
    comment_count?: number
}

export interface UserProfile {
    id: number
    user: number
    birth_date?: string
    phone?: string
    address?: string
    notification_email: boolean
    notification_push: boolean
    privacy_public_profile: boolean
    privacy_show_email: boolean
}

// 認証関連の型定義
export interface AuthTokens {
    access: string
    refresh: string
}

export interface AuthResponse {
    user: User
    tokens: AuthTokens
}

export interface LoginData {
    email: string
    password: string
}

export interface RegisterData {
    username: string
    email: string
    password: string
    password_confirm: string
    first_name?: string
    last_name?: string
}

// ブログ関連の型定義
export interface Category {
    id: number
    name: string
    slug: string
    description: string
    parent?: number
    color: string
    is_active: boolean
    sort_order: number
    created_at: string
    updated_at: string
    article_count: number
    full_path: string
    children: Category[]
}

export interface Tag {
    id: number
    name: string
    slug: string
    description: string
    color: string
    is_active: boolean
    created_at: string
    article_count: number
}

export interface Article {
    id: number
    title: string
    slug: string
    excerpt: string
    content?: string
    content_html?: string
    author: User
    category?: Category
    tags: Tag[]
    status: 'draft' | 'published' | 'private' | 'scheduled'
    meta_title?: string
    meta_description?: string
    og_title?: string
    og_description?: string
    og_image?: string
    featured_image?: string
    featured_image_alt?: string
    view_count: number
    like_count: number
    share_count: number
    comment_count: number
    published_at?: string
    created_at: string
    updated_at: string
    allow_comments: boolean
    is_featured: boolean
    is_pinned: boolean
    reading_time: number
    is_liked?: boolean
    related_articles?: Article[]
}

export interface ArticleCreateData {
    title: string
    slug?: string
    excerpt?: string
    content: string
    category_id?: number
    tag_ids?: number[]
    status: 'draft' | 'published' | 'private' | 'scheduled'
    meta_title?: string
    meta_description?: string
    og_title?: string
    og_description?: string
    og_image?: File
    featured_image?: File
    featured_image_alt?: string
    published_at?: string
    allow_comments: boolean
    is_featured: boolean
    is_pinned: boolean
}

// コメント関連の型定義
export interface Comment {
    id: number
    article: number
    author: User
    parent?: number
    content: string
    is_approved: boolean
    is_spam: boolean
    is_edited: boolean
    like_count: number
    ip_address?: string
    created_at: string
    updated_at: string
    edited_at?: string
    replies?: Comment[]
    depth: number
    is_liked?: boolean
    can_reply?: boolean
}

export interface CommentCreateData {
    article: number
    parent?: number
    content: string
}

export interface CommentFilters {
    article?: number
    parent?: number
    is_approved?: boolean
    is_spam?: boolean
    ordering?: string
    page?: number
}

// API レスポンス関連の型定義
export interface PaginatedResponse<T> {
    count: number
    next?: string
    previous?: string
    results: T[]
}

export interface ApiError {
    message: string
    field_errors?: Record<string, string[]>
    non_field_errors?: string[]
}

// フォーム関連の型定義
export interface FormErrors {
    [key: string]: string | string[]
}

// 検索・フィルター関連の型定義
export interface SearchFilters {
    search?: string
    category?: number
    tags?: number[]
    author?: number
    status?: string
    is_featured?: boolean
    ordering?: string
    page?: number
}

// UI関連の型定義
export interface NavItem {
    label: string
    href: string
    icon?: string
    children?: NavItem[]
}

export interface BreadcrumbItem {
    label: string
    href?: string
}

// 設定関連の型定義
export interface SiteSettings {
    site_name: string
    site_description: string
    site_url: string
    site_logo?: string
    favicon?: string
    meta_title: string
    meta_description: string
    og_image?: string
    analytics_id?: string
    disqus_shortname?: string
}

// テーマ関連の型定義
export type ThemeMode = 'light' | 'dark' | 'system'

export interface ThemeConfig {
    mode: ThemeMode
    primaryColor: string
    secondaryColor: string
} 