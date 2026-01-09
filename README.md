# 🚀 Cyberpunk Events - Sistema Completo

## 🎯 Como Executar o Projeto

### Backend (FastAPI)
```bash
cd cyberpunk-eventos-backend
python -m uvicorn main:app --reload
```
Backend rodando em: http://localhost:8000  
Documentação da API: http://localhost:8000/docs

### Frontend (Next.js)
```bash
cd cyberpunk-eventos-frontend
npm run dev
```
Frontend rodando em: http://localhost:3000

---

## ✅ Sistema Completo!

Sistema full-stack de gerenciamento de eventos com Next.js 16 e FastAPI.

## 📁 Estrutura do Projeto

```
cyberpunk-eventos-backend/
├── main.py                 # Aplicação FastAPI
├── requirements.txt        # Dependências Python
├── .env                    # Variáveis de ambiente
├── schemas.py             # Schemas Pydantic
├── database/
│   ├── models.py          # Modelos SQLAlchemy
│   └── database.py        # Conexão do banco
├── routers/
│   ├── auth.py            # Endpoints de autenticação
│   ├── companies.py       # Endpoints de empresas
│   ├── clients.py         # Endpoints de clientes
│   ├── events.py          # Endpoints de eventos
│   └── tickets.py         # Endpoints de ingressos e pagamentos
└── utils/
    ├── auth.py            # Utilitários de autenticação
    └── helpers.py         # Funções auxiliares

cyberpunk-eventos-frontend/
├── app/
│   ├── page.tsx           # Landing page
│   ├── login/page.tsx     # Página de login
│   ├── register/page.tsx  # Página de registro
│   ├── company/
│   │   ├── dashboard/page.tsx      # Dashboard da empresa
│   │   ├── create-event/page.tsx   # Criar evento
│   │   ├── history/page.tsx        # Histórico de eventos
│   │   ├── profile/page.tsx        # Perfil da empresa
│   │   └── [id]/page.tsx           # Perfil público
│   └── client/
│       ├── dashboard/page.tsx      # Dashboard do cliente
│       ├── checkout/[eventId]/page.tsx  # Checkout de pagamento
│       ├── payment/pix/[ticketId]/page.tsx  # Pagamento PIX
│       ├── my-tickets/page.tsx     # Meus pagamentos
│       ├── history/page.tsx        # Histórico de ingressos
│       └── profile/page.tsx        # Perfil do cliente
├── components/
│   ├── dashboard-layout.tsx
│   └── ui/               # Componentes Shadcn
├── contexts/
│   └── auth-context.tsx  # Provedor de autenticação
└── lib/
    ├── api-client.ts     # Cliente da API
    ├── types.ts          # Tipos TypeScript
    └── utils.ts          # Utilitários
```

## ✨ Funcionalidades Implementadas

### Backend (FastAPI)
- ✅ Autenticação JWT com Bearer tokens
- ✅ Modelos de usuário separados (Empresa & Cliente)
- ✅ Validação de email único
- ✅ Upload de arquivos para imagens da empresa (multipart/form-data)
- ✅ Operações CRUD de eventos
- ✅ Sistema de pagamentos com código único
- ✅ Geração de ingressos com hash único de 11 caracteres
- ✅ Cada ingresso possui código individual único
- ✅ Agrupamento de ingressos por transação de pagamento
- ✅ Suporte a pagamento via PIX e Cartão de Crédito
- ✅ Estatísticas do dashboard com filtro de data
- ✅ Rastreamento de vendas ao longo do tempo
- ✅ Gráfico de vendas com seleção de período
- ✅ CORS habilitado para frontend
- ✅ Banco SQLite com suporte assíncrono

### Frontend (Next.js 16)
- ✅ Landing page com showcase de funcionalidades
- ✅ Registro de usuário (Empresa/Cliente)
- ✅ Login com seleção de tipo de usuário
- ✅ Autenticação baseada em contexto
- ✅ Rotas protegidas
- ✅ Dashboard da Empresa:
  - Início com eventos ativos
  - Criar novos eventos com calendário
  - Histórico de eventos finalizados
  - Gráfico de vendas com filtro de período
  - Perfil público da empresa
  - Gerenciamento de perfil com upload de imagens
  - Cards de estatísticas
