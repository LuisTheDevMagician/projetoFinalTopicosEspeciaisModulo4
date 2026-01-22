from rest_framework import serializers
from .models import Empresa, Cliente, Evento, Pagamento, Ingresso, MetodoPagamento
from django.contrib.auth.password_validation import validate_password


# Serializers da Empresa
class EmpresaSerializer(serializers.ModelSerializer):
    """Serializer para Empresa"""
    
    class Meta:
        model = Empresa
        fields = [
            'id', 'nome', 'email', 'cnpj', 'endereco', 'biografia',
            'imagem_perfil', 'imagem_fundo', 'criado_em'
        ]
        read_only_fields = ['id', 'criado_em']


class EmpresaCriarSerializer(serializers.ModelSerializer):
    """Serializer para criar uma nova empresa"""
    senha = serializers.CharField(
        write_only=True,
        required=True,
        min_length=1  # Validação mais permissiva
    )
    
    class Meta:
        model = Empresa
        fields = ['nome', 'email', 'senha', 'cnpj', 'endereco', 'biografia']
    
    def create(self, validated_data):
        senha = validated_data.pop('senha')
        empresa = Empresa.objects.create_user(**validated_data, senha=senha)
        return empresa


class EmpresaAtualizarSerializer(serializers.ModelSerializer):
    """Serializer para atualizar empresa"""
    
    class Meta:
        model = Empresa
        fields = ['nome', 'cnpj', 'endereco', 'biografia', 'imagem_perfil', 'imagem_fundo']
        extra_kwargs = {
            'nome': {'required': False},
            'cnpj': {'required': False},
            'endereco': {'required': False},
            'biografia': {'required': False},
            'imagem_perfil': {'required': False},
            'imagem_fundo': {'required': False},
        }


# Serializers do Cliente
class ClienteSerializer(serializers.ModelSerializer):
    """Serializer para Cliente"""
    
    class Meta:
        model = Cliente
        fields = ['id', 'nome', 'email', 'criado_em']
        read_only_fields = ['id', 'criado_em']


class ClienteCriarSerializer(serializers.ModelSerializer):
    """Serializer para criar um novo cliente"""
    senha = serializers.CharField(
        write_only=True,
        required=True,
        min_length=1  # Validação mais permissiva
    )
    
    class Meta:
        model = Cliente
        fields = ['nome', 'email', 'senha']
    
    def create(self, validated_data):
        senha = validated_data.pop('senha')
        cliente = Cliente.objects.create_user(**validated_data, senha=senha)
        return cliente


class ClienteAtualizarSerializer(serializers.ModelSerializer):
    """Serializer para atualizar cliente"""
    
    class Meta:
        model = Cliente
        fields = ['nome', 'email']
        extra_kwargs = {
            'nome': {'required': False},
            'email': {'required': False},
        }


# Serializers do Evento
class EventoSerializer(serializers.ModelSerializer):
    """Serializer para Evento"""
    ingressos_vendidos = serializers.SerializerMethodField()
    
    class Meta:
        model = Evento
        fields = [
            'id', 'nome', 'localizacao', 'descricao', 'criado_em',
            'data_inicio', 'data_fim', 'preco_ingresso', 'total_ingressos', 'ativo',
            'organizador_id', 'ingressos_vendidos'
        ]
        read_only_fields = ['id', 'criado_em', 'organizador_id']
    
    def get_ingressos_vendidos(self, obj):
        return obj.ingressos.count()


class EventoCriarSerializer(serializers.ModelSerializer):
    """Serializer para criar um novo evento"""
    
    class Meta:
        model = Evento
        fields = [
            'nome', 'localizacao', 'descricao', 'data_inicio', 'data_fim',
            'preco_ingresso', 'total_ingressos'
        ]
    
    def validate_preco_ingresso(self, value):
        if value <= 0:
            raise serializers.ValidationError("O preço deve ser maior que 0")
        return value
    
    def validate_total_ingressos(self, value):
        if value <= 0:
            raise serializers.ValidationError("O total de ingressos deve ser maior que 0")
        return value


class EventoAtualizarSerializer(serializers.ModelSerializer):
    """Serializer para atualizar evento"""
    
    class Meta:
        model = Evento
        fields = [
            'nome', 'localizacao', 'descricao', 'data_inicio', 'data_fim',
            'preco_ingresso', 'total_ingressos', 'ativo'
        ]
        extra_kwargs = {field: {'required': False} for field in fields}


