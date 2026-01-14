from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from api.models import Empresa, Evento
from api.serializers import (
    EmpresaSerializer, EmpresaAtualizarSerializer, MudarSenhaSerializer
)
from api.utils.permissions import IsEmpresa
from api.utils.auth import CustomJWTAuthentication
from api.utils.helpers import salvar_arquivo_upload, deletar_arquivo


@api_view(['GET'])
@permission_classes([IsEmpresa])
def obter_meu_perfil(request):
    """Obter perfil da empresa atual"""
    serializer = EmpresaSerializer(request.user)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def obter_perfil_empresa(request, empresa_id):
    """Obter perfil público da empresa"""
    try:
        empresa = Empresa.objects.get(pk=empresa_id)
    except Empresa.DoesNotExist:
        return Response(
            {"detail": "Empresa não encontrada"},
            status=status.HTTP_404_NOT_FOUND
        )
    
    serializer = EmpresaSerializer(empresa)
    return Response(serializer.data)


@api_view(['PUT'])
@permission_classes([IsEmpresa])
@parser_classes([MultiPartParser, FormParser])
def atualizar_perfil_empresa(request):
    """Atualizar perfil da empresa com dados multipart"""
    empresa = request.user
    
    # Processar arquivos de imagem
    imagem_perfil = request.FILES.get('imagem_perfil')
    imagem_fundo = request.FILES.get('imagem_fundo')
    
    # Criar dict de dados atualizados
    dados = {}
    if 'nome' in request.data:
        dados['nome'] = request.data['nome']
    if 'endereco' in request.data:
        dados['endereco'] = request.data['endereco']
    if 'biografia' in request.data:
        dados['biografia'] = request.data['biografia']
    
    # Atualizar imagem de perfil
    if imagem_perfil:
        # Deletar imagem antiga
        deletar_arquivo(empresa.imagem_perfil)
        # Salvar nova imagem
        dados['imagem_perfil'] = salvar_arquivo_upload(imagem_perfil, "perfis")
    
    # Atualizar imagem de fundo
    if imagem_fundo:
        # Deletar imagem antiga
        deletar_arquivo(empresa.imagem_fundo)
        # Salvar nova imagem
        dados['imagem_fundo'] = salvar_arquivo_upload(imagem_fundo, "fundos")
    
    serializer = EmpresaAtualizarSerializer(empresa, data=dados, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(EmpresaSerializer(empresa).data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT'])
@permission_classes([IsEmpresa])
def mudar_senha(request):
    """Mudar senha da empresa"""
    empresa = request.user
    
    serializer = MudarSenhaSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    senha_antiga = serializer.validated_data['senha_antiga']
    senha_nova = serializer.validated_data['senha_nova']
    
    if not empresa.check_password(senha_antiga):
        return Response(
            {"detail": "Senha incorreta"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    empresa.set_password(senha_nova)
    empresa.save()
    
    return Response({"mensagem": "Senha alterada com sucesso"})


@api_view(['GET'])
@permission_classes([AllowAny])
def obter_eventos_ativos_empresa(request, empresa_id):
    """Obter eventos ativos de uma empresa (endpoint público)"""
    try:
        empresa = Empresa.objects.get(pk=empresa_id)
    except Empresa.DoesNotExist:
        return Response(
            {"detail": "Empresa não encontrada"},
            status=status.HTTP_404_NOT_FOUND
        )
    
    eventos = Evento.objects.filter(
        organizador=empresa,
        ativo=True
    ).order_by('-criado_em')
    
    resposta = []
    for evento in eventos:
        ingressos_vendidos = evento.ingressos.count()
        resposta.append({
            "id": evento.id,
            "nome": evento.nome,
            "localizacao": evento.localizacao,
            "descricao": evento.descricao,
            "criado_em": evento.criado_em,
            "data_fim": evento.data_fim,
            "preco_ingresso": evento.preco_ingresso,
            "total_ingressos": evento.total_ingressos,
            "ativo": evento.ativo,
            "ingressos_vendidos": ingressos_vendidos
        })
    
    return Response(resposta)
