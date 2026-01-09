from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List
from database.database import obter_db
from database.models import Ingresso, Evento, Pagamento
from schemas import IngressoCriar, IngressoResposta, IngressoDetalheResposta, PagamentoComIngressos
from utils.auth import obter_cliente_atual
from utils.helpers import gerar_hash_ingresso
from hashlib import sha256
from datetime import datetime

router = APIRouter(prefix="/ingressos", tags=["Ingressos"])


def gerar_codigo_pagamento() -> str:
    """Gera um código único de pagamento"""
    timestamp = datetime.now().isoformat()
    return sha256(f"PAG-{timestamp}".encode()).hexdigest()[:16].upper()


@router.post("", response_model=PagamentoComIngressos, status_code=status.HTTP_201_CREATED)
async def comprar_ingresso(
    dados_ingresso: IngressoCriar,
    usuario_atual: dict = Depends(obter_cliente_atual),
    db: AsyncSession = Depends(obter_db)
):
    """Comprar ingressos - cria 1 pagamento + N ingressos individuais"""
    # Verificar se o evento existe e está ativo
    evento_result = await db.execute(select(Evento).where(Evento.id == dados_ingresso.evento_id))
    evento = evento_result.scalar_one_or_none()
    
    if not evento:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evento não encontrado"
        )
    
    if not evento.ativo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Evento não está ativo"
        )
    
    # Verificar se ainda há ingressos disponíveis
    ingressos_result = await db.execute(
        select(Ingresso).where(Ingresso.evento_id == dados_ingresso.evento_id)
    )
    ingressos_existentes = ingressos_result.scalars().all()
    
    # Calcular total de ingressos vendidos (cada registro = 1 ingresso)
    total_vendidos = len(ingressos_existentes)
    
    if total_vendidos + dados_ingresso.quantidade > evento.total_ingressos:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Não há ingressos disponíveis suficientes para este evento"
        )
    
    # Calcular valor total
    valor_total = (evento.preco_ingresso / 100) * dados_ingresso.quantidade
    
    # Gerar código único de pagamento
    codigo_pagamento = gerar_codigo_pagamento()
    
    # Garantir que o código de pagamento é único
    while True:
        pag_result = await db.execute(select(Pagamento).where(Pagamento.codigo_pagamento == codigo_pagamento))
        if not pag_result.scalar_one_or_none():
            break
        codigo_pagamento = gerar_codigo_pagamento()
    
    # Criar o pagamento
    pagamento = Pagamento(
        codigo_pagamento=codigo_pagamento,
        quantidade=dados_ingresso.quantidade,
        valor_total=valor_total,
        metodo_pagamento=dados_ingresso.metodo_pagamento,
        nome_comprador=dados_ingresso.nome_comprador,
        email_comprador=dados_ingresso.email_comprador,
        cpf_comprador=dados_ingresso.cpf_comprador,
        cliente_id=usuario_atual["usuario_id"],
        evento_id=dados_ingresso.evento_id
    )
    
    db.add(pagamento)
    await db.flush()  # Flush para obter o ID do pagamento
    
    # Criar ingressos individuais
    ingressos_criados = []
    
    for _ in range(dados_ingresso.quantidade):
        # Gerar hash único para cada ingresso
        codigo_hash = gerar_hash_ingresso()
        
        # Garantir que o hash é único
        while True:
            hash_result = await db.execute(select(Ingresso).where(Ingresso.codigo_hash == codigo_hash))
            if not hash_result.scalar_one_or_none():
                break
            codigo_hash = gerar_hash_ingresso()
        
        # Criar ingresso individual (quantidade sempre 1)
        ingresso = Ingresso(
            codigo_hash=codigo_hash,
            cliente_id=usuario_atual["usuario_id"],
            evento_id=dados_ingresso.evento_id,
            pagamento_id=pagamento.id,
            quantidade=1,  # Cada registro é 1 ingresso
            metodo_pagamento=dados_ingresso.metodo_pagamento.value,
            nome_comprador=dados_ingresso.nome_comprador,
            email_comprador=dados_ingresso.email_comprador,
            cpf_comprador=dados_ingresso.cpf_comprador
        )
        
        db.add(ingresso)
        ingressos_criados.append(ingresso)
    
    await db.commit()
    await db.refresh(pagamento)
    
    # Refresh dos ingressos para obter IDs
    for ingresso in ingressos_criados:
        await db.refresh(ingresso)
    
    # Carregar relacionamentos completos
    result = await db.execute(
        select(Pagamento)
        .options(selectinload(Pagamento.ingressos), selectinload(Pagamento.evento))
        .where(Pagamento.id == pagamento.id)
    )
    pagamento_completo = result.scalar_one()
    
    return pagamento_completo