class EventoDetalheSerializer(serializers.ModelSerializer):
    """Serializer para detalhes do evento com organizador e ingressos"""
    organizador = EmpresaSerializer(read_only=True)
    ingressos_vendidos = serializers.SerializerMethodField()
    
    class Meta:
        model = Evento
        fields = [
            'id', 'nome', 'localizacao', 'descricao', 'criado_em',
            'data_fim', 'preco_ingresso', 'total_ingressos', 'ativo',
            'organizador_id', 'organizador', 'ingressos_vendidos'
        ]
        read_only_fields = ['id', 'criado_em', 'organizador_id']
    
    def get_ingressos_vendidos(self, obj):
        return obj.ingressos.count()


# Serializers do Ingresso
class IngressoSerializer(serializers.ModelSerializer):
    """Serializer para Ingresso"""
    
    class Meta:
        model = Ingresso
        fields = [
            'id', 'codigo_hash', 'comprado_em', 'evento_id',
            'cliente_id', 'quantidade', 'pagamento_id', 'metodo_pagamento'
        ]
        read_only_fields = [
            'id', 'codigo_hash', 'comprado_em', 'cliente_id', 'pagamento_id'
        ]


class IngressoCriarSerializer(serializers.Serializer):
    """Serializer para criar ingressos (compra)"""
    evento_id = serializers.IntegerField()
    quantidade = serializers.IntegerField(min_value=1, default=1)
    metodo_pagamento = serializers.ChoiceField(choices=MetodoPagamento.choices)
    nome_comprador = serializers.CharField(max_length=255)
    email_comprador = serializers.EmailField()
    cpf_comprador = serializers.CharField(max_length=14)


class IngressoDetalheSerializer(serializers.ModelSerializer):
    """Serializer para detalhes do ingresso com evento"""
    evento = EventoSerializer(read_only=True)
    
    class Meta:
        model = Ingresso
        fields = [
            'id', 'codigo_hash', 'comprado_em', 'evento_id',
            'cliente_id', 'quantidade', 'pagamento_id',
            'metodo_pagamento', 'evento'
        ]
        read_only_fields = [
            'id', 'codigo_hash', 'comprado_em', 'cliente_id', 'pagamento_id'
        ]


# Serializers do Pagamento
class PagamentoSerializer(serializers.ModelSerializer):
    """Serializer para Pagamento"""
    
    class Meta:
        model = Pagamento
        fields = [
            'id', 'codigo_pagamento', 'quantidade', 'valor_total',
            'metodo_pagamento', 'nome_comprador', 'email_comprador',
            'cpf_comprador', 'criado_em', 'evento_id', 'cliente_id'
        ]
        read_only_fields = [
            'id', 'codigo_pagamento', 'criado_em', 'cliente_id'
        ]


class PagamentoComIngressosSerializer(serializers.ModelSerializer):
    """Serializer para pagamento com ingressos"""
    ingressos = IngressoSerializer(many=True, read_only=True)
    evento = EventoSerializer(read_only=True)
    
    class Meta:
        model = Pagamento
        fields = [
            'id', 'codigo_pagamento', 'quantidade', 'valor_total',
            'metodo_pagamento', 'nome_comprador', 'email_comprador',
            'cpf_comprador', 'criado_em', 'evento_id', 'cliente_id',
            'ingressos', 'evento'
        ]
        read_only_fields = [
            'id', 'codigo_pagamento', 'criado_em', 'cliente_id'
        ]


# Serializers de Autenticação
class LoginSerializer(serializers.Serializer):
    """Serializer para login"""
    email = serializers.EmailField()
    senha = serializers.CharField(write_only=True)
    tipo_usuario = serializers.ChoiceField(choices=['empresa', 'cliente'])


class MudarSenhaSerializer(serializers.Serializer):
    """Serializer para mudar senha"""
    senha_antiga = serializers.CharField(write_only=True)
    senha_nova = serializers.CharField(
        write_only=True,
        min_length=1  # Validação mais permissiva
    )


# Serializers de Estatísticas
class EstatisticasVendasIngressosSerializer(serializers.Serializer):
    """Serializer para estatísticas de vendas"""
    data = serializers.CharField()
    quantidade = serializers.IntegerField()


class EstatisticasDashboardSerializer(serializers.Serializer):
    """Serializer para estatísticas do dashboard"""
    total_eventos = serializers.IntegerField()
    eventos_ativos = serializers.IntegerField()
    total_ingressos_vendidos = serializers.IntegerField()
    receita_total = serializers.IntegerField()
    vendas_ao_longo_tempo = EstatisticasVendasIngressosSerializer(many=True)
