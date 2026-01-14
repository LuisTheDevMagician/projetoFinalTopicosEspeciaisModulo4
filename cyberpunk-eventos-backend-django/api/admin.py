from django.contrib import admin
from .models import Empresa, Cliente, Evento, Pagamento, Ingresso


@admin.register(Empresa)
class EmpresaAdmin(admin.ModelAdmin):
    list_display = ['id', 'nome', 'email', 'criado_em']
    search_fields = ['nome', 'email']
    list_filter = ['criado_em']


@admin.register(Cliente)
class ClienteAdmin(admin.ModelAdmin):
    list_display = ['id', 'nome', 'email', 'criado_em']
    search_fields = ['nome', 'email']
    list_filter = ['criado_em']


@admin.register(Evento)
class EventoAdmin(admin.ModelAdmin):
    list_display = ['id', 'nome', 'organizador', 'data_fim', 'ativo', 'criado_em']
    search_fields = ['nome', 'localizacao']
    list_filter = ['ativo', 'criado_em', 'data_fim']
    raw_id_fields = ['organizador']


@admin.register(Pagamento)
class PagamentoAdmin(admin.ModelAdmin):
    list_display = ['id', 'codigo_pagamento', 'cliente', 'evento', 'valor_total', 'metodo_pagamento', 'criado_em']
    search_fields = ['codigo_pagamento', 'nome_comprador', 'email_comprador']
    list_filter = ['metodo_pagamento', 'criado_em']
    raw_id_fields = ['cliente', 'evento']


@admin.register(Ingresso)
class IngressoAdmin(admin.ModelAdmin):
    list_display = ['id', 'codigo_hash', 'cliente', 'evento', 'quantidade', 'comprado_em']
    search_fields = ['codigo_hash', 'nome_comprador', 'email_comprador']
    list_filter = ['comprado_em', 'metodo_pagamento']
    raw_id_fields = ['cliente', 'evento', 'pagamento']
