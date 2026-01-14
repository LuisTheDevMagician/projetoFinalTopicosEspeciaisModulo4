import random
import string
import os
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile


def gerar_hash_ingresso():
    """Gerar um hash alfanumérico único de 11 caracteres para ingressos"""
    caracteres = string.ascii_letters + string.digits
    return ''.join(random.choices(caracteres, k=11))


def salvar_arquivo_upload(arquivo, pasta):
    """Salvar um arquivo enviado e retornar o caminho do arquivo"""
    # Criar pasta se não existir
    caminho_pasta = f"./{pasta}"
    os.makedirs(caminho_pasta, exist_ok=True)
    
    # Gerar nome de arquivo único
    extensao_arquivo = os.path.splitext(arquivo.name)[1]
    nome_arquivo = f"{gerar_hash_ingresso()}{extensao_arquivo}"
    caminho_arquivo = os.path.join(caminho_pasta, nome_arquivo)
    
    # Salvar arquivo
    with open(caminho_arquivo, "wb") as buffer:
        for chunk in arquivo.chunks():
            buffer.write(chunk)
    
    # Retornar caminho relativo
    return f"/{pasta}/{nome_arquivo}"


def deletar_arquivo(caminho_arquivo):
    """Deletar um arquivo se ele existir"""
    if not caminho_arquivo:
        return
    
    # Deletar diretamente das pastas perfis ou fundos
    caminho_completo = f".{caminho_arquivo}"
    
    if os.path.exists(caminho_completo):
        os.remove(caminho_completo)


def gerar_codigo_pagamento():
    """Gera um código único de pagamento"""
    from hashlib import sha256
    from datetime import datetime
    
    timestamp = datetime.now().isoformat()
    return sha256(f"PAG-{timestamp}".encode()).hexdigest()[:16].upper()
