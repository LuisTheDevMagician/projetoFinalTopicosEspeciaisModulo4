from django.urls import path
from api.views.clients import obter_meu_perfil, atualizar_perfil_cliente, mudar_senha

urlpatterns = [
    path('eu/', obter_meu_perfil, name='meu-perfil-cliente'),
    path('eu/atualizar/', atualizar_perfil_cliente, name='atualizar-perfil-cliente'),
    path('eu/senha/', mudar_senha, name='mudar-senha-cliente'),
]
