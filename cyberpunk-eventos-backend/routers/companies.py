from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from typing import Optional, List
from database.database import obter_db
from database.models import Empresa, Evento
from schemas import EmpresaResposta, EmpresaAtualizar
from utils.auth import obter_empresa_atual, obter_hash_senha, verificar_senha
from utils.helpers import salvar_arquivo_upload, deletar_arquivo

router = APIRouter(prefix="/empresas", tags=["Empresas"])


@router.get("/eu", response_model=EmpresaResposta)
async def obter_meu_perfil(
    usuario_atual: dict = Depends(obter_empresa_atual),
    db: AsyncSession = Depends(obter_db)
):
    """Obter perfil da empresa atual"""
    result = await db.execute(select(Empresa).where(Empresa.id == usuario_atual["usuario_id"]))
    empresa = result.scalar_one_or_none()
    
    if not empresa:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Empresa não encontrada"
        )
    
    return empresa


@router.get("/{empresa_id}", response_model=EmpresaResposta)
async def obter_perfil_empresa(empresa_id: int, db: AsyncSession = Depends(obter_db)):
    """Obter perfil público da empresa"""
    result = await db.execute(select(Empresa).where(Empresa.id == empresa_id))
    empresa = result.scalar_one_or_none()
    
    if not empresa:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Empresa não encontrada"
        )
    
    return empresa


@router.put("/eu", response_model=EmpresaResposta)
async def atualizar_perfil_empresa(
    nome: Optional[str] = Form(None),
    endereco: Optional[str] = Form(None),
    biografia: Optional[str] = Form(None),
    imagem_perfil: Optional[UploadFile] = File(None),
    imagem_fundo: Optional[UploadFile] = File(None),
    usuario_atual: dict = Depends(obter_empresa_atual),
    db: AsyncSession = Depends(obter_db)
):
    """Atualizar perfil da empresa com dados multipart"""
    result = await db.execute(select(Empresa).where(Empresa.id == usuario_atual["usuario_id"]))
    empresa = result.scalar_one_or_none()
    
    if not empresa:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Empresa não encontrada"
        )
    
    # Atualizar campos de texto
    if nome is not None:
        empresa.nome = nome
    if endereco is not None:
        empresa.endereco = endereco
    if biografia is not None:
        empresa.biografia = biografia
    
    # Atualizar imagem de perfil
    if imagem_perfil:
        # Deletar imagem antiga
        await deletar_arquivo(empresa.imagem_perfil)
        # Salvar nova imagem
        empresa.imagem_perfil = await salvar_arquivo_upload(imagem_perfil, "perfis")
    
    # Atualizar imagem de fundo
    if imagem_fundo:
        # Deletar imagem antiga
        await deletar_arquivo(empresa.imagem_fundo)
        # Salvar nova imagem
        empresa.imagem_fundo = await salvar_arquivo_upload(imagem_fundo, "fundos")
    
    await db.commit()
    await db.refresh(empresa)
    
    return empresa


@router.put("/eu/senha")
async def mudar_senha(
    senha_antiga: str = Form(...),
    senha_nova: str = Form(...),
    usuario_atual: dict = Depends(obter_empresa_atual),
    db: AsyncSession = Depends(obter_db)
):
    """Mudar senha da empresa"""
    result = await db.execute(select(Empresa).where(Empresa.id == usuario_atual["usuario_id"]))
    empresa = result.scalar_one_or_none()
    
    if not empresa:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Empresa não encontrada"
        )
    
    if not verificar_senha(senha_antiga, empresa.senha):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Senha incorreta"
        )
    
    empresa.senha = obter_hash_senha(senha_nova)
    await db.commit()
    
    return {"mensagem": "Senha alterada com sucesso"}


@router.get("/{empresa_id}/eventos", response_model=List[dict])
async def obter_eventos_ativos_empresa(empresa_id: int, db: AsyncSession = Depends(obter_db)):
    """Obter eventos ativos de uma empresa (endpoint público)"""
    result = await db.execute(
        select(Evento)
        .options(selectinload(Evento.ingressos))
        .where(Evento.organizador_id == empresa_id, Evento.ativo == True)
        .order_by(Evento.criado_em.desc())
    )
    eventos = result.scalars().all()
    
    return [
        {
            "id": evento.id,
            "nome": evento.nome,
            "localizacao": evento.localizacao,
            "descricao": evento.descricao,
            "criado_em": evento.criado_em,
            "data_fim": evento.data_fim,
            "preco_ingresso": evento.preco_ingresso,
            "total_ingressos": evento.total_ingressos,
            "ativo": evento.ativo,
            "ingressos_vendidos": len(evento.ingressos)
        }
        for evento in eventos
    ]
