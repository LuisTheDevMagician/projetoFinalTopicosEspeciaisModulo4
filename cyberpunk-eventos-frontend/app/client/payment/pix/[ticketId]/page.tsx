'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { useState, useMemo } from 'react';

export default function PixPaymentPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const nome = searchParams.get('nome') || '';
  const email = searchParams.get('email') || '';
  const cpf = searchParams.get('cpf') || '';
  const valor = parseInt(searchParams.get('valor') || '0');

  // Gerar código PIX fictício (usando hash estável baseado nos dados)
  const pixCode = useMemo(() => {
    const hash = cpf.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const suffix = hash.toString(36).toUpperCase().slice(-4);
    return `00020126580014BR.GOV.BCB.PIX0136${cpf}@pixcyberpunk.com.br520400005303986540${(valor / 100).toFixed(2)}5802BR5913${nome.slice(0, 25)}6009SaoPaulo62070503***6304${suffix}`;
  }, [cpf, valor, nome]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(pixCode);
    setCopied(true);
    toast.success('Código PIX copiado!');
    setTimeout(() => setCopied(false), 3000);
  };

  const handleConfirmPayment = () => {
    toast.success('Pagamento confirmado com sucesso!');
    setTimeout(() => {
      router.push('/client/my-tickets');
    }, 2000);
  };

  return (
    <DashboardLayout type="client">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="w-16 h-16 text-green-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Pagamento via PIX</h1>
          <p className="text-gray-400">Escaneie o QR Code ou copie o código para pagar</p>
        </div>

        <Card className="bg-black/50 border-purple-400/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white text-center">QR Code de Pagamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* QR Code */}
            <div className="flex justify-center bg-white p-6 rounded-lg">
              <QRCodeSVG value={pixCode} size={256} level="H" />
            </div>

            {/* Valor */}
            <div className="text-center">
              <p className="text-gray-400 text-sm mb-1">Valor a pagar</p>
              <p className="text-3xl font-bold text-cyan-400">R$ {(valor / 100).toFixed(2)}</p>
            </div>

            {/* Código PIX */}
            <div className="space-y-2">
              <label className="text-gray-300 text-sm block">Código PIX Copia e Cola</label>
              <div className="relative">
                <div className="bg-black/30 border border-purple-400/30 rounded-lg p-3 pr-12 text-white text-sm break-all">
                  {pixCode}
                </div>
                <Button
                  onClick={handleCopyCode}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-purple-400 hover:bg-purple-500 text-black p-2"
                >
                  {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* Informações */}
            <div className="bg-purple-900/20 border border-purple-400/30 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between text-gray-300">
                <span>Beneficiário:</span>
                <span className="text-white">{nome}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>CPF:</span>
                <span className="text-white">
                  {cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}
                </span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Email:</span>
                <span className="text-white">{email}</span>
              </div>
            </div>

            {/* Botões */}
            <div className="space-y-3 pt-4">
              <Button
                onClick={handleConfirmPayment}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3"
              >
                Já Paguei - Confirmar Pagamento
              </Button>
              <p className="text-xs text-center text-gray-500">
                * Este é um sistema demonstrativo. O pagamento não é real.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Instruções */}
        <Card className="bg-black/50 border-cyan-400/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white text-sm">Como pagar com PIX?</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-300 text-sm space-y-2">
            <p>1. Abra o app do seu banco</p>
            <p>2. Escolha a opção PIX</p>
            <p>3. Escaneie o QR Code ou copie e cole o código</p>
            <p>4. Confirme o pagamento</p>
            <p>5. Clique em &quot;Já Paguei&quot; quando concluir</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
