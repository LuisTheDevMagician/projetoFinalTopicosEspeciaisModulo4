from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, extract
from sqlalchemy.orm import selectinload
from typing import List, Optional
from datetime import datetime, timedelta, timezone
from database.database import obter_db
from database.models import Evento, Ingresso, Empresa
from schemas import EventoCriar, EventoResposta, EventoDetalheResposta, EventoAtualizar, EstatisticasDashboard, EstatisticasVendasIngressos
from utils.auth import obter_empresa_atual

router = APIRouter(prefix="/eventos", tags=["Eventos"])


@router.post("", response_model=EventoResposta, status_code=status.HTTP_201_CREATED)
async def criar_evento(
    evento: EventoCriar,
    usuario_atual: dict = Depends(obter_empresa_atual),
    db: AsyncSession = Depends(obter_db)
):
    """Criar um novo evento (apenas empresa)"""
    # Validar se a data de término está no futuro
    if evento.data_fim <= datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A data de término deve estar no futuro"
        )
    
    db_evento = Evento(
        nome=evento.nome,
        localizacao=evento.localizacao,
        descricao=evento.descricao,
        data_fim=evento.data_fim,
        preco_ingresso=evento.preco_ingresso,
        total_ingressos=evento.total_ingressos,
        organizador_id=usuario_atual["usuario_id"]
    )
    
    db.add(db_evento)
    await db.commit()
    await db.refresh(db_evento)
    
    # Adicionar contagem de ingressos vendidos (cada registro = 1 ingresso)
    result = await db.execute(select(func.count(Ingresso.id)).where(Ingresso.evento_id == db_evento.id))
    ingressos_vendidos = result.scalar() or 0
    
    resposta_dict = {
        **db_evento.__dict__,
        "ingressos_vendidos": ingressos_vendidos
    }
    
    return resposta_dict


@router.get("/meus-eventos", response_model=List[EventoResposta])
async def obter_meus_eventos(
    apenas_ativos: bool = Query(True, description="Filtrar apenas eventos ativos"),
    usuario_atual: dict = Depends(obter_empresa_atual),
    db: AsyncSession = Depends(obter_db)
):
    """Obter todos os eventos da empresa atual"""
    query = select(Evento).where(Evento.organizador_id == usuario_atual["usuario_id"])
    
    if apenas_ativos:
        query = query.where(Evento.ativo == True)
    
    query = query.order_by(Evento.criado_em.desc())
    
    result = await db.execute(query)
    eventos = result.scalars().all()
    
    # Adicionar contagem de ingressos vendidos para cada evento (cada registro = 1 ingresso)
    resposta = []
    for evento in eventos:
        ingresso_result = await db.execute(
            select(func.count(Ingresso.id)).where(Ingresso.evento_id == evento.id)
        )
        ingressos_vendidos = ingresso_result.scalar() or 0
        
        resposta.append({
            **evento.__dict__,
            "ingressos_vendidos": ingressos_vendidos
        })
    
    return resposta


@router.get("/meus-eventos/historico", response_model=List[EventoResposta])
async def obter_historico_eventos(
    usuario_atual: dict = Depends(obter_empresa_atual),
    db: AsyncSession = Depends(obter_db)
):
    """Obter eventos finalizados/inativos da empresa atual"""
    result = await db.execute(
        select(Evento)
        .where(
            Evento.organizador_id == usuario_atual["usuario_id"],
            Evento.ativo == False
        )
        .order_by(Evento.data_fim.desc())
    )
    eventos = result.scalars().all()
    
    # Adicionar contagem de ingressos vendidos para cada evento (cada registro = 1 ingresso)
    resposta = []
    for evento in eventos:
        ingresso_result = await db.execute(
            select(func.count(Ingresso.id)).where(Ingresso.evento_id == evento.id)
        )
        ingressos_vendidos = ingresso_result.scalar() or 0
        
        resposta.append({
            **evento.__dict__,
            "ingressos_vendidos": ingressos_vendidos
        })
    
    return resposta


