import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Zap, Calendar, Shield, Users } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-cyan-900">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Zap className="w-8 h-8 text-cyan-400" />
            <h1 className="text-2xl font-bold text-cyan-400">Cyberpunk Events</h1>
          </div>
          <div className="space-x-4">
            <Link href="/login">
              <Button
                variant="outline"
                className="border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black"
              >
                Entrar
              </Button>
            </Link>
            <Link href="/register">
              <Button className="bg-cyan-400 text-black hover:bg-cyan-500">Cadastrar</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-white mb-6">O Futuro dos Eventos está Aqui</h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Plataforma completa para gerenciamento de eventos cyberpunk. Crie, gerencie e participe
            dos melhores eventos do underground.
          </p>
          <Link href="/register">
            <Button
              size="lg"
              className="bg-cyan-400 text-black hover:bg-cyan-500 text-lg px-8 py-6"
            >
              Começar Agora
            </Button>
          </Link>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-20">
          <Card className="bg-black/50 border-cyan-400/30 p-6 backdrop-blur-sm">
            <Calendar className="w-12 h-12 text-cyan-400 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Gestão de Eventos</h3>
            <p className="text-gray-400">
              Crie e gerencie eventos com facilidade. Dashboard completo com estatísticas em tempo
              real.
            </p>
          </Card>

          <Card className="bg-black/50 border-purple-400/30 p-6 backdrop-blur-sm">
            <Shield className="w-12 h-12 text-purple-400 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Ingressos Seguros</h3>
            <p className="text-gray-400">
              Sistema de tickets com hash único. Verificação instantânea e segura.
            </p>
          </Card>

          <Card className="bg-black/50 border-cyan-400/30 p-6 backdrop-blur-sm">
            <Users className="w-12 h-12 text-cyan-400 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Para Empresas</h3>
            <p className="text-gray-400">
              Perfil público, histórico de eventos e análise de vendas de ingressos.
            </p>
          </Card>

          <Card className="bg-black/50 border-purple-400/30 p-6 backdrop-blur-sm">
            <Zap className="w-12 h-12 text-purple-400 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Para Clientes</h3>
            <p className="text-gray-400">
              Compre ingressos facilmente e gerencie seu histórico de eventos.
            </p>
          </Card>
        </div>

        {/* How it Works */}
        <div className="mt-32 text-center">
          <h2 className="text-4xl font-bold text-white mb-12">Como Funciona</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="w-16 h-16 bg-cyan-400 rounded-full flex items-center justify-center text-2xl font-bold text-black mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Cadastre-se</h3>
              <p className="text-gray-400">
                Escolha entre conta de empresa ou cliente e crie seu perfil
              </p>
            </div>
            <div>
              <div className="w-16 h-16 bg-purple-400 rounded-full flex items-center justify-center text-2xl font-bold text-black mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Crie ou Participe</h3>
              <p className="text-gray-400">Empresas criam eventos, clientes compram ingressos</p>
            </div>
            <div>
              <div className="w-16 h-16 bg-cyan-400 rounded-full flex items-center justify-center text-2xl font-bold text-black mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Gerencie Tudo</h3>
              <p className="text-gray-400">
                Dashboard completo com todas as informações e estatísticas
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 mt-20 border-t border-cyan-400/20">
        <div className="text-center text-gray-400">
          <p>&copy; 2026 Cyberpunk Events. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
