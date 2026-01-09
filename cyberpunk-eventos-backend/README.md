# Cyberpunk Events Backend

Backend FastAPI para o Sistema de Gerenciamento de Eventos Cyberpunk.

## 🚀 Como Executar

```bash
python -m uvicorn main:app --reload
```

Acesse a documentação em: http://localhost:8000/docs

## ✨ Funcionalidades

- **Autenticação de Usuários**: Autenticação baseada em JWT para empresas e clientes
- **Gerenciamento de Empresas**: Perfil com upload de imagens, criação de eventos, analytics
- **Gerenciamento de Clientes**: Perfil, compra de ingressos
- **Gerenciamento de Eventos**: Operações CRUD com rastreamento de vendas
- **Sistema de Pagamentos**: Pagamentos únicos agrupando múltiplos ingressos
- **Sistema de Ingressos**: Códigos únicos por ingresso com verificação
- **Métodos de Pagamento**: PIX (com QR Code) e Cartão de Crédito

## 📦 Instalação

1. Instalar dependências:
```bash
pip install -r requirements.txt
```

2. Configurar variáveis de ambiente no `.env`:
```
DATABASE_URL=sqlite+aiosqlite:///./database.db
SECRET_KEY=sua-chave-secreta-mude-em-producao
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=43200
UPLOAD_FOLDER=./uploads
```

3. Executar o servidor:
```bash
python -m uvicorn main:app --reload
```

4. Acessar documentação da API:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 📡 Endpoints da API

### Autenticação
- `POST /auth/register/company` - Registrar nova empresa
- `POST /auth/register/client` - Registrar novo cliente
- `POST /auth/login` - Fazer login

### Empresas
- `GET /companies/me` - Obter perfil da empresa atual
- `GET /companies/{id}` - Obter perfil público da empresa
- `PUT /companies/me` - Atualizar perfil da empresa (multipart/form-data)
- `PUT /companies/me/password` - Mudar senha
- `GET /companies/{id}/events` - Obter eventos ativos da empresa

### Clientes
- `GET /clients/me` - Obter perfil do cliente atual
- `PUT /clients/me` - Atualizar perfil do cliente
- `PUT /clients/me/password` - Mudar senha

### Eventos
- `POST /events` - Criar evento (apenas empresa)
- `GET /events` - Obter todos os eventos ativos (público)
- `GET /events/my-events` - Obter eventos da empresa
- `GET /events/my-events/history` - Obter eventos finalizados da empresa
- `GET /events/dashboard/stats` - Obter estatísticas do dashboard (com filtro de data)
- `GET /events/{id}` - Obter detalhes do evento
- `PUT /events/{id}` - Atualizar evento
- `DELETE /events/{id}` - Deletar evento

### Ingressos e Pagamentos 🆕
- `POST /ingressos` - Comprar ingressos (cria pagamento + ingressos individuais)
- `GET /ingressos/meus-pagamentos` - Obter pagamentos do cliente com ingressos
- `GET /ingressos/meus-ingressos` - Obter todos os ingressos do cliente
- `GET /ingressos/{id}` - Obter detalhes do ingresso
- `GET /ingressos/verify/{hash_code}` - Verificar ingresso (público)

## 🗄️ Esquema do Banco de Dados

### Empresas (Companies)
- id, nome, email (único), senha (hash), endereco, biografia
- imagem_perfil, imagem_fundo, criado_em
- **Relacionamentos**: eventos[], pagamentos[]

### Clientes (Clients)
- id, nome, email (único), senha (hash), criado_em
- **Relacionamentos**: ingressos[], pagamentos[]

### Eventos (Events)
- id, nome, localizacao, descricao, criado_em, data_fim
- preco_ingresso, total_ingressos, ativo, organizador_id
- **Relacionamentos**: organizador, ingressos[], pagamentos[]

### Pagamentos (Payments) 🆕
- id, codigo_pagamento (único, 16 caracteres)
- quantidade, valor_total
- metodo_pagamento (PIX/CARTAO)
- nome_comprador, email_comprador, cpf_comprador
- criado_em, cliente_id, evento_id
- **Relacionamentos**: cliente, evento, ingressos[]

### Ingressos (Tickets)
- id, codigo_hash (único, 11 caracteres), comprado_em
- quantidade (sempre 1), metodo_pagamento
- nome_comprador, email_comprador, cpf_comprador
- cliente_id, evento_id, **pagamento_id** 🆕
- **Relacionamentos**: cliente, evento, pagamento

