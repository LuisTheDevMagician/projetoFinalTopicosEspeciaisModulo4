from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean, Enum, Float, func
from sqlalchemy.orm import relationship, declarative_base
from datetime import datetime
import enum

Base = declarative_base()


class MetodoPagamento(str, enum.Enum):
    PIX = "pix"
    CARTAO = "cartao"


class Empresa(Base):
    __tablename__ = "empresas"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    senha = Column(String, nullable=False)
    endereco = Column(String, nullable=True)
    biografia = Column(Text, nullable=True)
    imagem_perfil = Column(String, nullable=True)
    imagem_fundo = Column(String, nullable=True)
    criado_em = Column(DateTime, default=datetime.utcnow)

    # Relacionamentos
    eventos = relationship("Evento", back_populates="organizador", cascade="all, delete-orphan")


class Cliente(Base):
    __tablename__ = "clientes"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    senha = Column(String, nullable=False)
    criado_em = Column(DateTime, default=datetime.utcnow)

    # Relacionamentos
    ingressos = relationship("Ingresso", back_populates="cliente", cascade="all, delete-orphan")
    pagamentos = relationship("Pagamento", back_populates="cliente", cascade="all, delete-orphan")


class Evento(Base):
    __tablename__ = "eventos"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    localizacao = Column(String, nullable=False)
    descricao = Column(Text, nullable=True)
    criado_em = Column(DateTime, default=datetime.utcnow)
    data_fim = Column(DateTime, nullable=False)
    preco_ingresso = Column(Integer, nullable=False)  # Preço em centavos
    total_ingressos = Column(Integer, nullable=False)
    ativo = Column(Boolean, default=True)
    
    # Chaves Estrangeiras
    organizador_id = Column(Integer, ForeignKey("empresas.id"), nullable=False)

    # Relacionamentos
    organizador = relationship("Empresa", back_populates="eventos")
    ingressos = relationship("Ingresso", back_populates="evento", cascade="all, delete-orphan")
    pagamentos = relationship("Pagamento", back_populates="evento", cascade="all, delete-orphan")


class MetodoPagamento(str, enum.Enum):
    PIX = "pix"
    CARTAO = "cartao"

class Pagamento(Base):
    __tablename__ = "pagamentos"

    id = Column(Integer, primary_key=True, index=True)
    codigo_pagamento = Column(String, unique=True, index=True, nullable=False)
    
    # Informações do pagamento
    quantidade = Column(Integer, nullable=False)
    valor_total = Column(Float, nullable=False)
    metodo_pagamento = Column(Enum(MetodoPagamento), nullable=False)
    
    # Informações do comprador
    nome_comprador = Column(String, nullable=False)
    email_comprador = Column(String, nullable=False)
    cpf_comprador = Column(String, nullable=False)
    
    # Timestamps
    criado_em = Column(DateTime(timezone=True), server_default=func.now())
    
    # Foreign Keys
    cliente_id = Column(Integer, ForeignKey("clientes.id", ondelete="CASCADE"), nullable=False)
    evento_id = Column(Integer, ForeignKey("eventos.id", ondelete="CASCADE"), nullable=False)
    
    # Relacionamentos
    cliente = relationship("Cliente", back_populates="pagamentos")
    evento = relationship("Evento", back_populates="pagamentos")
    ingressos = relationship("Ingresso", back_populates="pagamento", cascade="all, delete-orphan")

class Ingresso(Base):
    __tablename__ = "ingressos"

    id = Column(Integer, primary_key=True, index=True)
    codigo_hash = Column(String(11), unique=True, index=True, nullable=False)
    comprado_em = Column(DateTime, default=datetime.utcnow)
    quantidade = Column(Integer, default=1, nullable=False)
    metodo_pagamento = Column(Enum(MetodoPagamento), nullable=True)
    nome_comprador = Column(String, nullable=True)
    email_comprador = Column(String, nullable=True)
    cpf_comprador = Column(String, nullable=True)
    
    # Chaves Estrangeiras
    cliente_id = Column(Integer, ForeignKey("clientes.id"), nullable=False)
    evento_id = Column(Integer, ForeignKey("eventos.id"), nullable=False)
    pagamento_id = Column(Integer, ForeignKey("pagamentos.id"), nullable=False)

    # Relacionamentos
    cliente = relationship("Cliente", back_populates="ingressos")
    evento = relationship("Evento", back_populates="ingressos")
    pagamento = relationship("Pagamento", back_populates="ingressos")
