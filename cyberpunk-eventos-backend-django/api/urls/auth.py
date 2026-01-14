from django.urls import path
from api.views.auth import registrar_empresa, registrar_cliente, fazer_login

urlpatterns = [
    path('registrar/empresa/', registrar_empresa, name='registrar-empresa'),
    path('registrar/cliente/', registrar_cliente, name='registrar-cliente'),
    path('login/', fazer_login, name='login'),
]
