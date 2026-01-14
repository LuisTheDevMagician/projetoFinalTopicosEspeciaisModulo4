from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from api.models import Ingresso, Evento, Pagamento
from api.serializers import (
    IngressoCriarSerializer, IngressoDetalheSerializer,
    PagamentoComIngressosSerializer
)
from api.utils.permissions import IsCliente
from api.utils.helpers import gerar_hash_ingresso, gerar_codigo_pagamento


@api_view(['POST'])
@permission_classes([IsCliente])
def comprar_ingresso(request):
    """Comprar ingressos - cria 1 pagamento + N ingressos individuais"""
    serializer = IngressoCriarSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    dados = serializer.validated_data
    
    # Verificar se o evento existe e está ativo
    try:
        evento = Evento.objects.get(pk=dados['evento_id'])
    except Evento.DoesNotExist:
        return Response(
            {"detail": "Evento não encontrado"},
            status=status.HTTP_404_NOT_FOUND
        )
    
    if not evento.ativo:
        return Response(
            {"detail": "Evento não está ativo"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Verificar se ainda há ingressos disponíveis
    total_vendidos = Ingresso.objects.filter(evento=evento).count()
    
    if total_vendidos + dados['quantidade'] > evento.total_ingressos:
        return Response(
            {"detail": "Não há ingressos disponíveis suficientes para este evento"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Calcular valor total
    valor_total = (evento.preco_ingresso / 100) * dados['quantidade']
    
    # Gerar código único de pagamento
    codigo_pagamento = gerar_codigo_pagamento()
    
    # Garantir que o código de pagamento é único
    while Pagamento.objects.filter(codigo_pagamento=codigo_pagamento).exists():
        codigo_pagamento = gerar_codigo_pagamento()
    
    # Criar o pagamento
    pagamento = Pagamento.objects.create(
        codigo_pagamento=codigo_pagamento,
        quantidade=dados['quantidade'],
        valor_total=valor_total,
        metodo_pagamento=dados['metodo_pagamento'],
        nome_comprador=dados['nome_comprador'],
        email_comprador=dados['email_comprador'],
        cpf_comprador=dados['cpf_comprador'],
        cliente=request.user,
        evento=evento
    )
    
    # Criar ingressos individuais
    ingressos_criados = []
    
    for _ in range(dados['quantidade']):
        # Gerar hash único para cada ingresso
        codigo_hash = gerar_hash_ingresso()
        
        # Garantir que o hash é único
        while Ingresso.objects.filter(codigo_hash=codigo_hash).exists():
            codigo_hash = gerar_hash_ingresso()
        
        # Criar ingresso individual (quantidade sempre 1)
        ingresso = Ingresso.objects.create(
            codigo_hash=codigo_hash,
            cliente=request.user,
            evento=evento,
            pagamento=pagamento,
            quantidade=1,  # Cada registro é 1 ingresso
            metodo_pagamento=dados['metodo_pagamento'],
            nome_comprador=dados['nome_comprador'],
            email_comprador=dados['email_comprador'],
            cpf_comprador=dados['cpf_comprador']
        )
        ingressos_criados.append(ingresso)
    
    # Recarregar pagamento com relacionamentos
    pagamento = Pagamento.objects.select_related('evento').prefetch_related('ingressos').get(pk=pagamento.id)
    
    serializer = PagamentoComIngressosSerializer(pagamento)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsCliente])
def obter_meus_pagamentos(request):
    """Obter todos os pagamentos do cliente atual"""
    pagamentos = Pagamento.objects.filter(
        cliente=request.user
    ).select_related('evento').prefetch_related('ingressos').order_by('-criado_em')
    
    serializer = PagamentoComIngressosSerializer(pagamentos, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsCliente])
def obter_meus_ingressos(request):
    """Obter todos os ingressos comprados pelo cliente atual"""
    ingressos = Ingresso.objects.filter(
        cliente=request.user
    ).select_related('evento').order_by('-comprado_em')
    
    serializer = IngressoDetalheSerializer(ingressos, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsCliente])
def obter_detalhes_ingresso(request, ingresso_id):
    """Obter detalhes de um ingresso específico"""
    try:
        ingresso = Ingresso.objects.select_related('evento').get(
            pk=ingresso_id,
            cliente=request.user
        )
    except Ingresso.DoesNotExist:
        return Response(
            {"detail": "Ingresso não encontrado"},
            status=status.HTTP_404_NOT_FOUND
        )
    
    serializer = IngressoDetalheSerializer(ingresso)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def verificar_ingresso(request, codigo_hash):
    """Verificar um ingresso pelo código hash (endpoint público)"""
    try:
        ingresso = Ingresso.objects.select_related('evento').get(codigo_hash=codigo_hash)
    except Ingresso.DoesNotExist:
        return Response(
            {"detail": "Ingresso não encontrado"},
            status=status.HTTP_404_NOT_FOUND
        )
    
    serializer = IngressoDetalheSerializer(ingresso)
    return Response(serializer.data)
