from django.urls import path
from api.views.companies import (
    obter_meu_perfil, obter_perfil_empresa, atualizar_perfil_empresa,
    mudar_senha, obter_eventos_ativos_empresa
)

urlpatterns = [
    path('eu/', obter_meu_perfil, name='meu-perfil-empresa'),
    path('eu/atualizar/', atualizar_perfil_empresa, name='atualizar-perfil-empresa'),
    path('eu/senha/', mudar_senha, name='mudar-senha-empresa'),
    path('<int:empresa_id>/', obter_perfil_empresa, name='perfil-empresa'),
    path('<int:empresa_id>/eventos/', obter_eventos_ativos_empresa, name='eventos-empresa'),
]
