from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.utils import timezone


class EmpresaManager(BaseUserManager):
    """Manager para o modelo Empresa"""
    
    def create_user(self, email, nome, senha=None, **extra_fields):
        """Criar e salvar uma empresa"""
        if not email:
            raise ValueError('O email deve ser fornecido')
        email = self.normalize_email(email)
        empresa = self.model(email=email, nome=nome, **extra_fields)
        empresa.set_password(senha)
        empresa.save(using=self._db)
        return empresa
    
    def create_superuser(self, email, nome, senha=None, **extra_fields):
        """Criar e salvar um superusuário empresa"""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, nome, senha, **extra_fields)


class Empresa(AbstractBaseUser):
    """Modelo para Empresas/Organizadores de Eventos"""
    
    id = models.AutoField(primary_key=True)
    nome = models.CharField(max_length=255)
    email = models.EmailField(unique=True, db_index=True)
    cnpj = models.CharField(max_length=18, unique=True, null=True, blank=True, db_index=True)
    endereco = models.CharField(max_length=500, null=True, blank=True)
    biografia = models.TextField(null=True, blank=True)
    imagem_perfil = models.CharField(max_length=500, null=True, blank=True)
    imagem_fundo = models.CharField(max_length=500, null=True, blank=True)
    criado_em = models.DateTimeField(default=timezone.now)
    
    # Campos para autenticação
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    
    objects = EmpresaManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['nome']
    
    class Meta:
        db_table = 'empresas'
        verbose_name = 'Empresa'
        verbose_name_plural = 'Empresas'
    
    def __str__(self):
        return self.email
    
    def has_perm(self, perm, obj=None):
        return True
    
    def has_module_perms(self, app_label):
        return True


class ClienteManager(BaseUserManager):
    """Manager para o modelo Cliente"""
    
    def create_user(self, email, nome, senha=None, **extra_fields):
        """Criar e salvar um cliente"""
        if not email:
            raise ValueError('O email deve ser fornecido')
        email = self.normalize_email(email)
        cliente = self.model(email=email, nome=nome, **extra_fields)
        cliente.set_password(senha)
        cliente.save(using=self._db)
        return cliente
    
    def create_superuser(self, email, nome, senha=None, **extra_fields):
        """Criar e salvar um superusuário cliente"""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, nome, senha, **extra_fields)


class Cliente(AbstractBaseUser):
    """Modelo para Clientes/Compradores de Ingressos"""
    
    id = models.AutoField(primary_key=True)
    nome = models.CharField(max_length=255)
    email = models.EmailField(unique=True, db_index=True)
    criado_em = models.DateTimeField(default=timezone.now)
    
    # Campos para autenticação
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    
    objects = ClienteManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['nome']
    
    class Meta:
        db_table = 'clientes'
        verbose_name = 'Cliente'
        verbose_name_plural = 'Clientes'
    
    def __str__(self):
        return self.email
    
    def has_perm(self, perm, obj=None):
        return True
    
    def has_module_perms(self, app_label):
        return True


class Evento(models.Model):
    """Modelo para Eventos"""
    
    id = models.AutoField(primary_key=True)
    nome = models.CharField(max_length=255)
    localizacao = models.CharField(max_length=500)
    descricao = models.TextField(null=True, blank=True)
    criado_em = models.DateTimeField(default=timezone.now)
    data_inicio = models.DateTimeField()
    data_fim = models.DateTimeField()
    preco_ingresso = models.IntegerField()  # Preço em centavos
    total_ingressos = models.IntegerField()
    ativo = models.BooleanField(default=True)
    
    # Relacionamentos
    organizador = models.ForeignKey(
        Empresa,
        on_delete=models.CASCADE,
        related_name='eventos'
    )
    
    class Meta:
        db_table = 'eventos'
        verbose_name = 'Evento'
        verbose_name_plural = 'Eventos'
        ordering = ['-criado_em']
    
    def __str__(self):
        return self.nome


class MetodoPagamento(models.TextChoices):
    """Enum para métodos de pagamento"""
    PIX = 'pix', 'PIX'
    CARTAO = 'cartao', 'Cartão'


class Pagamento(models.Model):
    """Modelo para Pagamentos"""
    
    id = models.AutoField(primary_key=True)
    codigo_pagamento = models.CharField(max_length=50, unique=True, db_index=True)
    
    # Informações do pagamento
    quantidade = models.IntegerField()
    valor_total = models.FloatField()
    metodo_pagamento = models.CharField(
        max_length=10,
        choices=MetodoPagamento.choices
    )
    
    # Informações do comprador
    nome_comprador = models.CharField(max_length=255)
    email_comprador = models.EmailField()
    cpf_comprador = models.CharField(max_length=14)
    
    # Timestamps
    criado_em = models.DateTimeField(default=timezone.now)
    
    # Relacionamentos
    cliente = models.ForeignKey(
        Cliente,
        on_delete=models.CASCADE,
        related_name='pagamentos'
    )
    evento = models.ForeignKey(
        Evento,
        on_delete=models.CASCADE,
        related_name='pagamentos'
    )
    
    class Meta:
        db_table = 'pagamentos'
        verbose_name = 'Pagamento'
        verbose_name_plural = 'Pagamentos'
        ordering = ['-criado_em']
    
    def __str__(self):
        return f'Pagamento {self.codigo_pagamento}'


class Ingresso(models.Model):
    """Modelo para Ingressos"""
    
    id = models.AutoField(primary_key=True)
    codigo_hash = models.CharField(max_length=11, unique=True, db_index=True)
    comprado_em = models.DateTimeField(default=timezone.now)
    quantidade = models.IntegerField(default=1)
    metodo_pagamento = models.CharField(
        max_length=10,
        choices=MetodoPagamento.choices,
        null=True,
        blank=True
    )
    nome_comprador = models.CharField(max_length=255, null=True, blank=True)
    email_comprador = models.EmailField(null=True, blank=True)
    cpf_comprador = models.CharField(max_length=14, null=True, blank=True)
    
    # Relacionamentos
    cliente = models.ForeignKey(
        Cliente,
        on_delete=models.CASCADE,
        related_name='ingressos'
    )
    evento = models.ForeignKey(
        Evento,
        on_delete=models.CASCADE,
        related_name='ingressos'
    )
    pagamento = models.ForeignKey(
        Pagamento,
        on_delete=models.CASCADE,
        related_name='ingressos'
    )
    
    class Meta:
        db_table = 'ingressos'
        verbose_name = 'Ingresso'
        verbose_name_plural = 'Ingressos'
        ordering = ['-comprado_em']
    
    def __str__(self):
        return f'Ingresso {self.codigo_hash}'
