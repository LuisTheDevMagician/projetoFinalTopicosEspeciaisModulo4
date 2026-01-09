import random
import string
import os
from fastapi import UploadFile
from typing import Optional


def gerar_hash_ingresso() -> str:
    """Gerar um hash alfanumérico único de 11 caracteres para ingressos"""
    caracteres = string.ascii_letters + string.digits
    return ''.join(random.choices(caracteres, k=11))


async def salvar_arquivo_upload(arquivo: UploadFile, pasta: str) -> str:
    """Salvar um arquivo enviado e retornar o caminho do arquivo"""
    # Salvar diretamente nas pastas perfis ou fundos
    caminho_pasta = f"./{pasta}"
    
    # Criar pasta se não existir
    os.makedirs(caminho_pasta, exist_ok=True)
    
    # Gerar nome de arquivo único
    extensao_arquivo = os.path.splitext(arquivo.filename)[1]
    nome_arquivo = f"{gerar_hash_ingresso()}{extensao_arquivo}"
    caminho_arquivo = os.path.join(caminho_pasta, nome_arquivo)
    
    # Salvar arquivo
    with open(caminho_arquivo, "wb") as buffer:
        conteudo = await arquivo.read()
        buffer.write(conteudo)
    
    # Retornar caminho relativo
    return f"/{pasta}/{nome_arquivo}"


async def deletar_arquivo(caminho_arquivo: Optional[str]) -> None:
    """Deletar um arquivo se ele existir"""
    if not caminho_arquivo:
        return
    
    # Deletar diretamente das pastas perfis ou fundos
    caminho_completo = f".{caminho_arquivo}"
    
    if os.path.exists(caminho_completo):
        os.remove(caminho_completo)
