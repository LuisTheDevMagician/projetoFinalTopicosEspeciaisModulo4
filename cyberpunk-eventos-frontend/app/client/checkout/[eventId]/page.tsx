'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { clienteApi } from '@/lib/api-client';
import { EventoDetalhes } from '@/lib/types';
import { CreditCard, QrCode } from 'lucide-react';
import { toast } from 'sonner';

interface PagamentoResponse {
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
  }>;
  evento: {
    id: number;
    nome: string;
    preco_ingresso: number;
  };
}

export default function CheckoutPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [event, setEvent] = useState<EventoDetalhes | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'cartao' | null>(null);
  const [processing, setProcessing] = useState(false);

  const quantidade = parseInt(searchParams.get('quantidade') || '1');
  const eventId = parseInt(params.eventId as string);

  // Dados PIX
  const [pixData, setPixData] = useState({
    nome: '',
    email: '',
    cpf: '',
  });

  // Dados Cartão
  const [cardData, setCardData] = useState({
    numeroCartao: '',
    nomeCartao: '',
    validade: '',
    cvv: '',
    email: '',
    cpf: '',
  });

  useEffect(() => {
    const fetchEvent = async () => {
      // Buscar evento através do endpoint público que não requer autenticação
      const response = await clienteApi.obter<EventoDetalhes[]>('/eventos', false);
      if (response.dados) {
        const foundEvent = response.dados.find((e) => e.id === eventId);
        if (foundEvent) {
          setEvent(foundEvent);
        } else {
          toast.error('Evento não encontrado');
          router.push('/client/dashboard');
        }
      } else {
        toast.error('Erro ao carregar evento');
        router.push('/client/dashboard');
      }
      setLoading(false);
    };

    fetchEvent();
  }, [eventId, router]);

  const handlePixPayment = async () => {
    if (!pixData.nome || !pixData.email || !pixData.cpf) {
      toast.error('Preencha todos os campos');
      return;
    }

    setProcessing(true);

    const response = await clienteApi.postar<PagamentoResponse>(
      '/ingressos',
      {
        evento_id: eventId,
        quantidade,
        metodo_pagamento: 'pix',
        nome_comprador: pixData.nome,
        email_comprador: pixData.email,
        cpf_comprador: pixData.cpf,
      },
      true
    );

    if (response.dados) {
      const pagamentoId = response.dados.id;
      router.push(
        `/client/payment/pix/${pagamentoId}?nome=${encodeURIComponent(pixData.nome)}&email=${encodeURIComponent(pixData.email)}&cpf=${encodeURIComponent(pixData.cpf)}&valor=${response.dados.valor_total * 100}`
      );
    } else {
      toast.error(response.erro || 'Erro ao processar pagamento');
      setProcessing(false);
    }
  };

  const handleCardPayment = async () => {
    if (!cardData.numeroCartao || !cardData.nomeCartao || !cardData.validade || !cardData.cvv || !cardData.email || !cardData.cpf) {
      toast.error('Preencha todos os campos');
      return;
    }

    setProcessing(true);

    const response = await clienteApi.postar<PagamentoResponse>(
      '/ingressos',
      {
        evento_id: eventId,
        quantidade,
        metodo_pagamento: 'cartao',
        nome_comprador: cardData.nomeCartao,
        email_comprador: cardData.email,
        cpf_comprador: cardData.cpf,
      },
      true
    );

    if (response.dados) {
      toast.success(`Pagamento realizado com sucesso! ${response.dados.quantidade} ingressos adquiridos.`);
      setTimeout(() => {
        router.push('/client/my-tickets');
      }, 2000);
    } else {
      toast.error(response.erro || 'Erro ao processar pagamento');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout type="client">
        <div className="flex items-center justify-center h-64">
          <p className="text-white">Carregando...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!event) return null;

  const totalValue = event.preco_ingresso * quantidade;

  return (
    <DashboardLayout type="client">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Checkout</h1>
          <p className="text-gray-400">Finalize sua compra</p>
        </div>

        {/* Resumo do Pedido */}
        <Card className="bg-black/50 border-purple-400/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Resumo do Pedido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-gray-300">
            <div className="flex justify-between">
              <span>Evento:</span>
              <span className="text-white font-semibold">{event.nome}</span>
            </div>
            <div className="flex justify-between">
              <span>Quantidade:</span>
              <span className="text-white font-semibold">{quantidade} ingresso(s)</span>
            </div>
            <div className="flex justify-between">
              <span>Valor Unitário:</span>
              <span className="text-cyan-400">R$ {(event.preco_ingresso / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-700 text-lg">
              <span className="font-bold">Total:</span>
              <span className="text-cyan-400 font-bold">R$ {(totalValue / 100).toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Seleção de Método de Pagamento */}
        {!paymentMethod && (
          <Card className="bg-black/50 border-purple-400/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Escolha o método de pagamento</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={() => setPaymentMethod('pix')}
                className="h-24 bg-purple-400 hover:bg-purple-500 text-black flex flex-col items-center justify-center gap-2"
              >
                <QrCode className="w-8 h-8" />
                <span className="font-bold">PIX</span>
              </Button>
              <Button
                onClick={() => setPaymentMethod('cartao')}
                className="h-24 bg-cyan-400 hover:bg-cyan-500 text-black flex flex-col items-center justify-center gap-2"
              >
                <CreditCard className="w-8 h-8" />
                <span className="font-bold">Cartão de Crédito/Débito</span>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Formulário PIX */}
        {paymentMethod === 'pix' && (
          <Card className="bg-black/50 border-purple-400/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Pagamento via PIX</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-gray-300 text-sm mb-2 block">Nome Completo</label>
                <Input
                  value={pixData.nome}
                  onChange={(e) => setPixData({ ...pixData, nome: e.target.value })}
                  placeholder="Seu nome completo"
                  className="bg-black/30 border-purple-400/30 text-white"
                />
              </div>
              <div>
                <label className="text-gray-300 text-sm mb-2 block">Email</label>
                <Input
                  type="email"
                  value={pixData.email}
                  onChange={(e) => setPixData({ ...pixData, email: e.target.value })}
                  placeholder="seu@email.com"
                  className="bg-black/30 border-purple-400/30 text-white"
                />
              </div>
              <div>
                <label className="text-gray-300 text-sm mb-2 block">CPF</label>
                <Input
                  value={pixData.cpf}
                  onChange={(e) =>
                    setPixData({ ...pixData, cpf: e.target.value.replace(/\D/g, '').slice(0, 11) })
                  }
                  placeholder="000.000.000-00"
                  className="bg-black/30 border-purple-400/30 text-white"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => setPaymentMethod(null)}
                  variant="outline"
                  className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  Voltar
                </Button>
                <Button
                  onClick={handlePixPayment}
                  disabled={processing}
                  className="flex-1 bg-purple-400 hover:bg-purple-500 text-black"
                >
                  {processing ? 'Processando...' : 'Gerar QR Code'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Formulário Cartão */}
        {paymentMethod === 'cartao' && (
          <Card className="bg-black/50 border-cyan-400/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Pagamento com Cartão</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-gray-300 text-sm mb-2 block">Número do Cartão</label>
                <Input
                  value={cardData.numeroCartao}
                  onChange={(e) =>
                    setCardData({
                      ...cardData,
                      numeroCartao: e.target.value.replace(/\D/g, '').slice(0, 16),
                    })
                  }
                  placeholder="0000 0000 0000 0000"
                  className="bg-black/30 border-cyan-400/30 text-white"
                />
              </div>
              <div>
                <label className="text-gray-300 text-sm mb-2 block">Nome no Cartão</label>
                <Input
                  value={cardData.nomeCartao}
                  onChange={(e) =>
                    setCardData({ ...cardData, nomeCartao: e.target.value.toUpperCase() })
                  }
                  placeholder="NOME COMO ESTÁ NO CARTÃO"
                  className="bg-black/30 border-cyan-400/30 text-white"
                />
              </div>
              <div>
                <label className="text-gray-300 text-sm mb-2 block">Email</label>
                <Input
                  type="email"
                  value={cardData.email}
                  onChange={(e) => setCardData({ ...cardData, email: e.target.value })}
                  placeholder="seu@email.com"
                  className="bg-black/30 border-cyan-400/30 text-white"
                />
              </div>
              <div>
                <label className="text-gray-300 text-sm mb-2 block">CPF</label>
                <Input
                  value={cardData.cpf}
                  onChange={(e) =>
                    setCardData({
                      ...cardData,
                      cpf: e.target.value.replace(/\D/g, '').slice(0, 11),
                    })
                  }
                  placeholder="000.000.000-00"
                  className="bg-black/30 border-cyan-400/30 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-300 text-sm mb-2 block">Validade</label>
                  <Input
                    value={cardData.validade}
                    onChange={(e) =>
                      setCardData({
                        ...cardData,
                        validade: e.target.value.replace(/\D/g, '').slice(0, 4),
                      })
                    }
                    placeholder="MM/AA"
                    className="bg-black/30 border-cyan-400/30 text-white"
                  />
                </div>
                <div>
                  <label className="text-gray-300 text-sm mb-2 block">CVV</label>
                  <Input
                    type="password"
                    value={cardData.cvv}
                    onChange={(e) =>
                      setCardData({
                        ...cardData,
                        cvv: e.target.value.replace(/\D/g, '').slice(0, 3),
                      })
                    }
                    placeholder="000"
                    className="bg-black/30 border-cyan-400/30 text-white"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => setPaymentMethod(null)}
                  variant="outline"
                  className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  Voltar
                </Button>
                <Button
                  onClick={handleCardPayment}
                  disabled={processing}
                  className="flex-1 bg-cyan-400 hover:bg-cyan-500 text-black"
                >
                  {processing ? 'Processando...' : 'Confirmar Pagamento'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
