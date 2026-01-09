'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { clienteApi } from '@/lib/api-client';
import { toast } from 'sonner';

export default function CreateEventPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [endDate, setEndDate] = useState<Date>();
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    description: '',
    ticket_price: '',
    total_tickets: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!endDate) {
      toast.error('Selecione uma data para o evento');
      setIsLoading(false);
      return;
    }

    // Convert price to cents and validate
    const priceInCents = Math.round(parseFloat(formData.ticket_price) * 100);
    const totalTickets = parseInt(formData.total_tickets);

    if (priceInCents <= 0) {
      toast.error('O preço deve ser maior que zero');
      setIsLoading(false);
      return;
    }

    if (totalTickets <= 0) {
      toast.error('A quantidade de ingressos deve ser maior que zero');
      setIsLoading(false);
      return;
    }

    // Set end date to end of day (23:59:59)
    const endOfDay = new Date(endDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Converter campos para português antes de enviar ao backend
    const eventData = {
      nome: formData.name,
      localizacao: formData.location,
      descricao: formData.description,
      data_fim: endOfDay.toISOString(),
      preco_ingresso: priceInCents,
      total_ingressos: totalTickets,
    };

    const response = await clienteApi.postar('/eventos', eventData, true);

    if (response.dados) {
      toast.success('Evento criado com sucesso!');
      router.push('/company/dashboard');
    } else {
      toast.error(response.erro || 'Erro ao criar evento');
    }

    setIsLoading(false);
  };

  return (
    <DashboardLayout type="company">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Criar Novo Evento</h1>

        <Card className="bg-black/50 border-purple-400/30 p-8 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                Nome do Evento *
              </label>
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="Nome do evento"
                required
                className="bg-black/30 border-gray-600 text-white"
              />
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-300 mb-2">
                Local *
              </label>
              <Input
                id="location"
                name="location"
                type="text"
                value={formData.location}
                onChange={handleChange}
                placeholder="Endereço do evento"
                required
                className="bg-black/30 border-gray-600 text-white"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
                Descrição
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Descreva o evento"
                rows={4}
                className="w-full bg-black/30 border border-gray-600 rounded-md px-3 py-2 text-white"
              />
            </div>

            <div>
              <label htmlFor="end_date" className="block text-sm font-medium text-gray-300 mb-2">
                Data de Término *
              </label>
              <div className="bg-black/30 border border-gray-600 rounded-md p-3 flex flex-col items-center">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  locale={ptBR}
                  className="rounded-md"
                />
                {endDate && (
                  <div className="mt-2 text-center text-sm text-cyan-400">
                    Data selecionada: {format(endDate, 'dd/MM/yyyy', { locale: ptBR })}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="ticket_price"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Preço do Ingresso (R$) *
                </label>
                <Input
                  id="ticket_price"
                  name="ticket_price"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.ticket_price}
                  onChange={handleChange}
                  placeholder="0.00"
                  required
                  className="bg-black/30 border-gray-600 text-white"
                />
              </div>

              <div>
                <label
                  htmlFor="total_tickets"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Quantidade Total de Ingressos *
                </label>
                <Input
                  id="total_tickets"
                  name="total_tickets"
                  type="number"
                  min="1"
                  value={formData.total_tickets}
                  onChange={handleChange}
                  placeholder="100"
                  required
                  className="bg-black/30 border-gray-600 text-white"
                />
              </div>
            </div>

            <div className="flex space-x-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-purple-400 hover:bg-purple-500 text-black"
              >
                {isLoading ? 'Criando...' : 'Criar Evento'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
}
