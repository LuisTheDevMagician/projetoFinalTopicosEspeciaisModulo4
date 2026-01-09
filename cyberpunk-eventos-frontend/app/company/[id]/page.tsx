'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { clienteApi } from '@/lib/api-client';
import { Empresa, Evento } from '@/lib/types';
import { Calendar, MapPin, Ticket, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function CompanyPublicProfile() {
  const params = useParams();
  const router = useRouter();
  const [company, setCompany] = useState<Empresa | null>(null);
  const [events, setEvents] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompanyData = async () => {
      const companyId = params.id;

      // Buscar dados da empresa
      const companyResponse = await clienteApi.obter<Empresa>(`/empresas/${companyId}`, false);

      if (companyResponse.dados) {
        setCompany(companyResponse.dados);
      } else {
        toast.error('Empresa não encontrada');
        router.push('/');
        return;
      }

      // Buscar eventos ativos da empresa
      const eventsResponse = await clienteApi.obter<Evento[]>(
        `/empresas/${companyId}/eventos`,
        false
      );

      if (eventsResponse.dados) {
        setEvents(eventsResponse.dados);
      }

      setLoading(false);
    };

    fetchCompanyData();
  }, [params.id, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-cyan-900 flex items-center justify-center">
        <p className="text-white">Carregando...</p>
      </div>
    );
  }

  if (!company) return null;

  const backgroundImage = company.imagem_fundo
    ? `http://localhost:8000${company.imagem_fundo}`
    : null;
  const profileImage = company.imagem_perfil
    ? `http://localhost:8000${company.imagem_perfil}`
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-cyan-900">
      {/* Botão Voltar Fixo */}
      <Button
        onClick={() => router.back()}
        className="fixed top-8 right-8 z-50 bg-purple-500 hover:bg-purple-600 text-white px-8 py-6 text-lg font-bold shadow-2xl"
      >
        Voltar
      </Button>

      {/* Header com imagem de fundo */}
      <div
        className="relative h-64 bg-cover bg-center"
        style={{
          backgroundImage: backgroundImage
            ? `url(${backgroundImage})`
            : 'linear-gradient(to right, rgba(147, 51, 234, 0.5), rgba(6, 182, 212, 0.5))',
        }}
      >
        <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/80 to-transparent">
          {/* Gradiente apenas embaixo para legibilidade */}
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="max-w-6xl mx-auto flex items-end space-x-6">
            {/* Imagem de perfil */}
            <div className="relative">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt={company.nome}
                  className="w-32 h-32 rounded-full border-4 border-purple-400 object-cover"
                />
              ) : (
                <div className="w-32 h-32 rounded-full border-4 border-purple-400 bg-black/50 flex items-center justify-center">
                  <Building2 className="w-16 h-16 text-purple-400" />
                </div>
              )}
            </div>

            {/* Informações da empresa */}
            <div className="flex-1 pb-4">
              <h1 className="text-4xl font-bold text-white mb-2">{company.nome}</h1>
              {company.endereco && (
                <p className="text-gray-300 flex items-center">
                  <MapPin className="w-4 h-4 mr-2" />
                  {company.endereco}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-6xl mx-auto p-8 space-y-8">
        {/* Biografia */}
        {company.biografia && (
          <Card className="bg-black/50 border-purple-400/30 p-6 backdrop-blur-sm">
            <h2 className="text-xl font-bold text-white mb-4">Sobre</h2>
            <p className="text-gray-300">{company.biografia}</p>
          </Card>
        )}

        {/* Eventos Ativos */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">Eventos Ativos</h2>

          {events.length === 0 ? (
            <Card className="bg-black/50 border-purple-400/30 p-12 backdrop-blur-sm text-center">
              <p className="text-gray-400">Nenhum evento ativo no momento</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => {
                const ticketsAvailable = event.total_ingressos - event.ingressos_vendidos;
                const soldOut = ticketsAvailable <= 0;

                return (
                  <Card
                    key={event.id}
                    className="bg-black/50 border-purple-400/30 p-6 backdrop-blur-sm hover:border-purple-400 transition-all"
                  >
                    <h3 className="text-xl font-bold text-white mb-1">{event.nome}</h3>
                    {company && (
                      <Link
                        href={`/company/${company.id}`}
                        className="text-sm bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent hover:from-cyan-300 hover:to-purple-400 transition-all mb-2 inline-block font-semibold"
                      >
                        by @{company.nome}
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
                        {soldOut ? (
                          <span className="text-red-400">Esgotado</span>
                        ) : (
                          `${ticketsAvailable} disponíveis`
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-cyan-400 font-bold text-lg">
                        R$ {(event.preco_ingresso / 100).toFixed(2)}
                      </span>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
