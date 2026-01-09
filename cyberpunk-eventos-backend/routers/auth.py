from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database.database import obter_db
from database.models import Empresa, Cliente
from schemas import Token, RequisicaoLogin, EmpresaCriar, ClienteCriar, EmpresaResposta, ClienteResposta
from utils.auth import verificar_senha, obter_hash_senha, criar_token_acesso

router = APIRouter(prefix="/auth", tags=["Autenticação"])


@router.post("/registrar/empresa", response_model=EmpresaResposta, status_code=status.HTTP_201_CREATED)
async def registrar_empresa(empresa: EmpresaCriar, db: AsyncSession = Depends(obter_db)):
    """Registrar uma nova empresa"""
    # Verificar se email já existe
    resultado = await db.execute(select(Empresa).where(Empresa.email == empresa.email))
    if resultado.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email já registrado"
        )
    
    # Verificar em clientes também
    resultado = await db.execute(select(Cliente).where(Cliente.email == empresa.email))
    if resultado.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email já registrado"
        )
    
    # Criar nova empresa
    senha_hash = obter_hash_senha(empresa.senha)
    db_empresa = Empresa(
        nome=empresa.nome,
        email=empresa.email,
        senha=senha_hash,
        endereco=empresa.endereco,
        biografia=empresa.biografia
    )
    
    db.add(db_empresa)
    await db.commit()
    await db.refresh(db_empresa)
    
    return db_empresa


@router.post("/registrar/cliente", response_model=ClienteResposta, status_code=status.HTTP_201_CREATED)
async def registrar_cliente(cliente: ClienteCriar, db: AsyncSession = Depends(obter_db)):
    """Registrar um novo cliente"""
    # Verificar se email já existe
    resultado = await db.execute(select(Cliente).where(Cliente.email == cliente.email))
    if resultado.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email já registrado"
        )
    
    # Verificar em empresas também
    resultado = await db.execute(select(Empresa).where(Empresa.email == cliente.email))
    if resultado.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email já registrado"
        )
    
    # Criar novo cliente
    senha_hash = obter_hash_senha(cliente.senha)
    db_cliente = Cliente(
        nome=cliente.nome,
        email=cliente.email,
        senha=senha_hash
    )
    
    db.add(db_cliente)
    await db.commit()
    await db.refresh(db_cliente)
    
    return db_cliente


@router.post("/login", response_model=Token)
async def fazer_login(dados_login: RequisicaoLogin, db: AsyncSession = Depends(obter_db)):
    """Login para empresas e clientes"""
    usuario = None
    
    if dados_login.tipo_usuario == "empresa":
        resultado = await db.execute(select(Empresa).where(Empresa.email == dados_login.email))
        usuario = resultado.scalar_one_or_none()
    elif dados_login.tipo_usuario == "cliente":
        resultado = await db.execute(select(Cliente).where(Cliente.email == dados_login.email))
        usuario = resultado.scalar_one_or_none()
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tipo de usuário inválido. Deve ser 'empresa' ou 'cliente'"
        )
    
    if not usuario or not verificar_senha(dados_login.senha, usuario.senha):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Criar token de acesso
    token_acesso = criar_token_acesso(
        data={"sub": str(usuario.id), "tipo_usuario": dados_login.tipo_usuario}
    )
    
    return {
        "token_acesso": token_acesso,
        "tipo_token": "bearer",
        "tipo_usuario": dados_login.tipo_usuario,
        "usuario_id": usuario.id
    }
