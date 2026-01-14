from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.exceptions import AuthenticationFailed
from api.models import Empresa, Cliente


class CustomJWTAuthentication(JWTAuthentication):
    """Autenticação JWT personalizada para suportar Empresa e Cliente"""
    
    def get_user(self, validated_token):
        """
        Tenta obter um usuário do token JWT validado.
        Verifica tanto em Empresa quanto em Cliente.
        """
        try:
            user_id = validated_token.get('user_id')
            tipo_usuario = validated_token.get('tipo_usuario')
            
            if not user_id or not tipo_usuario:
                raise AuthenticationFailed('Token inválido')
            
            if tipo_usuario == 'empresa':
                return Empresa.objects.get(pk=user_id)
            elif tipo_usuario == 'cliente':
                return Cliente.objects.get(pk=user_id)
            else:
                raise AuthenticationFailed('Tipo de usuário inválido')
                
        except (Empresa.DoesNotExist, Cliente.DoesNotExist):
            raise AuthenticationFailed('Usuário não encontrado')


def criar_token_para_usuario(usuario, tipo_usuario):
    """
    Cria um par de tokens (access e refresh) para um usuário.
    
    Args:
        usuario: Instância de Empresa ou Cliente
        tipo_usuario: 'empresa' ou 'cliente'
    
    Returns:
        dict com access_token, refresh_token, token_type, tipo_usuario, usuario_id
    """
    refresh = RefreshToken.for_user(usuario)
    
    # Adicionar claims customizados
    refresh['tipo_usuario'] = tipo_usuario
    refresh['user_id'] = usuario.id
    
    access = refresh.access_token
    access['tipo_usuario'] = tipo_usuario
    access['user_id'] = usuario.id
    
    return {
        'token_acesso': str(access),
        'token_atualizacao': str(refresh),
        'tipo_token': 'bearer',
        'tipo_usuario': tipo_usuario,
        'usuario_id': usuario.id
    }