@router.get("/dashboard/estatisticas", response_model=EstatisticasDashboard)
async def obter_estatisticas_dashboard(
    data_inicio: Optional[datetime] = Query(None),
    data_fim: Optional[datetime] = Query(None),
    usuario_atual: dict = Depends(obter_empresa_atual),
    db: AsyncSession = Depends(obter_db)
):
    """Obter estatísticas do dashboard com vendas ao longo do tempo"""
    # Definir intervalo de datas padrão se não fornecido (últimos 30 dias)
    if not data_fim:
        data_fim = datetime.utcnow()
    if not data_inicio:
        data_inicio = data_fim - timedelta(days=30)
    
    # Total de eventos
    total_eventos_result = await db.execute(
        select(func.count(Evento.id)).where(Evento.organizador_id == usuario_atual["usuario_id"])
    )
    total_eventos = total_eventos_result.scalar() or 0
    
    # Eventos ativos
    eventos_ativos_result = await db.execute(
        select(func.count(Evento.id)).where(
            Evento.organizador_id == usuario_atual["usuario_id"],
            Evento.ativo == True
        )
    )
    eventos_ativos = eventos_ativos_result.scalar() or 0
    
    # Obter todos os ingressos dos eventos do usuário
    ingressos_query = select(Ingresso).join(Evento).where(Evento.organizador_id == usuario_atual["usuario_id"])
    ingressos_result = await db.execute(ingressos_query)
    todos_ingressos = ingressos_result.scalars().all()
    
    total_ingressos_vendidos = len(todos_ingressos)
    
    # Calcular receita
    receita_query = (
        select(func.sum(Evento.preco_ingresso))
        .join(Ingresso, Evento.id == Ingresso.evento_id)
        .where(Evento.organizador_id == usuario_atual["usuario_id"])
    )
    receita_result = await db.execute(receita_query)
    receita_total = receita_result.scalar() or 0
    
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
    
    return {
        "total_eventos": total_eventos,
        "eventos_ativos": eventos_ativos,
        "total_ingressos_vendidos": total_ingressos_vendidos,
        "receita_total": receita_total,
        "vendas_ao_longo_tempo": vendas_ao_longo_tempo
    }


@router.get("/{evento_id}", response_model=EventoDetalheResposta)
async def obter_detalhes_evento(
    evento_id: int,
    usuario_atual: dict = Depends(obter_empresa_atual),
    db: AsyncSession = Depends(obter_db)
):
    """Obter informações detalhadas do evento"""
    result = await db.execute(
        select(Evento)
        .where(
            Evento.id == evento_id,
            Evento.organizador_id == usuario_atual["usuario_id"]
        )
    )
    evento = result.scalar_one_or_none()
    
    if not evento:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evento não encontrado"
        )
    
    # Obter detalhes do organizador
    from database.models import Empresa
    organizador_result = await db.execute(select(Empresa).where(Empresa.id == evento.organizador_id))
    organizador = organizador_result.scalar_one()
    
    # Obter ingressos
    ingressos_result = await db.execute(select(Ingresso).where(Ingresso.evento_id == evento_id))
    ingressos = ingressos_result.scalars().all()
    
    return {
        **evento.__dict__,
        "ingressos_vendidos": len(ingressos),
        "organizador": organizador,
        "ingressos": ingressos
    }


@router.put("/{evento_id}", response_model=EventoResposta)
async def atualizar_evento(
    evento_id: int,
    evento_atualizar: EventoAtualizar,
    usuario_atual: dict = Depends(obter_empresa_atual),
    db: AsyncSession = Depends(obter_db)
):
    """Atualizar um evento"""
    result = await db.execute(
        select(Evento)
        .where(
            Evento.id == evento_id,
            Evento.organizador_id == usuario_atual["usuario_id"]
        )
    )
    evento = result.scalar_one_or_none()
    
    if not evento:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evento não encontrado"
        )
    
    # Atualizar campos
    dados_atualizacao = evento_atualizar.model_dump(exclude_unset=True)
    for campo, valor in dados_atualizacao.items():
        setattr(evento, campo, valor)
    
    await db.commit()
    await db.refresh(evento)
    
    # Adicionar contagem de ingressos vendidos (cada registro = 1 ingresso)
    ingresso_result = await db.execute(
        select(func.count(Ingresso.id)).where(Ingresso.evento_id == evento.id)
    )
    ingressos_vendidos = ingresso_result.scalar() or 0
    
    return {
        **evento.__dict__,
        "ingressos_vendidos": ingressos_vendidos
    }


@router.delete("/{evento_id}", status_code=status.HTTP_204_NO_CONTENT)
async def deletar_evento(
    evento_id: int,
    usuario_atual: dict = Depends(obter_empresa_atual),
    db: AsyncSession = Depends(obter_db)
):
    """Deletar um evento"""
    result = await db.execute(
        select(Evento)
        .where(
            Evento.id == evento_id,
            Evento.organizador_id == usuario_atual["usuario_id"]
        )
    )
    evento = result.scalar_one_or_none()
    
    if not evento:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evento não encontrado"
        )
    
    await db.delete(evento)
    await db.commit()
    
    return None


@router.get("", response_model=List[dict])
async def obter_todos_eventos_ativos(
    pular: int = Query(0, ge=0),
    limite: int = Query(100, ge=1, le=100),
    db: AsyncSession = Depends(obter_db)
):
    """Obter todos os eventos ativos (endpoint público)"""
    result = await db.execute(
        select(Evento)
        .options(selectinload(Evento.organizador), selectinload(Evento.ingressos))
        .where(Evento.ativo == True)
        .order_by(Evento.criado_em.desc())
        .offset(pular)
        .limit(limite)
    )
    eventos = result.scalars().all()
    
    # Montar resposta com organizador e ingressos vendidos
    resposta = []
    for evento in eventos:
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
            "ingressos_vendidos": len(evento.ingressos),
            "organizador": {
                "id": evento.organizador.id,
                "nome": evento.organizador.nome,
                "email": evento.organizador.email
            } if evento.organizador else None
        })
    
    return resposta
