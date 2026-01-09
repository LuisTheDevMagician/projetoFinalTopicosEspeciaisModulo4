from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class MetodoPagamento(str, Enum):
    PIX = "pix"
    CARTAO = "cartao"


# Schemas da Empresa
class EmpresaBase(BaseModel):
    nome: str
    email: EmailStr


class EmpresaCriar(EmpresaBase):
    senha: str
    endereco: Optional[str] = None
    biografia: Optional[str] = None


class EmpresaAtualizar(BaseModel):
    nome: Optional[str] = None
    email: Optional[EmailStr] = None
    endereco: Optional[str] = None
    biografia: Optional[str] = None


class EmpresaResposta(EmpresaBase):
    id: int
    endereco: Optional[str]
    biografia: Optional[str]
    imagem_perfil: Optional[str]
    imagem_fundo: Optional[str]
    criado_em: datetime

    class Config:
        from_attributes = True


# Schemas do Cliente
class ClienteBase(BaseModel):
    nome: str
    email: EmailStr


class ClienteCriar(ClienteBase):
    senha: str


class ClienteAtualizar(BaseModel):
    nome: Optional[str] = None
    email: Optional[EmailStr] = None


class ClienteResposta(ClienteBase):
    id: int
    criado_em: datetime

    class Config:
        from_attributes = True


# Schemas do Evento
class EventoBase(BaseModel):
    nome: str
    localizacao: str
    descricao: Optional[str] = None
    data_fim: datetime
    preco_ingresso: int = Field(gt=0, description="Preço em centavos")
    total_ingressos: int = Field(gt=0, description="Número total de ingressos disponíveis")


class EventoCriar(EventoBase):
    pass


class EventoAtualizar(BaseModel):
    nome: Optional[str] = None
    localizacao: Optional[str] = None
    descricao: Optional[str] = None
    data_fim: Optional[datetime] = None
    preco_ingresso: Optional[int] = None
    total_ingressos: Optional[int] = None
    ativo: Optional[bool] = None


class EventoResposta(EventoBase):
    id: int
    criado_em: datetime
    ativo: bool
    organizador_id: int
    ingressos_vendidos: int = 0

    class Config:
        from_attributes = True


class EventoDetalheResposta(EventoResposta):
    organizador: EmpresaResposta
    ingressos: List["IngressoResposta"] = []

    class Config:
        from_attributes = True


# Schemas do Ingresso
class IngressoBase(BaseModel):
    evento_id: int


class IngressoCriar(IngressoBase):
    quantidade: int = 1
    metodo_pagamento: MetodoPagamento
    nome_comprador: str
    email_comprador: EmailStr
    cpf_comprador: str


class IngressoResposta(BaseModel):
    id: int
    codigo_hash: str
    comprado_em: datetime
    evento_id: int
    cliente_id: int
    quantidade: int
    pagamento_id: int
    metodo_pagamento: Optional[str] = None

    class Config:
        from_attributes = True


# Schemas do Pagamento
class PagamentoResposta(BaseModel):
    id: int
    codigo_pagamento: str
    quantidade: int
    valor_total: float
    metodo_pagamento: str
    nome_comprador: str
    email_comprador: str
    cpf_comprador: str
    criado_em: datetime
    evento_id: int
    cliente_id: int

    class Config:
        from_attributes = True


class PagamentoComIngressos(PagamentoResposta):
    ingressos: List[IngressoResposta]
    evento: EventoResposta

    class Config:
        from_attributes = True


class IngressoDetalheResposta(IngressoResposta):
    evento: EventoResposta

    class Config:
        from_attributes = True


# Schemas de Autenticação
class Token(BaseModel):
    token_acesso: str
    tipo_token: str
    tipo_usuario: str
    usuario_id: int


class RequisicaoLogin(BaseModel):
    email: EmailStr
    senha: str
    tipo_usuario: str  # "empresa" ou "cliente"


class RequisicaoMudarSenha(BaseModel):
    senha_antiga: str
    senha_nova: str


# Schemas de Estatísticas
class EstatisticasVendasIngressos(BaseModel):
    data: str
    quantidade: int


class EstatisticasDashboard(BaseModel):
    total_eventos: int
    eventos_ativos: int
    total_ingressos_vendidos: int
    receita_total: int
    vendas_ao_longo_tempo: List[EstatisticasVendasIngressos]
