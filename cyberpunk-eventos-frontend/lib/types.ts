export interface Usuario {
  id: number;
  nome: string;
  email: string;
  criado_em: string;
}

export interface Empresa extends Usuario {
  endereco?: string;
  biografia?: string;
  imagem_perfil?: string;
  imagem_fundo?: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface Cliente extends Usuario {}

export interface Evento {
  id: number;
  nome: string;
  localizacao: string;
  descricao?: string;
  criado_em: string;
  data_fim: string;
  preco_ingresso: number;
  total_ingressos: number;
  ativo: boolean;
  organizador_id: number;
  ingressos_vendidos: number;
}

export interface EventoDetalhes extends Evento {
  organizador: Empresa;
  ingressos: Ingresso[];
}

export interface Ingresso {
  id: number;
  codigo_hash: string;
  comprado_em: string;
  evento_id: number;
  cliente_id: number;
  quantidade: number;
  pagamento_id: number;
  metodo_pagamento: string;
  nome_comprador?: string;
  email_comprador?: string;
  cpf_comprador?: string;
}

export interface IngressoDetalhes extends Ingresso {
  evento: Evento;
}

export interface Pagamento {
  id: number;
  codigo_pagamento: string;
  quantidade: number;
  valor_total: number;
  metodo_pagamento: string;
  nome_comprador: string;
  email_comprador: string;
  cpf_comprador: string;
  criado_em: string;
  evento_id: number;
  cliente_id: number;
}

export interface PagamentoComIngressos extends Pagamento {
  ingressos: Ingresso[];
  evento: Evento;
}

export interface DadosLogin {
  email: string;
  senha: string;
  tipo_usuario: 'empresa' | 'cliente';
}

export interface DadosRegistroEmpresa {
  nome: string;
  email: string;
  senha: string;
  endereco?: string;
  biografia?: string;
}

export interface DadosRegistroCliente {
  nome: string;
  email: string;
  senha: string;
}

export interface EstatisticasDashboard {
  total_eventos: number;
  eventos_ativos: number;
  total_ingressos_vendidos: number;
  receita_total: number;
  vendas_ao_longo_tempo: { data: string; quantidade: number }[];
}

export interface RespostaAuth {
  token_acesso: string;
  tipo_token: string;
  tipo_usuario: string;
  usuario_id: number;
}
