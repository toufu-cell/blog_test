from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()


class CommentManager(models.Manager):
    """コメント用のカスタムマネージャー"""
    
    def approved(self):
        """承認済みコメントのみを取得"""
        return self.filter(is_approved=True)
    
    def pending(self):
        """承認待ちコメントを取得"""
        return self.filter(is_approved=False)
    
    def root_comments(self):
        """親コメント（返信ではない）のみを取得"""
        return self.filter(parent__isnull=True)


class Comment(models.Model):
    """コメントモデル"""
    
    article = models.ForeignKey(
        'blog.Article', 
        verbose_name='記事', 
        on_delete=models.CASCADE, 
        related_name='comments'
    )
    author = models.ForeignKey(
        User, 
        verbose_name='投稿者', 
        on_delete=models.CASCADE,
        related_name='comments'
    )
    parent = models.ForeignKey(
        'self', 
        verbose_name='親コメント', 
        null=True, 
        blank=True, 
        on_delete=models.CASCADE,
        related_name='replies'
    )
    content = models.TextField('コメント内容')
    
    # モデレーション
    is_approved = models.BooleanField('承認済み', default=False)
    is_spam = models.BooleanField('スパム', default=False)
    is_edited = models.BooleanField('編集済み', default=False)
    
    # 統計情報
    like_count = models.PositiveIntegerField('いいね数', default=0)
    
    # メタデータ
    ip_address = models.GenericIPAddressField('IPアドレス', null=True, blank=True)
    user_agent = models.TextField('ユーザーエージェント', blank=True)
    
    # 日時情報
    created_at = models.DateTimeField('作成日時', auto_now_add=True)
    updated_at = models.DateTimeField('更新日時', auto_now=True)
    edited_at = models.DateTimeField('編集日時', null=True, blank=True)
    
    objects = CommentManager()
    
    class Meta:
        verbose_name = 'コメント'
        verbose_name_plural = 'コメント'
        ordering = ['created_at']
        db_table = 'comments_comment'
        indexes = [
            models.Index(fields=['article', 'is_approved']),
            models.Index(fields=['parent', 'created_at']),
            models.Index(fields=['author', 'created_at']),
        ]
    
    def save(self, *args, **kwargs):
        if self.pk and self.content != self.__class__.objects.get(pk=self.pk).content:
            self.is_edited = True
            self.edited_at = timezone.now()
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.author.username} - {self.article.title}"
    
    @property
    def is_reply(self):
        """返信コメントかどうか"""
        return self.parent is not None
    
    @property
    def depth(self):
        """コメントのネストレベル"""
        if not self.parent:
            return 0
        return self.parent.depth + 1
    
    def get_replies(self):
        """このコメントに対する返信を取得"""
        return self.replies.filter(is_approved=True).order_by('created_at')
    
    def can_reply(self, max_depth=3):
        """返信可能かどうか（最大ネストレベルをチェック）"""
        return self.depth < max_depth
    
    def approve(self):
        """コメントを承認"""
        self.is_approved = True
        self.save(update_fields=['is_approved'])
    
    def mark_as_spam(self):
        """スパムとしてマーク"""
        self.is_spam = True
        self.is_approved = False
        self.save(update_fields=['is_spam', 'is_approved'])


class CommentLike(models.Model):
    """コメントのいいね"""
    
    comment = models.ForeignKey(Comment, on_delete=models.CASCADE, related_name='likes')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['comment', 'user']
        verbose_name = 'コメントいいね'
        verbose_name_plural = 'コメントいいね'
        db_table = 'comments_comment_like'
    
    def __str__(self):
        return f"{self.user.username} - Comment {self.comment.id}"


class CommentReport(models.Model):
    """コメント報告"""
    
    REASON_CHOICES = [
        ('spam', 'スパム'),
        ('inappropriate', '不適切な内容'),
        ('harassment', 'ハラスメント'),
        ('copyright', '著作権侵害'),
        ('other', 'その他'),
    ]
    
    comment = models.ForeignKey(Comment, on_delete=models.CASCADE, related_name='reports')
    reporter = models.ForeignKey(User, on_delete=models.CASCADE)
    reason = models.CharField('報告理由', max_length=20, choices=REASON_CHOICES)
    description = models.TextField('詳細', blank=True)
    is_resolved = models.BooleanField('解決済み', default=False)
    resolved_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='resolved_reports'
    )
    resolved_at = models.DateTimeField('解決日時', null=True, blank=True)
    created_at = models.DateTimeField('報告日時', auto_now_add=True)
    
    class Meta:
        unique_together = ['comment', 'reporter']
        verbose_name = 'コメント報告'
        verbose_name_plural = 'コメント報告'
        db_table = 'comments_comment_report'
    
    def resolve(self, resolved_by):
        """報告を解決済みにマーク"""
        self.is_resolved = True
        self.resolved_by = resolved_by
        self.resolved_at = timezone.now()
        self.save()
    
    def __str__(self):
        return f"Report: {self.comment} by {self.reporter.username}"


class CommentModerationLog(models.Model):
    """コメント管理ログ"""
    
    ACTION_CHOICES = [
        ('approved', '承認'),
        ('rejected', '拒否'),
        ('deleted', '削除'),
        ('marked_spam', 'スパムマーク'),
        ('unmarked_spam', 'スパム解除'),
        ('edited', '編集'),
    ]
    
    comment = models.ForeignKey(Comment, on_delete=models.CASCADE, related_name='moderation_logs')
    moderator = models.ForeignKey(User, on_delete=models.CASCADE)
    action = models.CharField('アクション', max_length=20, choices=ACTION_CHOICES)
    reason = models.TextField('理由', blank=True)
    created_at = models.DateTimeField('実行日時', auto_now_add=True)
    
    class Meta:
        verbose_name = 'コメント管理ログ'
        verbose_name_plural = 'コメント管理ログ'
        ordering = ['-created_at']
        db_table = 'comments_moderation_log'
    
    def __str__(self):
        return f"{self.action} - Comment {self.comment.id} by {self.moderator.username}"
