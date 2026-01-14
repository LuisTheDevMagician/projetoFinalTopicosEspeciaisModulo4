"""
URL configuration for cyberpunk_eventos project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.decorators import api_view
from rest_framework.response import Response


@api_view(['GET'])
def raiz(request):
    """Endpoint raiz da API"""
    return Response({
        "mensagem": "API Eventos Cyberpunk - Django",
        "versao": "1.0.0",
        "documentacao": "/api/docs/"
    })


@api_view(['GET'])
def verificar_saude(request):
    """Endpoint de verificação de saúde"""
    return Response({"status": "saudável"})


urlpatterns = [
    path('admin/', admin.site.urls),
    path('', raiz, name='raiz'),
    path('saude/', verificar_saude, name='saude'),
    path('auth/', include('api.urls.auth')),
    path('empresas/', include('api.urls.companies')),
    path('clientes/', include('api.urls.clients')),
    path('eventos/', include('api.urls.events')),
    path('ingressos/', include('api.urls.tickets')),
]

# Servir arquivos de mídia em desenvolvimento
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static('/perfis/', document_root=settings.BASE_DIR / 'perfis')
    urlpatterns += static('/fundos/', document_root=settings.BASE_DIR / 'fundos')
