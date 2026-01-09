'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { clienteApi } from '@/lib/api-client';
import { Calendar, MapPin, Ticket, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PagamentoComIngressos {
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
  ingressos: Array<{
    id: number;
    codigo_hash: string;
    comprado_em: string;
    quantidade: number;
    pagamento_id: number;
  }>;
  evento: {
    id: number;
    nome: string;
    localizacao: string;
    data_fim: string;
    preco_ingresso: number;
  };
}

export default function MyTicketsPage() {
  const { tipoUsuario, carregando } = useAuth();
  const router = useRouter();
  const [pagamentos, setPagamentos] = useState<PagamentoComIngressos[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandido, setExpandido] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!carregando && tipoUsuario !== 'cliente') {
      router.push('/login');
    }
  }, [carregando, tipoUsuario, router]);

  useEffect(() => {
    if (tipoUsuario !== 'cliente') return;

    const fetchPagamentos = async () => {
      const response = await clienteApi.obter<PagamentoComIngressos[]>(
        '/ingressos/meus-pagamentos',
        true
      );
      if (response.dados) {
        setPagamentos(response.dados);
      }
      setLoading(false);
    };

    fetchPagamentos();
  }, [tipoUsuario]);

  const toggleExpandir = (pagamentoId: number) => {
    const novoExpandido = new Set(expandido);
    if (novoExpandido.has(pagamentoId)) {
      novoExpandido.delete(pagamentoId);
    } else {
      novoExpandido.add(pagamentoId);
    }
    setExpandido(novoExpandido);
  };

  if (carregando || loading) {
    return (
      <DashboardLayout type="client">
        <div className="flex items-center justify-center h-64">
          <p className="text-white">Carregando...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout type="client">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Meus Pagamentos</h1>
          <p className="text-gray-400">Histórico de pagamentos e ingressos</p>
        </div>

        {pagamentos.length === 0 ? (
          <Card className="bg-black/50 border-cyan-400/30 p-12 backdrop-blur-sm text-center">
            <p className="text-gray-400">Você ainda não realizou nenhum pagamento</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {pagamentos.map((pagamento) => (
              <Card
                key={pagamento.id}
                className="bg-black/50 border-purple-400/30 backdrop-blur-sm hover:border-purple-400 transition-all"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-white text-xl">{pagamento.evento.nome}</CardTitle>
                      <p className="text-cyan-400 font-mono text-sm">Pagamento: {pagamento.codigo_pagamento}</p>
                    </div>
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2 text-gray-400">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{pagamento.evento.localizacao}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(pagamento.evento.data_fim).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Ticket className="w-4 h-4" />
                        <span>{pagamento.quantidade} ingresso(s)</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Pagamento:</span>
                        <span className="text-white uppercase">{pagamento.metodo_pagamento}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Valor Total:</span>
                        <span className="text-cyan-400 font-bold">
                          R$ {pagamento.valor_total.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Comprado em:</span>
                        <span className="text-white">
                          {new Date(pagamento.criado_em).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Botão para expandir códigos de ingressos */}
                  <div className="pt-3 border-t border-gray-700/50">
                    <Button
                      variant="ghost"
                      className="w-full flex items-center justify-between text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10"
                      onClick={() => toggleExpandir(pagamento.id)}
                    >
                      <span>Ver códigos de ingressos ({pagamento.ingressos.length})</span>
                      {expandido.has(pagamento.id) ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </Button>

                    {expandido.has(pagamento.id) && (
                      <div className="mt-4 space-y-2">
                        {pagamento.ingressos.map((ingresso, index) => (
                          <div
                            key={ingresso.id}
                            className="bg-black/30 p-3 rounded-lg border border-cyan-400/20 flex justify-between items-center"
                          >
                            <span className="text-gray-400 text-sm">Ingresso {index + 1}</span>
                            <span className="text-cyan-400 font-mono text-sm">{ingresso.codigo_hash}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

