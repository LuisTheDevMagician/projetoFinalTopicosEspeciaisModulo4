from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from api.models import Cliente
from api.serializers import (
    ClienteSerializer, ClienteAtualizarSerializer, MudarSenhaSerializer
)
from api.utils.permissions import IsCliente


@api_view(['GET'])
@permission_classes([IsCliente])
def obter_meu_perfil(request):
    """Obter perfil do cliente atual"""
    serializer = ClienteSerializer(request.user)
    return Response(serializer.data)


@api_view(['PUT'])
@permission_classes([IsCliente])
def atualizar_perfil_cliente(request):
    """Atualizar perfil do cliente"""
    cliente = request.user
    
    # Verificar se o novo email já está em uso
    if 'email' in request.data and request.data['email'] != cliente.email:
        if Cliente.objects.filter(email=request.data['email']).exists():
            return Response(
                {"detail": "Email já está em uso"},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    serializer = ClienteAtualizarSerializer(cliente, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(ClienteSerializer(cliente).data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT'])
@permission_classes([IsCliente])
def mudar_senha(request):
    """Mudar senha do cliente"""
    cliente = request.user
    
    serializer = MudarSenhaSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    senha_antiga = serializer.validated_data['senha_antiga']
    senha_nova = serializer.validated_data['senha_nova']
    
    if not cliente.check_password(senha_antiga):
        return Response(
            {"detail": "Senha incorreta"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    cliente.set_password(senha_nova)
    cliente.save()
    
    return Response({"mensagem": "Senha alterada com sucesso"})
