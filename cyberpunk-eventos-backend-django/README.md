# API Eventos Cyberpunk - Django

Backend em Django para Sistema de Gerenciamento de Eventos Cyberpunk.

## Tecnologias Utilizadas

- **Django 5.0+** - Framework web
- **Django REST Framework** - API REST
- **Simple JWT** - Autenticação JWT
- **SQLite** - Banco de dados (desenvolvimento)
- **Pillow** - Processamento de imagens

## Estrutura do Projeto

```
cyberpunk-eventos-backend-django/
├── cyberpunk_eventos/          # Configurações do projeto Django
│   ├── settings.py             # Configurações principais
│   ├── urls.py                 # URLs principais
│   ├── wsgi.py                 # WSGI application
│   └── asgi.py                 # ASGI application
├── api/                        # App principal da API
│   ├── models.py               # Modelos (Empresa, Cliente, Evento, Ingresso, Pagamento)
│   ├── serializers.py          # Serializers do DRF
│   ├── admin.py                # Configuração do Django Admin
│   ├── views/                  # Views organizadas por funcionalidade
│   │   ├── auth.py             # Autenticação e registro
│   │   ├── companies.py        # Gestão de empresas
│   │   ├── clients.py          # Gestão de clientes
│   │   ├── events.py           # Gestão de eventos
│   │   └── tickets.py          # Gestão de ingressos
│   ├── urls/                   # URLs organizadas por funcionalidade
│   │   ├── auth.py
│   │   ├── companies.py
│   │   ├── clients.py
│   │   ├── events.py
│   │   └── tickets.py
│   └── utils/                  # Utilitários
│       ├── auth.py             # Autenticação JWT customizada
│       ├── permissions.py      # Permissões customizadas
│       └── helpers.py          # Funções auxiliares
├── manage.py                   # Script de gerenciamento Django
├── requirements.txt            # Dependências do projeto
├── .env.example                # Exemplo de variáveis de ambiente
└── README.md                   # Este arquivo
```

## Instalação e Configuração

### 1. Criar e ativar ambiente virtual

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

### 2. Instalar dependências

```bash
pip install -r requirements.txt
```

### 3. Configurar variáveis de ambiente

Copie o arquivo `.env.example` para `.env` e ajuste as configurações:

```bash
copy .env.example .env  # Windows
cp .env.example .env    # Linux/Mac
```

### 4. Executar migrações

```bash
python manage.py makemigrations
python manage.py migrate
```

### 5. Criar superusuário (opcional)

```bash
python manage.py createsuperuser
```

### 6. Executar servidor de desenvolvimento

```bash
python manage.py runserver
```

O servidor estará disponível em `http://localhost:8000`

## Endpoints da API

### Autenticação

- `POST /auth/registrar/empresa/` - Registrar nova empresa
- `POST /auth/registrar/cliente/` - Registrar novo cliente
- `POST /auth/login/` - Login (empresa ou cliente)

### Empresas

- `GET /empresas/eu/` - Obter perfil da empresa autenticada
- `PUT /empresas/eu/atualizar/` - Atualizar perfil da empresa
- `PUT /empresas/eu/senha/` - Mudar senha da empresa
- `GET /empresas/{id}/` - Obter perfil público da empresa
- `GET /empresas/{id}/eventos/` - Obter eventos ativos da empresa

### Clientes

- `GET /clientes/eu/` - Obter perfil do cliente autenticado
- `PUT /clientes/eu/atualizar/` - Atualizar perfil do cliente
- `PUT /clientes/eu/senha/` - Mudar senha do cliente

### Eventos

- `GET /eventos/` - Listar todos eventos ativos (público)
- `POST /eventos/criar/` - Criar novo evento (empresa)
- `GET /eventos/meus-eventos/` - Listar eventos da empresa
- `GET /eventos/meus-eventos/historico/` - Histórico de eventos
- `GET /eventos/dashboard/estatisticas/` - Estatísticas do dashboard
- `GET /eventos/{id}/` - Detalhes do evento
- `PUT /eventos/{id}/atualizar/` - Atualizar evento
- `DELETE /eventos/{id}/deletar/` - Deletar evento

### Ingressos

- `POST /ingressos/comprar/` - Comprar ingressos (cliente)
- `GET /ingressos/meus-pagamentos/` - Listar pagamentos do cliente
- `GET /ingressos/meus-ingressos/` - Listar ingressos do cliente
- `GET /ingressos/{id}/` - Detalhes do ingresso
- `GET /ingressos/verificar/{codigo_hash}/` - Verificar ingresso (público)

### Outros

- `GET /` - Informações da API
- `GET /saude/` - Status de saúde do servidor
- `GET /admin/` - Painel administrativo Django

## Modelos de Dados

### Empresa
- Organizadores de eventos
- Autenticação independente
- Campos: nome, email, senha, endereço, biografia, imagens (perfil/fundo)

### Cliente
- Compradores de ingressos
- Autenticação independente
- Campos: nome, email, senha

### Evento
- Eventos criados por empresas
- Campos: nome, localização, descrição, data_fim, preço, total_ingressos, ativo

### Pagamento
- Registro de compras de ingressos
- Campos: código_pagamento, quantidade, valor_total, método_pagamento, dados do comprador

### Ingresso
- Ingressos individuais
- Campos: código_hash (único), quantidade, método_pagamento, dados do comprador

## Autenticação

O sistema utiliza **JWT (JSON Web Tokens)** para autenticação. Cada tipo de usuário (Empresa/Cliente) possui seu próprio modelo de autenticação.

### Como autenticar:

1. Faça login através do endpoint `/auth/login/`
2. Receba o `token_acesso` na resposta
3. Inclua o token no header das requisições:
   ```
   Authorization: Bearer {token_acesso}
   ```

### Exemplo de requisição autenticada:

```bash
curl -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbG..." \
     http://localhost:8000/empresas/eu/
```

## Upload de Arquivos

As imagens de perfil e fundo das empresas são salvas nas pastas:
- `perfis/` - Imagens de perfil
- `fundos/` - Imagens de fundo

Em desenvolvimento, os arquivos são servidos estaticamente pelo Django.

## Desenvolvimento

### Executar testes

```bash
python manage.py test
```

### Acessar shell do Django

```bash
python manage.py shell
```

### Criar migrações

```bash
python manage.py makemigrations
python manage.py migrate
```

## Produção

Para deploy em produção:

1. Configure `DEBUG=False` no `.env`
2. Configure uma `SECRET_KEY` segura
3. Configure `ALLOWED_HOSTS` adequadamente
4. Use um banco de dados robusto (PostgreSQL recomendado)
5. Configure servidor web (nginx + gunicorn recomendado)
6. Configure SSL/HTTPS
7. Execute `python manage.py collectstatic`

## Diferenças em relação ao FastAPI

- Django usa ORM ao invés de SQLAlchemy
- Autenticação via Django REST Framework + Simple JWT
- Sistema de permissões integrado do Django
- Admin panel disponível em `/admin/`
- Estrutura mais "batteries included"

## Licença

Projeto acadêmico - Eventos Cyberpunk
