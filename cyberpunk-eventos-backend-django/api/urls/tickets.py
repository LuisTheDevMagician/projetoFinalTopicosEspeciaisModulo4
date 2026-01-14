from django.urls import path
from api.views.tickets import (
    comprar_ingresso, obter_meus_pagamentos, obter_meus_ingressos,
    obter_detalhes_ingresso, verificar_ingresso
)

urlpatterns = [
    path('comprar/', comprar_ingresso, name='comprar-ingresso'),
    path('meus-pagamentos/', obter_meus_pagamentos, name='meus-pagamentos'),
    path('meus-ingressos/', obter_meus_ingressos, name='meus-ingressos'),
    path('<int:ingresso_id>/', obter_detalhes_ingresso, name='detalhes-ingresso'),
    path('verificar/<str:codigo_hash>/', verificar_ingresso, name='verificar-ingresso'),
]