## 🏗️ Arquitetura de Pagamentos

```
1 COMPRA = 1 Pagamento + N Ingressos

Pagamento {
  codigo_pagamento: "A1B2C3D4E5F6G7H8"
  quantidade: 10
  valor_total: 500.00
  ingressos: [
    { codigo_hash: "abc123def45", quantidade: 1 },
    { codigo_hash: "ghi678jkl91", quantidade: 1 },
    ... (10 ingressos individuais com códigos únicos)
  ]
}
```

### Benefícios
- ✅ Cada ingresso possui código único e independente
- ✅ Pagamentos agrupam logicamente a transação
- ✅ Rastreamento completo da compra
- ✅ Facilita verificação individual de ingressos
- ✅ Suporta múltiplos métodos de pagamento

## 🔐 Segurança

- **Hash de Senhas**: Argon2 (padrão da indústria)
- **JWT Tokens**: Autenticação stateless com expiração configurável
- **Códigos Únicos**: SHA-256 para gerar códigos de ingressos e pagamentos
- **Validação**: Pydantic schemas em todos os endpoints
- **CORS**: Configurado para frontend

## 🛠️ Tecnologias

- **FastAPI** - Framework web moderno e rápido
- **SQLAlchemy 2.0** - ORM assíncrono
- **Pydantic** - Validação de dados
- **python-jose** - Geração de JWT
- **passlib[argon2]** - Hash seguro de senhas
- **python-multipart** - Upload de arquivos
- **SQLite** - Banco de dados (fácil migração para PostgreSQL)

## 📝 Schemas Pydantic

### Request Schemas
- `EmpresaCriar`, `EmpresaAtualizar`
- `ClienteCriar`, `ClienteAtualizar`
- `EventoCriar`, `EventoAtualizar`
- `IngressoCriar` (com quantidade, método de pagamento, dados do comprador)
- `RequisicaoLogin`, `RequisicaoMudarSenha`

### Response Schemas
- `EmpresaResposta`, `ClienteResposta`
- `EventoResposta`, `EventoDetalheResposta`
- `IngressoResposta`, `IngressoDetalheResposta`
- `PagamentoResposta`, `PagamentoComIngressos` 🆕
- `Token`, `EstatisticasDashboard`

## 🚀 Desenvolvimento

### Estrutura de Diretórios
```
cyberpunk-eventos-backend/
├── main.py                 # App FastAPI principal
├── schemas.py             # Schemas Pydantic
├── requirements.txt       # Dependências
├── database/
│   ├── models.py          # Modelos SQLAlchemy
│   └── database.py        # Conexão e sessão do DB
├── routers/
│   ├── auth.py            # Endpoints de autenticação
│   ├── companies.py       # Endpoints de empresas
│   ├── clients.py         # Endpoints de clientes
│   ├── events.py          # Endpoints de eventos
│   └── tickets.py         # Endpoints de ingressos/pagamentos
└── utils/
    ├── auth.py            # Funções de autenticação
    └── helpers.py         # Funções auxiliares
```

### Adicionar Novo Endpoint

1. Criar função no router apropriado
2. Definir schemas em `schemas.py`
3. Adicionar modelo no `database/models.py` se necessário
4. Testar em http://localhost:8000/docs

## 🐛 Troubleshooting

### Erro ao iniciar servidor
```bash
# Reinstalar dependências
pip install -r requirements.txt --force-reinstall

# Verificar versão do Python
python --version  # Deve ser 3.14+
```

### Erro de banco de dados
```bash
# Deletar e recriar banco
rm database.db
python -m uvicorn main:app --reload
```

### Erro de importação
```bash
# Verificar se está no diretório correto
cd cyberpunk-eventos-backend
python -m uvicorn main:app --reload
```

## 📊 Estatísticas e Analytics

O sistema fornece estatísticas detalhadas:
- Total de eventos criados
- Eventos ativos
- Total de ingressos vendidos
- Receita total
- Vendas ao longo do tempo (com filtro de período)

## 🔄 Migrations

Atualmente usando SQLite com criação automática de tabelas. Para produção, considere:
- Migrar para PostgreSQL
- Usar Alembic para migrations
- Adicionar índices para performance

---

**Documentação completa da API disponível em http://localhost:8000/docs**
