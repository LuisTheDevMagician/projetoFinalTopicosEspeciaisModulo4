from rest_framework import permissions
from api.models import Empresa, Cliente


class IsEmpresa(permissions.BasePermission):
    """Permissão personalizada para verificar se o usuário é uma Empresa"""
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and isinstance(request.user, Empresa)


class IsCliente(permissions.BasePermission):
    """Permissão personalizada para verificar se o usuário é um Cliente"""
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and isinstance(request.user, Cliente)


class IsOwnerOrReadOnly(permissions.BasePermission):
    """Permissão personalizada para permitir apenas o proprietário editar o objeto"""
    
    def has_object_permission(self, request, view, obj):
        # Permissões de leitura são permitidas para qualquer requisição
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Permissões de escrita apenas para o proprietário do objeto
        return obj == request.user
