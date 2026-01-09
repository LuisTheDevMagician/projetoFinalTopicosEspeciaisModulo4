'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card } from '@/components/ui/card';
import { clienteApi } from '@/lib/api-client';
import { IngressoDetalhes } from '@/lib/types';
import { Calendar, MapPin, Ticket, Hash } from 'lucide-react';

export default function ClientHistory() {
  const { tipoUsuario, carregando } = useAuth();
  const router = useRouter();
  const [tickets, setTickets] = useState<IngressoDetalhes[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!carregando && tipoUsuario !== 'cliente') {
      router.push('/login');
    }
  }, [carregando, tipoUsuario, router]);

  useEffect(() => {
    if (tipoUsuario !== 'cliente') return;

    const fetchTickets = async () => {
      const response = await clienteApi.obter<IngressoDetalhes[]>(
        '/ingressos/meus-ingressos',
        true
      );
      if (response.dados) {
        // Agora o backend já retorna registros individuais (cada registro = 1 ingresso)
        setTickets(response.dados);
      }
      setLoadingData(false);
    };

    fetchTickets();
  }, [tipoUsuario]);

  if (carregando || loadingData) {
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
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Meus Ingressos</h1>
          <p className="text-gray-400">Todos os seus ingressos comprados</p>
        </div>

        {tickets.length === 0 ? (
          <Card className="bg-black/50 border-cyan-400/30 p-12 backdrop-blur-sm text-center">
            <Ticket className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-2">Você ainda não comprou nenhum ingresso</p>
            <p className="text-sm text-gray-500">
              Visite a página inicial para ver eventos disponíveis
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {tickets.map((ticket) => (
              <Card
                key={ticket.id}
                className="bg-black/50 border-cyan-400/30 p-6 backdrop-blur-sm hover:border-cyan-400 transition-all"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Event Info */}
                  <div className="md:col-span-2">
                    <h3 className="text-2xl font-bold text-white mb-2">{ticket.evento.nome}</h3>

                    {ticket.evento.descricao && (
                      <p className="text-gray-400 mb-4">{ticket.evento.descricao}</p>
                    )}

                    <div className="space-y-2 text-sm text-gray-400">
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-2 text-cyan-400" />
                        {ticket.evento.localizacao}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-cyan-400" />
                        Data do evento:{' '}
                        {new Date(ticket.evento.data_fim).toLocaleDateString('pt-BR')}
                      </div>
                      <div className="flex items-center">
                        <Ticket className="w-4 h-4 mr-2 text-cyan-400" />
                        Comprado em: {new Date(ticket.comprado_em).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </div>

                  {/* Ticket Info */}
                  <div className="border-l border-gray-700 pl-6">
                    <div className="bg-cyan-400/10 border border-cyan-400/50 rounded-lg p-4 text-center">
                      <Hash className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
                      <p className="text-xs text-gray-400 mb-1">Código do Ingresso</p>
                      <p className="text-lg font-mono font-bold text-cyan-400 tracking-wider">
                        {ticket.codigo_hash}
                      </p>
                    </div>

                    <div className="mt-4 text-center">
                      <p className="text-sm text-gray-400">Valor por Ingresso</p>
                      <p className="text-2xl font-bold text-white">
                        R$ {(ticket.evento.preco_ingresso / 100).toFixed(2)}
                      </p>
                      <p className="text-xs text-cyan-400 mt-1">1 ingresso</p>
                    </div>

                    <div className="mt-4 text-center">
                      {ticket.evento.ativo ? (
                        <span className="inline-block bg-green-500/20 text-green-400 text-xs px-3 py-1 rounded-full border border-green-500/50">
                          Evento Ativo
                        </span>
                      ) : (
                        <span className="inline-block bg-gray-500/20 text-gray-400 text-xs px-3 py-1 rounded-full border border-gray-500/50">
                          Evento Finalizado
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