@router.get("/meus-pagamentos", response_model=List[PagamentoComIngressos])
async def obter_meus_pagamentos(
    usuario_atual: dict = Depends(obter_cliente_atual),
    db: AsyncSession = Depends(obter_db)
):
    """Obter todos os pagamentos do cliente atual"""
    result = await db.execute(
        select(Pagamento)
        .options(selectinload(Pagamento.ingressos), selectinload(Pagamento.evento))
        .where(Pagamento.cliente_id == usuario_atual["usuario_id"])
        .order_by(Pagamento.criado_em.desc())
    )
    pagamentos = result.scalars().all()
    
    return pagamentos


@router.get("/meus-ingressos", response_model=List[IngressoDetalheResposta])
async def obter_meus_ingressos(
    usuario_atual: dict = Depends(obter_cliente_atual),
    db: AsyncSession = Depends(obter_db)
):
    """Obter todos os ingressos comprados pelo cliente atual"""
    result = await db.execute(
        select(Ingresso)
        .where(Ingresso.cliente_id == usuario_atual["usuario_id"])
        .order_by(Ingresso.comprado_em.desc())
    )
    ingressos = result.scalars().all()
    
    # Adicionar detalhes do evento para cada ingresso
    resposta = []
    for ingresso in ingressos:
        evento_result = await db.execute(select(Evento).where(Evento.id == ingresso.evento_id))
        evento = evento_result.scalar_one()
        
        # Contar ingressos vendidos (cada registro = 1 ingresso)
        from sqlalchemy import func
        ingressos_vendidos_result = await db.execute(
            select(func.count(Ingresso.id)).where(Ingresso.evento_id == evento.id)
        )
        ingressos_vendidos = ingressos_vendidos_result.scalar() or 0
        
        resposta.append({
            **ingresso.__dict__,
            "evento": {
                **evento.__dict__,
                "ingressos_vendidos": ingressos_vendidos
            }
        })
    
    return resposta


@router.get("/{ingresso_id}", response_model=IngressoDetalheResposta)
async def obter_detalhes_ingresso(
    ingresso_id: int,
    usuario_atual: dict = Depends(obter_cliente_atual),
    db: AsyncSession = Depends(obter_db)
):
    """Obter detalhes de um ingresso específico"""
    result = await db.execute(
        select(Ingresso)
        .where(
            Ingresso.id == ingresso_id,
            Ingresso.cliente_id == usuario_atual["usuario_id"]
        )
    )
    ingresso = result.scalar_one_or_none()
    
    if not ingresso:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ingresso não encontrado"
        )
    
    # Obter detalhes do evento
    evento_result = await db.execute(select(Evento).where(Evento.id == ingresso.evento_id))
    evento = evento_result.scalar_one()
    
    # Contar ingressos vendidos (soma das quantidades)
    from sqlalchemy import func
    ingressos_vendidos_result = await db.execute(
        select(func.sum(Ingresso.quantidade)).where(Ingresso.evento_id == evento.id)
    )
    ingressos_vendidos = ingressos_vendidos_result.scalar() or 0
    
    return {
        **ingresso.__dict__,
        "evento": {
            **evento.__dict__,
            "ingressos_vendidos": ingressos_vendidos
        }
    }


@router.get("/verificar/{codigo_hash}", response_model=IngressoDetalheResposta)
async def verificar_ingresso(codigo_hash: str, db: AsyncSession = Depends(obter_db)):
    """Verificar um ingresso pelo código hash (endpoint público)"""
    result = await db.execute(select(Ingresso).where(Ingresso.codigo_hash == codigo_hash))
    ingresso = result.scalar_one_or_none()
    
    if not ingresso:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ingresso não encontrado"
        )
    
    # Obter detalhes do evento
    evento_result = await db.execute(select(Evento).where(Evento.id == ingresso.evento_id))
    evento = evento_result.scalar_one()
    
    # Contar ingressos vendidos (soma das quantidades)
    from sqlalchemy import func
    ingressos_vendidos_result = await db.execute(
        select(func.sum(Ingresso.quantidade)).where(Ingresso.evento_id == evento.id)
    )
    ingressos_vendidos = ingressos_vendidos_result.scalar() or 0
    
    return {
        **ingresso.__dict__,
        "evento": {
            **evento.__dict__,
            "ingressos_vendidos": ingressos_vendidos
        }
    }
