from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Count
from datetime import timedelta
from api.models import Evento, Ingresso, Empresa
from api.serializers import (
    EventoSerializer, EventoCriarSerializer, EventoAtualizarSerializer,
    EventoDetalheSerializer, EstatisticasDashboardSerializer
)
from api.utils.permissions import IsEmpresa


@api_view(['POST'])
@permission_classes([IsEmpresa])
def criar_evento(request):
    """Criar um novo evento (apenas empresa)"""
    serializer = EventoCriarSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    # Validar se a data de término está no futuro
    if serializer.validated_data['data_fim'] <= timezone.now():
        return Response(
            {"detail": "A data de término deve estar no futuro"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    evento = serializer.save(organizador=request.user)
    return Response(EventoSerializer(evento).data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsEmpresa])
def obter_meus_eventos(request):
    """Obter todos os eventos da empresa atual"""
    apenas_ativos = request.query_params.get('apenas_ativos', 'true').lower() == 'true'
    
    query = Evento.objects.filter(organizador=request.user)
    
    if apenas_ativos:
        query = query.filter(ativo=True)
    
    eventos = query.order_by('-criado_em')
    
    serializer = EventoSerializer(eventos, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsEmpresa])
def obter_historico_eventos(request):
    """Obter eventos finalizados/inativos da empresa atual"""
    eventos = Evento.objects.filter(
        organizador=request.user,
        ativo=False
    ).order_by('-data_fim')
    
    serializer = EventoSerializer(eventos, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsEmpresa])
def obter_estatisticas_dashboard(request):
    """Obter estatísticas do dashboard com vendas ao longo do tempo"""
    # Parâmetros de data
    data_fim_str = request.query_params.get('data_fim')
    data_inicio_str = request.query_params.get('data_inicio')
    
    data_fim = timezone.now()
    if data_fim_str:
        from datetime import datetime
        data_fim = datetime.fromisoformat(data_fim_str.replace('Z', '+00:00'))
    
    data_inicio = data_fim - timedelta(days=30)
    if data_inicio_str:
        from datetime import datetime
        data_inicio = datetime.fromisoformat(data_inicio_str.replace('Z', '+00:00'))
    
    # Total de eventos
    total_eventos = Evento.objects.filter(organizador=request.user).count()
    
    # Eventos ativos
    eventos_ativos = Evento.objects.filter(
        organizador=request.user,
        ativo=True
    ).count()
    
    # Obter todos os ingressos dos eventos do usuário
    todos_ingressos = Ingresso.objects.filter(
        evento__organizador=request.user
    ).select_related('evento')
    
    total_ingressos_vendidos = todos_ingressos.count()
    
    # Calcular receita
    receita_total = sum(
        ingresso.evento.preco_ingresso
        for ingresso in todos_ingressos
    )
    
    # Vendas ao longo do tempo (agrupadas por data)
    vendas_dict = {}
    for ingresso in todos_ingressos:
        if data_inicio <= ingresso.comprado_em <= data_fim:
            chave_data = ingresso.comprado_em.strftime("%Y-%m-%d")
            vendas_dict[chave_data] = vendas_dict.get(chave_data, 0) + 1
    
    # Preencher datas faltantes com 0
    data_atual = data_inicio
    vendas_ao_longo_tempo = []
    while data_atual <= data_fim:
        chave_data = data_atual.strftime("%Y-%m-%d")
        vendas_ao_longo_tempo.append({
            "data": chave_data,
            "quantidade": vendas_dict.get(chave_data, 0)
        })
        data_atual += timedelta(days=1)
    
    dados = {
        "total_eventos": total_eventos,
        "eventos_ativos": eventos_ativos,
        "total_ingressos_vendidos": total_ingressos_vendidos,
        "receita_total": receita_total,
        "vendas_ao_longo_tempo": vendas_ao_longo_tempo
    }
    
    serializer = EstatisticasDashboardSerializer(dados)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsEmpresa])
def obter_detalhes_evento(request, evento_id):
    """Obter informações detalhadas do evento"""
    try:
        evento = Evento.objects.select_related('organizador').get(
            pk=evento_id,
            organizador=request.user
        )
    except Evento.DoesNotExist:
        return Response(
            {"detail": "Evento não encontrado"},
            status=status.HTTP_404_NOT_FOUND
        )
    
    serializer = EventoDetalheSerializer(evento)
    return Response(serializer.data)


@api_view(['PUT'])
@permission_classes([IsEmpresa])
def atualizar_evento(request, evento_id):
    """Atualizar um evento"""
    try:
        evento = Evento.objects.get(pk=evento_id, organizador=request.user)
    except Evento.DoesNotExist:
        return Response(
            {"detail": "Evento não encontrado"},
            status=status.HTTP_404_NOT_FOUND
        )
    
    serializer = EventoAtualizarSerializer(evento, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(EventoSerializer(evento).data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsEmpresa])
def deletar_evento(request, evento_id):
    """Deletar um evento"""
    try:
        evento = Evento.objects.get(pk=evento_id, organizador=request.user)
    except Evento.DoesNotExist:
        return Response(
            {"detail": "Evento não encontrado"},
            status=status.HTTP_404_NOT_FOUND
        )
    
    evento.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
@permission_classes([AllowAny])
def obter_todos_eventos_ativos(request):
    """Obter todos os eventos ativos (endpoint público)"""
    pular = int(request.query_params.get('pular', 0))
    limite = int(request.query_params.get('limite', 100))
    
    eventos = Evento.objects.filter(ativo=True).select_related('organizador').order_by('-criado_em')[pular:pular+limite]
    
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
            "ingressos_vendidos": ingressos_vendidos,
            "organizador": {
                "id": evento.organizador.id,
                "nome": evento.organizador.nome,
                "email": evento.organizador.email
            } if evento.organizador else None
        })
    
    return Response(resposta)
