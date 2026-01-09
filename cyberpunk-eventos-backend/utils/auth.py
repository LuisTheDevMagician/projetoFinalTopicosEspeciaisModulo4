from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
import os

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "sua-chave-secreta-mude-isso")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "43200"))

# Usar Argon2 em vez de bcrypt (mais moderno e seguro)
hash_senha = PasswordHasher()
seguranca = HTTPBearer()


def verificar_senha(senha_plana: str, senha_hash: str) -> bool:
    """Verificar uma senha contra um hash"""
    try:
        hash_senha.verify(senha_hash, senha_plana)
        return True
    except VerifyMismatchError:
        return False


def obter_hash_senha(senha: str) -> str:
    """Fazer hash de uma senha"""
    return hash_senha.hash(senha)


def criar_token_acesso(data: dict, delta_expiracao: Optional[timedelta] = None) -> str:
    """Criar um token JWT"""
    para_codificar = data.copy()
    if delta_expiracao:
        expiracao = datetime.utcnow() + delta_expiracao
    else:
        expiracao = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    para_codificar.update({"exp": expiracao})
    jwt_codificado = jwt.encode(para_codificar, SECRET_KEY, algorithm=ALGORITHM)
    return jwt_codificado


def decodificar_token(token: str) -> dict:
    """Decodificar um token JWT"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Não foi possível validar as credenciais",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def obter_usuario_atual(credenciais: HTTPAuthorizationCredentials = Depends(seguranca)) -> dict:
    """Obter usuário atual do token"""
    token = credenciais.credentials
    payload = decodificar_token(token)
    
    usuario_id: int = payload.get("sub")
    tipo_usuario: str = payload.get("tipo_usuario")
    
    if usuario_id is None or tipo_usuario is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Não foi possível validar as credenciais",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return {"usuario_id": int(usuario_id), "tipo_usuario": tipo_usuario}


async def obter_empresa_atual(usuario_atual: dict = Depends(obter_usuario_atual)) -> dict:
    """Verificar se usuário é uma empresa"""
    if usuario_atual["tipo_usuario"] != "empresa":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Não autorizado. Acesso de empresa requerido."
        )
    return usuario_atual


async def obter_cliente_atual(usuario_atual: dict = Depends(obter_usuario_atual)) -> dict:
    """Verificar se usuário é um cliente"""
    if usuario_atual["tipo_usuario"] != "cliente":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Não autorizado. Acesso de cliente requerido."
        )
    return usuario_atual
