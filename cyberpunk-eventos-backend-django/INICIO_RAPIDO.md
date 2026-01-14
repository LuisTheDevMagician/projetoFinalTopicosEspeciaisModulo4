# Guia Rápido de Início

## Primeiros Passos

### 1. Instalar dependências
```bash
pip install -r requirements.txt
```

### 2. Criar banco de dados
```bash
python manage.py makemigrations
python manage.py migrate
```

### 3. (Opcional) Criar superusuário
```bash
python manage.py createsuperuser
```

### 4. Executar servidor
```bash
python manage.py runserver
```

### 5. Acessar a API
- API: http://localhost:8000
- Admin: http://localhost:8000/admin
- Status: http://localhost:8000/saude

## Testando a API

### Registrar uma Empresa
```bash
curl -X POST http://localhost:8000/auth/registrar/empresa/ \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Empresa Teste",
    "email": "empresa@teste.com",
    "senha": "senha123"
  }'
```

### Fazer Login
```bash
curl -X POST http://localhost:8000/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "empresa@teste.com",
    "senha": "senha123",
    "tipo_usuario": "empresa"
  }'
```

### Criar um Evento (use o token recebido no login)
```bash
curl -X POST http://localhost:8000/eventos/criar/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "nome": "Evento Cyberpunk",
    "localizacao": "São Paulo, SP",
    "descricao": "Um evento incrível",
    "data_fim": "2026-12-31T23:59:59Z",
    "preco_ingresso": 5000,
    "total_ingressos": 100
  }'
```

## Comandos Úteis

### Criar novas migrações
```bash
python manage.py makemigrations
```

### Aplicar migrações
```bash
python manage.py migrate
```

### Acessar shell do Django
```bash
python manage.py shell
```

### Criar superusuário
```bash
python manage.py createsuperuser
```

### Coletar arquivos estáticos (produção)
```bash
python manage.py collectstatic
```

## Estrutura de Pastas

- `cyberpunk_eventos/` - Configurações do projeto
- `api/` - App principal com models, views, serializers
- `api/views/` - Views organizadas por funcionalidade
- `api/urls/` - URLs organizadas por funcionalidade
- `api/utils/` - Utilitários (auth, permissions, helpers)
- `perfis/` - Upload de imagens de perfil
- `fundos/` - Upload de imagens de fundo
- `uploads/` - Outros uploads

## Problemas Comuns

### Erro: No module named 'dotenv'
```bash
pip install python-dotenv
```

### Erro: No module named 'rest_framework'
```bash
pip install djangorestframework
```

### Erro: Authentication credentials were not provided
- Verifique se está enviando o header `Authorization: Bearer {token}`
- Verifique se o token não expirou

### Banco de dados não encontrado
```bash
python manage.py migrate
```
