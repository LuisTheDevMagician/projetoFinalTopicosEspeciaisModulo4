'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Zap, Building2, User } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState<'company' | 'client'>('client');
  const [isLoading, setIsLoading] = useState(false);
  const { entrar } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Converter tipo de usuário para português
    const tipoUsuario = userType === 'client' ? 'cliente' : 'empresa';
    const result = await entrar(email, password, tipoUsuario);

    if (!result.sucesso) {
      toast.error(result.erro || 'Erro ao fazer login');
    } else {
      toast.success('Login realizado com sucesso!');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-cyan-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-black/50 border-cyan-400/30 backdrop-blur-sm p-8">
        <div className="flex items-center justify-center mb-8">
          <Zap className="w-10 h-10 text-cyan-400 mr-2" />
          <h1 className="text-3xl font-bold text-cyan-400">Login</h1>
        </div>

        {/* User Type Selection */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            type="button"
            onClick={() => setUserType('client')}
            className={`p-4 rounded-lg border-2 transition-all ${
              userType === 'client'
                ? 'border-cyan-400 bg-cyan-400/10'
                : 'border-gray-600 hover:border-cyan-400/50'
            }`}
          >
            <User
              className={`w-8 h-8 mx-auto mb-2 ${userType === 'client' ? 'text-cyan-400' : 'text-gray-400'}`}
            />
            <p
              className={`text-sm font-medium ${userType === 'client' ? 'text-cyan-400' : 'text-gray-400'}`}
            >
              Cliente
            </p>
          </button>

          <button
            type="button"
            onClick={() => setUserType('company')}
            className={`p-4 rounded-lg border-2 transition-all ${
              userType === 'company'
                ? 'border-purple-400 bg-purple-400/10'
                : 'border-gray-600 hover:border-purple-400/50'
            }`}
          >
            <Building2
              className={`w-8 h-8 mx-auto mb-2 ${userType === 'company' ? 'text-purple-400' : 'text-gray-400'}`}
            />
            <p
              className={`text-sm font-medium ${userType === 'company' ? 'text-purple-400' : 'text-gray-400'}`}
            >
              Empresa
            </p>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              className="bg-black/30 border-gray-600 text-white"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              Senha
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="bg-black/30 border-gray-600 text-white"
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className={`w-full ${
              userType === 'company'
                ? 'bg-purple-400 hover:bg-purple-500'
                : 'bg-cyan-400 hover:bg-cyan-500'
            } text-black`}
          >
            {isLoading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm">
            Não tem uma conta?{' '}
            <Link href="/register" className="text-cyan-400 hover:underline">
              Cadastre-se
            </Link>
          </p>
          <Link href="/" className="text-gray-400 hover:text-cyan-400 text-sm block mt-2">
            ← Voltar para home
          </Link>
        </div>
      </Card>
    </div>
  );
}
