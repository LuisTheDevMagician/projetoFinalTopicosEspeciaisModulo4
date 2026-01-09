'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { clienteApi } from '@/lib/api-client';
import { Cliente } from '@/lib/types';
import { toast } from 'sonner';

export default function ClientProfile() {
  const { usuario, tipoUsuario, carregando, atualizarUsuario } = useAuth();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const previousUsuarioRef = useRef<string | null>(null);

  useEffect(() => {
    if (!carregando && tipoUsuario !== 'cliente') {
      router.push('/login');
    }
  }, [carregando, tipoUsuario, router]);

  useEffect(() => {
    if (usuario) {
      const usuarioString = JSON.stringify({
        nome: usuario.nome,
        email: usuario.email,
      });

      // Só atualiza se usuario realmente mudou
      if (previousUsuarioRef.current !== usuarioString) {
        previousUsuarioRef.current = usuarioString;
        const newData = {
          name: usuario.nome || '',
          email: usuario.email || '',
        };
        // eslint-disable-next-line react-hooks/set-state-in-effect -- Sincronização necessária de estado externo (auth context) com estado local do formulário
        setFormData(newData);
      }
    }
  }, [usuario]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    // Converter campos para português
    const dadosAtualizacao = {
      nome: formData.name,
      email: formData.email,
    };

    const response = await clienteApi.atualizar<Cliente>('/clientes/eu', dadosAtualizacao, true);

    if (response.dados) {
      toast.success('Perfil atualizado com sucesso!');
      atualizarUsuario(response.dados);
    } else {
      toast.error(response.erro || 'Erro ao atualizar perfil');
    }

    setIsSaving(false);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('A nova senha deve ter no mínimo 6 caracteres');
      return;
    }

    setIsChangingPassword(true);

    const formData = new FormData();
    formData.append('senha_antiga', passwordData.oldPassword);
    formData.append('senha_nova', passwordData.newPassword);

    const response = await clienteApi.atualizar('/clientes/eu/senha', formData, true);

    if (response.dados || !response.erro) {
      toast.success('Senha alterada com sucesso!');
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } else {
      toast.error(response.erro || 'Erro ao alterar senha');
    }

    setIsChangingPassword(false);
  };

  if (carregando) {
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
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Meu Perfil</h1>

        <Card className="bg-black/50 border-cyan-400/30 p-8 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                Nome
              </label>
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                required
                className="bg-black/30 border-gray-600 text-white"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="bg-black/30 border-gray-600 text-white"
              />
            </div>

            <Button
              type="submit"
              disabled={isSaving}
              className="w-full bg-cyan-400 hover:bg-cyan-500 text-black"
            >
              {isSaving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </form>

          {/* Seção de Mudança de Senha */}
          <div className="mt-8 pt-8 border-t border-gray-700">
            <h3 className="text-lg font-bold text-white mb-4">Alterar Senha</h3>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label
                  htmlFor="oldPassword"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Senha Atual
                </label>
                <Input
                  id="oldPassword"
                  type="password"
                  value={passwordData.oldPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, oldPassword: e.target.value })
                  }
                  required
                  className="bg-black/30 border-gray-600 text-white"
                />
              </div>

              <div>
                <label
                  htmlFor="newPassword"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Nova Senha
                </label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, newPassword: e.target.value })
                  }
                  required
                  minLength={6}
                  className="bg-black/30 border-gray-600 text-white"
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Confirmar Nova Senha
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                  }
                  required
                  minLength={6}
                  className="bg-black/30 border-gray-600 text-white"
                />
              </div>

              <Button
                type="submit"
                disabled={isChangingPassword}
                className="w-full bg-cyan-400 hover:bg-cyan-500 text-black"
              >
                {isChangingPassword ? 'Alterando...' : 'Alterar Senha'}
              </Button>
            </form>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-700">
            <h3 className="text-lg font-bold text-white mb-4">Informações da Conta</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Data de Cadastro:</span>
                <span className="text-white">
                  {usuario?.criado_em
                    ? new Date(usuario.criado_em).toLocaleDateString('pt-BR')
                    : '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Tipo de Conta:</span>
                <span className="text-cyan-400 font-medium">Cliente</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
