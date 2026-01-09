'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { clienteApi } from '@/lib/api-client';
import { Evento, EventoDetalhes } from '@/lib/types';
import { Calendar, MapPin, Ticket } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function ClientDashboard() {
  const { usuario, tipoUsuario, carregando } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<EventoDetalhes[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [quantities, setQuantities] = useState<Record<number, number>>({});

  useEffect(() => {
    if (!carregando && tipoUsuario !== 'cliente') {
      router.push('/login');
    }
  }, [carregando, tipoUsuario, router]);

  useEffect(() => {
    if (tipoUsuario !== 'cliente') return;

    const fetchEvents = async () => {
      const response = await clienteApi.obter<EventoDetalhes[]>('/eventos', false);
      if (response.dados) {
        setEvents(response.dados);
        // Inicializar quantidades com 1
        const initialQtd: Record<number, number> = {};
        response.dados.forEach((event) => {
          initialQtd[event.id] = 1;
        });
        setQuantities(initialQtd);
      }
      setLoadingData(false);
    };

    fetchEvents();
  }, [tipoUsuario]);

  const refreshEvents = async () => {
    const response = await clienteApi.obter<EventoDetalhes[]>('/eventos', false);
    if (response.dados) {
      setEvents(response.dados);
      // Inicializar quantidades com 1
      const initialQtd: Record<number, number> = {};
      response.dados.forEach((event) => {
        initialQtd[event.id] = 1;
      });
      setQuantities(initialQtd);
    }
  };

  const handleCheckout = (eventId: number) => {
    const quantidade = quantities[eventId] || 1;
    router.push(`/client/checkout/${eventId}?quantidade=${quantidade}`);
  };

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
          <h1 className="text-3xl font-bold text-white mb-2">Eventos Disponíveis</h1>
          <p className="text-gray-400">Bem-vindo, {usuario?.nome}</p>
        </div>

        {events.length === 0 ? (
          <Card className="bg-black/50 border-cyan-400/30 p-12 backdrop-blur-sm text-center">
            <p className="text-gray-400">Nenhum evento disponível no momento</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => {
              const ticketsAvailable = event.total_ingressos - event.ingressos_vendidos;
              const soldOut = ticketsAvailable <= 0;

              return (
                <Card
                  key={event.id}
                  className="bg-black/50 border-cyan-400/30 p-6 backdrop-blur-sm hover:border-cyan-400 transition-all"
                >
                  <h3 className="text-xl font-bold text-white mb-1">{event.nome}</h3>
                  {event.organizador && (
                    <Link
                      href={`/company/${event.organizador.id}`}
                      className="text-sm bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent hover:from-cyan-300 hover:to-purple-400 transition-all mb-2 inline-block font-semibold"
                    >
                      by @{event.organizador.nome}
                    </Link>
                  )}

                  {event.descricao && (
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">{event.descricao}</p>
                  )}

                  <div className="space-y-2 text-sm text-gray-400 mb-4">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      {event.localizacao}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      {new Date(event.data_fim).toLocaleDateString('pt-BR')}
                    </div>
                    <div className="flex items-center">
                      <Ticket className="w-4 h-4 mr-2" />
                      {ticketsAvailable} ingressos disponíveis
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-gray-700">
                    <div className="flex justify-between items-center">
                      <span className="text-cyan-400 font-bold text-lg">
                        R$ {(event.preco_ingresso / 100).toFixed(2)}
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() =>
                            setQuantities({
                              ...quantities,
                              [event.id]: Math.max(1, (quantities[event.id] || 1) - 1),
                            })
                          }
                          disabled={soldOut || (quantities[event.id] || 1) <= 1}
                          className="bg-purple-400 hover:bg-purple-500 text-black w-8 h-8 p-0"
                        >
                          -
                        </Button>
                        <span className="text-white font-semibold w-8 text-center">
                          {quantities[event.id] || 1}
                        </span>
                        <Button
                          onClick={() =>
                            setQuantities({
                              ...quantities,
                              [event.id]: Math.min(
                                ticketsAvailable,
                                (quantities[event.id] || 1) + 1
                              ),
                            })
                          }
                          disabled={soldOut || (quantities[event.id] || 1) >= ticketsAvailable}
                          className="bg-purple-400 hover:bg-purple-500 text-black w-8 h-8 p-0"
                        >
                          +
                        </Button>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleCheckout(event.id)}
                      disabled={soldOut}
                      className={`w-full ${
                        soldOut ? 'bg-gray-600 cursor-not-allowed' : 'bg-cyan-400 hover:bg-cyan-500'
                      } text-black`}
                    >
                      {soldOut ? 'Esgotado' : 'Comprar'}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
