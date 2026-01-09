from fastapi import APIRouter, Depends, HTTPException, status, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database.database import obter_db
from database.models import Cliente
from schemas import ClienteResposta, ClienteAtualizar
from utils.auth import obter_cliente_atual, obter_hash_senha, verificar_senha

router = APIRouter(prefix="/clientes", tags=["Clientes"])


@router.get("/eu", response_model=ClienteResposta)
async def obter_meu_perfil(
    usuario_atual: dict = Depends(obter_cliente_atual),
    db: AsyncSession = Depends(obter_db)
):
    """Obter perfil do cliente atual"""
    result = await db.execute(select(Cliente).where(Cliente.id == usuario_atual["usuario_id"]))
    cliente = result.scalar_one_or_none()
    
    if not cliente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cliente não encontrado"
        )
    
    return cliente


@router.put("/eu", response_model=ClienteResposta)
async def atualizar_perfil_cliente(
    cliente_atualizar: ClienteAtualizar,
    usuario_atual: dict = Depends(obter_cliente_atual),
    db: AsyncSession = Depends(obter_db)
):
    """Atualizar perfil do cliente"""
    result = await db.execute(select(Cliente).where(Cliente.id == usuario_atual["usuario_id"]))
    cliente = result.scalar_one_or_none()
    
    if not cliente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cliente não encontrado"
        )
    
    # Verificar se o novo email já está em uso
    if cliente_atualizar.email and cliente_atualizar.email != cliente.email:
        email_result = await db.execute(select(Cliente).where(Cliente.email == cliente_atualizar.email))
        if email_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email já está em uso"
            )
        cliente.email = cliente_atualizar.email
    
    if cliente_atualizar.nome:
        cliente.nome = cliente_atualizar.nome
    
    await db.commit()
    await db.refresh(cliente)
    
    return cliente


@router.put("/eu/senha")
async def mudar_senha(
    senha_antiga: str = Form(...),
    senha_nova: str = Form(...),
    usuario_atual: dict = Depends(obter_cliente_atual),
    db: AsyncSession = Depends(obter_db)
):
    """Mudar senha do cliente"""
    result = await db.execute(select(Cliente).where(Cliente.id == usuario_atual["usuario_id"]))
    cliente = result.scalar_one_or_none()
    
    if not cliente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cliente não encontrado"
        )
    
    if not verificar_senha(senha_antiga, cliente.senha):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Senha incorreta"
        )
    
    cliente.senha = obter_hash_senha(senha_nova)
    await db.commit()
    
    return {"mensagem": "Senha alterada com sucesso"}
