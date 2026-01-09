'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { clienteApi } from '@/lib/api-client';
import { Evento, EstatisticasDashboard } from '@/lib/types';
import { Calendar, MapPin, Ticket, TrendingUp, Edit, XCircle, CalendarIcon } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { toast } from 'sonner';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DayPicker, type DateRange } from 'react-day-picker';
import 'react-day-picker/dist/style.css';

export default function CompanyDashboard() {
  const { usuario, tipoUsuario, carregando } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<Evento[]>([]);
  const [stats, setStats] = useState<EstatisticasDashboard | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [finalizingEvent, setFinalizingEvent] = useState<number | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  useEffect(() => {
    if (!carregando && tipoUsuario !== 'empresa') {
      router.push('/login');
    }
  }, [carregando, tipoUsuario, router]);

  useEffect(() => {
    if (tipoUsuario !== 'empresa') return;

    const fetchDashboardData = async () => {
      setLoadingData(true);

      // Fetch active events
      const eventsResponse = await clienteApi.obter<Evento[]>(
        '/eventos/meus-eventos?apenas_ativos=true',
        true
      );
      if (eventsResponse.dados) {
        setEvents(eventsResponse.dados);
      }

      // Fetch stats
      const statsResponse = await clienteApi.obter<EstatisticasDashboard>(
        '/eventos/dashboard/estatisticas',
        true
      );
      if (statsResponse.dados) {
        setStats(statsResponse.dados);
      } else {
        toast.error('Erro ao carregar estatísticas');
      }

      setLoadingData(false);
    };

    fetchDashboardData();
  }, [tipoUsuario]);

  const handleFinalizeEvent = async (eventId: number) => {
    if (
      !confirm(
        'Tem certeza que deseja finalizar este evento? Ele não estará mais disponível para compra.'
      )
    ) {
      return;
    }

    setFinalizingEvent(eventId);

    const response = await clienteApi.atualizar(`/eventos/${eventId}`, { ativo: false }, true);

    if (response.dados) {
      toast.success('Evento finalizado com sucesso!');
      // Atualizar lista de eventos
      setEvents(events.filter((e) => e.id !== eventId));
    } else {
      toast.error(response.erro || 'Erro ao finalizar evento');
    }

    setFinalizingEvent(null);
  };

  // Filtrar dados do gráfico baseado no período selecionado
  const filteredChartData =
    stats?.vendas_ao_longo_tempo?.filter((item) => {
      if (!dateRange?.from && !dateRange?.to) return true;

      const itemDate = new Date(item.data);

      if (dateRange.from && dateRange.to) {
        return itemDate >= dateRange.from && itemDate <= dateRange.to;
      }

      if (dateRange.from) {
        return itemDate >= dateRange.from;
      }

      return true;
    }) || [];

  const handleApplyDateFilter = () => {
    setShowDatePicker(false);
    if (dateRange?.from || dateRange?.to) {
      toast.success('Filtro de período aplicado');
    }
  };

  const handleClearDateFilter = () => {
    setDateRange(undefined);
    setShowDatePicker(false);
    toast.success('Filtro removido');
  };

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
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-gray-400">Bem-vindo, {usuario?.nome}</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-black/50 border-purple-400/30 p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total de Eventos</p>
                  <p className="text-3xl font-bold text-white mt-2">{stats.total_eventos}</p>
                </div>
                <Calendar className="w-12 h-12 text-purple-400" />
              </div>
            </Card>

            <Card className="bg-black/50 border-cyan-400/30 p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Eventos Ativos</p>
                  <p className="text-3xl font-bold text-white mt-2">{stats.eventos_ativos}</p>
                </div>
                <TrendingUp className="w-12 h-12 text-cyan-400" />
              </div>
            </Card>

            <Card className="bg-black/50 border-purple-400/30 p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Ingressos Vendidos</p>
                  <p className="text-3xl font-bold text-white mt-2">
                    {stats.total_ingressos_vendidos}
                  </p>
                </div>
                <Ticket className="w-12 h-12 text-purple-400" />
              </div>
            </Card>

            <Card className="bg-black/50 border-cyan-400/30 p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Receita Total</p>
                  <p className="text-3xl font-bold text-white mt-2">
                    R$ {(stats.receita_total / 100).toFixed(2)}
                  </p>
                </div>
                <TrendingUp className="w-12 h-12 text-cyan-400" />
              </div>
            </Card>
          </div>
        )}

        {/* Active Events */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Eventos Ativos</h2>
            <Link href="/company/create-event">
              <Button className="bg-purple-400 hover:bg-purple-500 text-black">
                Criar Novo Evento
              </Button>
            </Link>
          </div>

          {events.length === 0 ? (
            <Card className="bg-black/50 border-purple-400/30 backdrop-blur-sm">
              <CardContent className="py-12">
                <p className="text-center text-gray-400">Nenhum evento ativo encontrado.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <Card key={event.id} className="bg-black/50 border-purple-400/30 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-white">{event.nome}</CardTitle>
                    {usuario && (
                      <Link
                        href={`/company/${usuario.id}`}
                        className="text-sm bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent hover:from-cyan-300 hover:to-purple-400 transition-all inline-block font-semibold"
                      >
                        by @{usuario.nome}
                      </Link>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-gray-400 mb-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{event.localizacao}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(event.data_fim).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Ticket className="w-4 h-4" />
                        <span>
                          {event.ingressos_vendidos || 0} / {event.total_ingressos} vendidos
                        </span>
                      </div>
                    </div>
                    {event.preco_ingresso && (
                      <div className="mb-4">
                        <span className="text-cyan-400 font-semibold text-lg">
                          R$ {(event.preco_ingresso / 100).toFixed(2)}
                        </span>
                      </div>
                    )}
                    <div className="flex gap-2 pt-4 border-t border-gray-700/50">
                      <Link href={`/company/edit-event/${event.id}`} className="flex-1">
                        <Button className="w-full bg-cyan-400 hover:bg-cyan-500 text-black">
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </Button>
                      </Link>
                      <Button
                        onClick={() => handleFinalizeEvent(event.id)}
                        disabled={finalizingEvent === event.id}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        {finalizingEvent === event.id ? 'Finalizando...' : 'Finalizar'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Sales Chart */}
        {stats && stats.vendas_ao_longo_tempo && stats.vendas_ao_longo_tempo.length > 0 && (
          <Card className="bg-black/50 border-purple-400/30 backdrop-blur-sm">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-white">Vendas ao Longo do Tempo</CardTitle>
                  <CardDescription className="text-gray-400">
                    Evolução das vendas de ingressos nos últimos meses
                  </CardDescription>
                </div>
                <div className="relative">
                  <Button
                    onClick={() => setShowDatePicker(!showDatePicker)}
                    className="bg-purple-500 hover:bg-purple-600 text-white"
                  >
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    Filtrar Período
                  </Button>

                  {showDatePicker && (
                    <div className="absolute right-0 top-12 z-50 bg-gray-900 border border-purple-400/30 rounded-lg p-4 shadow-2xl">
                      <div className="mb-4">
                        <p className="text-white font-semibold mb-2">Selecione o período:</p>
                        {dateRange?.from && (
                          <p className="text-sm text-gray-400">
                            {format(dateRange.from, 'dd/MM/yyyy', { locale: ptBR })}
                            {dateRange.to &&
                              ` - ${format(dateRange.to, 'dd/MM/yyyy', { locale: ptBR })}`}
                          </p>
                        )}
                      </div>
                      <DayPicker
                        mode="range"
                        selected={dateRange}
                        onSelect={setDateRange}
                        locale={ptBR}
                        className="text-white"
                        styles={{
                          caption: { color: 'white' },
                          head_cell: { color: '#a78bfa' },
                          cell: { color: 'white' },
                        }}
                      />
                      <div className="flex gap-2 mt-4">
                        <Button
                          onClick={handleApplyDateFilter}
                          className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-white"
                        >
                          Aplicar
                        </Button>
                        <Button
                          onClick={handleClearDateFilter}
                          className="flex-1 bg-gray-600 hover:bg-gray-700 text-white"
                        >
                          Limpar
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={
                  {
                    quantidade: {
                      label: 'Ingressos Vendidos',
                      color: 'hsl(280, 70%, 60%)',
                    },
                  } satisfies ChartConfig
                }
                className="h-[250px]"
              >
                <AreaChart
                  accessibilityLayer
                  data={filteredChartData}
                  margin={{
                    left: 12,
                    right: 12,
                  }}
                >
                  <CartesianGrid vertical={false} stroke="rgba(255, 255, 255, 0.1)" />
                  <XAxis
                    dataKey="data"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tick={{ fill: '#9ca3af' }}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" hideLabel />}
                  />
                  <Area
                    dataKey="quantidade"
                    type="linear"
                    fill="hsl(280, 70%, 60%)"
                    fillOpacity={0.4}
                    stroke="hsl(280, 70%, 60%)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
