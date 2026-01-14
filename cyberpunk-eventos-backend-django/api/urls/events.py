from django.urls import path
from api.views.events import (
    criar_evento, obter_meus_eventos, obter_historico_eventos,
    obter_estatisticas_dashboard, obter_detalhes_evento,
    atualizar_evento, deletar_evento, obter_todos_eventos_ativos
)

urlpatterns = [
    path('', obter_todos_eventos_ativos, name='todos-eventos'),
    path('criar/', criar_evento, name='criar-evento'),
    path('meus-eventos/', obter_meus_eventos, name='meus-eventos'),
    path('meus-eventos/historico/', obter_historico_eventos, name='historico-eventos'),
    path('dashboard/estatisticas/', obter_estatisticas_dashboard, name='estatisticas-dashboard'),
    path('<int:evento_id>/', obter_detalhes_evento, name='detalhes-evento'),
    path('<int:evento_id>/atualizar/', atualizar_evento, name='atualizar-evento'),
    path('<int:evento_id>/deletar/', deletar_evento, name='deletar-evento'),
]
