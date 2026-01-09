'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card } from '@/components/ui/card';
import { clienteApi } from '@/lib/api-client';
import { Evento } from '@/lib/types';
import { Calendar, MapPin, Ticket } from 'lucide-react';

export default function CompanyHistory() {
  const { tipoUsuario, carregando } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<Evento[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!carregando && tipoUsuario !== 'empresa') {
      router.push('/login');
    }
  }, [carregando, tipoUsuario, router]);

  useEffect(() => {
    if (tipoUsuario !== 'empresa') return;

    const fetchHistory = async () => {
      const response = await clienteApi.obter<Evento[]>('/eventos/meus-eventos/historico', true);
      if (response.dados) {
        setEvents(response.dados);
      }
      setLoadingData(false);
    };

    fetchHistory();
  }, [tipoUsuario]);

  if (carregando || loadingData) {
    return (
      <DashboardLayout type="company">
        <div className="flex items-center justify-center h-64">
          <p className="text-white">Carregando...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout type="company">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Histórico de Eventos</h1>
          <p className="text-gray-400">Eventos finalizados</p>
        </div>

        {events.length === 0 ? (
          <Card className="bg-black/50 border-purple-400/30 p-12 backdrop-blur-sm text-center">
            <p className="text-gray-400">Nenhum evento finalizado</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <Card
                key={event.id}
                className="bg-black/50 border-gray-600 p-6 backdrop-blur-sm hover:border-purple-400 transition-all"
              >
                <h3 className="text-xl font-bold text-white mb-2">{event.nome}</h3>
                <div className="space-y-2 text-sm text-gray-400 mb-4">
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-2" />
                    {event.localizacao}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    Finalizado em: {new Date(event.data_fim).toLocaleDateString('pt-BR')}
                  </div>
                  <div className="flex items-center">
                    <Ticket className="w-4 h-4 mr-2" />
                    {event.ingressos_vendidos} / {event.total_ingressos} ingressos vendidos
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-700">
                  <p className="text-cyan-400 font-bold">
                    Receita: R${' '}
                    {((event.preco_ingresso * event.ingressos_vendidos) / 100).toFixed(2)}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
