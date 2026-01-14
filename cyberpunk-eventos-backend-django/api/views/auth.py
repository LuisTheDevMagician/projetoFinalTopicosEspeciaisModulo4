from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.db.models import Q
from api.models import Empresa, Cliente
from api.serializers import (
    EmpresaCriarSerializer, ClienteCriarSerializer,
    EmpresaSerializer, ClienteSerializer, LoginSerializer
)
from api.utils.auth import criar_token_para_usuario


@api_view(['POST'])
@permission_classes([AllowAny])
def registrar_empresa(request):
    """Registrar uma nova empresa"""
    # Verificar se email já existe
    email = request.data.get('email')
    if Empresa.objects.filter(email=email).exists() or Cliente.objects.filter(email=email).exists():
        return Response(
            {"detail": "Email já registrado"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    serializer = EmpresaCriarSerializer(data=request.data)
    if serializer.is_valid():
        empresa = serializer.save()
        return Response(
            EmpresaSerializer(empresa).data,
            status=status.HTTP_201_CREATED
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def registrar_cliente(request):
    """Registrar um novo cliente"""
    # Verificar se email já existe
    email = request.data.get('email')
    if Cliente.objects.filter(email=email).exists() or Empresa.objects.filter(email=email).exists():
        return Response(
            {"detail": "Email já registrado"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    serializer = ClienteCriarSerializer(data=request.data)
    if serializer.is_valid():
        cliente = serializer.save()
        return Response(
            ClienteSerializer(cliente).data,
            status=status.HTTP_201_CREATED
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def fazer_login(request):
    """Login para empresas e clientes"""
    serializer = LoginSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    email = serializer.validated_data['email']
    senha = serializer.validated_data['senha']
    tipo_usuario = serializer.validated_data['tipo_usuario']
    
    usuario = None
    
    if tipo_usuario == 'empresa':
        try:
            usuario = Empresa.objects.get(email=email)
        except Empresa.DoesNotExist:
            pass
    elif tipo_usuario == 'cliente':
        try:
            usuario = Cliente.objects.get(email=email)
        except Cliente.DoesNotExist:
            pass
    else:
        return Response(
            {"detail": "Tipo de usuário inválido. Deve ser 'empresa' ou 'cliente'"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if not usuario or not usuario.check_password(senha):
        return Response(
            {"detail": "Email ou senha incorretos"},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    # Criar tokens
    tokens = criar_token_para_usuario(usuario, tipo_usuario)
    
    return Response(tokens, status=status.HTTP_200_OK)
