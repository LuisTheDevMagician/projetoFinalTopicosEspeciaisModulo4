from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os

from database.database import engine
from database.models import Base
from routers import auth, companies, clients, events, tickets


@asynccontextmanager
async def ciclo_vida(app: FastAPI):
    """Eventos de inicialização e encerramento"""
    # Criar tabelas do banco de dados
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Criar diretórios de upload
    pasta_upload = os.getenv("UPLOAD_FOLDER", "./uploads")
    os.makedirs(os.path.join(pasta_upload, "perfis"), exist_ok=True)
    os.makedirs(os.path.join(pasta_upload, "fundos"), exist_ok=True)
    
    yield
    
    # Limpeza
    await engine.dispose()


app = FastAPI(
    title="API Eventos Cyberpunk",
    description="API Backend para Sistema de Gerenciamento de Eventos Cyberpunk",
    version="1.0.0",
    lifespan=ciclo_vida
)

# Middleware CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Montar arquivos estáticos para uploads
pasta_upload = os.getenv("UPLOAD_FOLDER", "./uploads")
if os.path.exists(pasta_upload):
    app.mount("/uploads", StaticFiles(directory=pasta_upload), name="uploads")

# Montar diretórios de perfis e fundos diretamente
if os.path.exists("./perfis"):
    app.mount("/perfis", StaticFiles(directory="./perfis"), name="perfis")
if os.path.exists("./fundos"):
    app.mount("/fundos", StaticFiles(directory="./fundos"), name="fundos")

# Incluir routers
app.include_router(auth.router)
app.include_router(companies.router)
app.include_router(clients.router)
app.include_router(events.router)
app.include_router(tickets.router)


@app.get("/")
async def raiz():
    return {
        "mensagem": "API Eventos Cyberpunk",
        "versao": "1.0.0",
        "documentacao": "/docs"
    }


@app.get("/saude")
async def verificar_saude():
    return {"status": "saudável"}