- ✅ Dashboard do Cliente:
  - Navegar eventos disponíveis
  - Sistema de checkout completo
  - Seleção de quantidade de ingressos
  - Pagamento via PIX com QR Code
  - Pagamento via Cartão de Crédito
  - Visualizar histórico de pagamentos
  - Visualizar todos os ingressos individuais
  - Códigos únicos para cada ingresso
  - Gerenciamento de perfil
- ✅ Navegação por sidebar responsiva
- ✅ Tema cyberpunk (roxo/ciano)
- ✅ Notificações toast
- ✅ Validação de formulários
- ✅ Botão "Voltar" fixo em perfis públicos

## 🎨 Design

- **Tema**: Cyberpunk com acentos neon roxo e ciano
- **Modo escuro**: Fundos com gradiente preto
- **Glass morphism**: Efeitos de blur no fundo
- **Responsivo**: Design mobile-first

## 📊 Modelos do Banco de Dados

### Empresa (Company)
- id, nome, email (único), senha (hash)
- endereco, biografia, imagem_perfil, imagem_fundo
- criado_em

### Cliente (Client)
- id, nome, email (único), senha (hash)
- criado_em

### Evento (Event)
- id, nome, localizacao, descricao
- criado_em, data_fim, preco_ingresso, total_ingressos
- ativo, organizador_id

### Pagamento (Payment) 🆕
- id, codigo_pagamento (único, 16 caracteres)
- quantidade, valor_total
- metodo_pagamento (PIX/CARTAO)
- nome_comprador, email_comprador, cpf_comprador
- criado_em, cliente_id, evento_id
- **Relacionamento**: 1 pagamento → N ingressos

### Ingresso (Ticket)
- id, codigo_hash (único, 11 caracteres)
- comprado_em, quantidade (sempre 1)
- metodo_pagamento, nome_comprador, email_comprador, cpf_comprador
- cliente_id, evento_id, **pagamento_id** 🆕

### Arquitetura de Pagamentos
```
1 COMPRA = 1 Pagamento (código único) + N Ingressos (códigos únicos individuais)

Exemplo: Compra de 10 ingressos
├── Pagamento #A1B2C3D4E5F6G7H8
│   ├── quantidade: 10
│   ├── valor_total: R$ 500,00
│   └── ingressos:
│       ├── Ingresso #abc123def45 (código único)
│       ├── Ingresso #ghi678jkl91 (código único)
│       └── ... (10 ingressos individuais)
```

## 🔐 Fluxo de Autenticação

1. Usuário se registra como Empresa ou Cliente
2. Login retorna token JWT
3. Token armazenado no localStorage
4. Token enviado no header Authorization
5. Rotas protegidas verificam estado de autenticação

## 🛒 Fluxo de Compra

1. Cliente navega pelos eventos
2. Seleciona quantidade de ingressos
3. Escolhe método de pagamento (PIX ou Cartão)
4. Preenche dados pessoais
5. Sistema cria 1 Pagamento + N Ingressos individuais
6. Cada ingresso recebe código único
7. Cliente visualiza pagamento em "Meus Pagamentos"
8. Cliente pode expandir para ver todos os códigos de ingressos

## 🧪 Fluxo de Teste

1. **Iniciar Backend**: `python -m uvicorn main:app --reload`
2. **Iniciar Frontend**: `npm run dev`
3. **Registrar Empresa**: Criar conta de empresa
4. **Criar Eventos**: Adicionar eventos com preços
5. **Registrar Cliente**: Criar conta de cliente
6. **Comprar Ingressos**: Selecionar quantidade e método de pagamento
7. **Verificar Sistema**:
   - Dashboard empresa mostra vendas e estatísticas
   - Dashboard cliente mostra pagamentos agrupados
   - Histórico mostra ingressos individuais
   - Cada ingresso tem código único
8. **Visualizar Estatísticas**: Filtrar vendas por período no dashboard

## 📡 Endpoints da API

### Autenticação
- POST `/auth/register/company` - Registrar empresa
- POST `/auth/register/client` - Registrar cliente
- POST `/auth/login` - Login (retorna JWT)

### Empresas (Protegido)
- GET `/companies/me` - Obter próprio perfil
- PUT `/companies/me` - Atualizar perfil (multipart)
- GET `/companies/{id}` - Obter perfil público
- GET `/companies/{id}/events` - Obter eventos da empresa

### Clientes (Protegido)
- GET `/clients/me` - Obter próprio perfil
- PUT `/clients/me` - Atualizar perfil

