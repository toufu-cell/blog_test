from rest_framework import permissions


class IsAuthorOrReadOnly(permissions.BasePermission):
    """
    著者本人または編集者以上のみが編集可能
    読み取りは制限なし
    """
    
    def has_object_permission(self, request, view, obj):
        # 読み取り権限は全ユーザーに許可
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # 編集者以上は全ての記事を編集可能
        if request.user.is_authenticated and request.user.is_editor:
            return True
        
        # 著者本人のみが自分の記事を編集可能
        return obj.author == request.user


class CanPublishOrReadOnly(permissions.BasePermission):
    """
    公開権限を持つユーザーのみが記事を公開可能
    読み取りは制限なし
    """
    
    def has_object_permission(self, request, view, obj):
        # 読み取り権限は全ユーザーに許可
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # 記事のステータスを変更しようとしている場合
        if hasattr(request, 'data') and 'status' in request.data:
            new_status = request.data.get('status')
            
            # 'published' ステータスに変更しようとしている場合
            if new_status == 'published':
                # 編集者以上のみが公開可能
                if not (request.user.is_authenticated and request.user.can_publish):
                    return False
        
        return True


class IsEditorOrReadOnly(permissions.BasePermission):
    """
    編集者以上のみが編集可能
    読み取りは制限なし
    """
    
    def has_permission(self, request, view):
        # 読み取り権限は全ユーザーに許可
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # 編集権限は編集者以上のみ
        return request.user.is_authenticated and request.user.is_editor


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    管理者のみが編集可能
    読み取りは制限なし
    """
    
    def has_permission(self, request, view):
        # 読み取り権限は全ユーザーに許可
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # 編集権限は管理者のみ
        return request.user.is_authenticated and request.user.is_admin


class IsAuthorOrAdmin(permissions.BasePermission):
    """
    著者本人または管理者のみがアクセス可能
    """
    
    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False
        
        # 管理者は全てアクセス可能
        if request.user.is_admin:
            return True
        
        # 著者本人のみアクセス可能
        return obj.author == request.user 