### Eventos
- POST `/events` - Criar evento (apenas empresa)
- GET `/events` - Listar eventos ativos (público)
- GET `/events/my-events` - Obter eventos da empresa
- GET `/events/my-events/history` - Obter eventos finalizados
- GET `/events/dashboard/stats` - Obter estatísticas (com filtro de data)
- GET `/events/{id}` - Obter detalhes do evento
- PUT `/events/{id}` - Atualizar evento
- DELETE `/events/{id}` - Deletar evento

### Ingressos e Pagamentos 🆕
- POST `/ingressos` - Comprar ingressos (cria pagamento + ingressos)
- GET `/ingressos/meus-pagamentos` - Obter pagamentos do cliente
- GET `/ingressos/meus-ingressos` - Obter ingressos do cliente
- GET `/ingressos/{id}` - Obter detalhes do ingresso
- GET `/ingressos/verify/{hash}` - Verificar ingresso (público)

## 🛠️ Tecnologias

### Backend
- **FastAPI** - Framework web Python moderno
- **SQLAlchemy** - ORM com suporte assíncrono
- **Pydantic** - Validação de dados
- **python-jose** - Tokens JWT
- **passlib[argon2]** - Hash de senhas
- **python-multipart** - Upload de arquivos

### Frontend
- **Next.js 16** - Framework React
- **TypeScript** - Segurança de tipos
- **Tailwind CSS 4** - Estilização
- **Shadcn/ui** - Biblioteca de componentes
- **Lucide React** - Ícones
- **Sonner** - Notificações toast
- **qrcode.react** - Geração de QR Code para PIX
- **react-day-picker** - Seletor de datas

## 🐛 Solução de Problemas

### Problemas no Backend
- Certifique-se de ter Python 3.14+ instalado
- Verifique se a porta 8000 está livre
- Confirme que o arquivo .env existe
- Banco de dados criado automaticamente na primeira execução
- Se houver erro ao iniciar, delete `database.db` e reinicie

### Problemas no Frontend
- Certifique-se de ter Node.js 18+ instalado
- Verifique se a porta 3000 está livre
- Limpe o localStorage se houver problemas de autenticação
- Confirme que .env.local existe
- Execute `npm run format` para corrigir problemas de formatação

## 📝 Variáveis de Ambiente

### Backend (.env)
```
DATABASE_URL=sqlite+aiosqlite:///./database.db
SECRET_KEY=sua-chave-secreta-mude-em-producao
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=43200
UPLOAD_FOLDER=./uploads
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 🎯 Melhorias Futuras (Opcional)

- [ ] Integração com gateway de pagamento real
- [ ] Notificações por email
- [ ] Sistema de avaliações de eventos
- [ ] Compartilhamento social
- [ ] Busca avançada de eventos
- [ ] Compressão de imagens
- [ ] Rate limiting
- [ ] Sistema de cupons de desconto
- [ ] Exportação de relatórios em PDF
- [ ] App mobile com React Native

## 🔑 Características Principais

### Sistema de Pagamentos
- **Código de Pagamento Único**: Cada transação gera um código de 16 caracteres
- **Códigos de Ingresso Únicos**: Cada ingresso possui código individual de 11 caracteres
- **Agrupamento Lógico**: Pagamentos agrupam múltiplos ingressos de uma mesma compra
- **Métodos Suportados**: PIX (com QR Code) e Cartão de Crédito
- **Rastreabilidade**: Histórico completo de pagamentos e ingressos

### Dashboard Empresarial
- **Estatísticas em Tempo Real**: Total de eventos, eventos ativos, ingressos vendidos, receita
- **Gráfico de Vendas**: Visualização de vendas ao longo do tempo com filtro de período
- **Perfil Público**: Empresas possuem página pública com seus eventos

### Segurança
- **Hash de Senhas**: Argon2 para máxima segurança
- **JWT Tokens**: Autenticação stateless
- **Validação de Dados**: Pydantic schemas no backend
- **Códigos Únicos**: Hash SHA-256 para ingressos e pagamentos

## 📞 Suporte

Para problemas:
1. Verifique os logs do console
2. Confirme que a API está rodando
3. Verifique o console do navegador
4. Limpe o localStorage
5. Reinicie ambos os servidores
6. Delete o banco de dados e recrie

---

**Sistema Pronto! 🚀 Inicie ambos os servidores e comece a testar!**
